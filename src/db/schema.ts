import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  minecraftUsername: text('minecraft_username'),
  edition: text('edition').notNull().default('java'),
  role: text('role').notNull().default('player'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    orderCode: text('order_code').notNull().unique(),
    idempotencyKey: text('idempotency_key'),
    minecraftUsername: text('minecraft_username').notNull(),
    edition: text('edition').notNull().default('java'),
    email: text('email').notNull(),
    itemsJson: text('items_json').notNull(),
    couponCode: text('coupon_code'),
    discountBdt: integer('discount_bdt').notNull().default(0),
    totalAmountBdt: integer('total_amount_bdt').notNull(),
    paymentMethod: text('payment_method').notNull(),
    transactionId: text('transaction_id').notNull(),
    senderNumber: text('sender_number').notNull(),
    notes: text('notes'),
    status: text('status').notNull().default('pending_verification'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('orders_payment_txn_unique').on(table.paymentMethod, table.transactionId),
    uniqueIndex('orders_user_idempotency_unique').on(table.userId, table.idempotencyKey),
  ]
);

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  minecraftUsername: text('minecraft_username').notNull(),
  email: text('email').notNull(),
  category: text('category').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: serial('id').primaryKey(),
  playerName: text('player_name').notNull(),
  rankLabel: text('rank_label').notNull(),
  mode: text('mode').notNull().default('overall'),
  score: integer('score').notNull().default(0),
  position: integer('position').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  tickets: many(supportTickets),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
}));
