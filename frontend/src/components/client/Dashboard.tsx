import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';
import { useNotifications, useTransactions } from '../../hooks/useDatabase';
import { useAccounts } from '../../hooks/useDatabase';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  Bell,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  X,
  Loader,
  AlertCircle,
  Loader2,
  Copy,
  RefreshCcw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';
import { getStatusColor } from '../../helpers/transaction';

//const recentTransactions = [
//  { id: '1', type: 'credit', amount: 2500.00, description: 'Salary Deposit', date: '2024-01-15', status: 'completed' },
//  { id: '2', type: 'debit', amount: -85.50, description: 'Grocery Store', date: '2024-01-14', status: 'completed' },
//  { id: '3', type: 'debit', amount: -1200.00, description: 'Rent Payment', date: '2024-01-13', status: 'completed' },
//  { id: '4', type: 'credit', amount: 150.00, description: 'Refund', date: '2024-01-12', status: 'completed' },
//];

const balanceData = [
  { date: 'Jan 1', balance: 8500 },
  { date: 'Jan 5', balance: 9200 },
  { date: 'Jan 10', balance: 8800 },
  { date: 'Jan 15', balance: 12450 },
];

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

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { branding, msb } = useBranding();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();
  const [ accountsError, setAccountsError ] = useState<string | null>(null);
  const [ showNotifications, setShowNotifications ] = React.useState(false);
  const [ selectedNotification, setSelectedNotification ] = React.useState<any>(null);
  const { error, fetchRecentTransactions } = useTransactions();
  const [ recentTransactions, setRecentTransactions ] = useState<Transaction[]>([]);
  const [ loadingTransaction, setLoadingTransaction ] = useState(true);
  const [method, setMethod] = useState<'ACH'|'Wire'|'RTP'>('ACH');

  // Refresh notifications periodically
  useEffect(() => {
    console.log('fetching transaction with interval');
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

useEffect(() => {
  const loadTransactions = async () => {
    try {
      console.log('fetching transaction');

      const transactions = await fetchRecentTransactions(); // Fetch latest 10
      setRecentTransactions(transactions);
      setLoadingTransaction(false);
    } catch (err) {
      // Optional: handle error state here
      console.log('Error fetching transactions:', err);
    }
  };

  loadTransactions();
}, []);

  // Calculate total balance safely
  const totalBalance = accounts && accounts.length > 0 ? accounts.reduce((sum, account) => {
    if (account.currency === 'USD') return sum + Number(account.balance);
    if (account.currency === 'EUR') return sum + (Number(account.balance) * 1.09); // EUR to USD conversion
    if (account.currency === 'GBP') return sum + (Number(account.balance) * 1.27); // GBP to USD conversion
    return sum;
  }, 0) : 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction_approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'transaction_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'transaction_completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'transaction_failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'transaction_pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };
  const UsFlag = () => (
      <svg viewBox="0 0 7410 3900" className="h-4 w-4" aria-hidden>
        <path fill="#b22234" d="M0 0h7410v3900H0z"/>
        <path stroke="#fff" strokeWidth="300" d="M0 450h7410M0 1050h7410M0 1650h7410M0 2250h7410M0 2850h7410M0 3450h7410"/>
        <path fill="#3c3b6e" d="M0 0h2964v2100H0z"/>
      </svg>
    );
    const CryptoIcon = () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
      </svg>
    );
    const InfoRow: React.FC<{label:string; value:React.ReactNode;}> = ({label, value}) => {
      // const [copied, setCopied] = useState(false);
      // const copy = async () => {
      //   if (typeof value === 'string') {
      //     await navigator.clipboard.writeText(value);
      //     setCopied(true);
      //     setTimeout(() => setCopied(false), 1200);
      //   }
      // };
      return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2">
        <div className="text-sm text-slate-500 font-medium">{label}</div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <div className="text-sm text-slate-900 break-all">{value}</div>
            {/* {copyable && typeof value === 'string' && (
              <button onClick={copy} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-white hover:bg-slate-50 text-slate-700">
                <Copy className="h-3.5 w-3.5"/> {copied ? 'Copied' : 'Copy'}
              </button>
            )} */}
        </div>
      </div>
      );
    };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transaction_approved':
      case 'transaction_completed':
        return 'bg-green-50 border-green-200';
      case 'transaction_rejected':
      case 'transaction_failed':
        return 'bg-red-50 border-red-200';
      case 'transaction_pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

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
      {/* Welcome Section */}
      <div className="card" style={{ borderLeftColor: branding.primaryColor, borderLeftWidth: '4px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600 mt-1">Here's your account overview for today</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notifications Bell */}
            {/* <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button> */}

              {/* Notifications Dropdown */}
              {/* {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div> */}
                  {/* <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div> */}
                  {/* {notifications.length > 5 && (
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          // Navigate to a full notifications page if it exists
                        }}
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700"
                      >
                        View all notifications
                      </button>
                    </div>
                  )} */}
                {/* </div>
              )} */}
            {/* </div> */}

            {/* <div className="text-right">
              <p className="text-sm text-gray-600">Last login</p>
              <p className="text-sm font-medium text-gray-900">Today at 9:15 AM</p>
            </div> */}
          </div>
        </div>
      </div>

      {/* Account Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Account</h3>
              {/* <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" style={{ color: branding.secondaryColor }} />
                <span className="text-sm" style={{ color: branding.secondaryColor }}>
                  +5.2% this month
                </span>
              </div> */}
            </div>

            <div className="space-y-4">
              {accountsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : accountsError ? (
                <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-600">{accountsError}</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">You don't have any accounts yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Please contact your MSB administrator to set up an account.</p>
                </div>
              ) : accounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/client/accounts')}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.account_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{account.account_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {/* <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {account.currency === 'EUR' ? '€' : account.currency === 'GBP' ? '£' : '$'}{account.balance.toLocaleString()}
                      {account.currency !== 'USD' && (
                        <span className="text-xs text-gray-500 block">
                          ≈ ${(account.currency === 'EUR' ? account.balance * 1.09 : account.balance * 1.27).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{account.currency}</p>
                  </div> */}
                </div>
              ))}
            </div>
{/* 
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Total Balance (USD)</span>
                <span className="text-2xl font-bold" style={{ color: branding.secondaryColor }}>
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div> */}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/client/transfer')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg text-white font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>Transfer Money</span>
            </button>
            {/* <button 
              onClick={() => navigate('/client/transactions')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors border"
              style={{ 
                borderColor: branding.accentColor,
                color: branding.accentColor 
              }}
            >
              <CreditCard className="w-5 h-5" />
              <span>Pay Bills</span>
            </button> */}
            {/* <button 
              onClick={() => navigate('/client/statements')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>View Statements</span>
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button> */}
          </div>
        </div>
      </div>

      {/* Balance Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Balance Trend */}
        {/* <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Balance Trend</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={balanceData}>
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
          </ResponsiveContainer>
        </div> */}

        {/* Recent Transactions */}
        {/* <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/client/transactions')}
              className="text-sm font-medium hover:underline"
              style={{ color: branding.primaryColor }}
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {loadingTransaction ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="text-gray-600">Loading transactions...</span>
                </div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-sm">No recent transactions found.</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  onClick={() => alert(`asdasd ${transaction.id}`)}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-600">
                        {
                          new Intl.DateTimeFormat('en-CA', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }).format(new Date(transaction.created_at))
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : ''}${Math.abs(parseFloat(transaction.amount.toString())).toLocaleString()}
                      </p>
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div> */}
      </div>

      {/* Security Notice */}
       {/* <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900">Security Notice</h4>
            <p className="text-sm text-blue-800 mt-1">
              Your account is protected with bank-level security. Always log out when using public computers and never share your login credentials.
            </p>
          </div>
        </div>
      </div> */}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedNotification.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className={`p-4 rounded-lg border ${getNotificationColor(selectedNotification.type)} mb-4`}>
                <p className="text-sm text-gray-800">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.data && (
                <div className="space-y-2 text-sm">
                  {selectedNotification.data.transaction_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction:</span>
                      <span className="font-medium">{selectedNotification.data.transaction_number}</span>
                    </div>
                  )}
                  {selectedNotification.data.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">${Math.abs(selectedNotification.data.amount).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedNotification.data.reason && (
                    <div>
                      <span className="text-gray-600">Reason:</span>
                      <p className="text-gray-900 mt-1">{selectedNotification.data.reason}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 text-xs text-gray-500">
                {new Date(selectedNotification.created_at).toLocaleString()}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                {selectedNotification.data?.transaction_id && (
                  <button
                    onClick={() => {
                      setSelectedNotification(null);
                      navigate('/client/transactions');
                    }}
                    className="btn-primary flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/*On ramp*/}
      
      
      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}

