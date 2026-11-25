import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Menu,
  X,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronDown,
  ExternalLink,
  Crown,
  FileText,
  HelpCircle,
  Users,
  Compass,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Store', path: '/store', badge: 'Sale' },
    { name: 'Game Modes', path: '/game-modes' },
    { name: 'About Us', path: '/about' },
    { name: 'Our Team', path: '/team' },
    { name: 'Partnership', path: '/partnership' },
    { name: 'Rules', path: '/rules' },
    { name: 'Support', path: '/support' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
            id="navbar-brand-logo"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0">
              <img
                src="/logo.png"
                alt="Iron Cloud MC"
                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]"
              />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-widest text-slate-100 uppercase font-mono">
              Iron Cloud <span className="text-purple-500">MC</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-6 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wider xl:tracking-[0.18em]">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors py-1 ${
                    active
                      ? 'text-white border-b-2 border-purple-500 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    {link.name}
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-600 text-white font-mono">
                        {link.badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Cart Button */}
            <Link
              to="/cart"
              id="navbar-cart-button"
              className="relative p-2 rounded-sm border border-white/10 hover:border-purple-500/40 bg-white/5 text-slate-300 hover:text-white transition-all cursor-pointer group"
              title="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" />
              {itemCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-purple-600 text-[10px] flex items-center justify-center rounded-full font-bold text-white shadow-md shadow-purple-900/60 font-mono">
                  {itemCount}
                </div>
              )}
            </Link>

            {/* Auth / Account Profile */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  id="user-menu-button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-sm border border-white/10 bg-black/40 hover:border-purple-500/50 text-left transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-sm bg-purple-900/50 border border-purple-500/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {user.picture || user.avatarUrl ? (
                      <img
                        src={user.picture || user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-purple-200" />
                    )}
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-xs font-semibold text-slate-100 truncate max-w-[100px]">
                      {user.name}
                    </span>
                    <span className="text-[9px] text-purple-400 font-mono font-bold uppercase">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-md bg-[#0A0612]/95 border border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-purple-400" />
                      <span>Player Profile</span>
                    </Link>

                    <Link
                      to="/profile/orders"
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      <span>My Store Orders</span>
                    </Link>

                    <Link
                      to="/reports"
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Player Reports</span>
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-white/5" />
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-amber-300 font-semibold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Admin Control Panel</span>
                        </Link>
                      </>
                    )}

                    <div className="my-1 border-t border-white/5" />

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                id="navbar-login-button"
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm shadow-purple-950/40"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu and cart button */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              to="/cart"
              className="relative p-2 rounded-sm border border-white/10 bg-white/5 text-slate-300 hover:text-white"
            >
              <ShoppingBag className="w-4 h-4 text-purple-300" />
              {itemCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-purple-600 text-[10px] flex items-center justify-center rounded-full font-bold text-white font-mono">
                  {itemCount}
                </div>
              )}
            </Link>

            <button
              type="button"
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-sm border border-white/10 bg-black/40 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#0A0612]/95 backdrop-blur-md px-6 pt-4 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs uppercase tracking-wider font-semibold ${
                  isActive(link.path)
                    ? 'text-white bg-[#7b2cbf]/30 border border-[#7b2cbf]/40'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-600 text-white font-mono">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-xs text-zinc-300 bg-zinc-900"
                >
                  <UserIcon className="w-4 h-4 text-purple-400" />
                  <span>Profile: {user.name}</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-md text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                Sign In to Account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
