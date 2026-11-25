export interface ConfigJson {
  serverName: string;
  serverIp: string;
  bedrockPort: number;
  bedrockPlayersCanJoin: boolean;
  discordLink: string;
  logoPath: string;
  defaultColour: string;
}

export interface SiteJson {
  floatingNavbar: boolean;
  enableStoreButton: boolean;
  pages: {
    ranks: boolean;
    coins: boolean;
    keys: boolean;
    special: boolean;
  };
  gameModes: string[];
  hero: {
    liveStats: boolean;
    discord: {
      enabled: boolean;
      inviteCode: string;
      refreshSeconds: number;
    };
  };
  liveChat: {
    enabled: boolean;
    title: string;
    subtitle: string;
    refreshSeconds: number;
    maxMessages: number;
  };
}

export interface CurrencyOption {
  label: string;
  symbol: string;
  decimals: number;
  rate: number;
}

export interface StoreJson {
  currency: {
    default: string;
    base: string;
    options: Record<string, CurrencyOption>;
  };
  coupons: Array<{
    code: string;
    type: 'percent' | 'flat';
    value: number;
    minBdt: number;
    label: string;
  }>;
}

export const DEFAULT_CONFIG: ConfigJson = {
  serverName: 'IRON CLOUD MC',
  serverIp: 'play.ironcloudmc.fun',
  bedrockPort: 19132,
  bedrockPlayersCanJoin: true,
  discordLink: 'https://discord.gg/ErBVfVqEVg',
  logoPath: '/assets/aistudio/server_logo_1788529150584_b551acb7.jpg',
  defaultColour: 'emerald',
};

export const DEFAULT_SITE: SiteJson = {
  floatingNavbar: true,
  enableStoreButton: true,
  pages: {
    ranks: true,
    coins: true,
    keys: true,
    special: true,
  },
  gameModes: ['survival', 'skyblock', 'factions', 'pvp-arena'],
  hero: {
    liveStats: true,
    discord: {
      enabled: true,
      inviteCode: 'ErBVfVqEVg',
      refreshSeconds: 300,
    },
  },
  liveChat: {
    enabled: false,
    title: 'Live server chat',
    subtitle: 'Messages from the server when the chat bridge is connected.',
    refreshSeconds: 12,
    maxMessages: 40,
  },
};

export const DEFAULT_STORE_CONFIG: StoreJson = {
  currency: {
    default: 'BDT',
    base: 'BDT',
    options: {
      BDT: { label: 'BDT', symbol: '৳', decimals: 0, rate: 1 },
      USD: { label: 'USD', symbol: '$', decimals: 2, rate: 0.0084 },
      INR: { label: 'INR', symbol: '₹', decimals: 0, rate: 0.71 },
    },
  },
  coupons: [
    { code: 'IRON10', type: 'percent', value: 10, minBdt: 150, label: '10% off orders ৳150+' },
    { code: 'CLOUD50', type: 'flat', value: 50, minBdt: 300, label: '৳50 off orders ৳300+' },
  ],
};

export async function loadRuntimeConfigs(): Promise<{
  config: ConfigJson;
  site: SiteJson;
  store: StoreJson;
}> {
  const safeFetch = async <T,>(url: string, fallback: T): Promise<T> => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return fallback;
      const json = await res.json();
      return { ...fallback, ...json };
    } catch {
      return fallback;
    }
  };

  const [config, site, store] = await Promise.all([
    safeFetch<ConfigJson>('/config.json', DEFAULT_CONFIG),
    safeFetch<SiteJson>('/site.json', DEFAULT_SITE),
    safeFetch<StoreJson>('/store.json', DEFAULT_STORE_CONFIG),
  ]);

  return { config, site, store };
}

export function formatCurrencyAmount(
  amountBdt: number,
  currencyCode: string,
  options: Record<string, CurrencyOption>
): string {
  const opt = options[currencyCode] || options.BDT || { label: 'BDT', symbol: '৳', decimals: 0, rate: 1 };
  const converted = amountBdt * opt.rate;
  const formatted = converted.toLocaleString('en-US', {
    minimumFractionDigits: opt.decimals,
    maximumFractionDigits: opt.decimals,
  });
  return `${opt.symbol} ${formatted}`;
}

export function getMinecraftAvatarUrl(username: string, size = 64): string {
  const cleaned = username.trim().replace(/\s+/g, '_');
  return `https://mc-heads.net/avatar/${encodeURIComponent(cleaned || 'Steve')}/${size}`;
}

export function getMinecraftBodyUrl(username: string, size = 140): string {
  const cleaned = username.trim().replace(/\s+/g, '_');
  return `https://mc-heads.net/body/${encodeURIComponent(cleaned || 'Steve')}/${size}`;
}
