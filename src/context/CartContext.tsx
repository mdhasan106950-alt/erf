import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { calculateCouponDiscount, CATALOG_ITEMS, CatalogItem } from '../data/catalog';
import {
  ConfigJson,
  DEFAULT_CONFIG,
  DEFAULT_SITE,
  DEFAULT_STORE_CONFIG,
  formatCurrencyAmount,
  loadRuntimeConfigs,
  SiteJson,
  StoreJson,
} from '../lib/siteConfig';

export interface CartEntry {
  item: CatalogItem;
  quantity: number;
}

interface CartContextValue {
  entries: CartEntry[];
  isOpen: boolean;
  totalItems: number;
  totalAmountBdt: number;
  couponCode: string;
  discountBdt: number;
  finalTotalBdt: number;
  couponError: string | null;
  couponLabel: string | null;
  currency: string;
  currencyOptions: string[];
  runtimeConfig: {
    config: ConfigJson;
    site: SiteJson;
    store: StoreJson;
  };
  setCurrency: (code: string) => void;
  formatPrice: (amountBdt: number) => string;
  applyCoupon: (code: string) => { ok: boolean; error?: string };
  clearCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  addItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'ironcloudmc_cart_v1';
const CURRENCY_STORAGE_KEY = 'ironcloudmc_currency_v1';
const COUPON_STORAGE_KEY = 'ironcloudmc_coupon_v1';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore storage read issues
    }
    return {};
  });
  const [isOpen, setIsOpen] = useState(false);

  const [runtimeConfig, setRuntimeConfig] = useState<{
    config: ConfigJson;
    site: SiteJson;
    store: StoreJson;
  }>({
    config: DEFAULT_CONFIG,
    site: DEFAULT_SITE,
    store: DEFAULT_STORE_CONFIG,
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && ['BDT', 'USD', 'INR'].includes(saved)) return saved;
    } catch {
      // Ignore storage error
    }
    return 'BDT';
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    try {
      return window.localStorage.getItem(COUPON_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    let active = true;
    loadRuntimeConfigs().then((loaded) => {
      if (!active) return;
      setRuntimeConfig(loaded);
      const validCodes = Object.keys(loaded.store.currency.options || {});
      setCurrencyState((prev) =>
        validCodes.includes(prev) ? prev : loaded.store.currency.default || 'BDT'
      );
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(quantities));
    } catch {
      // Ignore storage write issues
    }
  }, [quantities]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // Ignore storage write issues
    }
  }, [currency]);

  useEffect(() => {
    try {
      if (couponCode) {
        window.localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
      } else {
        window.localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write issues
    }
  }, [couponCode]);

  const entries = useMemo<CartEntry[]>(() => {
    const list: CartEntry[] = [];
    for (const [id, qty] of Object.entries(quantities)) {
      const item = CATALOG_ITEMS.find((c) => c.id === id);
      if (item && qty > 0) {
        list.push({ item, quantity: qty });
      }
    }
    return list;
  }, [quantities]);

  const totalItems = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.quantity, 0),
    [entries]
  );

  const totalAmountBdt = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.item.priceBdt * entry.quantity, 0),
    [entries]
  );

  const couponCalc = useMemo(
    () => calculateCouponDiscount(totalAmountBdt, couponCode),
    [totalAmountBdt, couponCode]
  );

  const currencyOptions = useMemo(
    () => Object.keys(runtimeConfig.store.currency.options || { BDT: true }),
    [runtimeConfig.store.currency.options]
  );

  const setCurrency = useCallback(
    (code: string) => {
      if (runtimeConfig.store.currency.options[code]) {
        setCurrencyState(code);
      }
    },
    [runtimeConfig.store.currency.options]
  );

  const formatPrice = useCallback(
    (amountBdt: number) =>
      formatCurrencyAmount(amountBdt, currency, runtimeConfig.store.currency.options),
    [currency, runtimeConfig.store.currency.options]
  );

  const applyCoupon = useCallback(
    (rawCode: string) => {
      const cleaned = rawCode.trim().toUpperCase();
      if (!cleaned) {
        setCouponCode('');
        return { ok: true };
      }
      const check = calculateCouponDiscount(totalAmountBdt, cleaned);
      if (!check.valid) {
        return { ok: false, error: check.error };
      }
      setCouponCode(check.couponCode || cleaned);
      return { ok: true };
    },
    [totalAmountBdt]
  );

  const clearCoupon = useCallback(() => {
    setCouponCode('');
  }, []);

  const addItem = useCallback((itemId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.min(25, (prev[itemId] || 0) + 1),
    }));
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setQuantities((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: Math.min(25, quantity) };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setQuantities({});
    setCouponCode('');
  }, []);

  return (
    <CartContext.Provider
      value={{
        entries,
        isOpen,
        totalItems,
        totalAmountBdt,
        couponCode: couponCalc.valid && couponCalc.couponCode ? couponCalc.couponCode : '',
        discountBdt: couponCalc.valid ? couponCalc.discountBdt : 0,
        finalTotalBdt: couponCalc.valid ? couponCalc.finalTotalBdt : totalAmountBdt,
        couponError: couponCode && !couponCalc.valid ? couponCalc.error || null : null,
        couponLabel: couponCalc.valid ? couponCalc.label || null : null,
        currency,
        currencyOptions,
        runtimeConfig,
        setCurrency,
        formatPrice,
        applyCoupon,
        clearCoupon,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
