import { z } from "zod";
import { Resend } from "resend";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { broadcasts, newsletterSubscribers } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import NewsletterBroadcast from "@/emails/newsletter-broadcast";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const resend = new Resend(process.env.RESEND_API_KEY);

export const broadcastsRouter = createTRPCRouter({
  getMany: baseProcedure.query(async ({ ctx }) => {
    const allBroadcasts = await ctx.db
      .select()
      .from(broadcasts)
      .orderBy(desc(broadcasts.created_at));

    return allBroadcasts;
  }),
  send: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Subscriber id is required" }),
        scheduledAt: z
          .string()
          .min(1, { message: "Scheduledat is required" })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const scheduledAt = input.scheduledAt;
        const [broadcast] = await ctx.db
          .select()
          .from(broadcasts)
          .where(eq(broadcasts.id, input.id));

        if (!broadcast) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Broadcast not found",
          });
        }

        if (!broadcast.resend_broadcast_id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Broadcast not properly created in Resend",
          });
        }

        // Get active subscriber count
        const activeSubscribers = await ctx.db
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.status, "active"));

        if (scheduledAt) {
          await resend.broadcasts.send(broadcast.resend_broadcast_id, {
            scheduledAt,
          });
        } else {
          await resend.broadcasts.send(broadcast.resend_broadcast_id);
        }

        // return { success: true };
        const [updatedBroadcast] = await ctx.db
          .update(broadcasts)
          .set({
            status: scheduledAt ? "scheduled" : "sent",
            scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
            sent_at: scheduledAt ? null : new Date(),
            recipient_count: activeSubscribers.length,
            updated_at: new Date(),
          })
          .where(eq(broadcasts.id, input.id))
          .returning();

        return updatedBroadcast;
      } catch (error) {
        await ctx.db
          .update(broadcasts)
          .set({
            status: "failed",
            updated_at: new Date(),
          })
          .where(eq(broadcasts.id, input.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send broadcast",
        });
      }
    }),
  create: baseProcedure
    .input(
      z.object({
        title: z.string().min(1, { message: "Title is required" }),
        subject: z.string().min(1, { message: "Subject is required" }),
        content: z.string().min(1, { message: "Content is required" }),
        fromEmail: z.email("Invalid email address").toLowerCase().trim(),
        scheduledAt: z
          .string()
          .min(1, { message: "Subject is required" })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const title = input.title;
      const subject = input.subject;
      const content = input.content;
      const fromEmail = input.fromEmail;
      const scheduledAt = input.fromEmail;

      if (!title || !subject || !content) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Title, subject, and content are required",
        });
      }

      // Create broadcast in Resend
      const resendBroadcast = await resend.broadcasts.create({
        audienceId: AUDIENCE_ID!,
        from: fromEmail || "admin@azacdev.com",
        subject,
        react: NewsletterBroadcast({
          title,
          content,
          previewText: subject,
        }),
      });

      if (!resendBroadcast.data) {
        console.error("Resend error:", resendBroadcast.error);

        const errorMessage =
          typeof resendBroadcast.error === "string"
            ? // @ts-ignore
              resendBroadcast.error
            : resendBroadcast.error?.message ||
              "Failed to create broadcast in Resend";

        throw new TRPCError(errorMessage);
      }

      // Save to database
      const [newBroadcast] = await ctx.db
        .insert(broadcasts)
        .values({
          title,
          subject,
          content,
          from_email: fromEmail || "newsletter@nwgf.com",
          audience_id: AUDIENCE_ID!,
          resend_broadcast_id: resendBroadcast.data.id,
          status: scheduledAt ? "scheduled" : "draft",
          scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
        })
        .returning();

      return newBroadcast;
    }),
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Subscriber id is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const [broadcast] = await ctx.db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.id));

      if (!broadcast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });
      }

      return broadcast;
    }),
  deleteOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Subscriber id is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [broadcast] = await ctx.db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.id));

      if (!broadcast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });
      }

      if (broadcast.resend_broadcast_id) {
        try {
          await resend.broadcasts.remove(broadcast.resend_broadcast_id);
        } catch (resendError) {
          console.error("Failed to delete broadcast from Resend:", resendError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete broadcast from Resend",
          });
        }
      }

      await ctx.db.delete(broadcasts).where(eq(broadcasts.id, input.id));

      return { success: true };
    }),
  updateOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Subscriber id is required" }),
        title: z.string().min(1, { message: "Title is required" }),
        subject: z.string().min(1, { message: "Subject is required" }),
        content: z.string().min(1, { message: "Content is required" }),
        status: z.string().min(1, { message: "Status is required" }).optional(),
        fromEmail: z.email("Invalid email address").toLowerCase().trim(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const title = input.title;
      const subject = input.subject;
      const content = input.content;
      const status = input.status;
      const fromEmail = input.fromEmail;

      const updateData: any = {
        updated_at: new Date(),
      };

      if (title !== undefined) updateData.title = title;
      if (subject !== undefined) updateData.subject = subject;
      if (content !== undefined) updateData.content = content;
      if (fromEmail !== undefined) updateData.from_email = fromEmail;
      if (status !== undefined) updateData.status = status;

      const [updatedBroadcast] = await ctx.db
        .update(broadcasts)
        .set(updateData)
        .where(eq(broadcasts.id, input.id))
        .returning();

      return updatedBroadcast;
    }),
});
