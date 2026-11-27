import { useState } from 'react';
import { useBranding } from '../../contexts/BrandingContext';
import { useTransactions } from '../../hooks/useDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { approveTransaction, completeTransactionApproval } from '../../hooks/useDatabase';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter,
  Download,
  MapPin,
  CreditCard,
  Building2,
  Smartphone,
  Globe,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStatusColor } from '../../helpers/transaction';
import TransactionDetails from './components/TransactionDetails';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'payin_pending' | 'payin_completed' | 'payin_failed' | 'payout_pending' | 'payout_failed' | 'refunded';
  category: 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'refund';
  accountName: string;
  accountNumber: string;
  balance: number;
  location?: string;
  merchant?: string;
  paymentMethod?: 'card' | 'online' | 'mobile' | 'atm' | 'wire' | 'ach';
  beneficiary?: string;
  tags?: string[];
  metadata?: any;
}

// Helper function to convert database transaction to UI format
const convertTransactionToUI = (dbTransaction: any): Transaction => {
  return {
    id: dbTransaction.id,
    type: dbTransaction.type || 'debit',
    amount: parseFloat(dbTransaction.amount) || 0,
    currency: dbTransaction.currency || 'USD',
    description: dbTransaction.description || 'Transaction',
    reference: dbTransaction.reference || dbTransaction.transaction_number || '',
    date: dbTransaction.created_at || new Date().toISOString(),
    status: dbTransaction.status || 'pending',
    category: dbTransaction.category || 'transfer',
    accountName: dbTransaction.main_account?.account_name || 'Account',
    accountNumber: dbTransaction.main_account?.account_number || '****',
    balance: parseFloat(dbTransaction.balance_after) || 0,
    location: dbTransaction.location,
    merchant: dbTransaction.merchant,
    paymentMethod: dbTransaction.payment_method,
    beneficiary: dbTransaction.beneficiary_id,
    tags: generateTags(dbTransaction),
    metadata: dbTransaction.metadata
  };
};
export const getTransactionIcon = (category: string, paymentMethod?: string) => {
    switch (category) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'transfer':
        return paymentMethod === 'wire' ? <Globe className="w-5 h-5 text-blue-600" /> : <ArrowUpRight className="w-5 h-5 text-blue-600" />;
      case 'payment':
        return paymentMethod === 'card' ? <CreditCard className="w-5 h-5 text-purple-600" /> : 
               paymentMethod === 'mobile' ? <Smartphone className="w-5 h-5 text-purple-600" /> :
               <Building2 className="w-5 h-5 text-purple-600" />;
      case 'interest':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'fee':
        return <DollarSign className="w-5 h-5 text-orange-600" />;
      case 'refund':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      default:
        return <ArrowUpRight className="w-5 h-5 text-gray-600" />;
    }
  };

  export const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
      case 'payin_pending':
      case 'payout_pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'payin_failed':
      case 'payout_failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
};

// Generate tags based on transaction data
const generateTags = (transaction: any): string[] => {
  const tags: string[] = [];
  
  if (transaction.category === 'transfer') {
    tags.push('transfer');
    if (transaction.payment_method === 'wire') tags.push('wire');
    if (transaction.payment_method === 'ach') tags.push('ach');
  }
  
  if (transaction.category === 'payment') {
    tags.push('payment');
    if (transaction.payment_method === 'card') tags.push('card');
    if (transaction.payment_method === 'online') tags.push('online');
  }
  
  if (transaction.category === 'deposit') {
    tags.push('deposit');
  }
  
  if (transaction.category === 'withdrawal') {
    tags.push('withdrawal');
  }
  
  if (transaction.category === 'fee') {
    tags.push('fee');
  }
  
  if (transaction.category === 'interest') {
    tags.push('interest');
  }
  
  if (transaction.category === 'refund') {
    tags.push('refund');
  }
  
  // Add BlindPay specific tags
  if (transaction.metadata?.payin_id) {
    tags.push('blindpay');
  }
  
  if (transaction.status?.includes('pending')) {
    tags.push('pending');
  }
  
  return tags;
};

// Calculate category data from real transactions
const calculateCategoryData = (transactions: Transaction[]) => {
  const categoryMap = new Map<string, { count: number, amount: number, color: string }>();
  
  const colors = {
    'transfer': '#3b82f6',
    'payment': '#ef4444',
    'deposit': '#22c55e',
    'withdrawal': '#f97316',
    'fee': '#8b5cf6',
    'interest': '#10b981',
    'refund': '#06b6d4'
  };
  
  transactions.forEach(txn => {
    const category = txn.category;
    const current = categoryMap.get(category) || { count: 0, amount: 0, color: colors[category as keyof typeof colors] || '#6b7280' };
    
    categoryMap.set(category, {
      count: current.count + 1,
      amount: current.amount + Math.abs(txn.amount),
      color: current.color
    });
  });
  
  return Array.from(categoryMap.entries()).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.count,
    amount: data.amount,
    color: data.color
  }));
};

