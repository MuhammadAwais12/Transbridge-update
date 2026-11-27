import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { API_BASE_URL } from '../lib/apiBase';
import { useDisconnect, useAccount } from 'wagmi';
import {
  clearSession,
  getAuthToken,
  getStoredUser,
  getTokenExpiry,
  setAuthToken,
  setStoredUser,
} from '../lib/auth';

// Refresh this long before the access token expires.
const REFRESH_LEAD_MS = 5 * 60 * 1000;

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: 'msb' | 'client') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  loginError: string | null;
  clearLoginError: () => void;
  updateUserWallet: (walletData: { wallet_address: string; wallet_network: string; blindpay_wallet_id?: string }) => void;
  setConnectingWallet: (connecting: boolean) => void;
  walletError: string | null;
  setWalletError: (error: string | null) => void;
  clearWalletError: () => void;
  passwordChanged: () => void;
  clientId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const { disconnect: disconnectWallet } = useDisconnect();
  const { address: connectedAddress, isConnected } = useAccount();

  useEffect(() => {
    // Sessions are tab-scoped; drop anything older builds left in localStorage.
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    const storedToken = getAuthToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure the user object has the correct structure when loaded from localStorage
        setUser({
          id: parsedUser.id,
          email: parsedUser.email,
          name: parsedUser.name,
          role: parsedUser.role,
          msbId: parsedUser.msb_id || parsedUser.msbId, // Handle both formats
          isActive: parsedUser.is_active || parsedUser.isActive,
          createdAt: parsedUser.created_at || parsedUser.createdAt,
          lastLogin: parsedUser.last_login || parsedUser.lastLogin,
          clientId: parsedUser.clientId,
          passwordChanged: parsedUser.password_changed || parsedUser.passwordChanged,
          wallet_address: parsedUser.wallet_address,
          wallet_network: parsedUser.wallet_network,
          blindpay_wallet_id: parsedUser.blindpay_wallet_id,
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        clearSession();
      }
    } else {
      clearSession();
    }
    setIsLoading(false);
  }, []);

  // Validate wallet connection matches user account
  useEffect(() => {
    if (user && isConnected && connectedAddress && !isConnectingWallet) {
      // Only validate if user has a registered wallet
      if (user.wallet_address) {
        // If user has a registered wallet, check if it matches the connected wallet
        if (user.wallet_address.toLowerCase() !== connectedAddress.toLowerCase()) {
          console.warn('Connected wallet does not match user account. Disconnecting wallet.');
          setWalletError(`The wallet you connected (${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}) is not the registered wallet for this account. Please connect the correct wallet or contact support.`);
          disconnectWallet();
        } else {
          // Clear any existing wallet error if the wallet matches
          setWalletError(null);
        }
      } else {
        // Clear any existing wallet error if user doesn't have a registered wallet
        setWalletError(null);
      }
      // If user doesn't have a registered wallet, allow the connection to persist
      // This allows users to connect MetaMask and then register their wallet
    }
  }, [user, isConnected, connectedAddress, disconnectWallet, isConnectingWallet]);

  // Keep an active session alive: swap the token for a fresh one shortly before it expires.
  // The backend caps the whole session at 12 hours, after which the user logs in again.
  useEffect(() => {
    if (!user) return;
    const endpoint =
      user.role === 'msb_admin' ? '/msb-admin/refresh-token' : '/client/refresh-token';
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const schedule = () => {
      const token = getAuthToken();
      const exp = token ? getTokenExpiry(token) : null;
      if (!exp) return;
      const delay = Math.max(exp * 1000 - Date.now() - REFRESH_LEAD_MS, 0);
      timer = setTimeout(refresh, delay);
    };

    const refresh = async () => {
      const token = getAuthToken();
      if (!token || cancelled) return;
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          if (typeof data?.token === 'string') setAuthToken(data.token);
          schedule();
        } else if (response.status === 401) {
          // Session revoked or past its 12-hour limit.
          setUser(null);
          clearSession();
        } else {
          timer = setTimeout(refresh, 60 * 1000);
        }
      } catch {
        // Network blip: try again shortly; the token may still be valid.
        if (!cancelled) timer = setTimeout(refresh, 60 * 1000);
      }
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user?.id, user?.role]);

  const login = async (email: string, password: string, userType: 'msb' | 'client'): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      let endpoint = userType === 'msb' ? '/msb-admin/login' : '/client/login';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Login failed';
        if (response.status === 400) {
          if (data.message && Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else if (data.message) {
            errorMessage = data.message;
          }
        } else if (response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (response.status === 404) {
          errorMessage = 'User not found';
        } else if (response.status === 422) {
          errorMessage = 'Invalid input data';
        } else {
          errorMessage = data.message || 'Login failed';
        }
        setLoginError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Check if there's a connected wallet that doesn't match the user's registered wallet
      if (isConnected && connectedAddress && data.user.wallet_address) {
        if (connectedAddress.toLowerCase() !== data.user.wallet_address.toLowerCase()) {
          console.warn('Connected wallet does not match user account. Disconnecting wallet.');
          disconnectWallet();
        }
      }

      // Only set user state on successful login
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: userType === 'msb' ? 'msb_admin' : 'account_holder',
        msbId: data.user.msb_id,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        clientId: userType === 'client' && data.client ? data.client.id : undefined,
        passwordChanged: data.user.password_changed,
        wallet_address: data.user.wallet_address,
        wallet_network: data.user.wallet_network,
        blindpay_wallet_id: data.user.blindpay_wallet_id,
      });
      setStoredUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        msbId: data.user.msb_id,
        isActive: data.user.is_active,
        createdAt: data.user.created_at,
        lastLogin: data.user.last_login,
        clientId: userType === 'client' && data.client ? data.client.id : undefined,
        passwordChanged: data.user.password_changed,
        wallet_address: data.user.wallet_address,
        wallet_network: data.user.wallet_network,
        blindpay_wallet_id: data.user.blindpay_wallet_id,
      });
      setAuthToken(data.token);

      setLoginError(null);
      return { success: true };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setLoginError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    const token = getAuthToken();
    if (token && user) {
      const endpoint =
        user.role === 'msb_admin' ? '/msb-admin/logout' : '/client/logout';
      void fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      }).catch((logoutError) => {
        console.error('Failed to revoke server session during logout:', logoutError);
      });
    }

    // Disconnect wallet first to prevent wallet persistence across accounts
    disconnectWallet();
    
    // Clear user state and stored session
    setUser(null);
    clearSession();
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const updateUserWallet = (walletData: { wallet_address: string; wallet_network: string; blindpay_wallet_id?: string }) => {
    if (user) {
      const updatedUser = {
        ...user,
        wallet_address: walletData.wallet_address,
        wallet_network: walletData.wallet_network,
        blindpay_wallet_id: walletData.blindpay_wallet_id,
      };
      setUser(updatedUser);
      setStoredUser(updatedUser);
    }
  };

  const setConnectingWallet = (connecting: boolean) => {
    setIsConnectingWallet(connecting);
  };

  const clearWalletError = () => {
    setWalletError(null);
  };

  
  const passwordChanged = () => {
     if (user) {
      const updatedUser = {
        ...user,
        passwordChanged: true,
      };
      setUser(updatedUser);
      setStoredUser(updatedUser);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, loginError, clearLoginError, updateUserWallet,
      setConnectingWallet,
      walletError,
      setWalletError,
      clearWalletError, passwordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}