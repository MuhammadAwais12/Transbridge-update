import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { brand } from '../../config/brand';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import WalletConnectModal from '../auth/WalletConnectModal';
import { 
  isMetaMaskInstalled, 
  getBrowserSupportInfo, 
  getBrowserInfo 
} from '../../utils/metamaskDetection';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowLeftRight as TransactionsIcon,
  // FileText,
  // Shield,
  // Settings,
  Palette,
  // Globe,
  User,
  Wallet,
  MessageSquare,
  // BarChart3,
  // DollarSign,
  Building2,
  Link,
  Download
} from 'lucide-react';

const msbNavItems = [
  { path: '/msb/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/msb/clients', icon: Users, label: 'Client Management' },
  { path: '/msb/accounts', icon: CreditCard, label: 'Account Management' },
  { path: '/msb/wallets', icon: Wallet, label: 'Wallets Management' },
  { path: '/msb/virtual-accounts', icon: Building2, label: 'Virtual Accounts' },
  { path: '/msb/transactions', icon: TransactionsIcon, label: 'Transaction Management' },
  // { path: '/msb/payments', icon: DollarSign, label: 'Payment Dashboard' },
  // { path: '/msb/compliance', icon: Shield, label: 'Compliance & Reports' },
  { path: '/msb/branding', icon: Palette, label: 'Branding & Customization' },
  // { path: '/msb/domain', icon: Globe, label: 'Domain Management' },
  // { path: '/msb/payment-providers', icon: Globe, label: 'Payment Providers' },
  // { path: '/msb/analytics', icon: BarChart3, label: 'Analytics' },
  // { path: '/msb/settings', icon: Settings, label: 'Settings' },
];

const clientNavItems = [
  { path: '/client/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/client/accounts', icon: Wallet, label: 'My Accounts' },
  { path: '/client/transactions', icon: TransactionsIcon, label: 'Transactions' },
  { path: '/client/transfer', icon: TransactionsIcon, label: 'Transfer Funds' },
  // { path: '/client/statements', icon: Receipt, label: 'Statements' },
  { path: '/client/profile', icon: User, label: 'Profile' },
  { path: '/client/support', icon: MessageSquare, label: 'Support' },
];

