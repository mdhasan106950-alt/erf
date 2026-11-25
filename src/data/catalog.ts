export type ProductCategory = 'ranks' | 'coins' | 'keys' | 'special';

export interface CatalogItem {
  id: string;
  category: ProductCategory;
  name: string;
  priceBdt: number;
  image: string;
  summary: string;
  features: string[];
  featured?: boolean;
  tag?: string;
}

export const STORE_REFERENCE_IMAGE = '/assets/aistudio/store_crate_26f6d13d.jpg';

export interface StoreCoupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minBdt: number;
  label: string;
}

export const STORE_COUPONS: StoreCoupon[] = [
  {
    code: 'IRON10',
    type: 'percent',
    value: 10,
    minBdt: 150,
    label: '10% off orders ৳150+',
  },
  {
    code: 'CLOUD50',
    type: 'flat',
    value: 50,
    minBdt: 300,
    label: '৳50 off orders ৳300+',
  },
];

export function calculateCouponDiscount(
  subtotalBdt: number,
  rawCode?: string | null
): {
  valid: boolean;
  couponCode: string | null;
  discountBdt: number;
  finalTotalBdt: number;
  error?: string;
  label?: string;
} {
  const cleanCode = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  if (!cleanCode) {
    return { valid: true, couponCode: null, discountBdt: 0, finalTotalBdt: subtotalBdt };
  }
  const match = STORE_COUPONS.find((c) => c.code === cleanCode);
  if (!match) {
    return {
      valid: false,
      couponCode: null,
      discountBdt: 0,
      finalTotalBdt: subtotalBdt,
      error: 'Coupon code is invalid or expired.',
    };
  }
  if (subtotalBdt < match.minBdt) {
    return {
      valid: false,
      couponCode: null,
      discountBdt: 0,
      finalTotalBdt: subtotalBdt,
      error: `Minimum order of ৳ ${match.minBdt} required for ${match.code}.`,
    };
  }
  const rawDiscount =
    match.type === 'percent' ? Math.floor((subtotalBdt * match.value) / 100) : match.value;
  const discountBdt = Math.max(0, Math.min(subtotalBdt - 1, rawDiscount));
  return {
    valid: true,
    couponCode: match.code,
    discountBdt,
    finalTotalBdt: Math.max(1, subtotalBdt - discountBdt),
    label: match.label,
  };
}

export const SERVER_INFO = {
  name: 'IRON CLOUD MC',
  ip: 'play.ironcloudmc.fun',
  foundedYear: 2019,
  versions: '1.8 to 1.21.8',
  editions: 'Java & Bedrock',
  discordUrl: 'https://discord.gg/ErBVfVqEVg',
  discordDisplay: 'discord.gg/ErBVfVqEVg',
  email: 'ironcloudmc@gmail.com',
  phone: '01821925430',
  bkashNumber: '01821925430',
  nagadNumber: '01821925430',
  paymentReference: 'IRONCLOUD',
  stats: [
    { label: 'Active Players', value: '200+' },
    { label: 'Years Running', value: '5+' },
    { label: 'Game Modes', value: '10' },
    { label: 'Custom Plugins', value: '40' },
  ],
} as const;

