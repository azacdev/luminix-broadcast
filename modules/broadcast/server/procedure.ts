import { z } from "zod";
import { Resend } from "resend";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { broadcasts, newsletterSubscribers } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import BroadcastEmail from "@/emails/broadcast-email";
import { render } from "@react-email/render";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to delay between email sends (rate limiting)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const broadcastsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const offset = (input.page - 1) * input.limit;

      const allBroadcasts = await ctx.db
        .select()
        .from(broadcasts)
        .orderBy(desc(broadcasts.created_at))
        .limit(input.limit)
        .offset(offset);

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(broadcasts);

      return {
        broadcasts: allBroadcasts,
        total: Number(count),
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(Number(count) / input.limit),
      };
    }),

  send: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Broadcast id is required" }),
        scheduledAt: z.string().optional(),
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

        // Get active subscribers based on target category
        let activeSubscribers = await ctx.db
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.status, "active"));

        // Filter by category if not targeting all
        if (broadcast.target_category && broadcast.target_category !== "all") {
          activeSubscribers = activeSubscribers.filter(
            (sub) => sub.category === broadcast.target_category
          );
        }

        if (activeSubscribers.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No active subscribers found in category: ${
              broadcast.target_category || "all"
            }`,
          });
        }

        // If targeting all subscribers, use Resend broadcast API
        if (!broadcast.target_category || broadcast.target_category === "all") {
          if (!broadcast.resend_broadcast_id) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Broadcast not properly created in Resend",
            });
          }

          if (scheduledAt) {
            await resend.broadcasts.send(broadcast.resend_broadcast_id, {
              scheduledAt,
            });
          } else {
            await resend.broadcasts.send(broadcast.resend_broadcast_id);
          }
        } else {
          // For category-filtered broadcasts, send individual emails
          // This ensures only subscribers in the selected category receive the email

          if (scheduledAt) {
            // For scheduled sends, we can't use individual emails easily
            // You might want to implement a job queue system for this
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Scheduled sends for specific categories are not yet supported. Please send immediately or target all subscribers.",
            });
          }

          // Render the email HTML once
          const emailHtml = render(
            BroadcastEmail({
              title: broadcast.title,
              content: broadcast.content,
              previewText: broadcast.subject,
            })
          );

          // Send to each subscriber individually with rate limiting
          let successCount = 0;
          let failCount = 0;

          for (const subscriber of activeSubscribers) {
            if (!subscriber.email) continue;

            try {
              await resend.emails.send({
                from: broadcast.from_email,
                to: subscriber.email,
                subject: broadcast.subject,
                react: BroadcastEmail({
                  title: broadcast.title,
                  content: broadcast.content,
                  previewText: broadcast.subject,
                }),
              });
              successCount++;

              // Rate limit: 10 emails per second max (100ms delay)
              await delay(100);
            } catch (error) {
              console.error(`Failed to send to ${subscriber.email}:`, error);
              failCount++;
            }
          }

          console.log(
            `Broadcast ${broadcast.id}: ${successCount} sent, ${failCount} failed`
          );
        }

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
          message:
            error instanceof TRPCError
              ? error.message
              : "Failed to send broadcast",
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
        targetCategory: z.string().default("all"),
        scheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        title,
        subject,
        content,
        scheduledAt,
        fromEmail,
        targetCategory,
      } = input;

      if (!title || !subject || !content) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Title, subject, and content are required",
        });
      }

      // Get subscribers for the target category to validate
      let targetSubscribers = await ctx.db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.status, "active"));

      // Filter by category if not targeting all
      if (targetCategory && targetCategory !== "all") {
        targetSubscribers = targetSubscribers.filter(
          (sub) => sub.category === targetCategory
        );
      }

      if (targetSubscribers.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No active subscribers found in category: ${
            targetCategory || "all"
          }`,
        });
      }

      // Only create Resend broadcast if targeting all subscribers
      // For category-specific, we'll send individually at send time
      let resendBroadcastId = null;

      if (!targetCategory || targetCategory === "all") {
        const resendBroadcast = await resend.broadcasts.create({
          audienceId: AUDIENCE_ID!,
          from: fromEmail,
          subject,
          react: BroadcastEmail({
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

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
          });
        }

        resendBroadcastId = resendBroadcast.data.id;
      }

      // Save to database
      const [newBroadcast] = await ctx.db
        .insert(broadcasts)
        .values({
          title,
          subject,
          content,
          from_email: fromEmail,
          audience_id: AUDIENCE_ID!,
          target_category: targetCategory,
          resend_broadcast_id: resendBroadcastId,
          status: scheduledAt ? "scheduled" : "draft",
          scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
        })
        .returning();

      return newBroadcast;
    }),

  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Broadcast id is required" }),
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
        id: z.string().min(1, { message: "Broadcast id is required" }),
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

      // Only delete from Resend if it was a broadcast (targeting all)
      if (broadcast.resend_broadcast_id) {
        try {
          await resend.broadcasts.remove(broadcast.resend_broadcast_id);
        } catch (resendError) {
          console.error("Failed to delete broadcast from Resend:", resendError);
          // Don't throw - still delete from our database
        }
      }

      await ctx.db.delete(broadcasts).where(eq(broadcasts.id, input.id));

      return { success: true };
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
      const broadcastsList = await ctx.db
        .select()
        .from(broadcasts)
        .where(inArray(broadcasts.id, input.ids));

      if (broadcastsList.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No broadcasts found",
        });
      }

      // Delete from Resend in parallel (only those with resend_broadcast_id)
      const resendDeletions = broadcastsList.map(async (broadcast) => {
        if (broadcast.resend_broadcast_id) {
          try {
            await resend.broadcasts.remove(broadcast.resend_broadcast_id);
          } catch (resendError) {
            console.error(
              `Failed to remove broadcast ${broadcast.title} from Resend:`,
              resendError
            );
          }
        }
      });

      await Promise.allSettled(resendDeletions);

      await ctx.db.delete(broadcasts).where(inArray(broadcasts.id, input.ids));

      return {
        deleted: broadcastsList.length,
        broadcasts: broadcastsList,
      };
    }),

  updateOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Broadcast id is required" }),
        title: z.string().min(1, { message: "Title is required" }),
        subject: z.string().min(1, { message: "Subject is required" }),
        content: z.string().min(1, { message: "Content is required" }),
        status: z.string().optional(),
        fromEmail: z.email("Invalid email address").toLowerCase().trim(),
        targetCategory: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { title, subject, content, status, fromEmail, targetCategory } =
        input;

      const updateData: any = {
        updated_at: new Date(),
      };

      if (title !== undefined) updateData.title = title;
      if (subject !== undefined) updateData.subject = subject;
      if (content !== undefined) updateData.content = content;
      if (fromEmail !== undefined) updateData.from_email = fromEmail;
      if (status !== undefined) updateData.status = status;
      if (targetCategory !== undefined)
        updateData.target_category = targetCategory;

      const [updatedBroadcast] = await ctx.db
        .update(broadcasts)
        .set(updateData)
        .where(eq(broadcasts.id, input.id))
        .returning();

      return updatedBroadcast;
    }),
});
