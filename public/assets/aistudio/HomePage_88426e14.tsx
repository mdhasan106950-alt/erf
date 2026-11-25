import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { CopyIpButton } from '../components/shared/CopyIpButton';
import { ServerStatusBadge } from '../components/shared/ServerStatusBadge';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  Shield,
  Sword,
  Crosshair,
  Boxes,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Flame,
  Award,
  Lock,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { addToCart } = useCart();

  const { data: status } = useQuery({
    queryKey: ['serverStatus'],
    queryFn: api.getServerStatus,
  });

  const { data: gamemodes } = useQuery({
    queryKey: ['gamemodes'],
    queryFn: api.getGamemodes,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const { data: settings } = useQuery({
    queryKey: ['serverSettings'],
    queryFn: api.getCMS,
  });

  const featuredProducts = products?.filter((p) => p.isFeatured).slice(0, 4) || [];

  return (
    <div className="relative min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-white/5">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Status Badge from theme */}
          <div className="mb-4">
            <ServerStatusBadge />
          </div>

          {/* Official Server Logo */}
          <div className="relative mb-6 group">
            <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/25 via-fuchsia-600/20 to-emerald-500/20 blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <img
              src="/logo.png"
              alt="Iron Cloud MC Official Logo"
              className="relative w-52 sm:w-64 md:w-72 lg:w-80 h-auto mx-auto object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] filter transition-transform duration-300 group-hover:scale-105 select-none"
            />
          </div>

          {/* Subtitle / Brand pill with gaming vibe */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-black/60 border border-purple-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)] mb-4"
          >
            <span className="w-2 h-2 rotate-45 bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
            <span className="font-minecraft text-[11px] sm:text-xs text-purple-300 tracking-wider">
              JAVA & BEDROCK NETWORK • EST. 2019
            </span>
            <span className="w-2 h-2 rotate-45 bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          </motion.div>

          {/* Minecraft Themed Big Headline */}
          <div className="relative group my-2">
            {/* Ambient gaming backdrop glow */}
            <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/25 via-fuchsia-600/20 to-emerald-500/20 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

            <motion.h1
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase select-none tracking-wider text-center flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 gap-y-2 py-1"
            >
              <span className="font-minecraft text-slate-100 minecraft-title hover:text-white transition-colors drop-shadow-md">
                IRON CLOUD
              </span>
              <span className="relative inline-flex items-center">
                <span className="font-minecraft text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-200 to-purple-400 animate-enchanted-shimmer minecraft-title-mc px-2 sm:px-3 py-0.5 rounded-lg border border-purple-500/50 bg-purple-950/50 shadow-[0_0_25px_rgba(168,85,247,0.55)]">
                  MC
                </span>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400" />
                </span>
              </span>
            </motion.h1>
          </div>

          {/* Minecraft aesthetic game mode tags */}
          <div className="mt-3.5 mb-2 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[10px] sm:text-[11px] font-minecraft text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-black/50 border border-purple-900/60 text-purple-300 hover:border-purple-500/60 transition-colors shadow-sm">
              [ ⚔️ CUSTOM SMP ]
            </span>
            <span className="px-2.5 py-1 rounded-md bg-black/50 border border-emerald-900/60 text-emerald-300 hover:border-emerald-500/60 transition-colors shadow-sm">
              [ 💎 ECONOMY ]
            </span>
            <span className="px-2.5 py-1 rounded-md bg-black/50 border border-amber-900/60 text-amber-300 hover:border-amber-500/60 transition-colors shadow-sm">
              [ ⚡ PVP ARENA ]
            </span>
            <span className="px-2.5 py-1 rounded-md bg-black/50 border border-cyan-900/60 text-cyan-300 hover:border-cyan-500/60 transition-colors shadow-sm">
              [ 🛡️ 20 TPS LAG-FREE ]
            </span>
          </div>

          <p className="mt-6 text-sm md:text-base text-slate-400 max-w-xl font-light leading-relaxed">
            {settings?.tagline ||
              'The next generation of competitive Minecraft survival. Fully customized enchantments, active community-driven economy, and lag-free servers.'}
          </p>

          <p className="mt-2 text-xs text-slate-500 max-w-lg">
            {settings?.heroSubtitle ||
              'A premier Bangladeshi & Global Minecraft server network offering Custom Survival, Factions, and competitive PvP arenas.'}
          </p>

          {/* Hero Interaction: Server IP Box & Explore Store button from Theme */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <CopyIpButton variant="hero" />

            <Link
              to="/store"
              id="hero-explore-store-cta"
              className="border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 px-6 py-3 rounded-lg text-xs font-minecraft font-bold uppercase tracking-wider text-white transition-all inline-flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-purple-300" />
              <span>Explore Store</span>
            </Link>

            <Link
              to="/game-modes"
              className="border border-white/15 bg-black/40 hover:bg-white/10 px-5 py-3 rounded-lg text-xs font-minecraft font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all inline-flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm hover:border-emerald-500/40"
            >
              <Sword className="w-4 h-4 text-emerald-400" />
              <span>Game Modes</span>
            </Link>
          </div>

          {/* Server Specifications & Trust Metrics */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 border-t border-white/5 pt-8">
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Version</div>
              <div className="text-sm font-semibold text-slate-300">1.8 - 1.21.x</div>
            </div>
            <div className="hidden sm:block border-r border-white/5 h-8" />
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uptime</div>
              <div className="text-sm font-semibold text-emerald-400">99.98%</div>
            </div>
            <div className="hidden sm:block border-r border-white/5 h-8" />
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region</div>
              <div className="text-sm font-semibold text-slate-300">Global / BD</div>
            </div>
            <div className="hidden sm:block border-r border-white/5 h-8" />
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bedrock Port</div>
              <div className="text-sm font-semibold text-purple-400 font-mono">19132</div>
            </div>
          </div>
        </div>
      </section>

      {/* GAME MODES PREVIEW */}
      <section className="py-20 relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                <span>Our Realms</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Featured Game Modes
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg">
                Crafted with care, balanced economies, and custom plugins tailored for fair competitive play.
              </p>
            </div>
            <Link
              to="/game-modes"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400 hover:text-white transition-colors"
            >
              <span>Explore all game modes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gamemodes?.map((mode) => {
              const iconMap: Record<string, React.ReactNode> = {
                Shield: <Shield className="w-5 h-5 text-emerald-400" />,
                Sword: <Sword className="w-5 h-5 text-purple-400" />,
                Crosshair: <Crosshair className="w-5 h-5 text-slate-300" />,
                Boxes: <Boxes className="w-5 h-5 text-amber-400" />,
              };

              return (
                <div
                  key={mode.id}
                  className="group relative flex flex-col justify-between rounded-sm border border-white/10 bg-black/40 backdrop-blur-sm p-6 hover:border-purple-500/50 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-sm bg-white/5 border border-white/10 group-hover:border-purple-500/40 transition-colors">
                        {iconMap[mode.icon] || <Zap className="w-5 h-5 text-purple-400" />}
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                          mode.status === 'ONLINE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {mode.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-wide">
                      {mode.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {mode.shortDescription}
                    </p>

                    <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-white/5 pt-3">
                      {mode.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-3 border-t border-white/5">
                    <Link
                      to="/game-modes"
                      className="inline-flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors"
                    >
                      <span>Read Specifications</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED STORE PRODUCTS */}
      <section className="py-20 relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-widest mb-2">
                <span>Official Webstore</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Popular Ranks & Packages
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg">
                Instant delivery in-game. Payments securely handled via bKash and Nagad.
              </p>
            </div>
            <Link
              to="/store"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400 hover:text-white transition-colors"
            >
              <span>View Full Store Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <motion.div
                key={prod.id}
                whileHover={{
                  scale: 1.025,
                  y: -4,
                  boxShadow: '0 20px 30px -10px rgba(147, 51, 234, 0.4), 0 0 20px 2px rgba(168, 85, 247, 0.25)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 24,
                }}
                className="group relative flex flex-col justify-between rounded-sm border border-white/10 bg-black/40 backdrop-blur-sm p-6 hover:border-purple-500/70 transition-colors"
              >
                {prod.badge && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-sm bg-purple-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-md">
                    {prod.badge}
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-1">
                    {prod.category}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-wide">
                    {prod.name}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-mono">
                      ৳{prod.price}
                    </span>
                    {prod.originalPrice && (
                      <span className="text-xs text-slate-500 line-through font-mono">
                        ৳{prod.originalPrice}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                      BDT
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {prod.description}
                  </p>

                  <ul className="mt-4 space-y-1.5 text-xs text-slate-300 border-t border-white/5 pt-3">
                    {prod.features.slice(0, 4).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(prod, 1)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                  <Link
                    to={`/store/products/${prod.slug}`}
                    className="p-2 rounded-sm border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 hover:text-white text-xs transition-colors"
                    title="View details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE IRON CLOUD MC */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              <span>Network Quality</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Engineered for Minecraft Players
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From our custom plugins to anti-cheat enforcement, experience a lag-free environment built to last.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-sm border border-white/10 bg-black/40 backdrop-blur-sm hover:border-purple-500/50 transition-colors">
              <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Low Latency & High TPS</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Hosted on dedicated NVMe hardware with optimized garbage collection and network routing for seamless sub-40ms latency across South Asia and worldwide routes.
              </p>
            </div>

            <div className="p-6 rounded-sm border border-white/10 bg-black/40 backdrop-blur-sm hover:border-purple-500/50 transition-colors">
              <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Anti-Cheat & Staff</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Zero tolerance for hacked clients, auto-clickers, and exploits. Our machine-learning anti-cheat and active moderation team maintain a fair, cheat-free environment.
              </p>
            </div>

            <div className="p-6 rounded-sm border border-white/10 bg-black/40 backdrop-blur-sm hover:border-purple-500/50 transition-colors">
              <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">True Java & Bedrock Cross-Play</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Play seamlessly with your friends whether they are on PC Java Edition, Minecraft Bedrock, Mobile, or Console using port 19132.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
