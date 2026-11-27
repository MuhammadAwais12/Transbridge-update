// Configuration for payment API providers

import { PaymentProvider } from './types';

// Provider credentials and webhook secrets live in the backend only (never in the browser bundle).

// Base configuration for providers
export const providers: Record<string, PaymentProvider> = {
  bridge: {
    name: 'Bridge',
    isActive: false,
    baseUrl: 'https://api.bridge.xyz/v1',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    supportedCountries: ['US', 'CA', 'GB', 'EU', 'AU', 'JP'],
    webhookUrl: `${window.location.origin}/api/webhooks/bridge`
  },
  blindpay: {
    name: 'BlindPay',
    isActive: false,
    baseUrl: 'https://api.blindpay.com/v1',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedCountries: ['US', 'CA', 'GB', 'EU'],
    webhookUrl: `${window.location.origin}/api/webhooks/blindpay`
  },
  routefusion: {
    name: 'Routefusion',
    isActive: false,
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