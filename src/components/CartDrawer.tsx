import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, Tag, Trash, X, ArrowRight } from '@phosphor-icons/react';
import { useCart } from '../context/CartContext';
import { AppRoute } from './Navbar';
import { SafeImage } from './SafeImage';

interface CartDrawerProps {
  onNavigate: (route: AppRoute) => void;
}

export function CartDrawer({ onNavigate }: CartDrawerProps) {
  const {
    entries,
    isOpen,
    totalAmountBdt,
    couponCode,
    discountBdt,
    finalTotalBdt,
    couponLabel,
    formatPrice,
    applyCoupon,
    clearCoupon,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart();

  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [couponError, setCouponError] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    if (!res.ok) {
      setCouponError(true);
      setCouponFeedback(res.error || 'Coupon code not valid.');
    } else if (!couponInput.trim()) {
      setCouponError(false);
      setCouponFeedback(null);
    } else {
      setCouponError(false);
      setCouponFeedback('Coupon applied to bag.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Store bag">
      <div
        className="fixed inset-0 bg-[#07110B]/80 backdrop-blur-sm transition-opacity duration-300 ease-weighted"
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-md bg-[#0B1F12] border border-[#243C2A] h-full flex flex-col p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#243C2A]">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
            <h2 className="heading-6 text-[#E8F0E9]">Your Store Bag</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close store bag"
            className="w-10 h-10 rounded-lg bg-[#101D14] border border-[#243C2A] text-[#E8F0E9] flex items-center justify-center transition-colors duration-300 ease-weighted hover:bg-[#14261A] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {entries.length === 0 ? (
            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 text-center space-y-4 mt-8">
              <p className="title-3 text-[#E8F0E9]">Your store bag is empty</p>
              <p className="body-6 text-[#9BAD9F]">
                Select ranks, coin packs, or crate keys to prepare your order for play.ironcloudmc.fun.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  onNavigate('/store');
                }}
                className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              >
                <span>Browse Store Catalog</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          ) : (
            entries.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      fallbackLabel={item.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#243C2A] shrink-0 bg-[#07110B]"
                    />
                    <div className="min-w-0">
                      <p className="caption-4 text-[#9BAD9F] uppercase">{item.category}</p>
                      <p className="title-3 text-[#E8F0E9] truncate">{item.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-2 rounded-lg text-[#9BAD9F] hover:text-[#E8F0E9] hover:bg-[#14261A] transition-colors duration-300 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635] shrink-0"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-[#07110B] border border-[#243C2A] rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="w-8 h-8 rounded flex items-center justify-center text-[#E8F0E9] hover:bg-[#14261A] transition-colors duration-300 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                    >
                      <Minus size={14} weight="bold" />
                    </button>
                    <span className="font-mono-data text-sm text-[#E8F0E9] px-2">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="w-8 h-8 rounded flex items-center justify-center text-[#E8F0E9] hover:bg-[#14261A] transition-colors duration-300 ease-weighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>

                  <p className="font-mono-data body-1 text-[#A3E635]">
                    {formatPrice(item.priceBdt * quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {entries.length > 0 && (
          <div className="pt-4 border-t border-[#243C2A] space-y-3">
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BAD9F]"
                    aria-hidden="true"
                  />
                  <label htmlFor="bag-coupon" className="sr-only">
                    Coupon code
                  </label>
                  <input
                    id="bag-coupon"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon (IRON10 or CLOUD50)"
                    className="w-full bg-[#101D14] border border-[#243C2A] rounded-lg pl-9 pr-3 py-2 caption-2 font-mono-data text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                  />
                </div>
                {couponCode ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearCoupon();
                      setCouponInput('');
                      setCouponFeedback(null);
                    }}
                    className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-xsm hover:bg-[#1A3122]"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-xsm hover:bg-[#1A3122]"
                  >
                    Apply
                  </button>
                )}
              </div>
              {couponFeedback && (
                <p className={`caption-4 ${couponError ? 'text-[#F87171]' : 'text-[#A3E635]'}`}>
                  {couponFeedback}
                </p>
              )}
            </form>

            <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="body-6 text-[#9BAD9F]">Subtotal</span>
                <span className="font-mono-data body-5 text-[#E8F0E9]">{formatPrice(totalAmountBdt)}</span>
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
                <span className="font-mono-data heading-6 text-[#A3E635]">
                  {formatPrice(finalTotalBdt)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                closeCart();
                onNavigate('/checkout');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-md pixel-block-btn transition-all duration-300 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
