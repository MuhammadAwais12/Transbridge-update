import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';
import { useAccounts } from '../../hooks/useDatabase';
import { 
  CreditCard, 
  Eye, 
  EyeOff, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  Globe,
  Loader
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  category: 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'fee';
  balance: number;
  location?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    accountId: 'ACC-001',
    type: 'credit',
    amount: 2500.00,
    description: 'Salary Deposit',
    reference: 'PAYROLL-2024-001',
    date: '2024-01-15T10:30:00Z',
    status: 'completed',
    category: 'deposit',
    balance: 12450.00,
    location: 'Direct Deposit'
  },
  {
    id: 'TXN-002',
    accountId: 'ACC-001',
    type: 'debit',
    amount: -85.50,
    description: 'Grocery Store Purchase',
    reference: 'CARD-2024-002',
    date: '2024-01-14T18:45:00Z',
    status: 'completed',
    category: 'payment',
    balance: 9950.00,
    location: 'Fresh Market, Downtown'
  },
  {
    id: 'TXN-003',
    accountId: 'ACC-001',
    type: 'debit',
    amount: -1200.00,
    description: 'Rent Payment',
    reference: 'TRANSFER-2024-003',
    date: '2024-01-13T09:00:00Z',
    status: 'completed',
    category: 'transfer',
    balance: 10035.50
  },
  {
    id: 'TXN-004',
    accountId: 'ACC-002',
    type: 'credit',
    amount: 150.00,
    description: 'Interest Payment',
    reference: 'INT-2024-001',
    date: '2024-01-12T00:00:00Z',
    status: 'completed',
    category: 'deposit',
    balance: 25890.50
  },
  {
    id: 'TXN-005',
    accountId: 'ACC-001',
    type: 'debit',
    amount: -45.00,
    description: 'ATM Withdrawal',
    reference: 'ATM-2024-001',
    date: '2024-01-11T15:30:00Z',
    status: 'completed',
    category: 'withdrawal',
    balance: 8835.50,
    location: 'Main Street ATM'
  }
];

