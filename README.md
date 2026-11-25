# IRON CLOUD MC — Official Server Website & Store

Full-stack web application and official store for **IRON CLOUD MC** (`play.ironcloudmc.fun`), supporting Java and Bedrock Edition players (`1.8` to `1.21.8`) across Survival, Skyblock, Factions, and PvP Arena.

## Overview

- **Server IP**: `play.ironcloudmc.fun`
- **Editions**: Minecraft Java Edition & Bedrock Edition (`1.8`–`1.21.8`)
- **Store Currency & Payments**: Bangladeshi Taka (`৳`) via **bKash** and **Nagad** (`01821925430`, reference `IRONCLOUD`)
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Database**: Cloud SQL (PostgreSQL) via Drizzle ORM (`pg` connection pool)
- **Frontend**: React 19, Vite, Tailwind CSS v4, Manrope & Geist Mono typography, Phosphor Icons

---

## Project Structure

```text
iron-cloud-mc-shop/
├── .env.example
├── .gitignore
├── firebase-applet-config.json        # Generated Firebase client/project config
├── index.html                         # Root HTML entry, Manrope/Geist Mono fonts, SEO & OG tags
├── metadata.json                      # App metadata
├── package.json                       # Scripts (dev, start, build, lint) and dependencies
├── README.md                          # Project documentation
├── server.ts                          # Express API server & Vite middleware on port 3000
├── tsconfig.json                      # TypeScript compiler configuration
├── vite.config.ts                     # Vite build & static asset copy configuration
├── public/
│   ├── config.json                      # Live Minecraft server & Discord preview runtime config
│   ├── robots.txt                       # Search engine crawler directives
│   ├── site.json                        # Brand, navigation, and community runtime config
│   ├── store.json                       # Store display currency rates & promo runtime config
│   └── assets/
│       └── aistudio/
│           ├── SKILL_0c0ad932.md
│           └── server_logo_1788529150584_b551acb7.jpg
└── src/
    ├── App.tsx                        # Multi-page SPA router, cookie consent, global providers
    ├── index.css                      # Tailwind CSS v4, named typography classes, motion curves
    ├── main.tsx                       # React DOM mount
    ├── assets/
    │   └── images/                    # Generated voxel citadel, game mode, and crate vault art
    ├── components/
    │   ├── CartDrawer.tsx             # Slide-over store bag with currency formatting & coupon codes
    │   ├── Footer.tsx                 # Footer links, contact info, and newsletter subscription
    │   ├── Navbar.tsx                 # Floating translucent header and full-height mobile menu
    │   └── Reveal.tsx                 # IntersectionObserver scroll reveals & word-by-word tagline
    ├── context/
    │   ├── AuthContext.tsx            # Firebase Google Sign-In & PostgreSQL profile/role sync
    │   └── CartContext.tsx            # Persistent cart, runtime JSON configs, currency & coupons
    ├── data/
    │   └── catalog.ts                 # Ranks, coins, keys, special bundles, coupons, rules, FAQ
    ├── db/
    │   ├── drizzle.config.ts          # Drizzle Kit configuration (admin credentials)
    │   ├── index.ts                   # Lazy pg Pool connection (Object Method) + Drizzle client
    │   ├── repository.ts              # Queries for orders, tickets, leaderboard, staff queue, newsletter
    │   ├── schema.ts                  # PostgreSQL tables and Drizzle relations
    │   └── users.ts                   # Upsert, role normalization, and Minecraft profile helpers
    ├── lib/
    │   ├── firebase-admin.ts          # Firebase Admin SDK initialization for token verification
    │   ├── firebase.ts                # Firebase client SDK & GoogleAuthProvider
    │   └── siteConfig.ts              # Runtime JSON config loader & currency helpers
    ├── middleware/
    │   └── auth.ts                    # Express Bearer ID token verification & staff RBAC middleware
    └── pages/
        ├── CheckoutAndAccountPages.tsx # bKash/Nagad checkout, Player Passport, and Staff Panel
        ├── CommunityPages.tsx          # About, Team, Rules, Support tickets, Privacy, Terms, and 404
        ├── HomePage.tsx                # Live server status, Discord stats, leaderboard, store preview, FAQ
        └── StorePages.tsx              # Store overview, Ranks, Coins, Keys, Special bundles, Item modal
```

---

## Pages & Routes

