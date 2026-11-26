import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Building2, User } from 'lucide-react';
import { brand } from '../../config/brand';

// Demo credentials with proper MSB relationships
const STATIC_DEMO_CREDENTIALS = [
  {
    email: 'admin@fintechsolutions.com',
    name: 'John Smith',
    user_type: 'msb_admin',
    company_name: 'FinTech Solutions Ltd',
    company_domain: 'banking.fintechsolutions.com',
    password_hint: 'demo123',
    description: '3 clients, 3 accounts, active transactions'
  },
  {
    email: 'admin@securebank.pro',
    name: 'David Chen',
    user_type: 'msb_admin',
    company_name: 'SecureBank Pro',
    company_domain: 'app.securebank.pro',
    password_hint: 'demo123',
    description: '1 client, 1 account, investment focused'
  },
  {
    email: 'sarah.johnson@email.com',
    name: 'Sarah Johnson',
    user_type: 'client',
    company_name: 'FinTech Solutions Ltd',
    company_domain: 'banking.fintechsolutions.com',
    password_hint: 'demo123',
    description: 'Software Engineer, 2 accounts, recent activity'
  },
  {
    email: 'michael.chen@business.com',
    name: 'Michael Chen',
    user_type: 'client',
    company_name: 'FinTech Solutions Ltd',
    company_domain: 'banking.fintechsolutions.com',
    password_hint: 'demo123',
    description: 'Business Owner, pending approval transaction'
  },
  {
    email: 'emma.rodriguez@gmail.com',
    name: 'Emma Rodriguez',
    user_type: 'client',
    company_name: 'FinTech Solutions Ltd',
    company_domain: 'banking.fintechsolutions.com',
    password_hint: 'demo123',
    description: 'Marketing Manager, KYC pending'
  },
  {
    email: 'robert.davis@finance.com',
    name: 'Robert Davis',
    user_type: 'client',
    company_name: 'FinTech Solutions Ltd',
    company_domain: 'app.securebank.pro',
    password_hint: 'demo123',
    description: 'Financial Analyst, premium account'
  }
];

export default function LoginForm() {
  const { login, loginError, clearLoginError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'msb' as 'msb' | 'client',
    showPassword: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const [allCredentials, setAllCredentials] = useState(STATIC_DEMO_CREDENTIALS);

  // Monitor error state changes
  useEffect(() => {
    // Error state is now working correctly, no need for debug logs
  }, [loginError]);

  // Load dynamic credentials on component mount and when localStorage changes
  useEffect(() => {
    const loadCredentials = () => {
      const dynamicCredentials = JSON.parse(localStorage.getItem('demo_credentials') || '[]');
      const combined = [...STATIC_DEMO_CREDENTIALS, ...dynamicCredentials];
      
      // Remove duplicates based on email
      const unique = combined.filter((cred, index, self) => 
        index === self.findIndex(c => c.email === cred.email)
      );
      
      setAllCredentials(unique);
    };

    loadCredentials();

    // Listen for storage changes to update credentials in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo_credentials') {
        loadCredentials();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when credentials are updated in the same tab
    const handleCredentialsUpdate = () => {
      loadCredentials();
    };
    
    window.addEventListener('credentialsUpdated', handleCredentialsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('credentialsUpdated', handleCredentialsUpdate);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    setFieldErrors({ email: '', password: '' });
    setIsLoading(true);

    // Field-level validation
    let hasFieldErrors = false;
    const newFieldErrors = { email: '', password: '' };

    if (!formData.email.trim()) {
      newFieldErrors.email = 'Email is required';
      hasFieldErrors = true;
    } else if (formData.email.length > 254) {
      newFieldErrors.email = 'Email must not be longer than 254 characters';
      hasFieldErrors = true;
    }

    if (!formData.password.trim()) {
      newFieldErrors.password = 'Password is required';
      hasFieldErrors = true;
    } else if (formData.password.length < 6) {
      newFieldErrors.password = 'Password must be at least 6 characters';
      hasFieldErrors = true;
    } else if (formData.password.length > 128) {
      newFieldErrors.password = 'Password must not be longer than 128 characters';
      hasFieldErrors = true;
    }

    if (hasFieldErrors) {
      setFieldErrors(newFieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(formData.email.toLowerCase(), formData.password, formData.userType);
      
      if (!result.success) {
        // Error is handled by AuthContext, no need to do anything here
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }));
    }
    
    // Clear login error when user starts typing
    if (loginError) {
      clearLoginError();
    }
  };

  const handleCredentialClick = (credential: typeof allCredentials[0]) => {
    setFormData(prev => ({
      ...prev,
      email: credential.email,
      password: credential.password_hint,
      userType: credential.user_type === 'msb_admin' ? 'msb' : 'client'
    }));
  };

  const msbCredentials = allCredentials.filter(c => c.user_type === 'msb_admin');
  const clientCredentials = allCredentials.filter(c => c.user_type === 'client');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Official Glacier Crest vertical logo (full colour, for light backgrounds) */}
            <img
              src={brand.logos.vertical}
              alt={brand.name}
              className="mx-auto h-28 w-auto mb-4"
            />
            <h1 className="sr-only">{brand.name}</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* User Type Selector */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, userType: 'msb' }))}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formData.userType === 'msb'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>MSB Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, userType: 'client' }))}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formData.userType === 'client'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Client</span>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${fieldErrors.email ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="text-error-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={formData.showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pr-10 ${fieldErrors.password ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {formData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-error-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In Securely'}
            </button>
          </form>

          {/* Security Notice */}
          {/* <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Protected by bank-level encryption and multi-factor authentication
            </p>
          </div> */}
        </div>

      
    </div>
  );
}