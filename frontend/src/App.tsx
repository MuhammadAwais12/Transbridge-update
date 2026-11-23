import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { WagmiProvider } from './components/providers/WagmiProvider';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/common/Layout';

// MSB Components
import MSBDashboard from './components/msb/Dashboard';
import BrandingCustomization from './components/msb/BrandingCustomization';
import ClientManagement from './components/msb/ClientManagement';
import TransactionManagement from './components/msb/TransactionManagement';
import AccountManagement from './components/msb/AccountManagement';
import ComplianceReporting from './components/msb/ComplianceReporting';
import AdvancedAnalytics from './components/msb/AdvancedAnalytics';
import PaymentProviderSettings from './components/msb/PaymentProviderSettings';
import PaymentDashboard from './components/msb/PaymentDashboard';
import WalletsManagement from './components/msb/WalletsManagement';
import VirtualAccountManagement from './components/msb/VirtualAccountManagement';

// Client Components
import ClientDashboard from './components/client/Dashboard';
import ClientAccountManagement from './components/client/AccountManagement';
import TransactionHistory from './components/client/TransactionHistory';
import TransferMoney from './components/client/TransferMoney';
import Statements from './components/client/Statements';
import KYCOnboarding from './components/client/KYCOnboarding';
import Profile from './components/client/Profile';
import Support from './components/client/Support';

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        {user.role === 'msb_admin' ? (
          <>
            <Route path="/msb/dashboard" element={<MSBDashboard />} />
            <Route path="/msb/clients" element={<ClientManagement />} />
            <Route path="/msb/accounts" element={<AccountManagement />} />
            <Route path="/msb/wallets" element={<WalletsManagement />} />
            <Route path="/msb/virtual-accounts" element={<VirtualAccountManagement />} />
            <Route path="/msb/transactions" element={<TransactionManagement />} />
            <Route path="/msb/compliance" element={<ComplianceReporting />} />
            <Route path="/msb/branding" element={<BrandingCustomization />} />
            <Route path="/msb/domain" element={<div className="text-center py-12 text-gray-600">Domain Management - Coming Soon</div>} />
            <Route path="/msb/payments" element={<PaymentDashboard />} />
            <Route path="/msb/payment-providers" element={<PaymentProviderSettings />} />
            <Route path="/msb/analytics" element={<AdvancedAnalytics />} />
            <Route path="/msb/settings" element={<div className="text-center py-12 text-gray-600">Settings - Coming Soon</div>} />
            <Route path="*" element={<Navigate to="/msb/dashboard" replace />} />
          </>
        ) : (
          <>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/accounts" element={<ClientAccountManagement />} />
            <Route path="/client/transactions" element={<TransactionHistory />} />
            <Route path="/client/transfer" element={<TransferMoney />} />
            <Route path="/client/statements" element={<Statements />} />
            <Route path="/client/profile" element={<Profile />} />
            <Route path="/client/support" element={<Support />} />
            <Route path="/client/kyc" element={<KYCOnboarding />} />
            <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <WagmiProvider>
      <AuthProvider>
        <BrandingProvider>
          <Router>
            <AppRoutes />
          </Router>
        </BrandingProvider>
      </AuthProvider>
    </WagmiProvider>
  );
}