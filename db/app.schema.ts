import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),

  // Normal standalone UUID (no foreign key constraint)
  userId: uuid("user_id").notNull().unique(),

  subscriptionId: text("subscription_id").notNull().unique(),

  productId: text("product_id").notNull(),

  productName: text("product_name").notNull(),

  price: integer("price").notNull(),

  recurringInterval: text("recurring_interval").notNull(),

  status: text("status").notNull(),

  credits: integer("credits").default(0).notNull(),

  creditBalance: integer("credit_balance").default(0).notNull(),

  currentPeriodStart: timestamp("current_period_start").notNull(),

  currentPeriodEnd: timestamp("current_period_end").notNull(),

  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

