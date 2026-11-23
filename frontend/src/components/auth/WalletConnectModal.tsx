import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
// import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'; // TODO: Add WalletConnect support
import { Dialog } from '@headlessui/react';
import { Check, X, Download } from 'lucide-react';
import { linkWallet } from '../../hooks/useDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  isMetaMaskInstalled, 
  getCurrentWalletProvider, 
  getBrowserSupportInfo, 
  getBrowserInfo,
  EthereumProvider
} from '../../utils/metamaskDetection';

/**
 * WalletConnectModal Component
 * 
 * This component provides a comprehensive wallet connection interface that:
 * 1. Detects if MetaMask is installed
 * 2. Identifies browser compatibility issues
 * 3. Detects other wallet providers
 * 4. Provides clear user guidance for different scenarios
 * 5. Handles Safari and mobile-specific cases
 * 
 * Key Features:
 * - Real-time MetaMask detection
 * - Browser-specific error messages
 * - Mobile device guidance
 * - Different wallet provider detection
 * - Clear installation instructions
 */



interface WalletConnectModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}



// Get environment-based supported networks
const getSupportedNetworks = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  console.log('Environment:', environment);
  
  if (environment === 'production') {
    // Production: Allow mainnets and testnets
    return {
      chains: [1, 11155111, 137, 80001, 8453, 84532, 42161, 421614],
      networks: ['base', 'sepolia', 'polygon', 'polygon_amoy', 'base', 'base_sepolia', 'arbitrum', 'arbitrum_sepolia'],
      description: 'Base Sepolia (84532), Polygon Mumbai (80001), Sepolia (11155111), Arbitrum Sepolia (421614), or mainnets'
    };
  } else {
    // Development: Only testnets for safety
    return {
      chains: [11155111, 80001, 84532, 421614], // Only testnets
      networks: ['sepolia', 'polygon_amoy', 'base_sepolia', 'arbitrum_sepolia'],
      description: 'Base Sepolia (84532), Polygon Mumbai (80001), Sepolia (11155111), or Arbitrum Sepolia (421614)'
    };
  }
};

// Map chain IDs to BlindPay network names
const getBlindPayNetwork = (chainId: number): string => {
  const networkMap: { [key: number]: string } = {
    1: 'base', // Ethereum mainnet -> base (BlindPay doesn't support mainnet)
    11155111: 'sepolia', // Sepolia testnet
    137: 'polygon', // Polygon mainnet
    80001: 'polygon_amoy', // Polygon Mumbai testnet -> polygon_amoy
    8453: 'base', // Base mainnet
    84532: 'base_sepolia', // Base Sepolia testnet
    42161: 'arbitrum', // Arbitrum mainnet
    421614: 'arbitrum_sepolia', // Arbitrum Sepolia testnet
  };
  
  console.log('Mapping chain ID', chainId, 'to BlindPay network');
  const network = networkMap[chainId];
  console.log('Mapped to network:', network);
  
  if (!network) {
    throw new Error(`Chain ID ${chainId} is not supported. Please switch to a supported network.`);
  }
  
  return network;
};