export default function Sidebar() {
  const { user, setConnectingWallet, walletError, clearWalletError } = useAuth();
  const { branding, msb } = useBranding();
  const location = useLocation();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);
  const [browserInfo] = useState(getBrowserInfo());

  const navItems = user?.role === 'msb_admin' ? msbNavItems : clientNavItems;

  // Check MetaMask installation status
  useEffect(() => {
    const metaMaskStatus = isMetaMaskInstalled();
    setMetaMaskInstalled(metaMaskStatus);
    
    // Listen for changes to the ethereum object (when MetaMask is installed)
    const handleEthereumChange = () => {
      const newStatus = isMetaMaskInstalled();
      setMetaMaskInstalled(newStatus);
    };
    
    // Listen for the ethereum object to be added to window
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', handleEthereumChange);
      
      // Also check periodically for changes (useful for when user returns from MetaMask installation)
      const interval = setInterval(() => {
        const currentStatus = isMetaMaskInstalled();
        if (currentStatus !== metaMaskInstalled) {
          setMetaMaskInstalled(currentStatus);
        }
      }, 1000);
      
      return () => {
        window.removeEventListener('ethereum#initialized', handleEthereumChange);
        clearInterval(interval);
      };
    }
  }, [metaMaskInstalled]);

  const handleMetaMaskInstall = () => {
    const supportInfo = getBrowserSupportInfo(browserInfo.name);
    
    // For Safari and other unsupported browsers, show a message instead of opening install URL
    if (!supportInfo.supportsWeb3 || !supportInfo.supportsMetaMask) {
      // Show browser compatibility message
      alert(`Browser Compatibility Issue: ${browserInfo.name} doesn't support Web3 wallets.\n\n${supportInfo.recommendation}`);
      return;
    }
    
    // For supported browsers, open the installation URL
    window.open(supportInfo.installUrl, '_blank');
  };

  const handleWalletConnect = () => {
    // Clear any existing wallet error when attempting to connect
    clearWalletError();
    
    if (!metaMaskInstalled) {
      // MetaMask is not installed - show installation prompt
      return;
    }
    
    if (isConnected && user?.wallet_address) {
      // Wallet is connected and registered - show disconnect option
      disconnect();
    } else if (isConnected && !user?.wallet_address) {
      // Wallet is connected but not registered - show registration modal
      setShowWalletModal(true);
    } else {
      // No wallet connected - connect MetaMask
      setConnectingWallet(true);
      connect({ connector: connectors[0] });
      // Reset connecting state after a short delay
      setTimeout(() => setConnectingWallet(false), 2000);
    }
  };

  const handleWalletModalSuccess = () => {
    setShowWalletModal(false);
    // The modal will handle updating the user state
  };

  const getWalletStatus = () => {
    if (!metaMaskInstalled) {
      const supportInfo = getBrowserSupportInfo(browserInfo.name);
      const isUnsupported = !supportInfo.supportsWeb3 || !supportInfo.supportsMetaMask;
      
      return { 
        status: 'not_installed', 
        text: isUnsupported ? 'Browser Not Supported' : 'Install MetaMask', 
        icon: Download, 
        color: 'text-red-600' 
      };
    }
    
    if (!isConnected) {
      return { status: 'disconnected', text: 'Connect MetaMask', icon: Link, color: 'text-gray-600' };
    }
    
    if (isConnected && user?.wallet_address) {
      return { 
        status: 'connected', 
        text: `${address?.slice(0, 6)}...${address?.slice(-4)}`, 
        icon: Wallet, 
        color: 'text-green-600' 
      };
    }
    
    if (isConnected && !user?.wallet_address) {
      return { 
        status: 'needs_registration', 
        text: 'Register Wallet', 
        icon: Link, 
        color: 'text-yellow-600' 
      };
    }
    
    return { status: 'unknown', text: 'Unknown', icon: Link, color: 'text-gray-600' };
  };

  const walletStatus = getWalletStatus();
  const StatusIcon = walletStatus.icon;

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 overflow-hidden"
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={msb?.name || 'MSB Logo'}
                  className="w-full h-full object-contain"
                />
              ) : (
                // Default: official Glacier Crest symbol (static file, never an uploaded/S3 URL)
                <img
                  src={brand.logos.symbol}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {user?.role === 'msb_admin' ? brand.name : msb?.name || brand.name}
              </h2>
              <p className="text-xs text-gray-600">
                {user?.role === 'msb_admin' ? 'MSB Platform' : 'Online Banking'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: branding.primaryColor } : {}}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Wallet Connection Section - Only for clients */}
        {user?.role === 'account_holder' && (
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3">
              <h3 className="text-xs font-medium text-gray-700 mb-2">Wallet Connection</h3>
              <button
                onClick={walletStatus.status === 'not_installed' ? handleMetaMaskInstall : handleWalletConnect}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  walletStatus.status === 'connected'
                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                    : walletStatus.status === 'needs_registration'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                    : walletStatus.status === 'not_installed'
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <StatusIcon className="w-4 h-4" />
                  <span className="truncate">{walletStatus.text}</span>
                </div>
                {walletStatus.status === 'connected' && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
              
              {/* Show MetaMask installation info if not installed */}
              {/* {!metaMaskInstalled && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <div className="mb-2">
                    <strong>MetaMask Required:</strong> You need to install MetaMask to connect your wallet and continue with transfers.
                  </div>
                  <div className="text-xs text-red-600">
                    {(() => {
                      const supportInfo = getBrowserSupportInfo(browserInfo.name);
                      if (!supportInfo.supportsWeb3) {
                        return `Browser Compatibility Issue: Your browser (${browserInfo.name}) doesn't support Web3 wallets. ${supportInfo.recommendation}`;
                      } else if (getCurrentWalletProvider() !== 'None' && getCurrentWalletProvider() !== 'MetaMask') {
                        return `Different Wallet Detected: We detected ${getCurrentWalletProvider()} in your browser. However, this application currently only supports MetaMask.`;
                      } else {
                        return supportInfo.recommendation;
                      }
                    })()}
                  </div>
                  {browserInfo.isMobile && (
                    <div className="mt-1 text-xs text-red-600">
                      <strong>Mobile Device:</strong> On mobile devices, you may need to use the MetaMask mobile app or a mobile browser that supports MetaMask extensions.
                    </div>
                  )}
                </div>
              )} */}
              
              {/* Show network info if connected */}
              {isConnected && chain && (
                <div className="mt-2 text-xs text-gray-500">
                  Network: {chain.name || chain.id}
                </div>
              )}
              
              {/* Show registration status */}
              {isConnected && !user?.wallet_address && (
                <div className="mt-2 text-xs text-yellow-600">
                  Click to register wallet with account
                </div>
              )}
              
              {/* Show wallet error */}
              {walletError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <div className="flex items-start">
                    <div className="flex-1">
                      {walletError}
                    </div>
                    <button
                      onClick={clearWalletError}
                      className="ml-2 text-red-500 hover:text-red-700"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
             </div>
           </div>
         )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} {brand.name}
            <br />
            Version 1.0.0
          </div>
        </div>
      </aside>

      {/* Wallet Connect Modal */}
      {showWalletModal && (
        <WalletConnectModal
          isOpen={showWalletModal}
          onSuccess={handleWalletModalSuccess}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </>
  );
}