export const CATALOG_ITEMS: CatalogItem[] = [
  // Ranks (exact items & BDT pricing from iron-cloud-mc-shop)
  {
    id: 'rank-hero',
    category: 'ranks',
    name: 'Hero Rank',
    priceBdt: 150,
    image: '/assets/aistudio/Hero_Rank_bf763a49.png',
    summary: 'Starter flight access, custom Hero prefix, and five saved home waypoints.',
    features: ['Custom Prefix', 'Access to /fly', '5 Homes', 'Hero Tag', 'Colorful Chat'],
  },
  {
    id: 'rank-lion',
    category: 'ranks',
    name: 'Lion Rank',
    priceBdt: 300,
    image: '/assets/aistudio/Lion_Rank_0eead3b5.png',
    summary: 'Includes all Hero perks plus ten homes, hunger restore command, and priority support.',
    features: ['All Hero Perks', '10 Homes', 'Lion Tag', '/feed Command', 'Priority Support'],
  },
  {
    id: 'rank-king',
    category: 'ranks',
    name: 'King Rank',
    priceBdt: 500,
    image: '/assets/aistudio/King_Rank_ed1ba1ff.png',
    summary: 'Portable ender chest access, custom player nicknames, and fifteen saved homes.',
    features: ['All Lion Perks', '15 Homes', 'King Tag', '/ec Command', 'Nickname Access'],
    featured: true,
    tag: 'Popular',
  },
  {
    id: 'rank-legend',
    category: 'ranks',
    name: 'Legend Rank',
    priceBdt: 800,
    image: '/assets/aistudio/Legend_Rank_699048a5.png',
    summary: 'Instant gear repair command, particle cosmetics, and twenty saved homes.',
    features: ['All King Perks', '20 Homes', 'Legend Tag', '/repair Command', 'Special Particle Effects'],
  },
  {
    id: 'rank-master',
    category: 'ranks',
    name: 'MASTER Rank',
    priceBdt: 1200,
    image: '/assets/aistudio/King_Rank_ed1ba1ff.png',
    summary: 'Full command suite, thirty saved homes, and exclusive Master cosmetics.',
    features: ['All Legend Perks', '30 Homes', 'MASTER Tag', 'All Commands Access', 'Exclusive Master Cosmetics'],
  },
  {
    id: 'rank-immortal',
    category: 'ranks',
    name: 'IMMORTAL Rank',
    priceBdt: 2000,
    image: '/assets/aistudio/Legend_Rank_699048a5.png',
    summary: 'Top server tier with fifty homes, custom particles, and exclusive Immortal wings.',
    features: ['All MASTER Perks', '50 Homes', 'IMMORTAL Tag', 'Custom Particles', 'Exclusive Immortal Wing'],
    featured: true,
    tag: 'Highest Tier',
  },

  // Coin Packages
  {
    id: 'coins-bronze',
    category: 'coins',
    name: 'Bronze Coin Package',
    priceBdt: 50,
    image: '/assets/aistudio/Bronze_Coin_Package_246c70bb.png',
    summary: '5,000 in game coins delivered directly to your balance for starter gear.',
    features: ['5,000 Coins', 'Starter value', 'Instant delivery'],
  },
  {
    id: 'coins-silver',
    category: 'coins',
    name: 'Silver Coin Package',
    priceBdt: 120,
    image: '/assets/aistudio/Silver_Coin_Package_bb762e92.png',
    summary: '15,000 in game coins with a 5% bonus allocation for survival upgrades.',
    features: ['15,000 Coins', '+5% Bonus coins', 'Instant delivery'],
  },
  {
    id: 'coins-gold',
    category: 'coins',
    name: 'Gold Coin Package',
    priceBdt: 200,
    image: '/assets/aistudio/Gold_Coin_Package_ffd973d8.png',
    summary: '30,000 in game coins with a 10% bonus allocation for skyblock and survival.',
    features: ['30,000 Coins', '+10% Bonus coins', 'Instant delivery'],
    featured: true,
    tag: 'Best Seller',
  },
  {
    id: 'coins-diamond',
    category: 'coins',
    name: 'Diamond Coin Package',
    priceBdt: 300,
    image: '/assets/aistudio/Diamond_Coin_Package_b98c59ed.png',
    summary: '50,000 in game coins with a 15% bonus allocation for faction trading.',
    features: ['50,000 Coins', '+15% Bonus coins', 'Instant delivery'],
  },
  {
    id: 'coins-emerald',
    category: 'coins',
    name: 'Emerald Coin Package',
    priceBdt: 500,
    image: '/assets/aistudio/Diamond_Coin_Package_b98c59ed.png',
    summary: '100,000 in game coins with a 20% bonus allocation for guild treasuries.',
    features: ['100,000 Coins', '+20% Bonus coins', 'Instant delivery'],
  },
  {
    id: 'coins-legendary',
    category: 'coins',
    name: 'Legendary Coin Package',
    priceBdt: 1000,
    image: '/assets/aistudio/Gold_Coin_Package_ffd973d8.png',
    summary: '250,000 in game coins with a 30% bonus allocation for full realm dominance.',
    features: ['250,000 Coins', '+30% Bonus coins', 'Instant delivery'],
  },

  // Crate Keys
  {
    id: 'keys-common',
    category: 'keys',
    name: 'Common Key (x5)',
    priceBdt: 100,
    image: '/assets/aistudio/Common_Key_ecf19aa6.png',
    summary: 'Five Common Crate Keys with chances for starter tools and rare supplies.',
    features: ['5 Common Crate Keys', 'Chance for rare items', 'Instant delivery'],
  },
  {
    id: 'keys-rare',
    category: 'keys',
    name: 'Rare Key (x5)',
    priceBdt: 250,
    image: '/assets/aistudio/Rare_Key_0ab2f7a4.png',
    summary: 'Five Rare Crate Keys with improved odds for enchanted gear and epic drops.',
    features: ['5 Rare Crate Keys', 'Higher chance for epics', 'Instant delivery'],
  },
  {
    id: 'keys-epic',
    category: 'keys',
    name: 'Epic Key (x5)',
    priceBdt: 500,
    image: '/assets/aistudio/Epic_Key__eb1ef8c0.png',
    summary: 'Five Epic Crate Keys unlocking high tier combat gear and legendary drop rolls.',
    features: ['5 Epic Crate Keys', 'Chance for legendary items', 'Instant delivery'],
  },
  {
    id: 'keys-legendary',
    category: 'keys',
    name: 'Legendary Key (x3)',
    priceBdt: 750,
    image: '/assets/aistudio/Legendary_Key_da6fbcd0.png',
    summary: 'Three Legendary Crate Keys guaranteeing epic items with strong legendary odds.',
    features: ['3 Legendary Crate Keys', 'Guaranteed epic items', 'Instant delivery'],
    featured: true,
    tag: 'High Drop Rate',
  },
  {
    id: 'keys-mythical',
    category: 'keys',
    name: 'Mythical Key (x3)',
    priceBdt: 1200,
    image: '/assets/aistudio/Legendary_Key_da6fbcd0.png',
    summary: 'Three Mythical Crate Keys with guaranteed legendary drops and exclusive cosmetics.',
    features: ['3 Mythical Crate Keys', 'Guaranteed legendary', 'Exclusive cosmetics'],
  },
  {
    id: 'keys-ultimate',
    category: 'keys',
    name: 'Ultimate Key Bundle',
    priceBdt: 2500,
    image: '/assets/aistudio/store_crate_26f6d13d.jpg',
    summary: 'Ten keys from every crate tier across the entire vault in one combined bundle.',
    features: ['10 Keys of each type', 'All crate types', 'Best bundle rate'],
  },

  // Special Packages
  {
    id: 'special-adventure-starter',
    category: 'special',
    name: 'Adventure Starter Bundle',
    priceBdt: 280,
    image: '/assets/aistudio/Hero_Rank_bf763a49.png',
    summary: 'Combines Hero Rank, 15,000 Survival Coins, and five Rare Crate Keys for new players.',
    features: ['Hero Rank Included', '15,000 Coins', '5 Rare Crate Keys', 'Instant bundle dispatch'],
    featured: true,
    tag: 'Starter Bundle',
  },
  {
    id: 'special-realm-commander',
    category: 'special',
    name: 'Realm Commander Bundle',
    priceBdt: 950,
    image: '/assets/aistudio/store_crate_26f6d13d.jpg',
    summary: 'King Rank paired with 50,000 Coins and three Legendary Crate Keys at seasonal savings.',
    features: ['King Rank Included', '50,000 Coins', '3 Legendary Crate Keys', 'Priority Discord tag'],
    tag: 'Seasonal Value',
  },
];

