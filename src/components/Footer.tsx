import React, { useState } from 'react';
import { SERVER_INFO } from '../data/catalog';
import { useCart } from '../context/CartContext';
import { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { runtimeConfig } = useCart();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setStatus('error');
      setFeedback('Enter a valid email address.');
      return;
    }

    setStatus('submitting');
    setFeedback('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleaned }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed.');
      }
      setStatus('success');
      setFeedback(
        data.alreadyExists
          ? 'This email is already subscribed to server updates.'
          : 'Subscribed to IRON CLOUD MC updates.'
      );
      setEmail('');
    } catch (err: unknown) {
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Subscription failed. Try again.');
    }
  };

  return (
    <footer className="bg-[#0B1F12] border border-[#243C2A] rounded-3xl mx-4 mb-6 mt-16 pixel-card-bevel">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={runtimeConfig.config.logoPath || '/assets/aistudio/server_logo_1788529150584_b551acb7.jpg'}
                alt={`${runtimeConfig.config.serverName} crest`}
                className="w-10 h-10 rounded-xl object-cover border border-[#365C38]"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-pixel caption-3 text-[#E8F0E9]">{runtimeConfig.config.serverName}</p>
                <p className="font-mono-data caption-5 text-[#A3E635]">{runtimeConfig.config.serverIp}</p>
              </div>
            </div>
            <p className="body-6 text-[#9BAD9F] max-w-xs">
              Serving Java and Bedrock Minecraft players since 2019 across survival, skyblock, factions, and PvP arenas.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="title-4 text-[#E8F0E9]">Store</p>
            <ul className="space-y-2">
              {[
                { label: 'Store Overview', route: '/store' as AppRoute },
                { label: 'Server Ranks', route: '/ranks' as AppRoute },
                { label: 'Coin Packages', route: '/coins' as AppRoute },
                { label: 'Crate Keys', route: '/keys' as AppRoute },
                { label: 'Special Packages', route: '/special' as AppRoute },
                { label: 'Checkout', route: '/checkout' as AppRoute },
              ].map((link) => (
                <li key={link.route}>
                  <a
                    href={link.route}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(link.route);
                    }}
                    className="body-6 text-[#9BAD9F] hover:text-[#E8F0E9] transition-colors duration-300 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] rounded"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="title-4 text-[#E8F0E9]">Server</p>
            <ul className="space-y-2">
              {[
                { label: 'About Us', route: '/about' as AppRoute },
                { label: 'Staff Team', route: '/team' as AppRoute },
                { label: 'Server Rules', route: '/rules' as AppRoute },
                { label: 'Support Center', route: '/support' as AppRoute },
                { label: 'Player Account', route: '/account' as AppRoute },
              ].map((link) => (
                <li key={link.route}>
                  <a
                    href={link.route}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(link.route);
                    }}
                    className="body-6 text-[#9BAD9F] hover:text-[#E8F0E9] transition-colors duration-300 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] rounded"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <p className="title-4 text-[#E8F0E9]">Server News</p>
            <p className="body-6 text-[#9BAD9F]">
              Receive seasonal reset dates, tournament brackets, and store updates by email.
            </p>
            <form onSubmit={handleSubscribe} noValidate className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@example.com"
                  className="flex-1 bg-[#101D14] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn whitespace-nowrap shrink-0 transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                >
                  {status === 'submitting' ? 'Saving' : 'Subscribe'}
                </button>
              </div>
              {feedback && (
                <p
                  role={status === 'error' ? 'alert' : 'status'}
                  className={`caption-4 ${status === 'error' ? 'text-[#F87171]' : 'text-[#A3E635]'}`}
                >
                  {feedback}
                </p>
              )}
            </form>
            <div className="flex flex-wrap gap-4 caption-4 text-[#9BAD9F] pt-2">
              <a
                href={SERVER_INFO.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#A3E635] transition-colors duration-300"
              >
                Discord
              </a>
              <a
                href={`mailto:${SERVER_INFO.email}`}
                className="hover:text-[#A3E635] transition-colors duration-300"
              >
                {SERVER_INFO.email}
              </a>
              <span className="font-mono-data">{SERVER_INFO.phone}</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#243C2A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="caption-4 text-[#9BAD9F]">
            IRON CLOUD MC. Established 2019. Not an official Minecraft product.
          </p>
          <div className="flex items-center gap-6 caption-4 text-[#9BAD9F]">
            <a
              href="/rules"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/rules');
              }}
              className="hover:text-[#E8F0E9] transition-colors duration-300"
            >
              Rules
            </a>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/privacy');
              }}
              className="hover:text-[#E8F0E9] transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/terms');
              }}
              className="hover:text-[#E8F0E9] transition-colors duration-300"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