// Calculate monthly data from real transactions
const calculateMonthlyData = (transactions: Transaction[]) => {
  const monthlyMap = new Map<string, { income: number, expenses: number }>();
  
  transactions.forEach(txn => {
    const date = new Date(txn.date);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
    const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
    
    if (txn.type === 'credit') {
      current.income += txn.amount;
    } else {
      current.expenses += Math.abs(txn.amount);
    }
    
    monthlyMap.set(monthKey, current);
  });
  
  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    income: data.income,
    expenses: data.expenses
  }));
};

export default function TransactionHistory() {
  const { branding } = useBranding();
  const { user } = useAuth();
  const { transactions, loading, loadingMore, error, hasMore, loadMore } = useTransactions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [approvingTransaction, setApprovingTransaction] = useState<string | null>(null);
  
  // Token approval state
  const [showTokenApproval, setShowTokenApproval] = useState(false);
  const [approvalContract, setApprovalContract] = useState('');
  const [approvalAmount, setApprovalAmount] = useState('');
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | null>(null);
  const [isApprovalInProgress, setIsApprovalInProgress] = useState(false);
  const [pendingApprovalData, setPendingApprovalData] = useState<any>(null);
  
  // Wagmi hooks for token approval
  const { address: walletAddress, isConnected } = useAccount();
  const { writeContractAsync: approveTokens, isPending: isApproving } = useWriteContract();
  const { data: approvalReceipt, isError: isApprovalError, isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({
    hash: approvalTxHash || undefined,
  });
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();

  const handleApproveTransaction = async (transaction: Transaction) => {
    if (!user?.wallet_address) {
      alert('Please connect your wallet first');
      return;
    }

    setApprovingTransaction(transaction.id);
    try {
      const result = await approveTransaction({
        transaction_id: transaction.id,
        wallet_address: user.wallet_address,
        reason: 'Client approved the transfer'
      });
      
      // Check if token approval is required
      if (result.requiresTokenApproval) {
        console.log('Token approval required:', result.approvalData);
        setPendingApprovalData(result.approvalData);
        setApprovalContract(result.approvalData.contractAddress);
        setApprovalAmount(result.approvalData.amount);
        setShowTokenApproval(true);
        // Don't reset approvingTransaction here - keep it active until the complete process finishes
        return;
      }
      
      // No token approval needed, refresh the transaction list
      window.location.reload();
    } catch (error) {
      console.error('Error approving transaction:', error);
      alert(`Failed to approve transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApprovingTransaction(null); // Only reset on error
    }
  };

  const handleTokenApproval = async (contractAddress: string, amount: string) => {
    console.log('=== FRONTEND TOKEN APPROVAL WALLET ADDRESS ===');
    console.log('User wallet address:', user?.wallet_address);
    console.log('Connected wallet address:', walletAddress);
    console.log('Contract address for approval:', contractAddress);
    console.log('BlindPay contract address (spender):', pendingApprovalData?.blindpayContractAddress);
    console.log('Amount to approve:', amount);
    console.log('Network for approval:', pendingApprovalData?.network);
    console.log('Chain ID for approval:', pendingApprovalData?.network?.chainId);
    console.log('================================');

    // Ensure wallet is on the correct network before approving
    const requiredChainId: number | undefined = pendingApprovalData?.network?.chainId;
    if (!requiredChainId) {
      alert('Missing payout network. Please regenerate the quote.');
      return false;
    }

    if (currentChainId !== requiredChainId) {
      console.log(`Switching network from ${currentChainId} to ${requiredChainId} for approval`);
      try {
        if (switchChain) {
          await switchChain({ chainId: requiredChainId });
        } else if ((window as any).ethereum?.request) {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + requiredChainId.toString(16) }],
          });
        } else {
          alert('Unable to switch network. Please switch in MetaMask to the required network and try again.');
          return false;
        }
      } catch (switchErr) {
        console.error('Network switch rejected/failed:', switchErr);
        alert('Please switch your wallet to the required network and try again.');
        return false;
      }
    }
    
    console.log('handleTokenApproval called with:', { contractAddress, amount });
    console.log('approveTokens available:', !!approveTokens);
    console.log('pendingApprovalData?.blindpayContractAddress:', pendingApprovalData?.blindpayContractAddress);
    
    if (!approveTokens) {
      console.log('approveTokens is not available');
      alert('Token approval not available');
      return false;
    }

    try {
      console.log('About to call approveTokens with args:', {
        address: contractAddress,
        spender: pendingApprovalData?.blindpayContractAddress,
        amount: amount
      });
      
      // ERC20 approve function
      const txHash = await approveTokens({
        address: contractAddress as `0x${string}`,
        chainId: requiredChainId,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [
          pendingApprovalData?.blindpayContractAddress as `0x${string}`, // BlindPay contract
          BigInt(amount) // Amount to approve
        ]
      });
      setApprovalTxHash(txHash as `0x${string}`);
      
      console.log('approveTokens call successful');
      console.log('Token approval transaction submitted');
      
      // Wait for the transaction to be confirmed (max 60 seconds)
      let waitTime = 0;
      const maxWaitTime = 60000; // 60 seconds
      
      while (isWaitingForApproval && waitTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitTime += 1000;
        console.log(`Waiting for approval confirmation... ${waitTime}ms`);
      }
      
      if (waitTime >= maxWaitTime) {
        console.error('Token approval transaction timed out');
        alert('Token approval transaction timed out');
        return false;
      }
      
      if (isApprovalError) {
        console.error('Token approval transaction failed');
        alert('Token approval transaction failed');
        return false;
      }
      
      console.log('Token approval transaction confirmed successfully');
      return true;
    } catch (error) {
      console.error('Token approval failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Token approval failed: ${errorMessage}`);
      return false;
    }
  };

  // Convert database transactions to UI format
  const uiTransactions: Transaction[] = transactions.map(convertTransactionToUI);
  
  // Calculate analytics data from real transactions
  const categoryData = calculateCategoryData(uiTransactions);
  const monthlyData = calculateMonthlyData(uiTransactions);

  

  const filteredTransactions = uiTransactions.filter(txn => {
    const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.beneficiary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || txn.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || txn.accountNumber === accountFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesAccount;
  });

  const totalIncome = uiTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(uiTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0));
  const pendingTransactions = uiTransactions.filter(t => t.status.includes('pending')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Transactions</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-1">View and manage all your transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          {/* <button className="btn-primary">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Date Range
          </button> */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
            <ArrowUpRight className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Flow</p>
              <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(totalIncome - totalExpenses).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTransactions}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
                <span className="font-medium">${category.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Categories</option>
                  <option value="transfer">Transfers</option>
                  <option value="payment">Payments</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="fee">Fees</option>
                  <option value="interest">Interest</option>
                  <option value="refund">Refunds</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="payin_pending">Payin Pending</option>
                  <option value="payout_pending">Payout Pending</option>
                  <option value="failed">Failed</option>
                  <option value="payin_failed">Payin Failed</option>
                  <option value="payout_failed">Payout Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Accounts</option>
                  {Array.from(new Set(uiTransactions.map(t => t.accountNumber))).map(accountNumber => (
                    <option key={accountNumber} value={accountNumber}>
                      {uiTransactions.find(t => t.accountNumber === accountNumber)?.accountName || 'Account'} ({accountNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setAccountFilter('all');
                    setSearchTerm('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="card">
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setSelectedTransaction(transaction)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {getTransactionIcon(transaction.category, transaction.paymentMethod)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    {transaction.tags && transaction.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {transaction.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span>{transaction.reference}</span>
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    <span>{transaction.accountName}</span>
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
                <div className="flex items-center space-x-2">
                  <p className={`text-lg font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  {getStatusIcon(transaction.status)}
                </div>
                <div className="flex items-center justify-end space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                  {((transaction.status === 'payin_completed' && transaction.metadata?.awaiting_approval) || transaction.status === 'payout_failed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveTransaction(transaction);
                      }}
                      disabled={approvingTransaction === transaction.id}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {approvingTransaction === transaction.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {transaction.status === 'payout_failed' ? 'Retrying...' : 'Approving...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {transaction.status === 'payout_failed' ? 'Retry' : 'Approve'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
        <div className="mt-6 flex justify-center">
            <button 
              onClick={loadMore}
              disabled={loadingMore}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Transactions'
              )}
          </button>
        </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <TransactionDetails 
                onChange={() => setSelectedTransaction(null)}
                status={selectedTransaction.status}
                transactionId={selectedTransaction.metadata?.payin_id}
              />


            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                {/* <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button> */}
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {getTransactionIcon(selectedTransaction.category, selectedTransaction.paymentMethod)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedTransaction.description}</h4>
                    <p className="text-sm text-gray-600">{selectedTransaction.reference}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {selectedTransaction.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className={`mt-1 text-2xl font-bold ${
                      selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTransaction.type === 'credit' ? '+' : ''}${Math.abs(selectedTransaction.amount).toLocaleString()} {selectedTransaction.currency}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedTransaction.date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.accountName} ({selectedTransaction.accountNumber})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Balance After</label>
                    <p className="mt-1 text-sm text-gray-900">
                      ${selectedTransaction.balance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedTransaction.merchant && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Merchant</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.merchant}</p>
                  </div>
                )}

                {selectedTransaction.beneficiary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Beneficiary</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.beneficiary}</p>
                  </div>
                )}

                {selectedTransaction.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedTransaction.location}
                    </p>
                  </div>
                )}

                {selectedTransaction.paymentMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {selectedTransaction.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                )}

                {/* BlindPay Transaction Details */}
                {selectedTransaction.metadata && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">BlindPay Details</h4>
                    <div className="space-y-2">
                      {selectedTransaction.metadata.payin_id && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payin ID:</span>
                          <span className="font-mono text-gray-900">{selectedTransaction.metadata.payin_id}</span>
                        </div>
                      )}
                      {selectedTransaction.metadata.payout_id && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payout ID:</span>
                          <span className="font-mono text-gray-900">{selectedTransaction.metadata.payout_id}</span>
                        </div>
                      )}
                      {selectedTransaction.metadata.payin_quote_id && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payin Quote:</span>
                          <span className="font-mono text-gray-900">{selectedTransaction.metadata.payin_quote_id}</span>
                        </div>
                      )}
                      {selectedTransaction.metadata.payout_quote_id && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payout Quote:</span>
                          <span className="font-mono text-gray-900">{selectedTransaction.metadata.payout_quote_id}</span>
                        </div>
                      )}
                      {selectedTransaction.metadata.wallet_address && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Wallet Address:</span>
                          <span className="font-mono text-gray-900 text-xs">
                            {selectedTransaction.metadata.wallet_address.slice(0, 10)}...{selectedTransaction.metadata.wallet_address.slice(-8)}
                          </span>
                        </div>
                      )}
                      {selectedTransaction.metadata.payout_error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Payout Error</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">{selectedTransaction.metadata.payout_error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedTransaction.tags.map((tag, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* <div className="flex space-x-3 pt-4 border-t">
                  <button className="btn-secondary flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </button>
                  <button className="btn-secondary flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View Statement
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Approval Modal */}
      {showTokenApproval && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" 
          onClick={() => {
            setShowTokenApproval(false);
            setIsApprovalInProgress(false);
            setApprovingTransaction(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-red-600">Approve Token Transfer</h3>
            <p className="text-gray-600 mb-4">
              To complete this transfer, you need to approve the token contract to spend your tokens.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-mono text-sm">{approvalContract}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span>{approvalAmount}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTokenApproval(false);
                  setIsApprovalInProgress(false);
                  setApprovingTransaction(null);
                }}
                className="btn-secondary flex-1"
                disabled={isApproving || isApprovalInProgress}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (approvalContract && approvalAmount) {
                    setIsApprovalInProgress(true);
                    try {
                      const success = await handleTokenApproval(approvalContract, approvalAmount);
                      if (success) {
                        setShowTokenApproval(false);
                        // Continue with transaction approval after token approval
                        setTimeout(async () => {
                          try {
                            await completeTransactionApproval({
                              transaction_id: pendingApprovalData.transaction_id,
                              wallet_address: pendingApprovalData.wallet_address,
                              reason: pendingApprovalData.reason
                            });
                            // Refresh the transaction list
                            window.location.reload();
                          } catch (error) {
                            console.error('Transaction approval failed after token approval:', error);
                            alert('Transaction approval failed after token approval. Please try again.');
                          } finally {
                            setIsApprovalInProgress(false);
                            setApprovingTransaction(null);
                          }
                        }, 1000); // Give time for approval to be processed
                      } else {
                        setIsApprovalInProgress(false);
                        setApprovingTransaction(null);
                      }
                    } catch (error) {
                      console.error('Approval failed:', error);
                      setIsApprovalInProgress(false);
                      setApprovingTransaction(null);
                    }
                  }
                }}
                className="btn-primary flex-1"
                disabled={isApproving || isApprovalInProgress}
              >
                {isApproving || isApprovalInProgress ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}