export default function WalletConnectModal({ isOpen, onSuccess, onClose }: WalletConnectModalProps) {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { updateUserWallet, setConnectingWallet, walletError, clearWalletError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);
  const [browserInfo] = useState(getBrowserInfo());

  useEffect(() => {
    const metaMaskStatus = isMetaMaskInstalled();
    const walletProvider = getCurrentWalletProvider();
    const browserInfoData = getBrowserInfo();
    
    console.log('WalletConnectModal Debug:', {
      metaMaskInstalled: metaMaskStatus,
      walletProvider,
      browserInfo: browserInfoData,
      browserSupport: getBrowserSupportInfo(browserInfoData.name),
      ethereumAvailable: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    });
    
    setMetaMaskInstalled(metaMaskStatus);
    
    // Clear any existing errors when modal opens
    if (error) {
      setError('');
    }
    
    // Listen for changes to the ethereum object (when MetaMask is installed)
    const handleEthereumChange = () => {
      const newStatus = isMetaMaskInstalled();
      console.log('MetaMask status changed:', newStatus);
      setMetaMaskInstalled(newStatus);
    };
    
    // Listen for the ethereum object to be added to window
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', handleEthereumChange);
      
      // Also check periodically for changes (useful for when user returns from MetaMask installation)
      const interval = setInterval(() => {
        const currentStatus = isMetaMaskInstalled();
        if (currentStatus !== metaMaskInstalled) {
          console.log('MetaMask status updated via interval:', currentStatus);
          setMetaMaskInstalled(currentStatus);
          // Clear any existing errors when MetaMask status changes
          if (currentStatus && error) {
            setError('');
          }
        }
      }, 1000);
      
      return () => {
        window.removeEventListener('ethereum#initialized', handleEthereumChange);
        clearInterval(interval);
      };
    }
  }, [metaMaskInstalled, error, isOpen]);

  const handleMetaMaskInstall = () => {
    const supportInfo = getBrowserSupportInfo(browserInfo.name);
    window.open(supportInfo.installUrl, '_blank');
  };

  const handleConnect = () => {
    if (!metaMaskInstalled) {
      return; // Don't do anything if MetaMask is not installed
    }
    
    if (!connectors || connectors.length === 0) {
      setError('No wallet connectors available. Please refresh the page and try again.');
      return;
    }
    
    // Clear any existing wallet error when attempting to connect
    clearWalletError();
    
    try {
      setConnectingWallet(true);
      connect({ connector: connectors[0] });
      // Reset connecting state after a short delay
      setTimeout(() => setConnectingWallet(false), 2000);
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect to MetaMask. Please try again.');
      setConnectingWallet(false);
    }
  };

  const handleRegister = async () => {
    if (!address) {
      console.log('Missing address:', { address });
      return;
    }
    
    console.log('=== WALLET CONNECTION DEBUG ===');
    console.log('Chain from useAccount:', chain);
    console.log('Chain ID from useAccount:', chain?.id);
    console.log('Window ethereum available:', !!window.ethereum);
    
    // If chain is undefined, try to get it from the wallet
    let chainId = chain?.id;
    if (!chainId) {
      console.log('Chain ID from useAccount is undefined, trying window.ethereum...');
      // Try to get chain from window.ethereum
      if (window.ethereum) {
        try {
          const ethereum = window.ethereum as EthereumProvider;
          if (ethereum.request) {
            const hexChainId = await ethereum.request({ method: 'eth_chainId' });
            chainId = parseInt(hexChainId as string, 16); // Convert hex to decimal
            console.log('Got chain ID from ethereum:', chainId);
          }
        } catch (e) {
          console.error('Failed to get chain ID from ethereum:', e);
        }
      }
    }
    
    console.log('Final chain ID:', chainId);
    console.log('==============================');
    
    // Ensure chainId is a number and is supported
    if (!chainId) {
      console.error('No chain ID available');
      const { description } = getSupportedNetworks();
      setError(`Unable to detect network. Please ensure MetaMask is connected and switch to a supported network: ${description}.`);
      return;
    }
    
    // Check if the chain is supported based on environment
    const { chains, description } = getSupportedNetworks();
    if (!chains.includes(chainId)) {
      console.error('Unsupported chain ID:', chainId);
      setError(`Network not supported in ${import.meta.env.VITE_ENVIRONMENT || 'development'} environment. Please switch to: ${description}.`);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const networkName = getBlindPayNetwork(chainId);
      console.log('Chain ID:', chainId, 'Network Name:', networkName);
      console.log('About to call linkWallet with:', { wallet_address: address, wallet_network: networkName });
      
      const result = await linkWallet({ wallet_address: address, wallet_network: networkName });
      console.log('linkWallet result:', result);
      
      // Update the user state with the new wallet information
      updateUserWallet({
        wallet_address: address,
        wallet_network: networkName,
        blindpay_wallet_id: result.wallet?.blindpay_wallet_id,
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 1000);
    } catch (e: unknown) {
      console.error('linkWallet error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to register wallet. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-8 z-10">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <X className="w-6 h-6" />
        </button>
        <Dialog.Title className="text-xl font-semibold mb-4">Connect Your Wallet</Dialog.Title>
        <p className="mb-4 text-gray-600">To continue, please connect your crypto wallet (MetaMask). This is required for secure banking and transfers.</p>
        
        {/* Environment indicator */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Environment: <span className={`px-2 py-1 rounded text-xs ${import.meta.env.VITE_ENVIRONMENT=== 'production' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {import.meta.env.VITE_ENVIRONMENT || 'development'}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Supported networks: {getSupportedNetworks().description}
          </div>
        </div>
        
        {!isConnected ? (
          <div>
            {metaMaskInstalled ? (
              <button
                className="btn-primary w-full py-3 mb-2"
                onClick={handleConnect}
                type="button"
              >
                Connect MetaMask
              </button>
            ) : (
              <div className="text-center">
                <div className="mb-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Download className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium">MetaMask Not Installed</span>
                  </div>
                  
                  {/* Browser-specific guidance */}
                  <div className="mb-3 text-left">
                    <p className="text-yellow-700 text-sm mb-2">
                      You need to install MetaMask to connect your wallet and continue with transfers.
                    </p>
                    
                    {(() => {
                      const supportInfo = getBrowserSupportInfo(browserInfo.name);
                      
                      if (!supportInfo.supportsWeb3) {
                        return (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <strong>Browser Compatibility Issue:</strong> Your browser ({browserInfo.name}) doesn't support Web3 wallets.
                            <div className="mt-1">
                              {supportInfo.recommendation}
                            </div>
                          </div>
                        );
                      } else if (getCurrentWalletProvider() !== 'None' && getCurrentWalletProvider() !== 'MetaMask') {
                        return (
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                            <strong>Different Wallet Detected:</strong> We detected {getCurrentWalletProvider()} in your browser. 
                            However, this application currently only supports MetaMask. Please install MetaMask to continue.
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            <strong>Browser Support:</strong> {supportInfo.recommendation}
                          </div>
                        );
                      }
                    })()}
                    
                    {browserInfo.isMobile && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                        <strong>Mobile Device:</strong> On mobile devices, you may need to use the MetaMask mobile app 
                        or a mobile browser that supports MetaMask extensions.
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="btn-primary w-full py-3"
                    onClick={handleMetaMaskInstall}
                    type="button"
                  >
                    <Download className="mr-2 h-4 w-4 inline" />
                    Install MetaMask for {browserInfo.name}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  After installing, refresh this page and try connecting again.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">Network: {chain?.name || chain?.id || 'Unknown'} ({getBlindPayNetwork(chain?.id || 0)})</div>
            <button 
              className="btn-secondary w-full mb-2" 
              onClick={() => disconnect()}
              type="button"
            >
              Disconnect
            </button>
            <button
              className="btn-primary w-full"
              onClick={handleRegister}
              disabled={loading}
              type="button"
            >
              {loading ? 'Registering...' : 'Register Wallet'}
            </button>
          </div>
        )}
                 {success && <div className="text-green-600 text-center mt-2">Wallet registered successfully!</div>}
         {error && <div className="text-error-500 text-center mt-2">{error}</div>}
         {walletError && <div className="text-red-600 text-center mt-2">{walletError}</div>}
        <div className="mt-4 text-xs text-gray-400 text-center">
          {/* TODO: Add WalletConnect support for Trust Wallet, etc. */}
          Only MetaMask is supported for now.
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}