export const GAME_MODES = [
  {
    id: 'survival',
    name: 'Survival',
    description: 'Enhanced classic survival realms with custom bosses, land claiming, and balanced player economies.',
    image: '/src/assets/images/mode_survival_skyblock_1795293703501.jpg',
    meta: 'Java & Bedrock · Custom Mobs',
  },
  {
    id: 'skyblock',
    name: 'Skyblock',
    description: 'Begin on a single floating island, automate resource generators, and expand into a sky empire.',
    image: '/src/assets/images/mode_survival_skyblock_1795293703501.jpg',
    meta: 'Cooperative Islands · Leaderboards',
  },
  {
    id: 'factions',
    name: 'Factions',
    description: 'Build fortified obsidian bases, forge alliances, and contest territory across seasonal warzones.',
    image: '/src/assets/images/mode_factions_pvp_1795293704169.jpg',
    meta: 'Clan Wars · Territory Control',
  },
  {
    id: 'pvp-arena',
    name: 'PvP Arena',
    description: 'Test combat timing in dedicated duel arenas with zero lag hit registration and ranked kits.',
    image: '/src/assets/images/mode_factions_pvp_1795293704169.jpg',
    meta: '1.8 to 1.21.8 · Ranked Duels',
  },
];

export const TEAM_MEMBERS = [
  {
    group: 'Management',
    name: 'MR DOOM YT',
    role: 'Owner & Founder',
    bio: 'Founder and owner of IRON CLOUD MC. Oversees server operations, community direction, and seasonal roadmaps.',
  },
  {
    group: 'Management',
    name: 'senpai-hasan',
    role: 'Lead Developer',
    bio: 'Main developer responsible for custom plugin engineering, server maintenance, and technical stability.',
  },
  {
    group: 'Management',
    name: 'alvi',
    role: 'Developer',
    bio: 'Builds custom gameplay features, optimizes server tick performance, and maintains plugin integrations.',
  },
  {
    group: 'Administration',
    name: 'abir (ziron)',
    role: 'Administrator',
    bio: 'Senior administrator overseeing player support, fair rule enforcement, and realm moderation.',
  },
  {
    group: 'Administration',
    name: 'SAZIM',
    role: 'Administrator',
    bio: 'Senior administrator managing community events, dispute resolution, and store order verification.',
  },
  {
    group: 'Moderation',
    name: 'VAYMO',
    role: 'Moderator',
    bio: 'Maintains fair gameplay across arenas, reviews player reports, and assists newcomers.',
  },
  {
    group: 'Moderation',
    name: 'SAYAN',
    role: 'Moderator',
    bio: 'Active staff moderator helping players troubleshoot gameplay questions and keeping chat welcoming.',
  },
];

