/**
 * The only place that reads payment-provider environment variables.
 *
 * Canonical names are PROVIDER_*; the older TRANSBRIDGE_* / NEXT_PUBLIC_* / ONLINE_BANKING_* /
 * ORIGINAL_TECH_ACCOUNT_ID names are still accepted as fallbacks (first non-empty value wins).
 *
 * Values are read lazily (at call time, as before), so the app still boots without them;
 * a call that needs a missing value fails with a ProviderConfigError naming the variable.
 */

import { ServiceUnavailableException } from '@nestjs/common';

/** 503 with a message naming the missing variable (Nest serialises it as-is). */
export class ProviderConfigError extends ServiceUnavailableException {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigError';
  }
}

/** First non-empty value among `names`, or undefined. */
function readEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

function requireEnv(names: string[], purpose: string): string {
  const value = readEnv(names);
  if (value === undefined) {
    const which = names.length === 1 ? names[0] : `${names[0]} (or ${names.slice(1).join(', ')})`;
    throw new ProviderConfigError(
      `Missing required environment variable ${which}, needed for ${purpose}`,
    );
  }
  return value;
}

function positiveNumber(names: string[], fallback: number): number {
  const n = Number(readEnv(names) || fallback);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const stripTrailingSlash = (url: string) => url.replace(/\/$/, '');

export const providers = {
  /** Bridge, reached through the Transbridge proxy (src/integration/bridge). */
  transbridge: {
    get apiUrl(): string {
      return stripTrailingSlash(requireEnv(['PROVIDER_BRIDGE_API_URL', 'TRANSBRIDGE_API_URL'], 'Bridge (Transbridge) API calls'));
    },
    get apiKey(): string {
      return requireEnv(['PROVIDER_BRIDGE_API_KEY', 'TRANSBRIDGE_API_KEY'], 'Bridge (Transbridge) API calls');
    },
    get timeoutMs(): number {
      return Number(readEnv(['PROVIDER_BRIDGE_TIMEOUT_MS', 'TRANSBRIDGE_API_TIMEOUT_MS']) || 60000);
    },
  },

  /** BlindPay "online banking" gateway. */
  onlineBanking: {
    get url(): string {
      return stripTrailingSlash(
        requireEnv(['PROVIDER_ONLINE_BANKING_URL', 'NEXT_PUBLIC_ONLINE_BANKING_URL', 'ONLINE_BANKING_URL'], 'BlindPay online-banking API calls'),
      );
    },
    /** Optional: callers send it only when set (or as '' where they always did). */
    get xApiKey(): string | undefined {
      return readEnv(['PROVIDER_ONLINE_BANKING_API_KEY', 'NEXT_PUBLIC_ONLINE_BANKING_X_API_KEY', 'ONLINE_BANKING_X_API_KEY']);
    },
    get timeoutMs(): number {
      return positiveNumber(['PROVIDER_ONLINE_BANKING_TIMEOUT_MS', 'NEXT_PUBLIC_ONLINE_BANKING_TIMEOUT_MS', 'ONLINE_BANKING_TIMEOUT_MS'], 10000);
    },
  },

  blindpay: {
    get apiKey(): string {
      return requireEnv(['PROVIDER_BLINDPAY_API_KEY', 'NEXT_PUBLIC_BLINDPAY_API_KEY'], 'BlindPay API calls');
    },
    get instanceId(): string {
      return requireEnv(['PROVIDER_BLINDPAY_INSTANCE_ID', 'NEXT_PUBLIC_BLINDPAY_INSTANCE_ID'], 'BlindPay API calls');
    },
    /** Svix signing secret ("whsec_<base64>") for POST /webhook. */
    get webhookSecret(): string {
      return requireEnv(['PROVIDER_BLINDPAY_WEBHOOK_SECRET', 'NEXT_PUBLIC_BLINDPAY_WEBHOOK_SECRET'], 'verifying BlindPay webhooks');
    },
  },

  /** Optional fallback receiver id for business clients (when the MSB has no customer_id). */
  get originalTechAccountId(): string {
    return readEnv(['PROVIDER_ORIGINAL_TECH_ACCOUNT_ID', 'ORIGINAL_TECH_ACCOUNT_ID']) ?? '';
  },

  /** Non-throwing summary for debug logging. */
  status() {
    return {
      ONLINE_BANKING_URL: readEnv(['PROVIDER_ONLINE_BANKING_URL', 'NEXT_PUBLIC_ONLINE_BANKING_URL', 'ONLINE_BANKING_URL']),
      BLINDPAY_INSTANCE_ID: readEnv(['PROVIDER_BLINDPAY_INSTANCE_ID', 'NEXT_PUBLIC_BLINDPAY_INSTANCE_ID']),
      BLINDPAY_API_KEY: readEnv(['PROVIDER_BLINDPAY_API_KEY', 'NEXT_PUBLIC_BLINDPAY_API_KEY']) ? 'SET' : 'NOT SET',
    };
  },
};
