import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  GoogleLogo,
  Lifebuoy,
  Package,
  ShieldCheck,
  SignOut,
  Tag,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { SERVER_INFO } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMinecraftAvatarUrl, getMinecraftBodyUrl } from '../lib/siteConfig';
import { AppRoute } from '../components/Navbar';
import { SafeImage } from '../components/SafeImage';

interface OrderRecord {
  id: number;
  orderCode: string;
  minecraftUsername: string;
  edition: string;
  couponCode?: string | null;
  discountBdt?: number;
  totalAmountBdt: number;
  paymentMethod: string;
  transactionId: string;
  senderNumberMasked?: string;
  status: string;
  createdAt: string;
  itemsJson: string;
}

interface TicketRecord {
  id: number;
  minecraftUsername?: string;
  category: string;
  subject: string;
  message?: string;
  status: string;
  createdAt: string;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ic-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'delivered':
    case 'resolved':
      return 'text-[#A3E635] border-[#16A34A]/60 bg-[#16A34A]/15';
    case 'verified':
    case 'in_progress':
      return 'text-[#A3E635] border-[#365C38] bg-[#14261A]';
    case 'rejected':
    case 'closed':
      return 'text-[#F87171] border-[#F87171]/40 bg-[#0B1F12]';
    default:
      return 'text-[#C3D3C6] border-[#365C38] bg-[#0B1F12]';
  }
}

