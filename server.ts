import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs/promises';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { calculateCouponDiscount, CATALOG_ITEMS } from './src/data/catalog.ts';
import {
  createOrder,
  createSupportTicket,
  findOrderByIdempotencyKey,
  getAllOrdersForAdmin,
  getAllTicketsForAdmin,
  getLeaderboardEntries,
  getOrdersByUserId,
  getTicketsByUserId,
  OrderConflictError,
  subscribeNewsletter,
  toPublicOrder,
  updateOrderStatus,
  updateTicketStatus,
} from './src/db/repository.ts';
import { getOrCreateUser, toPublicUser, updateUserProfile } from './src/db/users.ts';
import {
  AuthRequest,
  extractBearerToken,
  requireAuth,
  requireStaffRole,
  verifyFirebaseBearerToken,
} from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^01[3-9]\d{8}$/;
const JAVA_USERNAME_REGEX = /^[A-Za-z0-9_]{3,16}$/;
const BEDROCK_USERNAME_REGEX = /^[A-Za-z0-9_](?:[A-Za-z0-9_ .]{0,18}[A-Za-z0-9_])?$/;
const TRANSACTION_ID_REGEX = /^[A-Z0-9]{6,32}$/;
const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{8,64}$/;

const ALLOWED_TICKET_CATEGORIES = new Set([
  'Store Delivery',
  'bKash or Nagad Verification',
  'Player Report',
  'Technical Bug',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidMinecraftUsername(username: string, edition: 'java' | 'bedrock'): boolean {
  if (edition === 'java') return JAVA_USERNAME_REGEX.test(username);
  return username.length >= 2 && username.length <= 20 && BEDROCK_USERNAME_REGEX.test(username);
}

function createRateLimiter({
  windowMs,
  max,
  keyPrefix,
  useUserKey = false,
}: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  useUserKey?: boolean;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  const prune = (now: number) => {
    if (hits.size < 2000) return;
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  };

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const now = Date.now();
    prune(now);

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identity = useUserKey && req.user?.uid ? `uid:${req.user.uid}` : `ip:${ip}`;
    const key = `${keyPrefix}:${identity}`;

    const existing = hits.get(key);
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      hits.set(key, { count: 1, resetAt });
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(max - 1));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
      return next();
    }

    if (existing.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)));
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
      });
    }

    existing.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - existing.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)));
    return next();
  };
}

