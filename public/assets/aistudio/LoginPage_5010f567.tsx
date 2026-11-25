import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Gamepad2,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAdmin,
    loginWithCredentials,
    register,
    loginWithGoogle,
    updateMinecraftAccount,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regIgn, setRegIgn] = useState('');
  const [regEdition, setRegEdition] = useState<'Java' | 'Bedrock'>('Java');

  // Google Modal States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // General Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Character linking state for authenticated users
  const [ign, setIgn] = useState(user?.minecraftUsername || '');
  const [edition, setEdition] = useState<'Java' | 'Bedrock'>(
    user?.minecraftEdition || 'Java'
  );
  const [isLinking, setIsLinking] = useState(false);

  // Redirect target
  const from = (location.state as any)?.from?.pathname || (isAdmin ? '/admin' : '/profile');

  // Handle Credentials Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await loginWithCredentials(loginEmail.trim(), loginPassword);
      setSuccessMsg('Signed in successfully! Redirecting...');
      setTimeout(() => {
        const dest = res.user.role === 'OWNER' || res.user.role === 'ADMIN' ? '/admin' : from;
        navigate(dest, { replace: true });
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Player Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Please fill in your name, email, and password.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        minecraftUsername: regIgn.trim() || undefined,
        minecraftEdition: regEdition,
      });
      setSuccessMsg('Account created successfully! Welcome to Iron Cloud MC.');
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMsg('Please provide your Google email.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setShowGoogleModal(false);

    try {
      const gUser = await loginWithGoogle({
        email: googleEmail.trim(),
        name: googleName.trim() || undefined,
      });
      setSuccessMsg('Google sign in successful! Welcome.');
      setTimeout(() => {
        const dest = gUser.role === 'OWNER' || gUser.role === 'ADMIN' ? '/admin' : from;
        navigate(dest, { replace: true });
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Minecraft account update
  const handleSaveMinecraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ign.trim()) return;
    setIsLinking(true);
    try {
      await updateMinecraftAccount(ign.trim(), edition);
      setSuccessMsg('Minecraft character linked successfully!');
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 700);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 flex items-center justify-center relative bg-radial from-purple-950/20 via-zinc-950 to-black">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto">
              <img
                src="/logo.png"
                alt="Iron Cloud MC"
                className="w-full h-full object-contain drop-shadow-[0_4px_20px_rgba(168,85,247,0.5)]"
              />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Iron Cloud Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in or create your player account to link your Minecraft character and claim rewards.
          </p>
        </div>

        {/* Main Portal Container */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {user ? (
            /* Logged In State: Account Hub & Character Link */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-500/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {user.picture || user.avatarUrl ? (
                      <img
                        src={user.picture || user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-purple-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white flex items-center gap-2 truncate">
                      <span className="truncate">{user.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold flex-shrink-0 ${
                          user.role === 'OWNER'
                            ? 'bg-amber-500 text-black'
                            : user.role === 'ADMIN'
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-slate-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign out"
                  className="p-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Navigation Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/profile"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white transition-all text-center"
                >
                  <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>My Profile</span>
                </Link>

                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold uppercase tracking-wider text-amber-300 transition-all text-center"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/store"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold uppercase tracking-wider text-purple-300 transition-all text-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Visit Store</span>
                  </Link>
                )}
              </div>

              {/* Link Minecraft Character Form */}
              <form onSubmit={handleSaveMinecraft} className="space-y-4 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Minecraft In-Game Name (IGN)
                  </label>
                  <input
                    type="text"
                    required
                    value={ign}
                    onChange={(e) => setIgn(e.target.value)}
                    placeholder="e.g. MR_DOOM_YT"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used to deliver purchased ranks, keys, and coins directly in-game.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Minecraft Edition
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEdition('Java')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        edition === 'Java'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      Java Edition
                    </button>
                    <button
                      type="button"
                      onClick={() => setEdition('Bedrock')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        edition === 'Bedrock'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      Bedrock Edition
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLinking}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>{isLinking ? 'Linking Character...' : 'Save Linked Character'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Unauthenticated State: Sign In / Sign Up Tabs */
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Status Messages */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Google Sign In Quick Action */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer group shadow-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-500">
                  {activeTab === 'login' ? 'Or sign in with password' : 'Or enter player details'}
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {activeTab === 'login' ? (
                /* TAB 1: SIGN IN */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-xs text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      Don't have an account? <span className="font-bold text-purple-400">Create one now</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: CREATE ACCOUNT / SIGN UP */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Alex Hunter"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Gmail / Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Choose Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Minecraft IGN (Optional)
                      </label>
                      <input
                        type="text"
                        value={regIgn}
                        onChange={(e) => setRegIgn(e.target.value)}
                        placeholder="e.g. Steve"
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Edition
                      </label>
                      <select
                        value={regEdition}
                        onChange={(e) => setRegEdition(e.target.value as 'Java' | 'Bedrock')}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Java">Java Edition</option>
                        <option value="Bedrock">Bedrock Edition</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>{isLoading ? 'Creating Account...' : 'Create Player Account'}</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-xs text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      Already have an account? <span className="font-bold text-purple-400">Sign in here</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Google Authentication Dialog Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full rounded-2xl bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Authentication</h3>
                <p className="text-xs text-slate-400">Sign in to Iron Cloud MC with your Google account</p>
              </div>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your Google Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
