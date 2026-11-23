import React from 'react';
import { Dialog } from '@headlessui/react';
import { Download, X, AlertTriangle, CheckCircle, Globe, Smartphone } from 'lucide-react';
import { 
  getBrowserSupportInfo, 
  getBrowserInfo,
  getCurrentWalletProvider
} from '../../utils/metamaskDetection';

interface MetaMaskInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MetaMaskInstallModal({ isOpen, onClose }: MetaMaskInstallModalProps) {
  const browserInfo = getBrowserInfo();
  const supportInfo = getBrowserSupportInfo(browserInfo.name);
  const currentWalletProvider = getCurrentWalletProvider();

  const handleInstall = () => {
    if (supportInfo.supportsWeb3 && supportInfo.supportsMetaMask) {
      window.open(supportInfo.installUrl, '_blank');
    }
  };

  const getInstallButtonText = () => {
    if (!supportInfo.supportsWeb3) {
      return 'Browser Not Supported';
    }
    if (!supportInfo.supportsMetaMask) {
      return 'View Alternatives';
    }
    return `Install MetaMask for ${browserInfo.name}`;
  };

  const getInstallButtonDisabled = () => {
    return !supportInfo.supportsWeb3 || !supportInfo.supportsMetaMask;
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
        
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Download className="w-8 h-8 text-yellow-600" />
          </div>
          <Dialog.Title className="text-xl font-semibold mb-2">MetaMask Required</Dialog.Title>
          <p className="text-gray-600">
            To continue with transfers, you need to install MetaMask wallet extension.
          </p>
        </div>

        {/* Browser-specific guidance */}
        <div className="mb-6">
          {!supportInfo.supportsWeb3 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Browser Compatibility Issue</h4>
                  <p className="text-red-700 text-sm mb-2">
                    Your browser ({browserInfo.name}) doesn't support Web3 wallets.
                  </p>
                  <p className="text-red-600 text-xs">
                    {supportInfo.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ) : !supportInfo.supportsMetaMask ? (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-1">Limited MetaMask Support</h4>
                  <p className="text-orange-700 text-sm mb-2">
                    {browserInfo.name} has limited support for MetaMask.
                  </p>
                  <p className="text-orange-600 text-xs">
                    {supportInfo.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ) : currentWalletProvider !== 'None' && currentWalletProvider !== 'MetaMask' ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Globe className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Different Wallet Detected</h4>
                  <p className="text-blue-700 text-sm mb-2">
                    We detected {currentWalletProvider} in your browser.
                  </p>
                  <p className="text-blue-600 text-xs">
                    However, this application currently only supports MetaMask. Please install MetaMask to continue.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Browser Supported</h4>
                  <p className="text-green-700 text-sm">
                    {supportInfo.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile device guidance */}
        {browserInfo.isMobile && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <Smartphone className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-orange-800 mb-1">Mobile Device</h4>
                <p className="text-orange-700 text-sm">
                  On mobile devices, you may need to use the MetaMask mobile app or a mobile browser that supports MetaMask extensions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Installation steps */}
        {supportInfo.supportsWeb3 && supportInfo.supportsMetaMask && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Installation Steps:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                <span>Click the "Install MetaMask" button below</span>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                <span>Follow the installation instructions on the official MetaMask page</span>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                <span>Return to this page and refresh to connect your wallet</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleInstall}
            disabled={getInstallButtonDisabled()}
            className={`btn-primary flex-1 flex items-center justify-center ${
              getInstallButtonDisabled() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            type="button"
          >
            <Download className="w-4 h-4 mr-2" />
            {getInstallButtonText()}
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          After installing, refresh this page and try connecting again.
        </div>
      </Dialog.Panel>
    </Dialog>
  );
} 