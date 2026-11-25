import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CaretDown,
  Check,
  Copy,
  Crown,
  Headset,
  Lightning,
  MagnifyingGlass,
  ShieldCheck,
  Trophy,
  UsersThree,
} from '@phosphor-icons/react';
import {
  CATALOG_ITEMS,
  FAQ_ITEMS,
  GAME_MODES,
  ProductCategory,
  SERVER_INFO,
  WHY_CHOOSE_FEATURES,
} from '../data/catalog';
import { useCart } from '../context/CartContext';
import { getMinecraftAvatarUrl } from '../lib/siteConfig';
import { AppRoute } from '../components/Navbar';
import { RevealSection, TaglineReveal } from '../components/Reveal';
import { SafeImage } from '../components/SafeImage';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
}

interface LiveStatusData {
  online: boolean;
  unavailable?: boolean;
  host: string;
  bedrockPort: number;
  bedrockPlayersCanJoin: boolean;
  playersNow: number | null;
  playersMax: number | null;
  version: string | null;
  motdLines: string[];
  names: string[];
  icon: string | null;
}

interface DiscordStatsData {
  available: boolean;
  memberCount: number | null;
  onlineCount: number | null;
  guildName: string | null;
  inviteCode: string;
}

interface LeaderboardEntry {
  id: number;
  playerName: string;
  rankLabel: string;
  mode: string;
  score: number;
  position: number;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { addItem, formatPrice, runtimeConfig } = useCart();
  const [copiedIp, setCopiedIp] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('ranks');
  const [storeQuickQuery, setStoreQuickQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [serverStatus, setServerStatus] = useState<LiveStatusData | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [discordStats, setDiscordStats] = useState<DiscordStatsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const serverIp = runtimeConfig.config.serverIp || SERVER_INFO.ip;
  const bedrockPort = runtimeConfig.config.bedrockPort || 19132;
  const serverName = runtimeConfig.config.serverName || SERVER_INFO.name;
  const discordUrl = runtimeConfig.config.discordLink || SERVER_INFO.discordUrl;

  useEffect(() => {
    let active = true;

    const loadLive = async () => {
      if (runtimeConfig.site.hero.liveStats) {
        try {
          const res = await fetch('/api/status');
          if (res.ok && active) {
            setServerStatus(await res.json());
          }
        } catch {
          // Leave unavailable state handled honestly
        } finally {
          if (active) setStatusLoading(false);
        }
      } else {
        setStatusLoading(false);
      }

      if (runtimeConfig.site.hero.discord.enabled) {
        try {
          const res = await fetch('/api/discord-stats');
          if (res.ok && active) {
            setDiscordStats(await res.json());
          }
        } catch {
          // Ignore optional discord failure
        }
      }

      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok && active) {
          const data = await res.json();
          setLeaderboard(Array.isArray(data.entries) ? data.entries : []);
        }
      } catch {
        // Leave empty array handled honestly
      } finally {
        if (active) setLeaderboardLoading(false);
      }
    };

    loadLive();
    const interval = window.setInterval(loadLive, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [runtimeConfig.site.hero.liveStats, runtimeConfig.site.hero.discord.enabled]);

  const handleCopyIp = async () => {
    try {
      await navigator.clipboard.writeText(serverIp);
      setCopiedIp(true);
      window.setTimeout(() => setCopiedIp(false), 2400);
    } catch {
      setCopiedIp(false);
    }
  };

  const previewItems = useMemo(() => {
    const q = storeQuickQuery.trim().toLowerCase();
    if (q) {
      return CATALOG_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.features.some((f) => f.toLowerCase().includes(q))
      ).slice(0, 3);
    }
    return CATALOG_ITEMS.filter((item) => item.category === activeCategory).slice(0, 3);
  }, [activeCategory, storeQuickQuery]);

  const popularRank = useMemo(
    () => CATALOG_ITEMS.find((item) => item.id === 'rank-king') || CATALOG_ITEMS[2],
    []
  );

