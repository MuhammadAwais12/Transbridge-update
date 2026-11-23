// Type for ethereum provider
export interface EthereumProvider {
  isMetaMask?: boolean;
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  if (typeof window !== 'undefined') {
    // Check if ethereum object exists and is specifically MetaMask
    if (typeof window.ethereum !== 'undefined') {
      // Check if it's specifically MetaMask
      if (window.ethereum.isMetaMask === true) {
        return true;
      }
      
      // Check for legacy MetaMask detection
      if ((window.ethereum as EthereumProvider).isMetaMask === true) {
        return true;
      }
      
      // Check if it's a different wallet provider (not MetaMask)
      if (window.ethereum.isMetaMask === false) {
        return false; // It's a different wallet
      }
    }
  }
  return false;
};

// Check what wallet provider is currently available
export const getCurrentWalletProvider = (): string => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    if (window.ethereum.isMetaMask === true) {
      return 'MetaMask';
    } else if (window.ethereum.isMetaMask === false) {
      // It's a different wallet provider
      const ethereum = window.ethereum as EthereumProvider & {
        isCoinbaseWallet?: boolean;
        isTrust?: boolean;
        isBraveWallet?: boolean;
        isPhantom?: boolean;
      };
      if (ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
      if (ethereum.isTrust) return 'Trust Wallet';
      if (ethereum.isBraveWallet) return 'Brave Wallet';
      if (ethereum.isPhantom) return 'Phantom';
      return 'Other Wallet';
    }
  }
  return 'None';
};

// Check if the browser supports Web3/ethereum
export const isWeb3Supported = (): boolean => {
  if (typeof window !== 'undefined') {
    // Check if ethereum object exists (any wallet provider)
    if (typeof window.ethereum !== 'undefined') {
      return true;
    }
    
    // Check for legacy Web3 support
    if (typeof (window as { web3?: unknown }).web3 !== 'undefined') {
      return true;
    }
  }
  return false;
};

// Get detailed browser support information
export const getBrowserSupportInfo = (browserName: string): { 
  supportsWeb3: boolean; 
  supportsMetaMask: boolean; 
  recommendation: string;
  installUrl: string;
} => {
  switch (browserName) {
    case 'Chrome':
      return {
        supportsWeb3: true,
        supportsMetaMask: true,
        recommendation: 'Chrome has excellent Web3 support. Install MetaMask extension from the Chrome Web Store.',
        installUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
      };
    case 'Chromium':
      return {
        supportsWeb3: true,
        supportsMetaMask: true,
        recommendation: 'Chromium has excellent Web3 support. Install MetaMask extension from the Chrome Web Store.',
        installUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
      };
    case 'Firefox':
      return {
        supportsWeb3: true,
        supportsMetaMask: true,
        recommendation: 'Firefox has excellent Web3 support. Install MetaMask extension from Firefox Add-ons.',
        installUrl: 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/'
      };
    case 'Brave':
      return {
        supportsWeb3: true,
        supportsMetaMask: true,
        recommendation: 'Brave has excellent Web3 support. Install MetaMask extension from the Chrome Web Store.',
        installUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
      };
    case 'Edge':
      return {
        supportsWeb3: true,
        supportsMetaMask: true,
        recommendation: 'Edge has good Web3 support. Install MetaMask extension from the Microsoft Edge Add-ons.',
        installUrl: 'https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm'
      };
    case 'Opera':
      return {
        supportsWeb3: true,
        supportsMetaMask: true,
        recommendation: 'Opera has good Web3 support. Install MetaMask extension from the Chrome Web Store.',
        installUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
      };
    case 'Safari':
      return {
        supportsWeb3: false,
        supportsMetaMask: false,
        recommendation: 'Safari has limited Web3 support. Consider using Chrome, Firefox, or Edge for better Web3 functionality.',
        installUrl: 'https://metamask.io/download/'
      };
    case 'Internet Explorer':
      return {
        supportsWeb3: false,
        supportsMetaMask: false,
        recommendation: 'Internet Explorer is not supported for Web3 applications. Please upgrade to a modern browser like Chrome, Firefox, or Edge.',
        installUrl: 'https://metamask.io/download/'
      };
    default:
      return {
        supportsWeb3: false,
        supportsMetaMask: false,
        recommendation: 'Your browser may have limited Web3 support. Consider using Chrome, Firefox, or Edge.',
        installUrl: 'https://metamask.io/download/'
      };
  }
};

// Get browser information for better user guidance
export const getBrowserInfo = (): { name: string; supportsWeb3: boolean; isMobile: boolean; isSafari: boolean } => {
  if (typeof navigator === 'undefined') {
    return { name: 'Unknown', supportsWeb3: false, isMobile: false, isSafari: false };
  }
  
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  let browserName = 'Unknown';
  let isSafari = false;
  
  // More robust browser detection - check in order of specificity
  if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
    browserName = 'Opera';
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    isSafari = true;
  } else if (userAgent.includes('Chrome')) {
    // Check if it's Brave (Brave includes "Chrome" but also "Brave")
    if (userAgent.includes('Brave')) {
      browserName = 'Brave';
    } else if (userAgent.includes('Chromium')) {
      browserName = 'Chromium';
    } else {
      browserName = 'Chrome';
    }
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browserName = 'Internet Explorer';
  }
  
  return {
    name: browserName,
    supportsWeb3: isWeb3Supported(),
    isMobile,
    isSafari
  };
}; 