function getAllowedOrigins(req: Request): Set<string> {
  const allowed = new Set<string>();
  const host = req.get('x-forwarded-host') || req.get('host');
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  if (process.env.APP_URL) {
    try {
      allowed.add(new URL(process.env.APP_URL).origin);
    } catch {
      // Ignore malformed APP_URL
    }
  }
  return allowed;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers across all responses
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    const scriptSrc = isProd
      ? "script-src 'self' https://apis.google.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com";
    const connectSrc = isProd
      ? "connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com"
      : "connect-src 'self' ws: wss: https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com";

    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        scriptSrc,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://*.googleusercontent.com https://mc-heads.net https://api.mcstatus.io",
        connectSrc,
        "frame-src 'self' https://sapient-berm-gf6jr.firebaseapp.com https://accounts.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self' https://aistudio.google.com https://*.google.com",
      ].join('; ')
    );
    next();
  });

  // Strict origin validation & CORS for /api/*
  app.use('/api', (req, res, next) => {
    const origin = req.get('origin');
    if (origin) {
      const allowedOrigins = getAllowedOrigins(req);
      if (!allowedOrigins.has(origin)) {
        return res.status(403).json({ error: 'Cross-origin API request denied.' });
      }
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Idempotency-Key'
      );
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }
    return next();
  });

  app.use(express.json({ limit: '32kb' }));

  // Handle malformed JSON cleanly without leaking stack traces
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON request body.' });
    }
    return next(err);
  });

  const globalApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    keyPrefix: 'api_global',
  });
  const profileWriteLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyPrefix: 'me_put',
    useUserKey: true,
  });
  const orderCreateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: 'orders_post',
    useUserKey: true,
  });
  const ticketCreateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: 'tickets_post',
  });
  const newsletterLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: 'newsletter_post',
  });

  app.use('/api', globalApiLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const SERVER_HOST_REGEX = /^[a-zA-Z0-9.-]{3,100}$/;
  const DISCORD_INVITE_REGEX = /^[a-zA-Z0-9-]{2,32}$/;

  async function readRuntimeServerSettings() {
    let serverIp = 'play.ironcloudmc.fun';
    let bedrockPort = 19132;
    let bedrockPlayersCanJoin = true;
    let inviteCode = 'ErBVfVqEVg';

    try {
      const rawCfg = await fs.readFile(path.join(__dirname, 'public', 'config.json'), 'utf8');
      const cfg = JSON.parse(rawCfg) as Record<string, unknown>;
      if (typeof cfg.serverIp === 'string' && SERVER_HOST_REGEX.test(cfg.serverIp.trim())) {
        serverIp = cfg.serverIp.trim();
      }
      if (typeof cfg.bedrockPort === 'number' && Number.isInteger(cfg.bedrockPort)) {
        bedrockPort = cfg.bedrockPort;
      }
      if (typeof cfg.bedrockPlayersCanJoin === 'boolean') {
        bedrockPlayersCanJoin = cfg.bedrockPlayersCanJoin;
      }
      if (typeof cfg.discordLink === 'string') {
        const match = cfg.discordLink.match(/discord\.(?:gg|com\/invite)\/([A-Za-z0-9-]{2,32})/i);
        if (match && DISCORD_INVITE_REGEX.test(match[1])) {
          inviteCode = match[1];
        }
      }
    } catch {
      // Fall back to verified defaults
    }

    try {
      const rawSite = await fs.readFile(path.join(__dirname, 'public', 'site.json'), 'utf8');
      const site = JSON.parse(rawSite) as { hero?: { discord?: { inviteCode?: string } } };
      const siteCode = site?.hero?.discord?.inviteCode?.trim();
      if (siteCode && DISCORD_INVITE_REGEX.test(siteCode)) {
        inviteCode = siteCode;
      }
    } catch {
      // Fall back to verified defaults
    }

    return { serverIp, bedrockPort, bedrockPlayersCanJoin, inviteCode };
  }

  function stripMinecraftFormatting(value: string): string {
    return value.replace(/§[0-9A-FK-ORa-fk-or]/g, '').trim();
  }

  let statusCache: { expiresAt: number; payload: Record<string, unknown> } | null = null;
  let discordCache: { expiresAt: number; payload: Record<string, unknown> } | null = null;

  app.get('/api/status', async (_req, res) => {
    const now = Date.now();
    if (statusCache && statusCache.expiresAt > now) {
      return res.json(statusCache.payload);
    }

    const { serverIp, bedrockPort, bedrockPlayersCanJoin } = await readRuntimeServerSettings();
    const fallbackPayload: Record<string, unknown> = {
      online: false,
      unavailable: true,
      host: serverIp,
      bedrockPort,
      bedrockPlayersCanJoin,
      playersNow: null,
      playersMax: null,
      version: null,
      motdLines: [],
      names: [],
      icon: null,
      fetchedAt: new Date().toISOString(),
    };

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      try {
        return await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json', 'User-Agent': 'IronCloudMC-Site/1.0' },
        });
      } finally {
        clearTimeout(timeout);
      }
    };

    try {
      const mcStatusUrl = `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(serverIp)}`;
      const resp = await fetchWithTimeout(mcStatusUrl);
      if (resp.ok) {
        const data = (await resp.json()) as {
          online?: boolean;
          players?: {
            online?: number;
            max?: number;
            list?: Array<{ name_clean?: string; name_raw?: string }>;
          };
          version?: { name_clean?: string; name_raw?: string };
          motd?: { clean?: string };
          icon?: string | null;
        };

        const motdRaw = typeof data?.motd?.clean === 'string' ? data.motd.clean : '';
        const motdLines = motdRaw
          .split(/\r?\n/)
          .map((l) => stripMinecraftFormatting(l))
          .filter(Boolean)
          .slice(0, 2);

        const names = Array.isArray(data?.players?.list)
          ? data.players.list
              .map((p) => (typeof p.name_clean === 'string' ? p.name_clean : p.name_raw || ''))
              .map((n) => stripMinecraftFormatting(n))
              .filter(Boolean)
              .slice(0, 12)
          : [];

        const payload = {
          online: Boolean(data.online),
          unavailable: false,
          host: serverIp,
          bedrockPort,
          bedrockPlayersCanJoin,
          playersNow: typeof data?.players?.online === 'number' ? data.players.online : null,
          playersMax: typeof data?.players?.max === 'number' ? data.players.max : null,
          version:
            typeof data?.version?.name_clean === 'string'
              ? stripMinecraftFormatting(data.version.name_clean)
              : null,
          motdLines,
          names,
          icon:
            typeof data?.icon === 'string' && data.icon.startsWith('data:image/')
              ? data.icon
              : null,
          fetchedAt: new Date().toISOString(),
        };
        statusCache = { expiresAt: now + 30_000, payload };
        return res.json(payload);
      }
    } catch {
      // Fall through to secondary allowlisted status provider
    }

    try {
      const mcsrvUrl = `https://api.mcsrvstat.us/3/${encodeURIComponent(serverIp)}`;
      const resp = await fetchWithTimeout(mcsrvUrl);
      if (resp.ok) {
        const data = (await resp.json()) as {
          online?: boolean;
          players?: { online?: number; max?: number; list?: Array<{ name?: string }> };
          version?: string;
          motd?: { clean?: string[] };
          icon?: string;
        };
        const motdLines = Array.isArray(data?.motd?.clean)
          ? data.motd.clean.map((l) => stripMinecraftFormatting(String(l))).filter(Boolean).slice(0, 2)
          : [];
        const names = Array.isArray(data?.players?.list)
          ? data.players.list
              .map((p) => stripMinecraftFormatting(String(p.name || '')))
              .filter(Boolean)
              .slice(0, 12)
          : [];
        const payload = {
          online: Boolean(data.online),
          unavailable: false,
          host: serverIp,
          bedrockPort,
          bedrockPlayersCanJoin,
          playersNow: typeof data?.players?.online === 'number' ? data.players.online : null,
          playersMax: typeof data?.players?.max === 'number' ? data.players.max : null,
          version: typeof data?.version === 'string' ? stripMinecraftFormatting(data.version) : null,
          motdLines,
          names,
          icon:
            typeof data?.icon === 'string' && data.icon.startsWith('data:image/')
              ? data.icon
              : null,
          fetchedAt: new Date().toISOString(),
        };
        statusCache = { expiresAt: now + 30_000, payload };
        return res.json(payload);
      }
    } catch {
      // Return unavailable payload honestly
    }

    statusCache = { expiresAt: now + 15_000, payload: fallbackPayload };
    return res.json(fallbackPayload);
  });

  app.get('/api/discord-stats', async (_req, res) => {
    const now = Date.now();
    if (discordCache && discordCache.expiresAt > now) {
      return res.json(discordCache.payload);
    }

    const { inviteCode } = await readRuntimeServerSettings();
    const fallback = {
      available: false,
      memberCount: null,
      onlineCount: null,
      guildName: null,
      inviteCode,
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const url = `https://discord.com/api/v10/invites/${encodeURIComponent(inviteCode)}?with_counts=true`;
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'IronCloudMC-Site/1.0' },
      }).finally(() => clearTimeout(timeout));

      if (resp.ok) {
        const data = (await resp.json()) as {
          approximate_member_count?: number;
          approximate_presence_count?: number;
          guild?: { name?: string };
        };
        const payload = {
          available: typeof data.approximate_member_count === 'number',
          memberCount:
            typeof data.approximate_member_count === 'number'
              ? data.approximate_member_count
              : null,
          onlineCount:
            typeof data.approximate_presence_count === 'number'
              ? data.approximate_presence_count
              : null,
          guildName: typeof data.guild?.name === 'string' ? data.guild.name : null,
          inviteCode,
        };
        discordCache = { expiresAt: now + 120_000, payload };
        return res.json(payload);
      }
    } catch {
      // Return unavailable honestly
    }

    discordCache = { expiresAt: now + 30_000, payload: fallback };
    return res.json(fallback);
  });

  app.get('/api/leaderboard', async (_req, res) => {
    try {
      const entries = await getLeaderboardEntries();
      return res.json({ entries });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load leaderboard.';
      return res.status(500).json({ error: message });
    }
  });

  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      const displayName = typeof req.user!.name === 'string' ? req.user!.name : null;
      const user = await getOrCreateUser(uid, email, displayName, Boolean(req.user!.email_verified));
      res.json({ user: toPublicUser(user) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load player profile.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/me', requireAuth, profileWriteLimiter, async (req: AuthRequest, res) => {
    try {
      if (!isPlainObject(req.body)) {
        return res.status(400).json({ error: 'Invalid request payload.' });
      }

      const uid = req.user!.uid;
      const email = req.user!.email || '';
      const displayName = typeof req.user!.name === 'string' ? req.user!.name : null;
      await getOrCreateUser(uid, email, displayName, Boolean(req.user!.email_verified));

      const rawEdition = req.body.edition;
      if (rawEdition !== 'java' && rawEdition !== 'bedrock') {
        return res.status(400).json({ error: 'Edition must be either java or bedrock.' });
      }

      const minecraftUsername =
        typeof req.body.minecraftUsername === 'string' ? req.body.minecraftUsername.trim() : '';

      if (!isValidMinecraftUsername(minecraftUsername, rawEdition)) {
        return res.status(400).json({
          error:
            rawEdition === 'java'
              ? 'Java usernames must be 3 to 16 letters, numbers, or underscores.'
              : 'Bedrock gamertags must be 2 to 20 valid characters.',
        });
      }

      const updated = await updateUserProfile(uid, minecraftUsername, rawEdition);
      res.json({ user: updated ? toPublicUser(updated) : null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update player profile.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        typeof req.user!.name === 'string' ? req.user!.name : null,
        Boolean(req.user!.email_verified)
      );
      const userOrders = await getOrdersByUserId(user.id);
      res.json({ orders: userOrders });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load orders.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/orders', requireAuth, orderCreateLimiter, async (req: AuthRequest, res) => {
    try {
      if (!isPlainObject(req.body)) {
        return res.status(400).json({ error: 'Invalid checkout payload.' });
      }

      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        typeof req.user!.name === 'string' ? req.user!.name : null,
        Boolean(req.user!.email_verified)
      );

      const rawIdempotency =
        req.get('x-idempotency-key') ||
        (typeof req.body.idempotencyKey === 'string' ? req.body.idempotencyKey : '');
      const idempotencyKey = rawIdempotency.trim() || null;

      if (idempotencyKey && !IDEMPOTENCY_KEY_REGEX.test(idempotencyKey)) {
        return res.status(400).json({ error: 'Invalid idempotency key format.' });
      }

      if (idempotencyKey) {
        const existingOrder = await findOrderByIdempotencyKey(user.id, idempotencyKey);
        if (existingOrder) {
          return res.status(200).json({
            order: toPublicOrder(existingOrder),
            idempotentReplay: true,
          });
        }
      }

      const rawEdition = req.body.edition;
      if (rawEdition !== 'java' && rawEdition !== 'bedrock') {
        return res.status(400).json({ error: 'Edition must be either java or bedrock.' });
      }

      const rawPaymentMethod = req.body.paymentMethod;
      if (rawPaymentMethod !== 'bkash' && rawPaymentMethod !== 'nagad') {
        return res.status(400).json({ error: 'Payment method must be either bkash or nagad.' });
      }

      const minecraftUsername =
        typeof req.body.minecraftUsername === 'string' ? req.body.minecraftUsername.trim() : '';
      const email =
        typeof req.body.email === 'string' && req.body.email.trim()
          ? req.body.email.trim().toLowerCase()
          : user.email.toLowerCase();
      const transactionId =
        typeof req.body.transactionId === 'string'
          ? req.body.transactionId.trim().toUpperCase()
          : '';
      const senderNumber =
        typeof req.body.senderNumber === 'string' ? req.body.senderNumber.trim() : '';
      const notes =
        typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 400) : '';
      const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

      if (!isValidMinecraftUsername(minecraftUsername, rawEdition)) {
        return res.status(400).json({
          error:
            rawEdition === 'java'
              ? 'Java usernames must be 3 to 16 letters, numbers, or underscores.'
              : 'Bedrock gamertags must be 2 to 20 valid characters.',
        });
      }
      if (email.length > 254 || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Enter a valid email address for receipt delivery.' });
      }
      if (!PHONE_REGEX.test(senderNumber)) {
        return res
          .status(400)
          .json({ error: 'Enter a valid 11 digit Bangladesh mobile number (01XXXXXXXXX).' });
      }
      if (!TRANSACTION_ID_REGEX.test(transactionId)) {
        return res.status(400).json({
          error: 'Transaction ID must be 6 to 32 alphanumeric characters.',
        });
      }
      if (rawItems.length === 0 || rawItems.length > 25) {
        return res.status(400).json({ error: 'Select between 1 and 25 store line items.' });
      }

      // Deduplicate & merge quantities per catalog item ID, computing prices exclusively from CATALOG_ITEMS
      const mergedQuantities = new Map<string, number>();
      for (const item of rawItems) {
        if (!isPlainObject(item) || typeof item.id !== 'string') {
          return res.status(400).json({ error: 'Invalid cart item payload.' });
        }
        const catalogMatch = CATALOG_ITEMS.find((c) => c.id === item.id);
        const qty = Number(item.quantity);
        if (!catalogMatch || !Number.isInteger(qty) || qty < 1 || qty > 25) {
          return res.status(400).json({ error: 'Invalid cart item or quantity detected.' });
        }
        const combined = (mergedQuantities.get(catalogMatch.id) || 0) + qty;
        if (combined > 25) {
          return res.status(400).json({ error: 'Maximum quantity per item is 25.' });
        }
        mergedQuantities.set(catalogMatch.id, combined);
      }

      const verifiedItems: Array<{ id: string; name: string; priceBdt: number; quantity: number }> = [];
      let subtotalAmountBdt = 0;

      for (const [id, quantity] of mergedQuantities.entries()) {
        const catalogMatch = CATALOG_ITEMS.find((c) => c.id === id)!;
        verifiedItems.push({
          id: catalogMatch.id,
          name: catalogMatch.name,
          priceBdt: catalogMatch.priceBdt,
          quantity,
        });
        subtotalAmountBdt += catalogMatch.priceBdt * quantity;
      }

      const rawCouponCode =
        typeof req.body.couponCode === 'string' ? req.body.couponCode.trim().slice(0, 32) : '';
      const couponResult = calculateCouponDiscount(subtotalAmountBdt, rawCouponCode);
      if (!couponResult.valid) {
        return res.status(400).json({ error: couponResult.error || 'Invalid coupon code.' });
      }

      await updateUserProfile(req.user!.uid, minecraftUsername, rawEdition);

      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orderCode = `IC-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

      const order = await createOrder({
        userId: user.id,
        orderCode,
        idempotencyKey,
        minecraftUsername,
        edition: rawEdition,
        email,
        itemsJson: JSON.stringify(verifiedItems),
        couponCode: couponResult.couponCode,
        discountBdt: couponResult.discountBdt,
        totalAmountBdt: couponResult.finalTotalBdt,
        paymentMethod: rawPaymentMethod,
        transactionId,
        senderNumber,
        notes: notes || undefined,
      });

      res.status(201).json({ order: toPublicOrder(order) });
    } catch (error: unknown) {
      if (error instanceof OrderConflictError) {
        return res.status(409).json({ error: error.message });
      }
      const message = error instanceof Error ? error.message : 'Unable to submit order.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/tickets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        typeof req.user!.name === 'string' ? req.user!.name : null,
        Boolean(req.user!.email_verified)
      );
      const tickets = await getTicketsByUserId(user.id);
      res.json({ tickets });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load support tickets.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/tickets', ticketCreateLimiter, async (req, res) => {
    try {
      if (!isPlainObject(req.body)) {
        return res.status(400).json({ error: 'Invalid ticket payload.' });
      }

      let userId: number | null = null;
      const bearerToken = extractBearerToken(req.headers.authorization);
      if (req.headers.authorization) {
        if (!bearerToken) {
          return res.status(401).json({ error: 'Invalid authorization header.' });
        }
        try {
          const decoded = await verifyFirebaseBearerToken(bearerToken);
          const user = await getOrCreateUser(
            decoded.uid,
            decoded.email || '',
            typeof decoded.name === 'string' ? decoded.name : null,
            Boolean(decoded.email_verified)
          );
          userId = user.id;
        } catch {
          return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
        }
      }

      const minecraftUsername =
        typeof req.body.minecraftUsername === 'string' ? req.body.minecraftUsername.trim() : '';
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
      const subject =
        typeof req.body.subject === 'string' ? req.body.subject.trim().slice(0, 140) : '';
      const message =
        typeof req.body.message === 'string' ? req.body.message.trim().slice(0, 1500) : '';

      if (!isValidMinecraftUsername(minecraftUsername, 'bedrock')) {
        return res.status(400).json({ error: 'Enter a valid Minecraft username (2 to 20 characters).' });
      }
      if (email.length > 254 || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Enter a valid email address.' });
      }
      if (!ALLOWED_TICKET_CATEGORIES.has(category)) {
        return res.status(400).json({ error: 'Select a valid support topic.' });
      }
      if (subject.length < 4) {
        return res.status(400).json({ error: 'Enter a subject with at least 4 characters.' });
      }
      if (message.length < 10) {
        return res
          .status(400)
          .json({ error: 'Describe your question or issue in at least 10 characters.' });
      }

      const ticket = await createSupportTicket({
        userId,
        minecraftUsername,
        email,
        category,
        subject,
        message,
      });

      res.status(201).json({ ticket });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to submit support ticket.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/newsletter', newsletterLimiter, async (req, res) => {
    try {
      if (!isPlainObject(req.body)) {
        return res.status(400).json({ error: 'Invalid subscription payload.' });
      }
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (email.length > 254 || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Enter a valid email address.' });
      }
      const result = await subscribeNewsletter(email);
      res.status(201).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Subscription failed.';
      res.status(500).json({ error: message });
    }
  });

  const ALLOWED_ORDER_STATUSES = new Set([
    'pending_verification',
    'verified',
    'delivered',
    'rejected',
  ]);
  const ALLOWED_TICKET_STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed']);

  app.get('/api/admin/orders', requireAuth, requireStaffRole, async (_req, res) => {
    try {
      const ordersList = await getAllOrdersForAdmin();
      return res.json({ orders: ordersList });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load orders.';
      return res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/orders/:id', requireAuth, requireStaffRole, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid order ID.' });
      }
      if (!isPlainObject(req.body) || typeof req.body.status !== 'string') {
        return res.status(400).json({ error: 'Invalid status update payload.' });
      }
      const nextStatus = req.body.status.trim();
      if (!ALLOWED_ORDER_STATUSES.has(nextStatus)) {
        return res.status(400).json({ error: 'Invalid order status value.' });
      }
      const updated = await updateOrderStatus(
        id,
        nextStatus as 'pending_verification' | 'verified' | 'delivered' | 'rejected'
      );
      if (!updated) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      return res.json({ order: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update order.';
      return res.status(500).json({ error: message });
    }
  });

  app.get('/api/admin/tickets', requireAuth, requireStaffRole, async (_req, res) => {
    try {
      const ticketsList = await getAllTicketsForAdmin();
      return res.json({ tickets: ticketsList });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load tickets.';
      return res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/tickets/:id', requireAuth, requireStaffRole, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ticket ID.' });
      }
      if (!isPlainObject(req.body) || typeof req.body.status !== 'string') {
        return res.status(400).json({ error: 'Invalid status update payload.' });
      }
      const nextStatus = req.body.status.trim();
      if (!ALLOWED_TICKET_STATUSES.has(nextStatus)) {
        return res.status(400).json({ error: 'Invalid ticket status value.' });
      }
      const updated = await updateTicketStatus(
        id,
        nextStatus as 'open' | 'in_progress' | 'resolved' | 'closed'
      );
      if (!updated) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }
      return res.json({ ticket: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update ticket.';
      return res.status(500).json({ error: message });
    }
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err instanceof Error ? err.name : 'unknown');
    if (res.headersSent) return;
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IRON CLOUD MC server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
