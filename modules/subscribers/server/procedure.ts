import { z } from "zod";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { newsletterSubscribers } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export const subscribersRouter = createTRPCRouter({
  getMany: baseProcedure.query(async ({ ctx }) => {
    const subscribers = await ctx.db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.created_at));

    return subscribers;
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