export function CheckoutPage({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const { firebaseUser, profile, signInWithGoogle, getToken } = useAuth();
  const {
    entries,
    totalAmountBdt,
    couponCode,
    discountBdt,
    finalTotalBdt,
    couponLabel,
    currency,
    formatPrice,
    applyCoupon,
    clearCoupon,
    clearCart,
  } = useCart();

  const [minecraftUsername, setMinecraftUsername] = useState(profile?.minecraftUsername || '');
  const [edition, setEdition] = useState<'java' | 'bedrock'>(profile?.edition || 'java');
  const [email, setEmail] = useState(profile?.email || firebaseUser?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponFeedback, setCouponFeedback] = useState('');
  const [couponIsError, setCouponIsError] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  const cartSignature = useMemo(
    () => entries.map((e) => `${e.item.id}:${e.quantity}`).join('|'),
    [entries]
  );
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => createIdempotencyKey());

  useEffect(() => {
    setIdempotencyKey(createIdempotencyKey());
  }, [cartSignature, transactionId, couponCode]);

  useEffect(() => {
    if (profile?.minecraftUsername && !minecraftUsername) {
      setMinecraftUsername(profile.minecraftUsername);
    }
    if (profile?.edition) {
      setEdition(profile.edition);
    }
    if ((profile?.email || firebaseUser?.email) && !email) {
      setEmail(profile?.email || firebaseUser?.email || '');
    }
  }, [profile, firebaseUser, minecraftUsername, email]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    if (!res.ok) {
      setCouponIsError(true);
      setCouponFeedback(res.error || 'Invalid coupon code.');
    } else if (!couponInput.trim()) {
      setCouponIsError(false);
      setCouponFeedback('');
    } else {
      setCouponIsError(false);
      setCouponFeedback('Coupon discount applied.');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firebaseUser) {
      setError('Sign in with Google first so your order attaches to your player account.');
      return;
    }
    if (entries.length === 0) {
      setError('Add at least one item to your store bag before submitting payment.');
      return;
    }

    const cleanUser = minecraftUsername.trim();
    const cleanEmail = email.trim();
    const cleanPhone = senderNumber.trim();
    const cleanTxn = transactionId.trim().toUpperCase();

    const validUsername =
      edition === 'java'
        ? /^[A-Za-z0-9_]{3,16}$/.test(cleanUser)
        : /^[A-Za-z0-9_](?:[A-Za-z0-9_ .]{0,18}[A-Za-z0-9_])?$/.test(cleanUser);

    if (!validUsername) {
      setError(
        edition === 'java'
          ? 'Java usernames must be 3 to 16 letters, numbers, or underscores.'
          : 'Bedrock gamertags must be 2 to 20 valid characters.'
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address for receipt confirmation.');
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setError('Enter a valid eleven digit Bangladesh number starting with 01.');
      return;
    }
    if (!/^[A-Z0-9]{6,32}$/.test(cleanTxn)) {
      setError('Transaction ID must be 6 to 32 alphanumeric characters.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication session expired. Sign in again.');

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          minecraftUsername: cleanUser,
          edition,
          email: cleanEmail,
          paymentMethod,
          senderNumber: cleanPhone,
          transactionId: cleanTxn,
          notes: notes.trim(),
          couponCode: couponCode || undefined,
          items: entries.map((entry) => ({
            id: entry.item.id,
            quantity: entry.quantity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Order submission failed.');
      }
      setConfirmedOrder(data.order);
      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
        <div className="max-w-2xl mx-auto rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-8 space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle size={28} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
            <h1 className="heading-4 text-[#E8F0E9]">Order Submitted for Verification</h1>
          </div>
          <p className="body-3 text-[#C3D3C6]">
            Order <span className="font-mono-data text-[#E8F0E9]">{confirmedOrder.orderCode}</span>{' '}
            is queued for manual payment verification before delivery to{' '}
            <span className="font-mono-data text-[#E8F0E9]">
              {confirmedOrder.minecraftUsername}
            </span>
            .
          </p>
          <div className="rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-5 space-y-3 body-6">
            <div className="flex justify-between">
              <span className="text-[#9BAD9F]">Status</span>
              <span className="text-[#A3E635] uppercase">
                {confirmedOrder.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9BAD9F]">Payment Method</span>
              <span className="text-[#E8F0E9] uppercase">{confirmedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9BAD9F]">Transaction ID</span>
              <span className="font-mono-data text-[#E8F0E9]">{confirmedOrder.transactionId}</span>
            </div>
            {confirmedOrder.senderNumberMasked && (
              <div className="flex justify-between">
                <span className="text-[#9BAD9F]">Sender Number</span>
                <span className="font-mono-data text-[#E8F0E9]">
                  {confirmedOrder.senderNumberMasked}
                </span>
              </div>
            )}
            {confirmedOrder.couponCode && (
              <div className="flex justify-between">
                <span className="text-[#9BAD9F]">Coupon Applied</span>
                <span className="font-mono-data text-[#A3E635]">
                  {confirmedOrder.couponCode} (৳ {confirmedOrder.discountBdt || 0} off)
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#9BAD9F]">Total Paid</span>
              <span className="font-mono-data text-[#E8F0E9]">
                ৳ {confirmedOrder.totalAmountBdt}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/account')}
              className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] pixel-block-btn button-sm transition-all duration-300 ease-weighted hover:bg-[#22C55E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              View Order History
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/store')}
              className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm transition-colors duration-300 ease-weighted hover:bg-[#365C38]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              Return to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-3">
          <p className="font-pixel caption-3 text-[#A3E635] uppercase">Checkout</p>
          <h1 className="heading-2 hero-heading-gradient max-w-[680px]">
            Verify bKash or Nagad Payment
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {!firebaseUser && (
              <div className="rounded-2xl bg-[#101D14] border border-[#365C38] pixel-card-bevel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="title-3 text-[#E8F0E9]">Sign in required for checkout</p>
                  <p className="body-6 text-[#9BAD9F]">
                    Connect your Google account so your purchase receipt and delivery status stay
                    saved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] pixel-block-btn button-sm whitespace-nowrap shrink-0 transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                >
                  <GoogleLogo size={16} weight="bold" aria-hidden="true" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            <form
              onSubmit={handleCheckout}
              noValidate
              className="rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-6 sm:p-8 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="checkout-mc-user" className="caption-3 text-[#E8F0E9] block">
                    Minecraft Username
                  </label>
                  <input
                    id="checkout-mc-user"
                    type="text"
                    value={minecraftUsername}
                    onChange={(e) => setMinecraftUsername(e.target.value)}
                    placeholder="PlayerName"
                    className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="checkout-edition" className="caption-3 text-[#E8F0E9] block">
                    Minecraft Edition
                  </label>
                  <select
                    id="checkout-edition"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value as 'java' | 'bedrock')}
                    className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  >
                    <option value="java">Java Edition</option>
                    <option value="bedrock">Bedrock Edition</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="checkout-email" className="caption-3 text-[#E8F0E9] block">
                  Receipt Email Address
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@example.com"
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>

              <div className="space-y-3">
                <p className="caption-3 text-[#E8F0E9]">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['bkash', 'nagad'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 px-4 rounded-xl border button-sm uppercase transition-colors duration-300 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] ${
                        paymentMethod === method
                          ? 'bg-[#16A34A] text-[#041008] border-[#16A34A] pixel-block-btn'
                          : 'bg-[#0B1F12] text-[#9BAD9F] border-[#243C2A] hover:text-[#E8F0E9]'
                      }`}
                    >
                      {method === 'bkash' ? 'bKash' : 'Nagad'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-5 space-y-2">
                <p className="title-4 text-[#E8F0E9]">
                  {paymentMethod === 'bkash'
                    ? 'bKash Send Money Instructions'
                    : 'Nagad Send Money Instructions'}
                </p>
                <ol className="space-y-1 body-6 text-[#C3D3C6] list-decimal list-inside">
                  <li>
                    {paymentMethod === 'bkash'
                      ? 'Open bKash App or dial *247# and choose Send Money.'
                      : 'Open Nagad App or dial *167# and choose Send Money.'}
                  </li>
                  <li>
                    Enter account number:{' '}
                    <span className="font-mono-data text-[#E8F0E9]">{SERVER_INFO.bkashNumber}</span>
                  </li>
                  <li>
                    Enter exact total:{' '}
                    <span className="font-mono-data text-[#E8F0E9]">৳ {finalTotalBdt} BDT</span>
                    {currency !== 'BDT' && (
                      <span className="text-[#9BAD9F]"> ({formatPrice(finalTotalBdt)})</span>
                    )}
                  </li>
                  <li>
                    Set reference:{' '}
                    <span className="font-mono-data text-[#E8F0E9]">
                      {SERVER_INFO.paymentReference}
                    </span>
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="checkout-sender" className="caption-3 text-[#E8F0E9] block">
                    Sender Mobile Number
                  </label>
                  <input
                    id="checkout-sender"
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 font-mono-data text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="checkout-txnid" className="caption-3 text-[#E8F0E9] block">
                    Transaction ID
                  </label>
                  <input
                    id="checkout-txnid"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="TXN8A92K1"
                    className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 font-mono-data text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="checkout-notes" className="caption-3 text-[#E8F0E9] block">
                  Notes (Optional)
                </label>
                <input
                  id="checkout-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Realm preference or gift recipient note"
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 text-[#F87171] body-6">
                  <WarningCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || entries.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#16A34A] text-[#041008] pixel-block-btn button-md transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              >
                <span>{submitting ? 'Confirming Order' : 'Confirm and Submit Order'}</span>
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Order Summary + Coupon Box */}
          <aside className="lg:col-span-5 rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-6 space-y-5">
            <h2 className="heading-6 text-[#E8F0E9]">Order Summary</h2>
            {entries.length === 0 ? (
              <div className="space-y-4 py-4">
                <p className="body-6 text-[#9BAD9F]">No items in your bag yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('/store')}
                  className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#365C38]/40 transition-colors duration-300"
                >
                  Browse Store Packages
                </button>
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {entries.map(({ item, quantity }) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#0B1F12] border border-[#243C2A] p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#14261A] border border-[#243C2A] overflow-hidden shrink-0">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            fallbackLabel={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="title-4 text-[#E8F0E9] truncate">{item.name}</p>
                          <p className="caption-5 text-[#9BAD9F]">Quantity: {quantity}</p>
                        </div>
                      </div>
                      <span className="font-mono-data body-4 text-[#E8F0E9] shrink-0">
                        {formatPrice(item.priceBdt * quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BAD9F]"
                        aria-hidden="true"
                      />
                      <label htmlFor="checkout-coupon" className="sr-only">
                        Coupon code
                      </label>
                      <input
                        id="checkout-coupon"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Promo code (IRON10 / CLOUD50)"
                        className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg pl-9 pr-3 py-2 caption-2 font-mono-data text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                      />
                    </div>
                    {couponCode ? (
                      <button
                        type="button"
                        onClick={() => {
                          clearCoupon();
                          setCouponInput('');
                          setCouponFeedback('');
                        }}
                        className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-xsm hover:bg-[#365C38]/40"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-xsm hover:bg-[#365C38]/40"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {couponFeedback && (
                    <p className={`caption-4 ${couponIsError ? 'text-[#F87171]' : 'text-[#A3E635]'}`}>
                      {couponFeedback}
                    </p>
                  )}
                </form>

                <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="body-6 text-[#9BAD9F]">Subtotal</span>
                    <span className="font-mono-data body-5 text-[#E8F0E9]">
                      {formatPrice(totalAmountBdt)}
                    </span>
                  </div>
                  {discountBdt > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="body-6 text-[#A3E635]">
                        {couponCode} {couponLabel ? `(${couponLabel})` : ''}
                      </span>
                      <span className="font-mono-data body-5 text-[#A3E635]">
                        {formatPrice(-discountBdt)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="body-5 text-[#E8F0E9]">Total Due</span>
                    <span className="font-mono-data heading-5 text-[#A3E635]">
                      {formatPrice(finalTotalBdt)}
                    </span>
                  </div>
                  {currency !== 'BDT' && (
                    <p className="caption-5 text-[#9BAD9F] text-right font-mono-data">
                      Exact settlement: ৳ {finalTotalBdt} BDT
                    </p>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

type AccountTab = 'orders' | 'tickets' | 'profile' | 'staff';

export function AccountPage({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const {
    firebaseUser,
    profile,
    loading,
    authError,
    signInWithGoogle,
    logout,
    getToken,
    updateMinecraftProfile,
  } = useAuth();
  const { runtimeConfig, formatPrice } = useCart();

  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [mcUsername, setMcUsername] = useState('');
  const [edition, setEdition] = useState<'java' | 'bedrock'>('java');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileIsError, setProfileIsError] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // Quick copy state for server connect bar
  const [copiedIp, setCopiedIp] = useState(false);

  // Inline quick ticket composer inside Account
  const [ticketCategory, setTicketCategory] = useState('Store Delivery');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState('');
  const [ticketIsError, setTicketIsError] = useState(false);

  // Staff RBAC queue state
  const [staffOrders, setStaffOrders] = useState<OrderRecord[]>([]);
  const [staffTickets, setStaffTickets] = useState<TicketRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const isStaff =
    profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'moderator';

  const serverIp = runtimeConfig.config.serverIp || SERVER_INFO.ip;
  const bedrockPort = runtimeConfig.config.bedrockPort || 19132;

  useEffect(() => {
    if (profile) {
      setMcUsername(profile.minecraftUsername || '');
      setEdition(profile.edition || 'java');
    }
  }, [profile]);

  const loadAccountData = useCallback(async () => {
    if (!firebaseUser) return;
    setDataLoading(true);
    setDataError('');
    try {
      const token = await getToken();
      if (!token) return;
      const [ordersRes, ticketsRes] = await Promise.all([
        fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tickets', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const ordersJson = await ordersRes.json();
      const ticketsJson = await ticketsRes.json();
      if (!ordersRes.ok) throw new Error(ordersJson.error || 'Failed to load orders.');
      if (!ticketsRes.ok) throw new Error(ticketsJson.error || 'Failed to load tickets.');
      setOrders(ordersJson.orders || []);
      setTickets(ticketsJson.tickets || []);
    } catch (err: unknown) {
      setDataError(err instanceof Error ? err.message : 'Unable to load account records.');
    } finally {
      setDataLoading(false);
    }
  }, [firebaseUser, getToken]);

  const loadStaffData = useCallback(async () => {
    if (!firebaseUser || !isStaff) return;
    setStaffLoading(true);
    setStaffError('');
    try {
      const token = await getToken();
      if (!token) return;
      const [ordRes, tktRes] = await Promise.all([
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/tickets', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const ordJson = await ordRes.json();
      const tktJson = await tktRes.json();
      if (!ordRes.ok) throw new Error(ordJson.error || 'Unable to load staff orders.');
      if (!tktRes.ok) throw new Error(tktJson.error || 'Unable to load staff tickets.');
      setStaffOrders(ordJson.orders || []);
      setStaffTickets(tktJson.tickets || []);
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : 'Unable to load staff queue.');
    } finally {
      setStaffLoading(false);
    }
  }, [firebaseUser, isStaff, getToken]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  useEffect(() => {
    if (activeTab === 'staff' && isStaff) {
      loadStaffData();
    }
  }, [activeTab, isStaff, loadStaffData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileIsError(false);
    const cleaned = mcUsername.trim();
    const valid =
      edition === 'java'
        ? /^[A-Za-z0-9_]{3,16}$/.test(cleaned)
        : /^[A-Za-z0-9_](?:[A-Za-z0-9_ .]{0,18}[A-Za-z0-9_])?$/.test(cleaned);
    if (!valid) {
      setProfileIsError(true);
      setProfileMsg(
        edition === 'java'
          ? 'Java usernames must be 3 to 16 letters, numbers, or underscores.'
          : 'Bedrock gamertags must be 2 to 20 valid characters.'
      );
      return;
    }
    setSavingProfile(true);
    try {
      await updateMinecraftProfile(cleaned, edition);
      setProfileMsg('Minecraft username and skin passport updated.');
    } catch (err: unknown) {
      setProfileIsError(true);
      setProfileMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitQuickTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketFeedback('');
    setTicketIsError(false);
    const activeIgn = (mcUsername || profile?.minecraftUsername || '').trim();
    if (activeIgn.length < 2) {
      setTicketIsError(true);
      setTicketFeedback('Save your Minecraft username in Skin & Profile first.');
      return;
    }
    if (ticketSubject.trim().length < 4) {
      setTicketIsError(true);
      setTicketFeedback('Enter a subject with at least 4 characters.');
      return;
    }
    if (ticketMessage.trim().length < 10) {
      setTicketIsError(true);
      setTicketFeedback('Describe your request in at least 10 characters.');
      return;
    }

    setTicketSending(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          minecraftUsername: activeIgn,
          email: profile?.email || firebaseUser?.email || '',
          category: ticketCategory,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ticket submission failed.');
      setTicketSubject('');
      setTicketMessage('');
      setTicketFeedback(`Ticket #${data.ticket.id} created.`);
      await loadAccountData();
    } catch (err: unknown) {
      setTicketIsError(true);
      setTicketFeedback(err instanceof Error ? err.message : 'Unable to create ticket.');
    } finally {
      setTicketSending(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update order status.');
      }
      await loadStaffData();
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : 'Unable to update order.');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update ticket status.');
      }
      await loadStaffData();
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : 'Unable to update ticket.');
    }
  };

  const handleCopyServer = async () => {
    try {
      await navigator.clipboard.writeText(serverIp);
      setCopiedIp(true);
      window.setTimeout(() => setCopiedIp(false), 2000);
    } catch {
      setCopiedIp(false);
    }
  };

  const totalSpentBdt = useMemo(
    () => orders.reduce((sum, o) => sum + (o.status === 'rejected' ? 0 : o.totalAmountBdt), 0),
    [orders]
  );

  if (loading) {
    return (
      <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-44 rounded-3xl bg-[#101D14] border border-[#243C2A] animate-pulse" />
          <div className="h-64 rounded-3xl bg-[#101D14] border border-[#243C2A] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
        <div className="max-w-xl mx-auto rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-8 sm:p-10 space-y-6 text-center">
          <SafeImage
            src={getMinecraftAvatarUrl('Steve', 64)}
            alt="Default Minecraft avatar"
            fallbackLabel="Steve"
            className="w-16 h-16 rounded-2xl mx-auto border border-[#365C38] object-cover"
          />
          <div className="space-y-2">
            <p className="font-pixel caption-4 text-[#A3E635] uppercase">Player Account</p>
            <h1 className="heading-3 text-[#E8F0E9]">Player Passport & Account</h1>
            <p className="body-6 text-[#9BAD9F]">
              Sign in with Google to preview your Minecraft skin, link your Java or Bedrock
              username, track order verification, and manage support tickets.
            </p>
          </div>
          {authError && (
            <p role="alert" className="body-6 text-[#F87171]">
              {authError}
            </p>
          )}
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg bg-[#16A34A] text-[#041008] pixel-block-btn button-md transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            <GoogleLogo size={18} weight="bold" aria-hidden="true" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  const activeSkinName = (mcUsername || profile?.minecraftUsername || 'Steve').trim();
  const roleLabel =
    profile?.role === 'owner'
      ? 'Owner'
      : profile?.role === 'admin'
      ? 'Admin'
      : profile?.role === 'moderator'
      ? 'Moderator'
      : 'Player';

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Player Passport Card */}
        <section className="rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-24 rounded-2xl bg-[#0B1F12] border border-[#365C38] flex items-center justify-center overflow-hidden shrink-0">
                <SafeImage
                  src={getMinecraftBodyUrl(activeSkinName, 96)}
                  alt={`${activeSkinName} Minecraft character render`}
                  fallbackLabel={activeSkinName}
                  className="h-20 w-auto object-contain"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`caption-4 px-2.5 py-0.5 rounded-lg border uppercase ${
                      isStaff
                        ? 'text-[#A3E635] border-[#16A34A]/60 bg-[#16A34A]/15'
                        : 'text-[#C3D3C6] border-[#365C38] bg-[#0B1F12]'
                    }`}
                  >
                    {roleLabel}
                  </span>
                  <span className="font-mono-data caption-4 px-2.5 py-0.5 rounded-lg bg-[#0B1F12] border border-[#243C2A] text-[#9BAD9F] uppercase">
                    {profile?.edition || edition} Edition
                  </span>
                </div>

                <h1 className="heading-4 text-[#E8F0E9] truncate">
                  {profile?.minecraftUsername || profile?.displayName || 'Unlinked Player'}
                </h1>
                <p className="caption-2 text-[#9BAD9F] truncate">{firebaseUser.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={handleCopyServer}
                className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#0B1F12] border border-[#243C2A] text-[#E8F0E9] font-mono-data button-sm hover:border-[#365C38] hover:bg-[#14261A] transition-colors"
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

              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#365C38]/40 transition-colors"
              >
                <SignOut size={16} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-1">
              <p className="caption-4 text-[#9BAD9F] uppercase">Total Orders</p>
              <p className="font-mono-data heading-6 text-[#E8F0E9]">{orders.length}</p>
            </div>
            <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-1">
              <p className="caption-4 text-[#9BAD9F] uppercase">Support Tickets</p>
              <p className="font-mono-data heading-6 text-[#E8F0E9]">{tickets.length}</p>
            </div>
            <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-1">
              <p className="caption-4 text-[#9BAD9F] uppercase">Store Total</p>
              <p className="font-mono-data heading-6 text-[#A3E635]">{formatPrice(totalSpentBdt)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1F12] border border-[#243C2A] p-4 space-y-1">
              <p className="caption-4 text-[#9BAD9F] uppercase">Bedrock Port</p>
              <p className="font-mono-data heading-6 text-[#E8F0E9]">{bedrockPort}</p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Account sections"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#101D14] border border-[#243C2A]"
        >
          {(
            [
              { id: 'orders', label: 'Orders & Delivery', icon: Package },
              { id: 'tickets', label: 'Support Tickets', icon: Lifebuoy },
              { id: 'profile', label: 'Skin & Profile', icon: UserCircle },
              ...(isStaff
                ? [{ id: 'staff' as AccountTab, label: 'Staff Panel', icon: ShieldCheck }]
                : []),
            ] as Array<{ id: AccountTab; label: string; icon: typeof Package }>
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 py-2 px-3 rounded-lg button-sm whitespace-nowrap transition-colors duration-200 ${
                  active
                    ? 'bg-[#16A34A] text-[#041008] pixel-block-btn'
                    : 'text-[#9BAD9F] hover:text-[#E8F0E9]'
                }`}
              >
                <Icon size={16} weight="bold" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ORDERS & DELIVERY */}
        {activeTab === 'orders' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="heading-5 text-[#E8F0E9]">Store Order History</h2>
              <button
                type="button"
                onClick={() => onNavigate('/store')}
                className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#365C38]/40 transition-colors"
              >
                Browse Store
              </button>
            </div>

            {dataError && (
              <div
                role="alert"
                className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-4 text-[#F87171] body-6"
              >
                {dataError}
              </div>
            )}

            {dataLoading ? (
              <div className="space-y-3">
                <div className="h-24 rounded-2xl bg-[#101D14] border border-[#243C2A] animate-pulse" />
                <div className="h-24 rounded-2xl bg-[#101D14] border border-[#243C2A] animate-pulse" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-8 space-y-4">
                <p className="title-3 text-[#E8F0E9]">No store orders yet</p>
                <p className="body-6 text-[#9BAD9F]">
                  Ranks, coin packages, crate keys, and special bundles purchased with this account
                  appear here with real verification status.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/store')}
                  className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] pixel-block-btn button-sm hover:bg-[#22C55E] transition-colors"
                >
                  Explore Official Store
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  let parsedItems: Array<{ name: string; quantity: number }> = [];
                  try {
                    parsedItems = JSON.parse(order.itemsJson);
                  } catch {
                    parsedItems = [];
                  }
                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <p className="font-mono-data caption-3 text-[#9BAD9F]">
                          {order.orderCode} · {order.paymentMethod.toUpperCase()} ·{' '}
                          {order.transactionId}
                        </p>
                        <p className="title-3 text-[#E8F0E9]">
                          {parsedItems.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                        </p>
                        <p className="caption-4 text-[#9BAD9F]">
                          Recipient: {order.minecraftUsername} ({order.edition})
                          {order.senderNumberMasked ? ` · Sender: ${order.senderNumberMasked}` : ''}
                          {order.couponCode ? ` · Promo: ${order.couponCode}` : ''}
                        </p>
                      </div>
                      <div className="text-left sm:text-right space-y-2 shrink-0">
                        <p className="font-mono-data title-2 text-[#E8F0E9]">
                          ৳ {order.totalAmountBdt}
                        </p>
                        <span
                          className={`inline-block caption-4 px-2.5 py-0.5 rounded-lg border uppercase ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="heading-5 text-[#E8F0E9]">Your Support Tickets</h2>
              {tickets.length === 0 ? (
                <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-8 space-y-2">
                  <p className="title-3 text-[#E8F0E9]">No open tickets</p>
                  <p className="body-6 text-[#9BAD9F]">
                    Submit a payment verification check, bug report, or store inquiry using the
                    form beside this panel.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      className="rounded-2xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-5 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="caption-4 text-[#9BAD9F]">
                          #{ticket.id} · {ticket.category}
                        </p>
                        <p className="title-3 text-[#E8F0E9]">{ticket.subject}</p>
                      </div>
                      <span
                        className={`caption-4 px-2.5 py-0.5 rounded-lg border uppercase shrink-0 ${getStatusClass(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmitQuickTicket}
              className="lg:col-span-5 rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-6 space-y-4"
            >
              <h3 className="heading-6 text-[#E8F0E9]">Quick Ticket Composer</h3>
              <div className="space-y-2">
                <label htmlFor="acc-ticket-cat" className="caption-3 text-[#9BAD9F] block">
                  Topic
                </label>
                <select
                  id="acc-ticket-cat"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                >
                  <option value="Store Delivery">Store Delivery</option>
                  <option value="bKash or Nagad Verification">bKash or Nagad Verification</option>
                  <option value="Player Report">Player Report</option>
                  <option value="Technical Bug">Technical Bug</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="acc-ticket-subj" className="caption-3 text-[#9BAD9F] block">
                  Subject
                </label>
                <input
                  id="acc-ticket-subj"
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Missing item or question"
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="acc-ticket-msg" className="caption-3 text-[#9BAD9F] block">
                  Message
                </label>
                <textarea
                  id="acc-ticket-msg"
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Include your order code or bKash/Nagad transaction ID."
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>
              {ticketFeedback && (
                <p className={`caption-4 ${ticketIsError ? 'text-[#F87171]' : 'text-[#A3E635]'}`}>
                  {ticketFeedback}
                </p>
              )}
              <button
                type="submit"
                disabled={ticketSending}
                className="w-full py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] pixel-block-btn button-sm hover:bg-[#22C55E] disabled:opacity-60 transition-colors"
              >
                {ticketSending ? 'Sending Ticket' : 'Submit Ticket'}
              </button>
            </form>
          </section>
        )}

        {/* TAB 3: SKIN & PROFILE */}
        {activeTab === 'profile' && (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-6 flex flex-col items-center text-center space-y-4">
              <p className="font-pixel caption-4 text-[#A3E635] uppercase">Live Skin Preview</p>
              <div className="w-36 h-48 rounded-2xl bg-[#0B1F12] border border-[#365C38] flex items-center justify-center p-3 overflow-hidden">
                <SafeImage
                  src={getMinecraftBodyUrl(activeSkinName, 140)}
                  alt={`${activeSkinName} live preview`}
                  fallbackLabel={activeSkinName}
                  className="h-40 w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <SafeImage
                  src={getMinecraftAvatarUrl(activeSkinName, 24)}
                  alt=""
                  fallbackLabel={activeSkinName}
                  className="w-5 h-5 rounded-sm object-cover"
                />
                <span className="font-mono-data title-4 text-[#E8F0E9]">{activeSkinName}</span>
              </div>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="md:col-span-8 rounded-3xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-6 sm:p-8 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="heading-6 text-[#E8F0E9]">Link Minecraft Username</h2>
                <p className="body-6 text-[#9BAD9F]">
                  Your skin updates live as you type. Store orders default to this username and
                  edition.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="account-mc-name" className="caption-3 text-[#9BAD9F] block">
                    Minecraft Username
                  </label>
                  <input
                    id="account-mc-name"
                    type="text"
                    value={mcUsername}
                    onChange={(e) => setMcUsername(e.target.value)}
                    placeholder="PlayerName"
                    className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="account-edition" className="caption-3 text-[#9BAD9F] block">
                    Edition
                  </label>
                  <select
                    id="account-edition"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value as 'java' | 'bedrock')}
                    className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  >
                    <option value="java">Java Edition</option>
                    <option value="bedrock">Bedrock Edition</option>
                  </select>
                </div>
              </div>

              {profileMsg && (
                <p className={`caption-2 ${profileIsError ? 'text-[#F87171]' : 'text-[#A3E635]'}`}>
                  {profileMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="py-2 px-4 rounded-lg bg-[#16A34A] text-[#041008] pixel-block-btn button-sm transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              >
                {savingProfile ? 'Saving Profile' : 'Save Minecraft Profile'}
              </button>
            </form>
          </section>
        )}

        {/* TAB 4: STAFF RBAC PANEL (Owner / Admin / Moderator only) */}
        {activeTab === 'staff' && isStaff && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-pixel caption-4 text-[#A3E635] uppercase">
                  Staff Operations ({roleLabel})
                </p>
                <h2 className="heading-5 text-[#E8F0E9]">Order Verification & Ticket Queue</h2>
              </div>
              <button
                type="button"
                onClick={loadStaffData}
                className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm self-start hover:bg-[#365C38]/40 transition-colors"
              >
                Refresh Queue
              </button>
            </div>

            {staffError && (
              <div
                role="alert"
                className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-4 text-[#F87171] body-6"
              >
                {staffError}
              </div>
            )}

            {staffLoading ? (
              <div className="space-y-3">
                <div className="h-24 rounded-2xl bg-[#101D14] border border-[#243C2A] animate-pulse" />
                <div className="h-24 rounded-2xl bg-[#101D14] border border-[#243C2A] animate-pulse" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <h3 className="title-2 text-[#E8F0E9]">
                    Recent Store Orders ({staffOrders.length})
                  </h3>
                  {staffOrders.length === 0 ? (
                    <p className="body-6 text-[#9BAD9F]">No store orders submitted yet.</p>
                  ) : (
                    staffOrders.map((order) => (
                      <article
                        key={order.id}
                        className="rounded-2xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="font-mono-data caption-3 text-[#9BAD9F]">
                            {order.orderCode} · {order.paymentMethod.toUpperCase()} ·{' '}
                            {order.transactionId} · Sender {order.senderNumberMasked}
                          </p>
                          <p className="title-3 text-[#E8F0E9]">
                            {order.minecraftUsername} ({order.edition}) · ৳ {order.totalAmountBdt}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label htmlFor={`staff-order-${order.id}`} className="sr-only">
                            Order status
                          </label>
                          <select
                            id={`staff-order-${order.id}`}
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 caption-3 text-[#E8F0E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                          >
                            <option value="pending_verification">Pending Verification</option>
                            <option value="verified">Verified</option>
                            <option value="delivered">Delivered</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="title-2 text-[#E8F0E9]">
                    Support Tickets ({staffTickets.length})
                  </h3>
                  {staffTickets.length === 0 ? (
                    <p className="body-6 text-[#9BAD9F]">No support tickets logged yet.</p>
                  ) : (
                    staffTickets.map((ticket) => (
                      <article
                        key={ticket.id}
                        className="rounded-2xl bg-[#101D14] border border-[#243C2A] pixel-card-bevel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="caption-4 text-[#9BAD9F]">
                            #{ticket.id} · {ticket.minecraftUsername} · {ticket.category}
                          </p>
                          <p className="title-3 text-[#E8F0E9]">{ticket.subject}</p>
                          {ticket.message && (
                            <p className="body-6 text-[#9BAD9F]">{ticket.message}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label htmlFor={`staff-ticket-${ticket.id}`} className="sr-only">
                            Ticket status
                          </label>
                          <select
                            id={`staff-ticket-${ticket.id}`}
                            value={ticket.status}
                            onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                            className="bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 caption-3 text-[#E8F0E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