export const SERVER_TIMELINE = [
  { year: '2019', event: 'IRON CLOUD MC began as a private survival world built for a close group of friends.' },
  { year: '2020', event: 'Opened publicly with custom plugins, dedicated survival realms, and the first player store.' },
  { year: '2021', event: 'Expanded crossplay infrastructure to welcome both Java Edition and Bedrock Edition players.' },
  { year: '2022', event: 'Introduced Skyblock, Factions, and dedicated PvP arenas powered by forty custom plugins.' },
  { year: '2023+', event: 'Sustained an active community supporting versions 1.8 through 1.21.8 with automated delivery.' },
];

export const FAQ_ITEMS = [
  {
    question: 'How fast are purchased ranks, coins, and crate keys delivered?',
    answer: 'Items are queued for instant automated delivery once your bKash or Nagad transaction is confirmed. If items do not arrive within 5 minutes, open a ticket in Support or on Discord.',
  },
  {
    question: 'Which payment methods are currently accepted?',
    answer: 'We accept bKash and Nagad mobile payments for players in Bangladesh using account number 01821925430 with reference IRONCLOUD.',
  },
  {
    question: 'What happens if a technical issue prevents my purchase from arriving?',
    answer: 'Digital purchases are generally final once delivered, but if a technical error prevents delivery, our staff verifies your transaction ID and guarantees full item fulfillment or resolution.',
  },
  {
    question: 'Can both Java Edition and Bedrock Edition players join and buy items?',
    answer: 'Yes. Both Java and Bedrock players connect to play.ironcloudmc.fun and receive store ranks, coins, and crate keys on their linked server username.',
  },
  {
    question: 'Which Minecraft versions are supported on IRON CLOUD MC?',
    answer: 'You can join using any Minecraft client from version 1.8 up to the latest 1.21.8 release.',
  },
  {
    question: 'Do I need to be online in the server during checkout?',
    answer: 'Being online speeds up verification, though your username record is stored so queued rewards apply as soon as your transaction is confirmed.',
  },
  {
    question: 'How do I verify a bKash or Nagad payment in checkout?',
    answer: 'Send the exact BDT total via Send Money to 01821925430 with reference IRONCLOUD, then enter your eleven digit sender number and transaction ID on the Checkout page.',
  },
  {
    question: 'Where can I get help after hours or report a server issue?',
    answer: 'Our Discord server at discord.gg/ErBVfVqEVg operates around the clock, and you can also submit a tracked support ticket directly from the Support page.',
  },
];

export const WHY_CHOOSE_FEATURES = [
  {
    title: 'Custom Gameplay',
    description: 'Forty custom server plugins balancing survival claims, island automation, and clean combat timing.',
  },
  {
    title: 'Active Community',
    description: 'Java and Bedrock players trading, building towns, and competing side by side since 2019.',
  },
  {
    title: 'Regular Events',
    description: 'Scheduled boss raids, seasonal crate drops, and weekend arena brackets with tracked rewards.',
  },
  {
    title: 'Unique Adventures',
    description: 'Four distinct game modes across ten worlds designed for solo builders and full clans alike.',
  },
  {
    title: 'Rewards and Progression',
    description: 'Transparent rank perks, coin milestones, and guaranteed technical delivery protection.',
  },
  {
    title: 'Dedicated Staff Team',
    description: 'Active moderators and administrators verifying orders and resolving reports promptly.',
  },
];

export const SERVER_RULES = [
  {
    code: '01',
    title: 'Respect All Players and Staff',
    detail: 'Harassment, hate speech, doxxing threats, and toxic spamming in global chat or Discord result in mutes or permanent bans.',
  },
  {
    code: '02',
    title: 'Zero Unfair Clients or Exploits',
    detail: 'Hacked clients, autoclickers, xray packs, kill aura, and duplication glitches are strictly prohibited across every realm.',
  },
  {
    code: '03',
    title: 'Protect Claimed Bases and Economies',
    detail: 'Respect land claims in Survival and Skyblock. Scamming real money trades or impersonating staff leads to immediate account action.',
  },
  {
    code: '04',
    title: 'Honest Store Transactions Only',
    detail: 'Always submit accurate bKash or Nagad transaction IDs belonging to your payment. Falsified or duplicated slips are rejected.',
  },
  {
    code: '05',
    title: 'Follow Moderator Instructions',
    detail: 'If you believe a punishment or order review was issued in error, submit an appeal ticket through Support or Discord rather than arguing in chat.',
  },
];
