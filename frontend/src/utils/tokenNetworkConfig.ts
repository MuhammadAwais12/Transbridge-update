// Token and Network Configuration Utility
// This utility determines the appropriate token and network based on the client's wallet and environment

export interface TokenNetworkConfig {
  token: string;
  network: string;
}

// Environment-based token configuration
const getEnvironmentTokens = (environment: string): string[] => {
  if (environment === 'production') {
    return ['USDC', 'USDT']; // Production tokens
  } else {
    return ['USDC', 'USDT']; // Development tokens (same as production for now)
  }
};

// Network mapping based on wallet network and environment
const getNetworkMapping = (walletNetwork: string, environment: string): string => {
  const networkMap: { [key: string]: { [key: string]: string } } = {
    development: {
      'base_sepolia': 'base_sepolia',
      'polygon_amoy': 'polygon_amoy', 
      'arbitrum_sepolia': 'arbitrum_sepolia',
      'sepolia': 'sepolia',
      'stellar_testnet': 'stellar_testnet'
    },
    production: {
      'base': 'base',
      'polygon': 'polygon',
      'arbitrum': 'arbitrum', 
      'ethereum': 'ethereum',
      'stellar': 'stellar'
    }
  };

  return networkMap[environment]?.[walletNetwork] || walletNetwork;
};

// Default token selection based on environment
const getDefaultToken = (environment: string): string => {
  if (environment === 'production') {
    return 'USDC'; // Default to USDC in production
  } else {
    return 'USDC'; // Default to USDC in development
  }
};

// Main function to get token and network configuration
export const getTokenNetworkConfig = (
  walletNetwork?: string,
  environment?: string
): TokenNetworkConfig => {
  const env = environment || 'development';
  const network = walletNetwork || 'base_sepolia'; // Default fallback
  
  // Map the wallet network to the appropriate BlindPay network
  const mappedNetwork = getNetworkMapping(network, env);
  
  // Get the default token for the environment
  const token = getDefaultToken(env);
  
  console.log('Token/Network Configuration:', {
    walletNetwork,
    environment: env,
    mappedNetwork,
    token,
    availableTokens: getEnvironmentTokens(env)
  });
  
  return {
    token,
    network: mappedNetwork
  };
};

// Function to validate if a token is supported in the current environment
export const isTokenSupported = (token: string, environment?: string): boolean => {
  const env = environment || 'development';
  const supportedTokens = getEnvironmentTokens(env);
  return supportedTokens.includes(token.toUpperCase());
};

// Function to validate if a network is supported in the current environment
export const isNetworkSupported = (network: string, environment?: string): boolean => {
  const env = environment || 'development';
  const networkMap: { [key: string]: string[] } = {
    development: ['base_sepolia', 'polygon_amoy', 'arbitrum_sepolia', 'sepolia', 'stellar_testnet'],
    production: ['base', 'polygon', 'arbitrum', 'ethereum', 'stellar']
  };
  
  return networkMap[env]?.includes(network) || false;
}; 