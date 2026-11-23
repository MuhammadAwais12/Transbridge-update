// Configuration for payment API providers

import { PaymentProvider } from './types';

// Environment variables would be used in production
const BRIDGE_API_KEY = import.meta.env.VITE_BRIDGE_API_KEY || '';
const BRIDGE_API_SECRET = import.meta.env.VITE_BRIDGE_API_SECRET || '';
const BLINDPAY_API_KEY = import.meta.env.NEXT_PUBLIC_BLINDPAY_API_KEY || '';
const BLINDPAY_API_SECRET = import.meta.env.NEXT_PUBLIC_BLINDPAY_API_SECRET || '';
const ROUTEFUSION_API_KEY = import.meta.env.NEXT_PUBLIC_ROUTEFUSION_API_KEY || '';
const ROUTEFUSION_API_SECRET = import.meta.env.NEXT_PUBLIC_ROUTEFUSION_API_SECRET || '';

// Base configuration for providers
export const providers: Record<string, PaymentProvider> = {
  bridge: {
    name: 'Bridge',
    isActive: false, // Set to true when API keys are configured
    apiKey: BRIDGE_API_KEY,
    apiSecret: BRIDGE_API_SECRET,
    baseUrl: 'https://api.bridge.xyz/v1',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    supportedCountries: ['US', 'CA', 'GB', 'EU', 'AU', 'JP'],
    webhookUrl: `${window.location.origin}/api/webhooks/bridge`
  },
  blindpay: {
    name: 'BlindPay',
    isActive: false, // Set to true when API keys are configured
    apiKey: BLINDPAY_API_KEY,
    apiSecret: BLINDPAY_API_SECRET,
    baseUrl: 'https://api.blindpay.com/v1',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedCountries: ['US', 'CA', 'GB', 'EU'],
    webhookUrl: `${window.location.origin}/api/webhooks/blindpay`
  },
  routefusion: {
    name: 'Routefusion',
    isActive: false, // Set to true when API keys are configured
    apiKey: ROUTEFUSION_API_KEY,
    apiSecret: ROUTEFUSION_API_SECRET,
    baseUrl: 'https://api.routefusion.co/v1',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN'],
    supportedCountries: ['US', 'CA', 'GB', 'EU', 'AU', 'MX'],
    webhookUrl: `${window.location.origin}/api/webhooks/routefusion`
  }
};

// Default provider selection logic
export const getDefaultProvider = (currency: string, destinationCountry?: string): string => {
  // This would be more sophisticated in production, considering:
  // - Provider availability
  // - Fees for specific routes
  // - Speed requirements
  // - Regulatory considerations
  
  // Simple logic for now
  if (currency === 'USD' && (!destinationCountry || destinationCountry === 'US')) {
    return 'bridge';
  } else if (['EUR', 'GBP'].includes(currency)) {
    return 'blindpay';
  } else {
    return 'routefusion';
  }
};

// Configuration for webhook verification
export const webhookSecrets = {
  bridge: import.meta.env.VITE_BRIDGE_WEBHOOK_SECRET || '',
  blindpay: import.meta.env.NEXT_PUBLIC_BLINDPAY_WEBHOOK_SECRET || '',
  routefusion: import.meta.env.VITE_ROUTEFUSION_WEBHOOK_SECRET || ''
};