| Route | View | Description |
|---|---|---|
| `/` | Home | Hero live status pill, server/Discord telemetry, MOTD & online players, highlights, store preview, leaderboard, game modes, FAQ |
| `/store` | Store Overview | Unified catalog with category tabs (`All`, `Ranks`, `Coins`, `Crate Keys`, `Special`), currency switcher (`BDT`/`USD`/`INR`), search, and item modal |
| `/ranks` | Server Ranks | `Hero` (`৳150`), `Lion` (`৳300`), `King` (`৳500`), `Legend` (`৳800`), `MASTER` (`৳1200`), `IMMORTAL` (`৳2000`) |
| `/coins` | Coin Packages | `Bronze` (`৳50`) through `Legendary` (`৳1000`) with up to 30% bonus coins |
| `/keys` | Crate Keys | `Common`, `Rare`, `Epic`, `Legendary`, `Mythical`, and `Ultimate Key Bundle` (`৳2500`) |
| `/special` | Special Packages | Curated starter and commander server bundles (`Adventure Starter Bundle`, `Realm Commander Bundle`) |
| `/about` | About Us | Server story since 2019, statistics, and milestone timeline |
| `/team` | Staff Team | Management, Administration, and Moderation team roster |
| `/rules` | Server Rules | Official gameplay, economy, and community conduct guidelines |
| `/support` | Support Center | Discord, email, phone support, and PostgreSQL-persisted ticket submission |
| `/checkout` | Checkout | Google Sign-In gated bKash/Nagad checkout with promo codes and transaction ID validation |
| `/account` | Player Passport | 3D skin preview (`mc-heads.net`), Java/Bedrock profile sync, orders, quick ticket composer, and Staff Panel |
| `/privacy`, `/terms` | Legal | Privacy Policy and Terms of Service |

---

## Backend API Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/health` | Public | Server health check |
| `GET /api/status` | Public | Cached server-side Minecraft status proxy (`mcstatus.io` / `mcsrvstat.us`) |
| `GET /api/discord-stats` | Public | Cached server-side Discord invite member/online count proxy |
| `GET /api/leaderboard` | Public | Fetch seasonal leaderboard entries from PostgreSQL |
| `GET /api/me` | Bearer Token | Fetch or initialize signed-in player profile and role in PostgreSQL |
| `PUT /api/me` | Bearer Token | Save Minecraft username and edition (`java` or `bedrock`) |
| `GET /api/orders` | Bearer Token | Retrieve authenticated player's store orders |
| `POST /api/orders` | Bearer Token | Validate catalog items, coupons, bKash/Nagad details, and create order |
| `GET /api/tickets` | Bearer Token | Retrieve authenticated player's support tickets |
| `POST /api/tickets` | Optional Token | Submit a support ticket to PostgreSQL |
| `POST /api/newsletter` | Public | Subscribe an email address to server updates |
| `GET /api/admin/orders` | Staff RBAC | List recent player orders for `owner`, `admin`, and `moderator` accounts |
| `PATCH /api/admin/orders/:id` | Staff RBAC | Update store order fulfillment status (`pending`, `verified`, `delivered`, `rejected`) |
| `GET /api/admin/tickets` | Staff RBAC | List support tickets for `owner`, `admin`, and `moderator` accounts |
| `PATCH /api/admin/tickets/:id` | Staff RBAC | Update support ticket status (`open`, `in_progress`, `resolved`) |

---

## Database Schema (`src/db/schema.ts`)

- **`users`**: `id`, `uid` (unique Firebase UID), `email`, `display_name`, `minecraft_username`, `edition`, `role` (`owner`, `admin`, `moderator`, `player`), `created_at`
- **`orders`**: `id`, `user_id` (FK → `users.id`), `order_code`, `minecraft_username`, `edition`, `email`, `items_json`, `coupon_code`, `discount_bdt`, `total_amount_bdt`, `payment_method`, `transaction_id`, `sender_number`, `idempotency_key`, `notes`, `status`, `created_at`
- **`support_tickets`**: `id`, `user_id` (nullable FK → `users.id`), `minecraft_username`, `email`, `category`, `subject`, `message`, `status`, `created_at`
- **`leaderboard_entries`**: `id`, `player_name`, `rank_label`, `mode`, `score`, `position`, `updated_at`
- **`newsletter_subscribers`**: `id`, `email` (unique), `created_at`

---

## Environment Variables & Local Commands

Runtime Cloud SQL and app environment variables:

- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD` (application connection pool)
- `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD` (Drizzle Kit schema migrations)
- `APP_URL`, `GEMINI_API_KEY` (runtime environment configuration)
- `ADMIN_OWNER_EMAIL` (optional verified email bootstrap for initial `owner` role)

```bash
# Install dependencies
npm install

# Run Express + Vite development server on port 3000
npm run dev

# Type-check TypeScript
npm run lint

# Build production bundle
npm run build

# Start production Express server on port 3000
npm start
```
