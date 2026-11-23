import React, { useState } from 'react';
import {
  Plus,
  Download,
  Check,
  X,
  User,
  Wallet as WalletIcon,
  Key,
  Edit,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useClients, useWallets } from '../../hooks/useDatabase';

// Environment-based network options
const getNetworkOptions = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  
  if (environment === 'production') {
    return [
      { value: 'polygon', label: 'Polygon', chainId: '137' },
      { value: 'base', label: 'Base', chainId: '8453' },
      { value: 'arbitrum', label: 'Arbitrum', chainId: '42161' },
      { value: 'stellar', label: 'Stellar' }
    ];
  } else {
    // Development environment
    return [
      { value: 'polygon_amoy', label: 'PoS Amoy (testnet)', chainId: '80002' },
      { value: 'base_sepolia', label: 'Base Sepolia (testnet)', chainId: '84532' },
      { value: 'arbitrum_sepolia', label: 'Arbitrum Sepolia (testnet)', chainId: '421614' },
      { value: 'stellar_testnet', label: 'Stellar Testnet' }
    ];
  }
};

export default function WalletsManagement() {
  const { clients, loading: clientsLoading, error: clientsError } = useClients();
  const { wallets, loading: walletsLoading, error: walletsError, fetchWallets, createWallet } = useWallets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: '',
    network: '',
    address: '',
    is_account_abstraction: true, // Always true
    clientId: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    network: '',
    address: '',
    clientId: ''
  });

  // Get network options based on environment
  const networkOptions = getNetworkOptions();
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

     // Fetch wallets on component mount
   React.useEffect(() => {
     fetchWallets();
   }, []);
   
   const handleFieldChange = (field: string, value: string) => {
     setNewWallet(prev => ({ ...prev, [field]: value }));
     
     // Clear field error when user starts typing
     if (fieldErrors[field as keyof typeof fieldErrors]) {
       setFieldErrors(prev => ({
         ...prev,
         [field]: ''
       }));
     }
   };

     const handleCreateWallet = async () => {
     try {
       // Clear previous errors
       setFieldErrors({ name: '', network: '', address: '', clientId: '' });
       
       // Field-level validation
       let hasFieldErrors = false;
       const newFieldErrors = { name: '', network: '', address: '', clientId: '' };
       
       // Validate required fields
       if (!newWallet.name.trim()) {
         newFieldErrors.name = 'Wallet name is required';
         hasFieldErrors = true;
       } else if (newWallet.name.length > 100) {
         newFieldErrors.name = 'Wallet name must not exceed 100 characters';
         hasFieldErrors = true;
       }
       
       if (!newWallet.network.trim()) {
         newFieldErrors.network = 'Network is required';
         hasFieldErrors = true;
       } else if (newWallet.network.length > 50) {
         newFieldErrors.network = 'Network must not exceed 50 characters';
         hasFieldErrors = true;
       }
       
               if (!newWallet.address.trim()) {
          newFieldErrors.address = 'Address is required';
          hasFieldErrors = true;
        } else {
          // Network-specific address validation
          const selectedNetwork = networkOptions.find(opt => opt.value === newWallet.network);
          if (selectedNetwork) {
            if (selectedNetwork.value.includes('stellar')) {
              // Stellar addresses should be 56 characters and start with 'G'
              if (newWallet.address.length > 56) {
                newFieldErrors.address = 'Address must not exceed 56 characters';
                hasFieldErrors = true;
              } else if (!newWallet.address.startsWith('G') || newWallet.address.length !== 56) {
                newFieldErrors.address = 'Invalid Stellar address format. Must start with G and be 56 characters';
                hasFieldErrors = true;
              }
            } else {
              // EVM networks (Ethereum, Polygon, Base, Arbitrum, etc.)
              if (newWallet.address.length > 42) {
                newFieldErrors.address = 'Address must not exceed 42 characters';
                hasFieldErrors = true;
              } else if (!newWallet.address.startsWith('0x') || newWallet.address.length !== 42) {
                newFieldErrors.address = 'Invalid address format. Must be 0x followed by 40 hex characters';
                hasFieldErrors = true;
              }
            }
          }
        }
       
       if (!newWallet.clientId.trim()) {
         newFieldErrors.clientId = 'Client is required';
         hasFieldErrors = true;
       }
       
       if (hasFieldErrors) {
         setFieldErrors(newFieldErrors);
         return;
       }
      
      const payload = {
        client_id: newWallet.clientId,
        name: newWallet.name,
        network: newWallet.network,
        address: newWallet.address,
        is_account_abstraction: newWallet.is_account_abstraction,
      };
      
      console.log('Frontend sending wallet payload:', payload);
      
      const result = await createWallet(payload);
      if (result.success) {
        // Refresh the wallets list
        await fetchWallets();
        setShowCreateModal(false);
                 setNewWallet({ name: '', network: '', address: '', is_account_abstraction: true, clientId: '' });
         setFieldErrors({ name: '', network: '', address: '', clientId: '' });
        setSuccessMessage('Wallet created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Error creating wallet:', err);
      // The error is already set in the hook's state, so we don't need to do anything here
      // The walletsError will be displayed automatically
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}
             <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-gray-900">Wallets Management</h1>
           <p className="text-gray-600 mt-1">
             Manage blockchain wallets for clients
             <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
               {environment === 'production' ? 'Production' : 'Development'} Environment
             </span>
           </p>
         </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Wallet
        </button>
      </div>
      <div className="card overflow-hidden min-h-[20rem]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 min-h-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Abstraction</th>
                {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {walletsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-gray-500">Loading wallets...</span>
                    </div>
                  </td>
                </tr>
              ) : walletsError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="text-red-500">
                      <X className="w-8 h-8 mx-auto mb-2" />
                      <p>Failed to load wallets: {walletsError}</p>
                    </div>
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <WalletIcon className="w-8 h-8 mx-auto mb-2" />
                      <p>No wallets found</p>
                      <p className="text-sm">Create your first wallet to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                wallets.map(wallet => (
                  <tr key={wallet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                          <WalletIcon className="w-4 h-4" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{wallet.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {wallet.client?.first_name} {wallet.client?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {wallet.client?.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {wallet.client?.users?.email || 'No email'}
                          </div>
                      </div>
                    </td>
                                         <td className="px-6 py-4">
                       <div className="text-sm text-gray-900">
                         {networkOptions.find(opt => opt.value === wallet.network)?.label || wallet.network}
                       </div>
                     </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900">{wallet.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${wallet.is_account_abstraction ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {wallet.is_account_abstraction ? 'Yes' : 'No'}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-gray-400 hover:text-gray-600" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600" title="Edit Wallet">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600" title="More Actions">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Create Wallet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-8 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold mb-6">Create New Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Name <span className="text-red-500">*</span></label>
                                 <input
                   type="text"
                   className={`input-field ${fieldErrors.name ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                   value={newWallet.name}
                   onChange={e => handleFieldChange('name', e.target.value)}
                   maxLength={100}
                   required
                 />
                 {fieldErrors.name && (
                   <p className="text-error-500 text-xs mt-1">{fieldErrors.name}</p>
                 )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Network <span className="text-red-500">*</span></label>
                                 <select
                   className={`input-field ${fieldErrors.network ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                   value={newWallet.network}
                   onChange={e => handleFieldChange('network', e.target.value)}
                   required
                 >
                  <option value="">Select network</option>
                  {networkOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {fieldErrors.network && (
                  <p className="text-error-500 text-xs mt-1">{fieldErrors.network}</p>
                )}
              </div>
                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Address <span className="text-red-500">*</span></label>
                                                      <input
                     type="text"
                     className={`input-field ${fieldErrors.address ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                     value={newWallet.address}
                     onChange={e => handleFieldChange('address', e.target.value)}
                     placeholder={
                       newWallet.network && networkOptions.find(opt => opt.value === newWallet.network)?.value.includes('stellar')
                         ? 'G... (56 characters)'
                         : '0x... (42 characters)'
                     }
                     maxLength={
                       newWallet.network && networkOptions.find(opt => opt.value === newWallet.network)?.value.includes('stellar')
                         ? 56
                         : 42
                     }
                     required
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     {newWallet.network && networkOptions.find(opt => opt.value === newWallet.network)?.value.includes('stellar')
                       ? 'Must be a valid Stellar address (G + 55 characters)'
                       : 'Must be a valid Ethereum address (0x + 40 hex characters)'
                     }
                   </p>
                   {fieldErrors.address && (
                     <p className="text-error-500 text-xs mt-1">{fieldErrors.address}</p>
                   )}
                 </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client <span className="text-red-500">*</span></label>
                                 <select
                   className={`input-field ${fieldErrors.clientId ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                   value={newWallet.clientId}
                   onChange={e => handleFieldChange('clientId', e.target.value)}
                   required
                   disabled={clientsLoading}
                 >
                  <option value="">{clientsLoading ? 'Loading clients...' : 'Select client'}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.first_name} {client.last_name} ({client.users?.email})</option>
                  ))}
                                   </select>
                   {fieldErrors.clientId && (
                     <p className="text-error-500 text-xs mt-1">{fieldErrors.clientId}</p>
                   )}
                   {clientsError && <div className="text-red-500 text-xs mt-1">Failed to load clients</div>}
                 </div>
              
              <div>
                                                  <button
                   className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors ${
                     walletsLoading 
                       ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                       : !newWallet.name || !newWallet.network || !newWallet.address || !newWallet.clientId
                       ? 'bg-gray-100 text-gray-400 border border-gray-200'
                       : 'btn-primary'
                   }`}
                   onClick={handleCreateWallet}
                   disabled={walletsLoading}
                 >
                   {walletsLoading ? 'Creating...' : 'Create Wallet'}
                 </button>
                {walletsError && <div className="text-red-500 text-xs mt-2">{walletsError}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 