// Generate balance history data from filtered transactions
const generateBalanceHistoryData = (transactions: Transaction[], selectedAccount: any) => {
  if (!selectedAccount || transactions.length === 0) {
    return [];
  }

  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Start with the current account balance
  let runningBalance = selectedAccount.available_balance || 0;
  
  // Create balance history by working backwards from the most recent transaction
  const balanceHistory = sortedTransactions.map(txn => {
    // Adjust balance based on transaction type
    if (txn.type === 'credit') {
      runningBalance -= txn.amount; // Subtract credit to get previous balance
    } else {
      runningBalance += Math.abs(txn.amount); // Add debit to get previous balance
    }

    return {
      date: new Date(txn.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      balance: runningBalance
    };
  }).reverse(); // Reverse to show chronological order

  // Add current balance as the last point
  if (balanceHistory.length > 0) {
    balanceHistory.push({
      date: 'Today',
      balance: selectedAccount.available_balance || 0
    });
  }

  return balanceHistory;
};

export default function AccountManagement() {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { accounts, loading: accountsLoading } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30');

  // Set the first account as selected when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts]);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'current': return <CreditCard className="w-5 h-5" />;
      case 'savings': return <TrendingUp className="w-5 h-5" />;
      case 'multi_currency': return <Globe className="w-5 h-5" />;
      case 'business': return <Building2 className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'frozen': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string, category: string) => {
    if (type === 'credit') {
      return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
    } else {
      switch (category) {
        case 'withdrawal':
          return <ArrowUpRight className="w-4 h-4 text-red-600" />;
        default:
          return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      }
    }
  };

  const filteredTransactions = mockTransactions
    .filter(txn => selectedAccount && txn.accountId === selectedAccount.id)
    .filter(txn => {
      const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           txn.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = transactionFilter === 'all' || txn.category === transactionFilter;
      
      // Date range filtering
      const transactionDate = new Date(txn.date);
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const matchesDateRange = transactionDate >= cutoffDate;
      
      return matchesSearch && matchesFilter && matchesDateRange;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your accounts and view transaction history</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* <button 
            onClick={() => navigate('/client/statements')}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Statement
          </button>
          <button className="btn-secondary">
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </button> */}
        </div>
      </div>

      {/* Account Selection */}
      {accountsLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Accounts Found</h3>
          <p className="text-gray-600">You don't have any accounts yet.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact your MSB administrator to set up an account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            onClick={() => setSelectedAccount(account)}
            className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedAccount && selectedAccount.id === account.id 
                ? 'ring-2 ring-offset-2' 
                : 'hover:border-gray-300'
            }`}
            style={selectedAccount && selectedAccount.id === account.id ? { borderColor: branding.primaryColor } : {}}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {getAccountTypeIcon(account.account_type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{account.account_name}</h3>
                  <p className="text-sm text-gray-600">****{account.account_number.slice(-4)}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(account.status || 'active')}`}>
                {account.status}
              </span>
            </div>
            <div className="space-y-2">
              {/* <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="text-lg font-bold" style={{ color: branding.secondaryColor }}>
                  {account.currency === 'EUR' ? '€' : account.currency === 'GBP' ? '£' : '$'}{account.available_balance.toLocaleString()}
                </span>
              </div> */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Account Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {account.account_type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>)}

      {/* Account Details */}
      {selectedAccount && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Information */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
            <button
              onClick={() => setShowAccountNumber(!showAccountNumber)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Number</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">
                {showAccountNumber ? selectedAccount.account_number : '****' + selectedAccount.account_number.slice(-4)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {selectedAccount.account_type.replace('_', ' ')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <p className="mt-1 text-sm text-gray-900">{selectedAccount.currency}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Opened Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedAccount.opened_date).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Activity</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedAccount.last_activity).toLocaleDateString()}
              </p>
            </div>

            {selectedAccount.interest_rate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAccount.interest_rate}% APY</p>
              </div>
            )}

            {selectedAccount.overdraft_limit && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Overdraft Limit</label>
                <p className="mt-1 text-sm text-gray-900">
                  ${selectedAccount.overdraft_limit.toLocaleString()}
                </p>
              </div>
            )}

            {selectedAccount.monthly_fee !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Fee</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedAccount.monthly_fee === 0 ? 'Free' : `$${selectedAccount.monthly_fee}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Balance Overview */}
        {/* <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Balance Overview</h3>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Current Balance</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {selectedAccount.currency === 'EUR' ? '€' : selectedAccount.currency === 'GBP' ? '£' : '$'}{selectedAccount.balance.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Available Balance</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: branding.secondaryColor }}>
                {selectedAccount.currency === 'EUR' ? '€' : selectedAccount.currency === 'GBP' ? '£' : '$'}{selectedAccount.available_balance.toLocaleString()}
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            {generateBalanceHistoryData(filteredTransactions, selectedAccount).length > 0 ? (
              <LineChart data={generateBalanceHistoryData(filteredTransactions, selectedAccount)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke={branding.primaryColor}
                  strokeWidth={3}
                  dot={{ fill: branding.primaryColor, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No transaction data available</p>
                  <p className="text-xs text-gray-400">Balance history will appear here when you have transactions</p>
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div> */}
      </div>}

      {/* Transaction History */}
      {/* {selectedAccount && <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="transfer">Transfers</option>
              <option value="payment">Payments</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="fee">Fees</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {getTransactionIcon(transaction.type, transaction.category)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{transaction.reference}</span>
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    {transaction.location && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {transaction.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : ''}
                  {selectedAccount.currency === 'EUR' ? '€' : selectedAccount.currency === 'GBP' ? '£' : '$'}{Math.abs(transaction.amount).toLocaleString()}
                </p>
                <div className="flex items-center justify-end space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => navigate('/client/transactions')}
            className="btn-secondary"
          >
            Load More Transactions
          </button>
        </div>
      </div>} */}

      {/* Quick Actions */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/client/transfer')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
          style={{ borderColor: branding.primaryColor }}
        >
          <ArrowUpRight className="w-8 h-8 mx-auto mb-3" style={{ color: branding.primaryColor }} />
          <h4 className="font-medium text-gray-900">Transfer Money</h4>
          <p className="text-sm text-gray-600 mt-1">Send money to another account</p>
        </button>
        
        <button 
          onClick={() => navigate('/client/statements')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <Download className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900">Download Statement</h4>
          <p className="text-sm text-gray-600 mt-1">Get your account statement</p>
        </button>
        
        <button className="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <Settings className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900">Account Settings</h4>
          <p className="text-sm text-gray-600 mt-1">Manage account preferences</p>
        </button>
        
        <button className="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900">Set Alerts</h4>
          <p className="text-sm text-gray-600 mt-1">Configure account notifications</p>
        </button>
      </div> */}
    </div>
  );
}