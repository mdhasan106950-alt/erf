import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { leaderboardEntries, newsletterSubscribers, orders, supportTickets } from './schema.ts';

export interface CreateOrderInput {
  userId: number;
  orderCode: string;
  idempotencyKey?: string | null;
  minecraftUsername: string;
  edition: 'java' | 'bedrock';
  email: string;
  itemsJson: string;
  couponCode?: string | null;
  discountBdt?: number;
  totalAmountBdt: number;
  paymentMethod: 'bkash' | 'nagad';
  transactionId: string;
  senderNumber: string;
  notes?: string;
}

export class OrderConflictError extends Error {
  code: 'DUPLICATE_TRANSACTION' | 'DUPLICATE_IDEMPOTENCY';
  constructor(code: 'DUPLICATE_TRANSACTION' | 'DUPLICATE_IDEMPOTENCY', message: string) {
    super(message);
    this.code = code;
  }
}

export function maskPhoneNumber(phone: string): string {
  const clean = phone.trim();
  if (clean.length < 7) return '***';
  return `${clean.slice(0, 3)}****${clean.slice(-4)}`;
}

export function toPublicOrder(order: typeof orders.$inferSelect) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    minecraftUsername: order.minecraftUsername,
    edition: order.edition,
    itemsJson: order.itemsJson,
    couponCode: order.couponCode,
    discountBdt: order.discountBdt,
    totalAmountBdt: order.totalAmountBdt,
    paymentMethod: order.paymentMethod,
    transactionId: order.transactionId,
    senderNumberMasked: maskPhoneNumber(order.senderNumber),
    status: order.status,
    createdAt: order.createdAt,
  };
}

export function toPublicTicket(ticket: typeof supportTickets.$inferSelect) {
  return {
    id: ticket.id,
    minecraftUsername: ticket.minecraftUsername,
    category: ticket.category,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt,
  };
}

export function toStaffTicket(ticket: typeof supportTickets.$inferSelect) {
  return {
    id: ticket.id,
    minecraftUsername: ticket.minecraftUsername,
    category: ticket.category,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    createdAt: ticket.createdAt,
  };
}

export async function findOrderByIdempotencyKey(userId: number, idempotencyKey: string) {
  try {
    const result = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, idempotencyKey)))
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error('Database error in findOrderByIdempotencyKey:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to verify order state right now.', { cause: error });
  }
}

export async function createOrder(input: CreateOrderInput) {
  try {
    const result = await db
      .insert(orders)
      .values({
        userId: input.userId,
        orderCode: input.orderCode,
        idempotencyKey: input.idempotencyKey ?? null,
        minecraftUsername: input.minecraftUsername,
        edition: input.edition,
        email: input.email,
        itemsJson: input.itemsJson,
        couponCode: input.couponCode ?? null,
        discountBdt: input.discountBdt ?? 0,
        totalAmountBdt: input.totalAmountBdt,
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId,
        senderNumber: input.senderNumber,
        notes: input.notes ?? null,
        status: 'pending_verification',
      })
      .returning();

    return result[0];
  } catch (error: unknown) {
    const pgError = error as { code?: string; constraint?: string };
    if (pgError?.code === '23505') {
      if (pgError.constraint === 'orders_user_idempotency_unique') {
        throw new OrderConflictError(
          'DUPLICATE_IDEMPOTENCY',
          'This checkout submission was already processed.'
        );
      }
      throw new OrderConflictError(
        'DUPLICATE_TRANSACTION',
        'This transaction ID has already been submitted for an order.'
      );
    }
    console.error('Database error in createOrder:', pgError?.code || 'unknown');
    throw new Error('Order submission failed. Please try again in a moment.', { cause: error });
  }
}

export async function getOrdersByUserId(userId: number) {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    return rows.map(toPublicOrder);
  } catch (error) {
    console.error('Database error in getOrdersByUserId:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to load your order history right now.', { cause: error });
  }
}

export async function getAllOrdersForAdmin() {
  try {
    const rows = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(50);
    return rows.map(toPublicOrder);
  } catch (error) {
    console.error('Database error in getAllOrdersForAdmin:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to load staff orders right now.', { cause: error });
  }
}

export async function updateOrderStatus(
  orderId: number,
  status: 'pending_verification' | 'verified' | 'delivered' | 'rejected'
) {
  try {
    const result = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();
    return result[0] ? toPublicOrder(result[0]) : null;
  } catch (error) {
    console.error('Database error in updateOrderStatus:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to update order status right now.', { cause: error });
  }
}

export interface CreateTicketInput {
  userId?: number | null;
  minecraftUsername: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

export async function createSupportTicket(input: CreateTicketInput) {
  try {
    const result = await db
      .insert(supportTickets)
      .values({
        userId: input.userId ?? null,
        minecraftUsername: input.minecraftUsername,
        email: input.email,
        category: input.category,
        subject: input.subject,
        message: input.message,
        status: 'open',
      })
      .returning();

    return toPublicTicket(result[0]);
  } catch (error) {
    console.error('Database error in createSupportTicket:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to submit support ticket right now.', { cause: error });
  }
}

export async function getTicketsByUserId(userId: number) {
  try {
    const rows = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
    return rows.map(toPublicTicket);
  } catch (error) {
    console.error('Database error in getTicketsByUserId:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to load your support tickets right now.', { cause: error });
  }
}

export async function getAllTicketsForAdmin() {
  try {
    const rows = await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt))
      .limit(50);
    return rows.map(toStaffTicket);
  } catch (error) {
    console.error('Database error in getAllTicketsForAdmin:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to load staff tickets right now.', { cause: error });
  }
}

export async function updateTicketStatus(
  ticketId: number,
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
) {
  try {
    const result = await db
      .update(supportTickets)
      .set({ status })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    return result[0] ? toStaffTicket(result[0]) : null;
  } catch (error) {
    console.error('Database error in updateTicketStatus:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to update ticket status right now.', { cause: error });
  }
}

export async function getLeaderboardEntries() {
  try {
    const rows = await db
      .select({
        id: leaderboardEntries.id,
        playerName: leaderboardEntries.playerName,
        rankLabel: leaderboardEntries.rankLabel,
        mode: leaderboardEntries.mode,
        score: leaderboardEntries.score,
        position: leaderboardEntries.position,
        updatedAt: leaderboardEntries.updatedAt,
      })
      .from(leaderboardEntries)
      .orderBy(asc(leaderboardEntries.position))
      .limit(20);
    return rows;
  } catch (error) {
    console.error('Database error in getLeaderboardEntries:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to load server leaderboard right now.', { cause: error });
  }
}

export async function subscribeNewsletter(email: string) {
  try {
    const result = await db
      .insert(newsletterSubscribers)
      .values({ email })
      .onConflictDoNothing({ target: newsletterSubscribers.email })
      .returning();

    return { subscribed: true, alreadyExists: result.length === 0 };
  } catch (error) {
    console.error('Database error in subscribeNewsletter:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to subscribe right now. Please try again.', { cause: error });
  }
}