  const visibleGameModes = useMemo(() => {
    const allowed = runtimeConfig.site.gameModes;
    if (!Array.isArray(allowed) || allowed.length === 0) return GAME_MODES;
    const matched = GAME_MODES.filter((mode) => allowed.includes(mode.id));
    return matched.length > 0 ? matched : GAME_MODES;
  }, [runtimeConfig.site.gameModes]);

  return (
    <div className="bg-[#07110B]">
      {/* 1. HERO SECTION */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 caption-2 text-[#9BAD9F]">
              <span className="font-mono-data text-[#E8F0E9]">
                {statusLoading
                  ? 'Checking Realm Status'
                  : serverStatus?.online && serverStatus.playersNow !== null
                  ? `Online · ${serverStatus.playersNow}/${serverStatus.playersMax ?? '?'} Players`
                  : serverStatus?.online
                  ? 'Realm Online'
                  : 'Status Unavailable'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Running Since 2019 · Java and Bedrock {SERVER_INFO.versions}
              </span>
            </div>

            <h1 className="heading-2 sm:heading-1 hero-heading-gradient max-w-[680px]">
              Welcome to Iron Cloud MC.
            </h1>

            <p className="body-3 text-[#9BAD9F] max-w-[680px]">
              Enter a lush multiplayer survival world across survival, skyblock, factions, and PvP arenas at{' '}
              <span className="font-mono-data text-[#A3E635]">{serverIp}</span>
              {runtimeConfig.config.bedrockPlayersCanJoin && (
                <span>
                  {' '}
                  (Bedrock port <span className="font-mono-data text-[#E8F0E9]">{bedrockPort}</span>)
                </span>
              )}{' '}
              with instant automated store delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/store')}
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg bg-[#16A34A] text-[#041008] button-md pixel-block-btn transition-all duration-200 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              >
                <span>Browse Store Ranks and Items</span>
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleCopyIp}
                aria-label="Copy server IP address"
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg bg-[#101D14] border border-[#243C2A] text-[#E8F0E9] button-sm font-mono-data transition-colors duration-200 ease-weighted hover:bg-[#14261A] hover:border-[#365C38] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              >
                {copiedIp ? (
                  <>
                    <Check size={15} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
                    <span>IP Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} className="text-[#A3E635]" aria-hidden="true" />
                    <span>{serverIp}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-[#101D14] border border-[#243C2A] p-3 space-y-3 pixel-card-bevel">
            {heroImgFailed ? (
              <div className="aspect-video w-full rounded-2xl bg-[#0B1F12] border border-[#243C2A] flex flex-col items-center justify-center p-8 text-center">
                <p className="heading-5 text-[#E8F0E9]">{serverName} Realm Citadel</p>
                <p className="body-6 text-[#9BAD9F] mt-2">
                  Connect on Java and Bedrock at {serverIp}
                </p>
              </div>
            ) : (
              <img
                src={runtimeConfig.config.logoPath || '/assets/aistudio/server_logo_1788529150584_b551acb7.jpg'}
                alt={`${serverName} official Minecraft server logo`}
                onError={() => setHeroImgFailed(true)}
                className="aspect-video w-full rounded-2xl object-contain bg-[#030705] border border-[#243C2A] p-4 sm:p-6"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Live Server Activity & Discord Telemetry Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-1">
                <p className="caption-4 text-[#9BAD9F] uppercase">Live Realm Status</p>
                <p className="font-mono-data title-3 text-[#E8F0E9]">
                  {statusLoading
                    ? 'Querying realm'
                    : serverStatus?.online && serverStatus.playersNow !== null
                    ? `${serverStatus.playersNow} / ${serverStatus.playersMax ?? '?'} Online`
                    : serverStatus?.online
                    ? 'Realm Online'
                    : 'Offline or Unreachable'}
                </p>
                <p className="caption-5 text-[#9BAD9F]">
                  {serverStatus?.version || `Supported ${SERVER_INFO.versions}`}
                </p>
              </div>

              <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-1">
                <p className="caption-4 text-[#9BAD9F] uppercase">Discord Community</p>
                <p className="font-mono-data title-3 text-[#E8F0E9]">
                  {discordStats?.available && discordStats.memberCount !== null
                    ? `${discordStats.memberCount.toLocaleString()} Members`
                    : 'Community Active'}
                </p>
                <p className="caption-5 text-[#9BAD9F]">
                  {discordStats?.available && discordStats.onlineCount !== null
                    ? `${discordStats.onlineCount.toLocaleString()} online now`
                    : SERVER_INFO.discordDisplay}
                </p>
              </div>

              <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-1">
                <p className="caption-4 text-[#9BAD9F] uppercase">Bedrock & Crossplay</p>
                <p className="font-mono-data title-3 text-[#A3E635]">
                  Port {bedrockPort}
                </p>
                <p className="caption-5 text-[#9BAD9F]">
                  {runtimeConfig.config.bedrockPlayersCanJoin
                    ? 'Java and Bedrock enabled'
                    : 'Java Edition realm'}
                </p>
              </div>
            </div>

            {serverStatus?.motdLines && serverStatus.motdLines.length > 0 && (
              <div className="rounded-xl bg-[#14261A] border border-[#243C2A] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="caption-4 text-[#A3E635] uppercase shrink-0">Server MOTD</span>
                <p className="font-mono-data caption-2 text-[#E8F0E9] truncate">
                  {serverStatus.motdLines.join(' · ')}
                </p>
              </div>
            )}

            {serverStatus?.names && serverStatus.names.length > 0 && (
              <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] px-4 py-3 space-y-2">
                <p className="caption-4 text-[#9BAD9F] uppercase">Players Currently Online</p>
                <div className="flex flex-wrap gap-2">
                  {serverStatus.names.map((playerName) => (
                    <span
                      key={playerName}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#101D14] border border-[#243C2A] px-2.5 py-1 caption-2 font-mono-data text-[#E8F0E9]"
                    >
                      <SafeImage
                        src={getMinecraftAvatarUrl(playerName, 20)}
                        alt=""
                        fallbackLabel={playerName.slice(0, 2)}
                        className="w-4 h-4 rounded-sm"
                      />
                      <span>{playerName}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. PROBLEM TO SOLUTION */}
      <RevealSection className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="font-pixel caption-4 text-[#A3E635]">Why Players Switch</p>
            <h2 className="heading-4 text-[#E8F0E9]">
              Persistent worlds without sudden wipes or delayed perks
            </h2>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-6 space-y-3">
              <p className="title-3 text-[#9BAD9F]">Common Server Frustrations</p>
              <p className="body-6 text-[#9BAD9F]">
                Many servers shut down within months, restrict Bedrock friends, or leave store
                buyers waiting hours for manual staff fulfillment.
              </p>
            </div>

            <div className="rounded-2xl bg-[#101D14] border border-[#365C38] p-6 space-y-3 pixel-card-bevel">
              <p className="title-3 text-[#A3E635]">The Iron Cloud Standard</p>
              <p className="body-6 text-[#E8F0E9]">
                Operating continuously since 2019 with 40 custom plugins, full Java and Bedrock
                crossplay, and automated delivery after bKash or Nagad confirmation.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 3. MANDATORY TAGLINE REVEAL SECTION */}
      <TaglineReveal
        lines={[
          'Built in 2019 for lasting survival worlds.',
          'Upgraded every season for fair play and instant rewards.',
        ]}
      />

      {/* 4. BENEFITS & WHY CHOOSE IRON CLOUD MC */}
      <RevealSection className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-[680px] space-y-3">
            <p className="font-pixel caption-4 text-[#A3E635]">Core Advantages</p>
            <h2 className="heading-4 text-[#E8F0E9]">
              Built for smooth gameplay and protected store purchases
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 pixel-card-bevel">
              <Lightning size={24} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
              <h3 className="title-2 text-[#E8F0E9]">
                Instant Store Delivery within 5 Minutes
              </h3>
              <p className="body-6 text-[#9BAD9F]">
                Verified bKash and Nagad payments dispatch ranks, coin packs, and crate keys
                directly to your Minecraft username without waiting on manual queues.
              </p>
            </div>

            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 pixel-card-bevel">
              <UsersThree size={24} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
              <h3 className="title-2 text-[#E8F0E9]">
                Java and Bedrock Crossplay on Versions 1.8 to 1.21.8
              </h3>
              <p className="body-6 text-[#9BAD9F]">
                Play alongside friends on PC, mobile, or console at{' '}
                <span className="font-mono-data text-[#E8F0E9]">{serverIp}</span> with unified
                inventory and rank privileges.
              </p>
            </div>

            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 pixel-card-bevel">
              <ShieldCheck size={24} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
              <h3 className="title-2 text-[#E8F0E9]">
                Technical Delivery Protection on Every Order
              </h3>
              <p className="body-6 text-[#9BAD9F]">
                Every transaction ID is logged in your account history. If a technical issue ever
                interrupts item delivery, staff fulfills your full order promptly.
              </p>
            </div>

            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 pixel-card-bevel">
              <Headset size={24} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
              <h3 className="title-2 text-[#E8F0E9]">
                Round the Clock Discord and Ticket Support
              </h3>
              <p className="body-6 text-[#9BAD9F]">
                Reach active moderators and administrators anytime via Discord, email, or tracked
                support tickets whenever you need assistance.
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-6">
            <div className="max-w-[680px] space-y-2">
              <p className="font-pixel caption-4 text-[#A3E635]">Server Highlights</p>
              <h2 className="heading-5 text-[#E8F0E9]">Why choose Iron Cloud MC</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {WHY_CHOOSE_FEATURES.map((feat, index) => (
                <div
                  key={feat.title}
                  className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-5 space-y-2 pixel-card-bevel"
                >
                  <p className="font-mono-data caption-3 text-[#A3E635]">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="title-3 text-[#E8F0E9]">{feat.title}</h3>
                  <p className="body-6 text-[#9BAD9F]">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 5. HOW IT WORKS (3 STEPS) */}
      <RevealSection className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-[#0B1F12] border border-[#243C2A] p-6 sm:p-10 space-y-8 pixel-card-bevel">
          <div className="max-w-[680px] space-y-3">
            <p className="font-pixel caption-4 text-[#A3E635]">How It Works</p>
            <h2 className="heading-4 text-[#E8F0E9]">Three steps from login to realm perks</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Join the Server',
                desc: `Connect on Java or Bedrock at ${serverIp} to register your username inside the realm.`,
              },
              {
                step: '02',
                title: 'Pick Ranks, Coins, or Keys',
                desc: 'Browse permanent ranks from Hero to IMMORTAL, bonus coin packages, or crate key bundles.',
              },
              {
                step: '03',
                title: 'Confirm bKash or Nagad',
                desc: 'Send Money to 01821925430 with reference IRONCLOUD and submit your transaction ID for instant delivery.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3"
              >
                <p className="font-mono-data caption-3 text-[#A3E635]">{item.step}</p>
                <h3 className="title-2 text-[#E8F0E9]">{item.title}</h3>
                <p className="body-6 text-[#9BAD9F]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 6. FEATURED STORE CATALOG, SPOTLIGHT & REALMS */}
      <RevealSection className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Most Popular Rank Spotlight with King Rank artwork */}
          <div className="rounded-3xl bg-[#101D14] border border-[#365C38] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pixel-card-bevel">
            <div className="lg:col-span-3 rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-2">
              <SafeImage
                src={popularRank.image}
                alt={popularRank.name}
                fallbackLabel={popularRank.name}
                className="aspect-square w-full rounded-xl object-cover bg-[#07110B]"
              />
            </div>
            <div className="lg:col-span-6 space-y-3">
              <div className="inline-flex items-center gap-2 font-pixel caption-4 text-[#A3E635]">
                <Crown size={16} weight="bold" aria-hidden="true" />
                <span>Most Popular Rank</span>
              </div>
              <h2 className="heading-4 text-[#E8F0E9]">{popularRank.name}</h2>
              <p className="body-6 text-[#E8F0E9]/85 max-w-xl">{popularRank.summary}</p>
              <p className="caption-2 text-[#9BAD9F]">
                {popularRank.features.join(' · ')}
              </p>
            </div>
            <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4">
              <div className="lg:text-right">
                <p className="caption-4 text-[#9BAD9F] uppercase">Lifetime Unlock</p>
                <p className="font-mono-data heading-3 text-[#A3E635]">
                  {formatPrice(popularRank.priceBdt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addItem(popularRank.id)}
                  className="py-2 px-4 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn hover:bg-[#22C55E] active:scale-[0.98]"
                >
                  Add King Rank
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/ranks')}
                  className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#1B3323]"
                >
                  Compare Ranks
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-[680px]">
              <p className="font-pixel caption-4 text-[#A3E635]">Official Store</p>
              <h2 className="heading-4 text-[#E8F0E9]">Popular Ranks, Coins, and Crate Keys</h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative w-full sm:w-56">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BAD9F]"
                  aria-hidden="true"
                />
                <label htmlFor="home-store-search" className="sr-only">
                  Search store packages
                </label>
                <input
                  id="home-store-search"
                  type="search"
                  value={storeQuickQuery}
                  onChange={(e) => setStoreQuickQuery(e.target.value)}
                  placeholder="Quick search store"
                  className="w-full bg-[#101D14] border border-[#243C2A] rounded-xl pl-9 pr-3 py-2 caption-2 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>

              <div
                role="tablist"
                aria-label="Store preview categories"
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0B1F12] border border-[#243C2A] self-start"
              >
                {(
                  [
                    { id: 'ranks', label: 'Ranks' },
                    { id: 'coins', label: 'Coins' },
                    { id: 'keys', label: 'Keys' },
                    { id: 'special', label: 'Special' },
                  ] as Array<{ id: ProductCategory; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={activeCategory === tab.id && !storeQuickQuery}
                    onClick={() => {
                      setStoreQuickQuery('');
                      setActiveCategory(tab.id);
                    }}
                    className={`py-2 px-3 rounded-lg button-sm whitespace-nowrap shrink-0 transition-colors duration-200 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] ${
                      activeCategory === tab.id && !storeQuickQuery
                        ? 'bg-[#16A34A] text-[#041008] pixel-block-btn'
                        : 'text-[#9BAD9F] hover:text-[#E8F0E9]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {previewItems.length === 0 ? (
            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-8 text-center space-y-3">
              <p className="title-2 text-[#E8F0E9]">No matching store items found</p>
              <button
                type="button"
                onClick={() => setStoreQuickQuery('')}
                className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#1B3323]"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {previewItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-5 flex flex-col justify-between gap-5 pixel-card-bevel transition-all duration-300 ease-weighted hover:-translate-y-0.5 hover:border-[#365C38]"
                >
                  <div className="space-y-4">
                    <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-2 overflow-hidden">
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        fallbackLabel={item.name}
                        className="aspect-[4/3] w-full rounded-lg object-cover bg-[#07110B]"
                      />
                    </div>
                    <p className="caption-4 text-[#9BAD9F] uppercase">
                      <span>{item.category}</span>
                      {item.tag && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="text-[#A3E635]">{item.tag}</span>
                        </>
                      )}
                    </p>
                    <h3 className="heading-6 text-[#E8F0E9]">{item.name}</h3>
                    <p className="body-6 text-[#9BAD9F]">{item.summary}</p>
                    <ul className="space-y-2 pt-1">
                      {item.features.slice(0, 4).map((feat) => (
                        <li key={feat} className="flex items-center gap-2 body-6 text-[#E8F0E9]">
                          <Check size={14} weight="bold" className="text-[#16A34A] shrink-0" aria-hidden="true" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#243C2A] flex items-center justify-between gap-4">
                    <span className="font-mono-data heading-6 text-[#A3E635]">
                      {formatPrice(item.priceBdt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addItem(item.id)}
                      className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn whitespace-nowrap shrink-0 transition-all duration-200 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                    >
                      Add to Bag
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate(`/${activeCategory}` as AppRoute)}
              className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#101D14] border border-[#243C2A] text-[#E8F0E9] button-sm transition-colors duration-200 ease-weighted hover:bg-[#14261A] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              <span>View all {activeCategory} packages</span>
              <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/store')}
              className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#0B1F12] border border-[#243C2A] text-[#9BAD9F] button-sm hover:text-[#E8F0E9]"
            >
              <span>Open Full Store</span>
            </button>
          </div>

          {/* Realms & Worlds Grid */}
          <div className="pt-8 space-y-6">
            <div className="max-w-[680px] space-y-2">
              <p className="font-pixel caption-4 text-[#A3E635]">Realms and Worlds</p>
              <h2 className="heading-4 text-[#E8F0E9]">Signature realms across ten worlds</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleGameModes.map((mode) => (
                <article
                  key={mode.id}
                  className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-3 space-y-4 pixel-card-bevel"
                >
                  <SafeImage
                    src={mode.image}
                    alt={`${mode.name} realm showcase on IRON CLOUD MC`}
                    fallbackLabel={mode.name}
                    className="aspect-[4/3] w-full rounded-xl object-cover border border-[#243C2A]"
                  />
                  <div className="px-3 pb-3 space-y-2">
                    <p className="caption-4 text-[#A3E635]">{mode.meta}</p>
                    <h3 className="heading-6 text-[#E8F0E9]">{mode.name}</h3>
                    <p className="body-6 text-[#9BAD9F]">{mode.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 7. LEADERBOARD, GUARANTEES & COMMUNITY */}
      <RevealSection className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Realm Leaderboard */}
          <div className="rounded-3xl bg-[#101D14] border border-[#243C2A] p-6 sm:p-8 space-y-6 pixel-card-bevel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 font-pixel caption-4 text-[#A3E635]">
                  <Trophy size={16} weight="bold" aria-hidden="true" />
                  <span>Seasonal Standings</span>
                </div>
                <h2 className="heading-5 text-[#E8F0E9]">Top Realm Leaderboard</h2>
              </div>
              <span className="caption-4 font-mono-data text-[#9BAD9F]">
                Synced from Realm Database
              </span>
            </div>

            {leaderboardLoading ? (
              <div className="space-y-3">
                <div className="h-14 rounded-xl bg-[#0B1F12] animate-pulse" />
                <div className="h-14 rounded-xl bg-[#0B1F12] animate-pulse" />
                <div className="h-14 rounded-xl bg-[#0B1F12] animate-pulse" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="title-3 text-[#E8F0E9]">Seasonal standings open soon</p>
                  <p className="body-6 text-[#9BAD9F]">
                    Connect at {serverIp} to compete in Survival, Skyblock, Factions, and PvP
                    Arena rankings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyIp}
                  className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm whitespace-nowrap shrink-0 hover:bg-[#1B3323]"
                >
                  Copy Server IP
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const isTopThree = entry.position <= 3;
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-xl bg-[#0B1F12] border p-4 flex items-center justify-between gap-4 ${
                        isTopThree ? 'border-[#16A34A]' : 'border-[#243C2A]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-mono-data title-4 w-7 text-center shrink-0 ${
                            isTopThree ? 'text-[#A3E635]' : 'text-[#9BAD9F]'
                          }`}
                        >
                          #{entry.position}
                        </span>
                        <SafeImage
                          src={getMinecraftAvatarUrl(entry.playerName, 32)}
                          alt=""
                          fallbackLabel={entry.playerName.slice(0, 2)}
                          className="w-8 h-8 rounded-lg border border-[#243C2A] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="title-4 text-[#E8F0E9] truncate">{entry.playerName}</p>
                          <p className="caption-5 text-[#9BAD9F]">
                            {entry.rankLabel} · {entry.mode}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono-data title-4 text-[#A3E635] shrink-0">
                        {entry.score.toLocaleString()} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="max-w-[680px] space-y-3">
            <p className="font-pixel caption-4 text-[#A3E635]">Community and Guarantees</p>
            <h2 className="heading-4 text-[#E8F0E9]">
              Backed by transparent delivery terms and active players
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 pixel-card-bevel">
              <p className="font-mono-data caption-4 text-[#A3E635]">Guarantee 01</p>
              <h3 className="title-2 text-[#E8F0E9]">5 Minute Delivery Promise</h3>
              <p className="body-6 text-[#9BAD9F]">
                Confirmed bKash and Nagad orders dispatch automatically. If items miss the 5 minute
                window, staff manually applies them upon ticket review.
              </p>
            </div>

            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 pixel-card-bevel">
              <p className="font-mono-data caption-4 text-[#A3E635]">Guarantee 02</p>
              <h3 className="title-2 text-[#E8F0E9]">Technical Fulfillment Protection</h3>
              <p className="body-6 text-[#9BAD9F]">
                Digital perks are non refundable once delivered, yet any technical delivery failure
                is fully resolved or reissued against your transaction ID.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B1F12] border border-[#365C38] p-6 space-y-3">
              <p className="font-mono-data caption-4 text-[#A3E635]">Community Feedback</p>
              <p className="body-5 text-[#E8F0E9]">
                Read live member discussions, patch announcements, and player builds inside our
                official Discord server.
              </p>
              <p className="caption-4 text-[#9BAD9F]">
                {discordStats?.available && discordStats.memberCount !== null
                  ? `${discordStats.memberCount.toLocaleString()} Discord Members`
                  : SERVER_INFO.discordDisplay}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="title-3 text-[#E8F0E9]">
                {discordStats?.available && discordStats.memberCount !== null
                  ? `Connect with ${discordStats.memberCount.toLocaleString()} members on Discord`
                  : 'Connect with our community on Discord'}
              </p>
              <p className="body-6 text-[#9BAD9F]">
                Ask questions, verify events, and read community feedback directly at{' '}
                {SERVER_INFO.discordDisplay}.
              </p>
            </div>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#365C38] text-[#E8F0E9] button-sm whitespace-nowrap shrink-0 transition-colors duration-200 ease-weighted hover:bg-[#1B3323] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              Join Discord Server
            </a>
          </div>
        </div>
      </RevealSection>

      {/* 8. FAQ SECTION */}
      <RevealSection className="py-16 px-4 sm:px-6" id="faq">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-3">
            <p className="font-pixel caption-4 text-[#A3E635]">Questions</p>
            <h2 className="heading-4 text-[#E8F0E9]">Frequently asked questions</h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl bg-[#101D14] border border-[#243C2A] overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left transition-colors duration-200 ease-weighted hover:bg-[#14261A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  >
                    <span className="title-3 text-[#E8F0E9]">{faq.question}</span>
                    <CaretDown
                      size={18}
                      weight="bold"
                      className={`text-[#A3E635] shrink-0 transition-transform duration-300 ease-weighted ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5">
                      <p className="body-6 text-[#9BAD9F]">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* 9. FINAL CTA */}
      <RevealSection className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#0B1F12] border border-[#243C2A] p-8 sm:p-12 text-center space-y-6 pixel-card-bevel">
          <p className="font-pixel caption-4 text-[#A3E635]">Ready to Upgrade</p>
          <h2 className="heading-3 sm:heading-2 hero-heading-gradient mx-auto max-w-[680px]">
            Gear up before your next session
          </h2>
          <p className="body-3 text-[#9BAD9F] max-w-[540px] mx-auto">
            Instant automated delivery, bKash and Nagad verification, and round the clock staff
            protection.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/store')}
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg bg-[#16A34A] text-[#041008] button-md pixel-block-btn transition-all duration-200 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              <span>Browse Store Ranks and Items</span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
