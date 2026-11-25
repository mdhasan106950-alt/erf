import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Coins,
  Copy,
  Crown,
  Key,
  MagnifyingGlass,
  Package,
  X,
} from '@phosphor-icons/react';
import {
  CATALOG_ITEMS,
  CatalogItem,
  ProductCategory,
  SERVER_INFO,
  STORE_REFERENCE_IMAGE,
} from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { AppRoute } from '../components/Navbar';
import { RevealSection } from '../components/Reveal';
import { SafeImage } from '../components/SafeImage';

interface StorePageProps {
  initialCategory?: ProductCategory | 'all';
  onNavigate: (route: AppRoute) => void;
}

export function StorePage({ initialCategory = 'all', onNavigate }: StorePageProps) {
  const { profile } = useAuth();
  const { addItem, currency, currencyOptions, setCurrency, formatPrice, runtimeConfig } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>(initialCategory);
  const [query, setQuery] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  React.useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const filteredItems = CATALOG_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.features.some((f) => f.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  const handleAdd = (item: CatalogItem) => {
    addItem(item.id);
    setRecentlyAddedId(item.id);
    window.setTimeout(() => {
      setRecentlyAddedId((prev) => (prev === item.id ? null : prev));
    }, 1500);
  };

  const handleCopyTicketDetails = async (item: CatalogItem) => {
    const player = profile?.minecraftUsername || 'NotSet';
    const edition = profile?.edition || 'java';
    const serverIp = runtimeConfig.config.serverIp || SERVER_INFO.ip;
    const text = [
      `Server: ${serverIp}`,
      `Item: ${item.name} (${item.category.toUpperCase()})`,
      `Price: ${formatPrice(item.priceBdt)} (৳ ${item.priceBdt} BDT)`,
      `Minecraft Username: ${player} (${edition})`,
      `Payment Method: bKash or Nagad (${SERVER_INFO.bkashNumber}, Ref: ${SERVER_INFO.paymentReference})`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedTicket(true);
      window.setTimeout(() => setCopiedTicket(false), 2400);
    } catch {
      setCopiedTicket(false);
    }
  };

  const pageHeading =
    selectedCategory === 'ranks'
      ? 'Server Ranks'
      : selectedCategory === 'coins'
      ? 'Coin Packages'
      : selectedCategory === 'keys'
      ? 'Crate Keys'
      : selectedCategory === 'special'
      ? 'Special Packages'
      : 'Official Server Store';

  const pageSubtitle =
    selectedCategory === 'ranks'
      ? 'Permanent rank tiers from Hero to IMMORTAL with fly, extra homes, and exclusive cosmetics.'
      : selectedCategory === 'coins'
      ? 'Purchase in game currency packages with up to 30% bonus coins delivered instantly.'
      : selectedCategory === 'keys'
      ? 'Unlock Common, Rare, Epic, Legendary, and Mythical crates across survival and skyblock.'
      : selectedCategory === 'special'
      ? 'Curated seasonal bundles combining ranks, coins, and crate keys at combined savings.'
      : `Upgrade your gameplay on ${runtimeConfig.config.serverIp || SERVER_INFO.ip} with instant bKash and Nagad verification.`;

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header & Reference Store Crate Showcase */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="font-pixel caption-4 text-[#A3E635]">
                {SERVER_INFO.editions} · Automated Store Dispatch
              </p>
              <h1 className="heading-2 sm:heading-1 hero-heading-gradient max-w-[680px]">
                {pageHeading}
              </h1>
              <p className="body-3 text-[#9BAD9F] max-w-[680px]">{pageSubtitle}</p>
            </div>

            {/* Category Overview Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { label: 'Ranks', sub: '150 to 2000 BDT', route: '/ranks' as AppRoute, icon: Crown },
                { label: 'Coins', sub: '50 to 1000 BDT', route: '/coins' as AppRoute, icon: Coins },
                { label: 'Crate Keys', sub: '100 to 2500 BDT', route: '/keys' as AppRoute, icon: Key },
                { label: 'Special', sub: '280 to 950 BDT', route: '/special' as AppRoute, icon: Package },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.route}
                    type="button"
                    onClick={() => onNavigate(cat.route)}
                    className="text-left rounded-2xl bg-[#101D14] border border-[#243C2A] p-4 space-y-1 pixel-card-bevel transition-colors duration-300 ease-weighted hover:bg-[#14261A] hover:border-[#365C38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  >
                    <Icon size={20} weight="bold" className="text-[#A3E635] mb-2" aria-hidden="true" />
                    <p className="title-4 text-[#E8F0E9]">{cat.label}</p>
                    <p className="font-mono-data caption-5 text-[#9BAD9F]">{cat.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-[#101D14] border border-[#243C2A] p-3 pixel-card-bevel flex">
            <SafeImage
              src={STORE_REFERENCE_IMAGE}
              alt="IRON CLOUD MC enchanted amethyst store crates on obsidian base"
              fallbackLabel="IRON CLOUD MC Crate Vault"
              className="w-full h-full min-h-[240px] aspect-[4/3] lg:aspect-auto rounded-2xl object-cover border border-[#243C2A] bg-[#0B1F12]"
            />
          </div>
        </section>

        {/* Filter, Currency Switcher & Search Toolbar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Filter catalog items"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#0B1F12] border border-[#243C2A]"
          >
            {(
              [
                { id: 'all', label: 'All Items', route: '/store' as AppRoute },
                { id: 'ranks', label: 'Ranks', route: '/ranks' as AppRoute },
                { id: 'coins', label: 'Coins', route: '/coins' as AppRoute },
                { id: 'keys', label: 'Crate Keys', route: '/keys' as AppRoute },
                { id: 'special', label: 'Special', route: '/special' as AppRoute },
              ] as const
            ).map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    onNavigate(tab.route);
                  }}
                  className={`py-2 px-3 rounded-lg button-sm whitespace-nowrap shrink-0 transition-colors duration-200 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] ${
                    active
                      ? 'bg-[#16A34A] text-[#041008] pixel-block-btn'
                      : 'text-[#9BAD9F] hover:text-[#E8F0E9]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Switcher */}
            <div
              role="group"
              aria-label="Display currency"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0B1F12] border border-[#243C2A]"
            >
              {currencyOptions.map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={currency === code}
                  onClick={() => setCurrency(code)}
                  className={`py-1.5 px-2.5 rounded-lg font-mono-data caption-3 transition-colors duration-200 ${
                    currency === code
                      ? 'bg-[#16A34A] text-[#041008] pixel-block-btn'
                      : 'text-[#9BAD9F] hover:text-[#E8F0E9]'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BAD9F]"
                aria-hidden="true"
              />
              <label htmlFor="store-search" className="sr-only">
                Search ranks, coins, keys, or bundles
              </label>
              <input
                id="store-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ranks, perks, or keys"
                className="w-full bg-[#101D14] border border-[#243C2A] rounded-xl pl-9 pr-4 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              />
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <RevealSection>
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-12 text-center space-y-4">
              <p className="heading-6 text-[#E8F0E9]">No store packages matched your search</p>
              <p className="body-6 text-[#9BAD9F]">
                Clear your search filter to view all ranks, coin packs, crate keys, and special bundles.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                }}
                className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              >
                Show All Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const added = recentlyAddedId === item.id;
                return (
                  <article
                    key={item.id}
                    className={`rounded-2xl bg-[#101D14] border p-5 flex flex-col justify-between gap-5 pixel-card-bevel transition-all duration-300 ease-weighted hover:-translate-y-0.5 ${
                      item.featured
                        ? 'border-[#365C38] hover:border-[#16A34A]'
                        : 'border-[#243C2A] hover:border-[#365C38]'
                    }`}
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

                      <div className="space-y-2">
                        <p className="caption-4 text-[#9BAD9F] uppercase">
                          <span>{item.category}</span>
                          {item.tag && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-[#A3E635]">{item.tag}</span>
                            </>
                          )}
                        </p>

                        <h2 className="heading-6 text-[#E8F0E9]">{item.name}</h2>
                        <p className="body-6 text-[#9BAD9F]">{item.summary}</p>
                      </div>

                      <ul className="space-y-2 pt-1">
                        {item.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2 body-6 text-[#E8F0E9]">
                            <Check
                              size={14}
                              weight="bold"
                              className="text-[#16A34A] shrink-0"
                              aria-hidden="true"
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[#243C2A] flex items-center justify-between gap-4">
                      <span className="font-mono-data heading-6 text-[#A3E635]">
                        {formatPrice(item.priceBdt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCopiedTicket(false);
                            setDetailItem(item);
                          }}
                          className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#1B3323] whitespace-nowrap shrink-0"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdd(item)}
                          className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn whitespace-nowrap shrink-0 transition-all duration-200 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                        >
                          {added ? (
                            <>
                              <Check size={14} weight="bold" aria-hidden="true" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <span>Add</span>
                              <ArrowRight size={14} weight="bold" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </RevealSection>
      </div>

      {/* Item Detail Modal */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${detailItem.name} details`}
        >
          <div
            className="fixed inset-0 bg-[#07110B]/85 backdrop-blur-sm"
            onClick={() => setDetailItem(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#101D14] border border-[#365C38] p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="caption-3 text-[#A3E635] uppercase">
                  {detailItem.category}
                  {detailItem.tag ? ` · ${detailItem.tag}` : ''}
                </p>
                <h2 className="heading-4 text-[#E8F0E9]">{detailItem.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                aria-label="Close item details"
                className="w-10 h-10 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] flex items-center justify-center hover:bg-[#1B3323]"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-2">
              <SafeImage
                src={detailItem.image}
                alt={detailItem.name}
                fallbackLabel={detailItem.name}
                className="aspect-[4/3] w-full rounded-xl object-cover bg-[#07110B]"
              />
            </div>

            <p className="body-6 text-[#9BAD9F]">{detailItem.summary}</p>

            <div className="rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-5 space-y-3">
              <p className="caption-3 text-[#9BAD9F] uppercase">Included Perks</p>
              <ul className="space-y-2">
                {detailItem.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 body-6 text-[#E8F0E9]">
                    <Check size={14} weight="bold" className="text-[#A3E635] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#14261A] border border-[#243C2A] p-4">
              <div>
                <p className="caption-4 text-[#9BAD9F]">Checkout Price</p>
                <p className="font-mono-data heading-5 text-[#A3E635]">
                  {formatPrice(detailItem.priceBdt)}
                </p>
              </div>
              <span className="font-mono-data caption-3 text-[#9BAD9F]">
                Base: ৳ {detailItem.priceBdt} BDT
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  addItem(detailItem.id);
                  setDetailItem(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn hover:bg-[#22C55E]"
              >
                <span>Add to Bag & Checkout</span>
                <ArrowRight size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => handleCopyTicketDetails(detailItem)}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#1B3323]"
              >
                {copiedTicket ? (
                  <>
                    <Check size={14} weight="bold" className="text-[#A3E635]" />
                    <span>Details Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Discord Ticket Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
