import { z } from "zod";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { newsletterSubscribers } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

// Helper function to add delay between requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to delete contacts from Resend with rate limiting
async function deleteFromResendWithRateLimit(
  subscribers: Array<{
    id: string;
    email: string | null;
    resend_contact_id: string | null;
  }>
) {
  const results = [];

  // Process deletions sequentially with 500ms delay (2 per second)
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

      // Wait 500ms between requests to stay under 2 req/sec limit
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
      })
    )
    .query(async ({ input, ctx }) => {
      const offset = (input.page - 1) * input.limit;

      const subscribers = await ctx.db
        .select()
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.created_at))
        .limit(input.limit)
        .offset(offset);

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers);

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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email;

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
          // Try to remove by contact ID first, fallback to email
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

      // Delete from Resend sequentially with rate limiting
      const resendResults = await deleteFromResendWithRateLimit(subscribers);

      // Log any failures
      const failures = resendResults.filter((r) => !r.success);
      if (failures.length > 0) {
        console.warn(
          `Failed to delete ${failures.length} contacts from Resend:`,
          failures
        );
      }

      // Delete from database
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
        status: z.string().min(1, { message: "Status is required" }).optional(),
        id: z.string().min(1, { message: "Subscriber id is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const status = input.status;
      const updateData = {
        status,
        updated_at: new Date(),
      };

      const [updatedSubscriber] = await ctx.db
        .update(newsletterSubscribers)
        .set(updateData)
        .where(eq(newsletterSubscribers.id, input.id))
        .returning();

      return updatedSubscriber;
    }),
});
