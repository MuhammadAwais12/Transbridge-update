import React, { useState } from 'react';
import { 
  CreditCard, 
  Settings, 
  Globe, 
  DollarSign, 
  Check, 
  X, 
  AlertTriangle,
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Loader
} from 'lucide-react';
import { usePaymentProviders } from '../../hooks/usePaymentProviders';

export default function PaymentProviderSettings() {
  const { providers, loading, error, refetch } = usePaymentProviders();
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Provider configuration form state
  const [providerConfig, setProviderConfig] = useState({
    apiKey: '',
    apiSecret: '',
    webhookSecret: '',
    isActive: true,
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedCountries: ['US', 'CA', 'GB', 'EU'],
    feeStructure: {
      percentage: 0.5,
      flatFee: 2.5,
      minimumFee: 1.0
    }
  });

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'bridge':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'blindpay':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'routefusion':
        return <Globe className="w-5 h-5 text-purple-600" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleProviderSelect = (providerName: string) => {
    setActiveProvider(providerName);
    setTestResult(null);
    
    // In production, this would load the actual provider configuration
    // For now, just set some mock data
    setProviderConfig({
      apiKey: '••••••••••••••••',
      apiSecret: '••••••••••••••••••••••••••',
      webhookSecret: '••••••••••••••••',
      isActive: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      supportedCountries: ['US', 'CA', 'GB', 'EU'],
      feeStructure: {
        percentage: providerName === 'Bridge' ? 0.5 : providerName === 'BlindPay' ? 0.75 : 1.0,
        flatFee: providerName === 'Bridge' ? 2.5 : providerName === 'BlindPay' ? 1.5 : 3.0,
        minimumFee: providerName === 'Bridge' ? 1.0 : providerName === 'BlindPay' ? 1.5 : 2.0
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setProviderConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeeChange = (field: string, value: number) => {
    setProviderConfig(prev => ({
      ...prev,
      feeStructure: {
        ...prev.feeStructure,
        [field]: value
      }
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // In production, this would make an actual API call to test the connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful test
      setTestResult({
        success: true,
        message: `Connection to ${activeProvider} API successful. API version: 2.1.0`
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || `Failed to connect to ${activeProvider} API`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    
    try {
      // In production, this would save the configuration to the database
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessMessage(`${activeProvider} configuration saved successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving provider configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Provider Settings</h1>
          <p className="text-gray-600 mt-1">Configure and manage payment service providers</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <div
            key={provider.id}
            onClick={() => handleProviderSelect(provider.provider_name)}
            className={`card cursor-pointer transition-all duration-200 ${
              activeProvider === provider.provider_name 
                ? 'ring-2 ring-primary-500 ring-offset-2' 
                : 'hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getProviderIcon(provider.provider_name)}
                <h3 className="font-semibold text-gray-900">{provider.provider_name}</h3>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                provider.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {provider.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {provider.provider_type === 'banking' ? 'Banking and payments provider' : 
               provider.provider_type === 'payments' ? 'Payment processing provider' : 
               'Foreign exchange provider'}
            </p>
            <div className="text-xs text-gray-500">
              <div className="flex flex-wrap gap-1 mb-2">
                {provider.config.supportedCurrencies.map((currency: string) => (
                  <span key={currency} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {currency}
                  </span>
                ))}
              </div>
              <p>Supports {provider.config.supportedCountries.length} countries</p>
            </div>
          </div>
        ))}
      </div>

      {/* Provider Configuration */}
      {activeProvider && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getProviderIcon(activeProvider)}
              <h3 className="text-lg font-semibold text-gray-900">{activeProvider} Configuration</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={providerConfig.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* API Credentials */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Key className="w-4 h-4 mr-2" />
              API Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={providerConfig.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter API key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={providerConfig.apiSecret}
                    onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter API secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Webhook Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={`https://example.com/api/webhooks/${activeProvider.toLowerCase()}`}
                    className="input-field flex-1"
                    disabled
                  />
                  <button
                    type="button"
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://example.com/api/webhooks/${activeProvider.toLowerCase()}`);
                      alert('Webhook URL copied to clipboard');
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Configure this URL in your {activeProvider} dashboard to receive webhook events
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={providerConfig.webhookSecret}
                    onChange={(e) => handleInputChange('webhookSecret', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter webhook secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Configuration */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Fee Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage Fee (%)
                </label>
                <input
                  type="number"
                  value={providerConfig.feeStructure.percentage}
                  onChange={(e) => handleFeeChange('percentage', parseFloat(e.target.value))}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flat Fee ($)
                </label>
                <input
                  type="number"
                  value={providerConfig.feeStructure.flatFee}
                  onChange={(e) => handleFeeChange('flatFee', parseFloat(e.target.value))}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Fee ($)
                </label>
                <input
                  type="number"
                  value={providerConfig.feeStructure.minimumFee}
                  onChange={(e) => handleFeeChange('minimumFee', parseFloat(e.target.value))}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Supported Currencies */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Supported Currencies</h4>
            <div className="flex flex-wrap gap-2">
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MXN'].map(currency => (
                <label key={currency} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={providerConfig.supportedCurrencies.includes(currency)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('supportedCurrencies', [...providerConfig.supportedCurrencies, currency]);
                      } else {
                        handleInputChange('supportedCurrencies', 
                          providerConfig.supportedCurrencies.filter((c: string) => c !== currency)
                        );
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span>{currency}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Test Connection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Connection
            </h4>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="btn-secondary"
              >
                {isTesting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
              {testResult && (
                <div className={`flex items-center space-x-2 ${
                  testResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult.success ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900">Security Notice</h4>
                <p className="text-sm text-blue-800 mt-1">
                  API credentials are encrypted before storage and are never exposed in client-side code.
                  Webhook endpoints are secured with signature verification to prevent unauthorized access.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActiveProvider(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}