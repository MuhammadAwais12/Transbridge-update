import React, { useState, useEffect } from 'react';
import { useVirtualAccounts, useClients, useWallets } from '../../hooks/useDatabase';
import { Loader2, Plus, Banknote, CreditCard, Activity } from 'lucide-react';
import { getTokenNetworkConfig } from '../../utils/tokenNetworkConfig';

interface VirtualAccountFormData {
  clientId: string;
  paymentRail: 'ach' | 'domestic_wire' | 'international_wire' | 'rtp';
  token: string;
  blockchainWalletId?: string;
  accountName?: string;
  description?: string;
}

export default function VirtualAccountManagement() {
  const { virtualAccounts, loading, error, createVirtualAccount, updateVirtualAccountStatus } = useVirtualAccounts();
  const { clients } = useClients();
  const { wallets, fetchWalletsByClientId, loading: walletsLoading } = useWallets();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<VirtualAccountFormData>({
    clientId: '',
    paymentRail: 'ach',
    token: 'USDC', // Will be updated dynamically based on selected client's wallet
    blockchainWalletId: '',
    accountName: '',
    description: '',
  });

  // Fetch wallets when client changes and update token based on client's wallet network
  useEffect(() => {
    if (formData.clientId) {
      fetchWalletsByClientId(formData.clientId);
      setFormData((prev) => ({ ...prev, blockchainWalletId: '' })); // reset wallet selection
      
      // Get the selected client to determine their wallet network
      const selectedClient = clients.find(client => client.id === formData.clientId);
      if (selectedClient?.wallet_network) {
        const { token } = getTokenNetworkConfig(selectedClient.wallet_network);
        setFormData((prev) => ({ ...prev, token }));
      }
    }
  }, [formData.clientId, clients]);

  // Filter wallets to only those with a valid blindpay_wallet_id
  const validWallets = wallets.filter((wallet) => !!wallet.blindpay_wallet_id);
                 // Filter clients to only those with supported ID types for virtual accounts
              // const eligibleClients = clients.filter((client) => {
              //   const supportedIdTypes = ['PASSPORT', 'SSN'];
              //   const isEligible = client.id_document_type && supportedIdTypes.includes(client.id_document_type);
              //   console.log(`Client ${client.first_name} ${client.last_name}: id_document_type = "${client.id_document_type}", eligible = ${isEligible}`);
              //   return isEligible;
              // });
  const eligibleClients = clients;
  const canCreate = formData.clientId && formData.blockchainWalletId && validWallets.length > 0 && !isCreating;

  const handleCreateVirtualAccount = async () => {
    if (!formData.clientId) {
      alert('Please select a client');
      return;
    }
    if (!formData.blockchainWalletId) {
      alert('Please select a blockchain wallet');
      return;
    }
    console.log('Creating virtual account with data:', {
      clientId: formData.clientId,
      blockchainWalletId: formData.blockchainWalletId,
      paymentRail: formData.paymentRail,
      token: formData.token,
      accountName: formData.accountName,
      description: formData.description
    });
    setIsCreating(true);
    try {
      await createVirtualAccount(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        clientId: '',
        paymentRail: 'ach',
        token: 'USDC', // Will be updated when client is selected
        blockchainWalletId: '',
        accountName: '',
        description: '',
      });
    } catch (error: any) {
      console.error('Error creating virtual account:', error);
      
      // Handle specific BlindPay errors
      let errorMessage = 'Failed to create virtual account';
      if (error.message) {
        if (error.message.includes('id_doc_is_not_supported')) {
          errorMessage = 'This client\'s ID document type is not supported for virtual accounts. Only passport or SSN are supported.';
        } else if (error.message.includes('Client must have a BlindPay receiver ID')) {
          errorMessage = 'This client does not have a BlindPay receiver ID. Please ensure the client has completed KYC.';
        } else if (error.message.includes('blockchainWalletId is required')) {
          errorMessage = 'Please select a blockchain wallet for this virtual account.';
        } else if (error.message.includes('Client must have a passport or SSN')) {
          errorMessage = 'This client must have a passport or SSN ID document type to create virtual accounts.';
        } else if (error.message.includes('id_doc_is_not_supported')) {
          errorMessage = 'This client\'s ID document type is not supported for virtual accounts. Only passport or SSN are supported.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentRailIcon = (rail: string) => {
    switch (rail) {
      case 'ach': return <Activity className="w-4 h-4" />;
      case 'domestic_wire': return <Banknote className="w-4 h-4" />;
      case 'international_wire': return <CreditCard className="w-4 h-4" />;
      case 'rtp': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Virtual Account Management</h1>
          <p className="text-gray-600">Manage US bank accounts for your customers</p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Virtual Account
        </button>
      </div>

      {/* Create Virtual Account Modal */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Virtual Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client</label>
                {eligibleClients.length === 0 ? (
                  <div className="text-red-500 text-sm">No clients with supported ID types (passport/SSN) found. Only clients with passport or SSN can create virtual accounts.</div>
                ) : (
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select a client</option>
                                                    {eligibleClients.map((client) => (
                                  <option key={client.id} value={client.id}>
                                    {client.first_name} {client.last_name} ({client.users?.email})
                                  </option>
                                ))}
                  </select>
                )}
              </div>

              {/* Wallet selection dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">Blockchain Wallet</label>
                {walletsLoading ? (
                  <div className="text-gray-500 text-sm">Loading wallets...</div>
                ) : formData.clientId && validWallets.length === 0 ? (
                  <div className="text-red-500 text-sm">No wallets with BlindPay ID found for this client. Please create a wallet first.</div>
                ) : (
                  <select
                    value={formData.blockchainWalletId}
                    onChange={(e) => setFormData({ ...formData, blockchainWalletId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select a wallet</option>
                    {validWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.blindpay_wallet_id}>
                        {wallet.name} ({wallet.address})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Rail</label>
                <select
                  value={formData.paymentRail}
                  onChange={(e) => setFormData({ ...formData, paymentRail: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="ach">ACH (~2 business days)</option>
                  <option value="domestic_wire">Domestic Wire (~1 business day)</option>
                  <option value="international_wire">International Wire (~5 business days)</option>
                  <option value="rtp">RTP (~5 minutes)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Token</label>
                <select
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Name (Optional)</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Enter account name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVirtualAccount}
                disabled={!canCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Virtual Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Virtual Accounts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Virtual Accounts ({virtualAccounts.length})</h3>
        </div>
        <div className="p-6">
          {virtualAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No virtual accounts found. Create your first virtual account to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Account Details</th>
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-left py-3 px-4">Payment Rail</th>
                    <th className="text-left py-3 px-4">Balance</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {virtualAccounts.map((account) => (
                    <tr key={account.id} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium">{account.accountName || 'Virtual Account'}</div>
                          <div className="text-sm text-gray-500">
                            {account.accountNumber} • {account.routingNumber}
                          </div>
                          <div className="text-xs text-gray-400">{account.bankName}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {account.client && (
                          <div>
                            <div className="font-medium">
                              {account.client.first_name} {account.client.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{account.client.users?.email}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getPaymentRailIcon(account.paymentRail)}
                          <span className="capitalize">{account.paymentRail.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium">${parseFloat(account.balance).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">
                            Available: ${parseFloat(account.availableBalance).toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                            View Details
                          </button>
                          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 