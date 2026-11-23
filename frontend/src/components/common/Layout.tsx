import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import WalletConnectModal from '../auth/WalletConnectModal';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, passwordChanged } = useAuth();
  const { msb } = useBranding();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Check if user needs to change password on first login
  useEffect(() => {
    if (user && user.role === 'account_holder' && user.passwordChanged === false) {
      setShowPasswordModal(true);
    }
  }, [user]);

  // Show wallet connect modal if wallet is not linked (only for transfer functionality)
  useEffect(() => {
    if (user && user.role === 'account_holder' && !user.wallet_address) {
      // Don't force wallet connection on login - let users access other features
      setShowWalletModal(false);
    } else {
      setShowWalletModal(false);
    }
  }, [user]);

  const handleWalletLinkSuccess = () => {
    window.location.reload(); // Simple approach for now
  };

  if (!user) return null;

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() =>  setShowPasswordModal(false)}
        onSuccess={passwordChanged}
      />
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletLinkSuccess}
      />
    </>
  );
}