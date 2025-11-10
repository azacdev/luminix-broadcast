import { z } from "zod";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { newsletterSubscribers } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

// Categories constant
export const SUBSCRIBER_CATEGORIES = [
  "general",
  "announcements",
  "updates",
  "newsletters",
  "promotions",
] as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function deleteFromResendWithRateLimit(
  subscribers: Array<{
    id: string;
    email: string | null;
    resend_contact_id: string | null;
  }>
) {
  const results = [];

  for (const subscriber of subscribers) {
    if (subscriber.resend_contact_id || subscriber.email) {
      try {
        if (subscriber.resend_contact_id) {
          await resend.contacts.remove({
            id: subscriber.resend_contact_id,
            audienceId: AUDIENCE_ID!,
          });
        } else if (subscriber.email) {
          await resend.contacts.remove({
            email: subscriber.email,
            audienceId: AUDIENCE_ID!,
          });
        }
        results.push({ success: true, email: subscriber.email });
      } catch (resendError) {
        console.error(
          `Failed to remove subscriber ${subscriber.email} from Resend:`,
          resendError
        );
        results.push({
          success: false,
          email: subscriber.email,
          error: resendError,
        });
      }
      await delay(500);
    }
  }

  return results;
}

export const subscribersRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        category: z.string().optional(), // New filter
      })
    )
    .query(async ({ input, ctx }) => {
      const offset = (input.page - 1) * input.limit;

      let query = ctx.db
        .select()
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.created_at))
        .limit(input.limit)
        .offset(offset);

      // Apply category filter if provided
      if (input.category && input.category !== "all") {
        query = query.where(
          eq(newsletterSubscribers.category, input.category)
        ) as any;
      }

      const subscribers = await query;

      let countQuery = ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers);

      if (input.category && input.category !== "all") {
        countQuery = countQuery.where(
          eq(newsletterSubscribers.category, input.category)
        ) as any;
      }

      const [{ count }] = await countQuery;

      return {
        subscribers,
        total: Number(count),
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(Number(count) / input.limit),
      };
    }),

  create: baseProcedure
    .input(
      z.object({
        email: z.email("Invalid email address").toLowerCase().trim(),
        category: z.enum(SUBSCRIBER_CATEGORIES).default("general"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, category } = input;

      const existingSubscriber = await ctx.db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .limit(1);

      if (existingSubscriber.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already subscribed",
        });
      }

      const resendContact = await resend.contacts.create({
        email,
        unsubscribed: false,
        audienceId: AUDIENCE_ID!,
      });

      const unsubscribeToken = uuidv4();

      const [newSubscriber] = await ctx.db
        .insert(newsletterSubscribers)
        .values({
          email,
          category,
          source: "api",
          resend_contact_id: resendContact.data?.id,
          unsubscribe_token: unsubscribeToken,
          status: "active",
        })
        .returning();

      return newSubscriber;
    }),

  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Subscriber id is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const [subscriber] = await ctx.db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.id, input.id));

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscriber not found",
        });
      }

      return subscriber;
    }),

  deleteOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Subscriber id is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [subscriber] = await ctx.db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.id, input.id));

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscriber not found",
        });
      }

      if (subscriber.resend_contact_id || subscriber.email) {
        try {
          if (subscriber.resend_contact_id) {
            await resend.contacts.remove({
              id: subscriber.resend_contact_id,
              audienceId: process.env.RESEND_AUDIENCE_ID!,
            });
          } else if (subscriber.email) {
            await resend.contacts.remove({
              email: subscriber.email,
              audienceId: process.env.RESEND_AUDIENCE_ID!,
            });
          }
        } catch (resendError) {
          console.error(
            "Failed to remove subscriber from Resend:",
            resendError
          );
        }
      }

      await ctx.db
        .delete(newsletterSubscribers)
        .where(eq(newsletterSubscribers.id, input.id));

      return subscriber;
    }),

  deleteMany: baseProcedure
    .input(
      z.object({
        ids: z
          .array(z.string().min(1))
          .min(1, { message: "At least one id is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const subscribers = await ctx.db
        .select()
        .from(newsletterSubscribers)
        .where(inArray(newsletterSubscribers.id, input.ids));

      if (subscribers.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No subscribers found",
        });
      }

      const resendResults = await deleteFromResendWithRateLimit(subscribers);

      const failures = resendResults.filter((r) => !r.success);
      if (failures.length > 0) {
        console.warn(
          `Failed to delete ${failures.length} contacts from Resend:`,
          failures
        );
      }

      await ctx.db
        .delete(newsletterSubscribers)
        .where(inArray(newsletterSubscribers.id, input.ids));

      return {
        deleted: subscribers.length,
        subscribers,
        resendResults: {
          successful: resendResults.filter((r) => r.success).length,
          failed: failures.length,
        },
      };
    }),

  updateOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Subscriber id is required" }),
        status: z.string().optional(),
        category: z.enum(SUBSCRIBER_CATEGORIES).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updateData: any = {
        updated_at: new Date(),
      };

      if (input.status) updateData.status = input.status;
      if (input.category) updateData.category = input.category;

      const [updatedSubscriber] = await ctx.db
        .update(newsletterSubscribers)
        .set(updateData)
        .where(eq(newsletterSubscribers.id, input.id))
        .returning();

      return updatedSubscriber;
    }),

  // New procedure to get category stats
  getCategoryStats: baseProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db
      .select({
        category: newsletterSubscribers.category,
        count: sql<number>`count(*)`,
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "active"))
      .groupBy(newsletterSubscribers.category);

    return stats;
  }),
});
