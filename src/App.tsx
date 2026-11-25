import React, { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AppRoute, Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { StorePage } from './pages/StorePages';
import {
  AboutPage,
  LegalPage,
  NotFoundPage,
  RulesPage,
  SupportPage,
  TeamPage,
} from './pages/CommunityPages';
import { AccountPage, CheckoutPage } from './pages/CheckoutAndAccountPages';

const KNOWN_ROUTES: AppRoute[] = [
  '/',
  '/store',
  '/ranks',
  '/coins',
  '/keys',
  '/special',
  '/about',
  '/team',
  '/support',
  '/rules',
  '/checkout',
  '/account',
  '/privacy',
  '/terms',
];

const ROUTE_TITLES: Record<string, string> = {
  '/': 'IRON CLOUD MC — Minecraft Server & Official Store',
  '/store': 'Store — IRON CLOUD MC',
  '/ranks': 'Server Ranks — IRON CLOUD MC',
  '/coins': 'Coin Packages — IRON CLOUD MC',
  '/keys': 'Crate Keys — IRON CLOUD MC',
  '/special': 'Special Packages — IRON CLOUD MC',
  '/about': 'About Us — IRON CLOUD MC',
  '/team': 'Staff Team — IRON CLOUD MC',
  '/support': 'Support Center — IRON CLOUD MC',
  '/rules': 'Server Rules — IRON CLOUD MC',
  '/checkout': 'Checkout — IRON CLOUD MC',
  '/account': 'Player Account — IRON CLOUD MC',
  '/privacy': 'Privacy Policy — IRON CLOUD MC',
  '/terms': 'Terms of Service — IRON CLOUD MC',
};

function CookieNotice() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('ironcloudmc_cookie_consent') !== null;
    } catch {
      return true;
    }
  });

  if (dismissed) return null;

  const choose = (choice: 'accepted' | 'declined') => {
    try {
      window.localStorage.setItem('ironcloudmc_cookie_consent', choice);
    } catch {
      // Ignore storage error
    }
    setDismissed(true);
  };

  return (
    <aside
      aria-label="Cookie preference"
      className="fixed bottom-4 right-4 z-40 max-w-sm rounded-2xl bg-[#101D14] border border-[#243C2A] p-4 space-y-3"
    >
      <p className="body-6 text-[#E8F0E9]">
        We use essential browser storage to keep your store bag and session active.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => choose('accepted')}
          className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-xsm pixel-block-btn hover:bg-[#22C55E] transition-colors"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose('declined')}
          className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-xsm hover:bg-[#1A3122] transition-colors"
        >
          Essential Only
        </button>
      </div>
    </aside>
  );
}

function AppContent() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.title = ROUTE_TITLES[pathname] || 'IRON CLOUD MC';
  }, [pathname]);

  const navigate = useCallback((route: AppRoute) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setPathname(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderRoute = () => {
    switch (pathname) {
      case '/':
        return <HomePage onNavigate={navigate} />;
      case '/store':
        return <StorePage initialCategory="all" onNavigate={navigate} />;
      case '/ranks':
        return <StorePage initialCategory="ranks" onNavigate={navigate} />;
      case '/coins':
        return <StorePage initialCategory="coins" onNavigate={navigate} />;
      case '/keys':
        return <StorePage initialCategory="keys" onNavigate={navigate} />;
      case '/special':
        return <StorePage initialCategory="special" onNavigate={navigate} />;
      case '/about':
        return <AboutPage onNavigate={navigate} />;
      case '/team':
        return <TeamPage />;
      case '/support':
        return <SupportPage />;
      case '/rules':
        return <RulesPage onNavigate={navigate} />;
      case '/checkout':
        return <CheckoutPage onNavigate={navigate} />;
      case '/account':
        return <AccountPage onNavigate={navigate} />;
      case '/privacy':
        return <LegalPage type="privacy" onNavigate={navigate} />;
      case '/terms':
        return <LegalPage type="terms" onNavigate={navigate} />;
      default:
        return <NotFoundPage onNavigate={navigate} />;
    }
  };

  const activeRoute = KNOWN_ROUTES.includes(pathname as AppRoute) ? pathname : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#07110B] text-[#E8F0E9]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#16A34A] focus:text-[#041008] button-sm"
      >
        Skip to content
      </a>

      <Navbar currentRoute={activeRoute} onNavigate={navigate} />

      <main id="main-content" className="flex-1">
        {renderRoute()}
      </main>

      <Footer onNavigate={navigate} />
      <CartDrawer onNavigate={navigate} />
      <CookieNotice />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
