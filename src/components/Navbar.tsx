import React, { useEffect, useState } from 'react';
import { ShoppingBag } from '@phosphor-icons/react';
import { useCart } from '../context/CartContext';

export type AppRoute =
  | '/'
  | '/store'
  | '/ranks'
  | '/coins'
  | '/keys'
  | '/special'
  | '/about'
  | '/team'
  | '/support'
  | '/rules'
  | '/checkout'
  | '/account'
  | '/privacy'
  | '/terms';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: AppRoute) => void;
}

const NAV_LINKS: Array<{ label: string; route: AppRoute }> = [
  { label: 'Home', route: '/' },
  { label: 'Store', route: '/store' },
  { label: 'Team', route: '/team' },
  { label: 'Support', route: '/support' },
  { label: 'Account', route: '/account' },
];

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const { totalItems, openCart, runtimeConfig } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentRoute]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isRouteActive = (route: AppRoute) => {
    if (route === '/store') {
      return ['/store', '/ranks', '/coins', '/keys', '/special', '/checkout'].includes(currentRoute);
    }
    return currentRoute === route;
  };

  return (
    <>
      <div className="fixed top-4 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
        <header
          className="pointer-events-auto flex items-center justify-between gap-8 px-4 py-2 rounded-2xl bg-[#0B1F12]/90 backdrop-blur-md border border-[#243C2A] max-w-4xl w-full"
          aria-label="Primary navigation"
        >
          {/* Zone 1: Single-line brand mark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="flex items-center gap-3 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] rounded-lg"
          >
            <img
              src={runtimeConfig.config.logoPath || '/assets/aistudio/server_logo_1788529150584_b551acb7.jpg'}
              alt={`${runtimeConfig.config.serverName} crest`}
              className="w-8 h-8 rounded-lg object-cover border border-[#365C38]"
              referrerPolicy="no-referrer"
            />
            <span className="font-pixel caption-3 text-[#E8F0E9] tracking-tight whitespace-nowrap shrink-0">
              {runtimeConfig.config.serverName}
            </span>
          </a>

          {/* Zone 2: Five concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main pages">
            {NAV_LINKS.map((item) => {
              const active = isRouteActive(item.route);
              return (
                <a
                  key={item.route}
                  href={item.route}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.route);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`body-5 whitespace-nowrap shrink-0 transition-colors duration-300 ease-weighted rounded px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] ${
                    active ? 'text-[#A3E635]' : 'text-[#9BAD9F] hover:text-[#E8F0E9]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action + mobile menu toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openCart}
              className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn whitespace-nowrap shrink-0 transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              aria-label={`Open store bag with ${totalItems} items`}
            >
              <ShoppingBag size={16} weight="bold" aria-hidden="true" />
              <span>Bag</span>
              <span className="font-mono-data text-xs">({totalItems})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg bg-[#101D14] border border-[#243C2A] text-[#E8F0E9] transition-colors duration-300 ease-weighted hover:bg-[#14261A] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
              <span
                className={`absolute w-4 h-0.5 bg-[#E8F0E9] transition-transform duration-500 ease-weighted ${
                  mobileOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                }`}
              />
              <span
                className={`absolute w-4 h-0.5 bg-[#E8F0E9] transition-opacity duration-300 ease-weighted ${
                  mobileOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute w-4 h-0.5 bg-[#E8F0E9] transition-transform duration-500 ease-weighted ${
                  mobileOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                }`}
              />
            </button>
          </div>
        </header>
      </div>

      {/* Full-Height Mobile Menu Panel */}
      <div
        aria-hidden={!mobileOpen}
        className={`md:hidden fixed inset-0 z-30 bg-[#07110B]/95 backdrop-blur-xl transition-opacity duration-500 ease-weighted ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav
          aria-label="Mobile navigation"
          className="h-full flex flex-col justify-center px-8 gap-5 max-w-md mx-auto"
        >
          {[
            ...NAV_LINKS,
            { label: 'Ranks', route: '/ranks' as AppRoute },
            { label: 'Coins', route: '/coins' as AppRoute },
            { label: 'Crate Keys', route: '/keys' as AppRoute },
            { label: 'Special Packages', route: '/special' as AppRoute },
            { label: 'Rules', route: '/rules' as AppRoute },
            { label: 'About', route: '/about' as AppRoute },
          ].map((item, idx) => {
            const delayMs = Math.min(idx * 50, 400);
            const active = currentRoute === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.route);
                  setMobileOpen(false);
                }}
                style={{
                  transitionDelay: mobileOpen ? `${delayMs}ms` : '0ms',
                }}
                className={`heading-5 transition-all duration-500 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] rounded px-2 py-1 ${
                  mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                } ${active ? 'text-[#A3E635]' : 'text-[#9BAD9F] hover:text-[#E8F0E9]'}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </>
  );
}
