import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  resend_contact_id: text("resend_contact_id"),
  category: text("category").notNull().default("general"),
  subscription_date: timestamp("subscription_date").defaultNow(),
  unsubscribe_token: text("unsubscribe_token").unique(),
  source: text("source").default("manual"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  from_email: text("from_email").notNull(),
  audience_id: text("audience_id").notNull(),
  target_category: text("target_category").default("all"),
  resend_broadcast_id: text("resend_broadcast_id"),
  status: text("status").notNull().default("draft"),
  scheduled_at: timestamp("scheduled_at"),
  sent_at: timestamp("sent_at"),
  recipient_count: integer("recipient_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
