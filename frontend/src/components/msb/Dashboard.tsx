import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, ArrowLeftRight, Shield, TrendingUp, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useClients, useAccounts, useDashboardTransactions, useComplianceAlerts } from '../../hooks/useDatabase';
import { formatCurrency } from '../../lib/formatters';

// Generate transaction data for the last 6 months based on actual transactions
const generateTransactionData = (transactions: any[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const targetMonth = (currentMonth - i + 12) % 12;
    const targetYear = currentMonth - i < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    
    const monthTransactions = transactions.filter((t: any) => {
      const transactionDate = new Date(t.created_at);
      return transactionDate.getMonth() === targetMonth && transactionDate.getFullYear() === targetYear;
    });

    const transactionCount = monthTransactions.length;
    const volume = monthTransactions.reduce((sum: number, t: any) => 
      sum + Math.abs(parseFloat(t.amount) || 0), 0
    );

    data.push({
      month: months[targetMonth],
      transactions: transactionCount,
      volume: volume,
      volumeFormatted: formatCurrency(volume)
    });
  }

  return data;
};

export default function MSBDashboard() {
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transactionsLoading } = useDashboardTransactions(); // Get transactions for dashboard stats
  const { alerts, loading: alertsLoading } = useComplianceAlerts();

  // Check if any data is still loading
  const isLoading = clientsLoading || accountsLoading || transactionsLoading || alertsLoading;

  // Generate transaction data for charts
  const transactionData = generateTransactionData(transactions);
  
  // Fallback data if no transactions exist
  const fallbackData = [
    { month: 'Jan', transactions: 0, volume: 0, volumeFormatted: '$0' },
    { month: 'Feb', transactions: 0, volume: 0, volumeFormatted: '$0' },
    { month: 'Mar', transactions: 0, volume: 0, volumeFormatted: '$0' },
    { month: 'Apr', transactions: 0, volume: 0, volumeFormatted: '$0' },
    { month: 'May', transactions: 0, volume: 0, volumeFormatted: '$0' },
    { month: 'Jun', transactions: 0, volume: 0, volumeFormatted: '$0' },
  ];
  
  const chartData = transactionData.length > 0 ? transactionData : fallbackData;

  const activeClients = clients.filter(c => c.users?.is_active).length;
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const monthlyTransactions = transactions.filter((t: any) => 
    new Date(t.created_at).getMonth() === new Date().getMonth()
  ).length;
  const totalVolume = transactions
    .filter((t: any) => new Date(t.created_at).getMonth() === new Date().getMonth())
    .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

  const pendingApprovals = transactions.filter((t: any) => t.status === 'pending' && t.requires_approval).length;
  const openAlerts = alerts.filter(a => a.status === 'open').length;

  // Calculate month-over-month changes
  const currentMonthTransactions = transactions.filter((t: any) => 
    new Date(t.created_at).getMonth() === new Date().getMonth() &&
    new Date(t.created_at).getFullYear() === new Date().getFullYear()
  );
  const previousMonthTransactions = transactions.filter((t: any) => {
    const date = new Date(t.created_at);
    const prevMonth = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1;
    const prevYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
  });

  const currentMonthVolume = currentMonthTransactions.reduce((sum: number, t: any) => 
    sum + Math.abs(parseFloat(t.amount) || 0), 0
  );
  const previousMonthVolume = previousMonthTransactions.reduce((sum: number, t: any) => 
    sum + Math.abs(parseFloat(t.amount) || 0), 0
  );

  const transactionChange = previousMonthTransactions.length > 0 
    ? ((currentMonthTransactions.length - previousMonthTransactions.length) / previousMonthTransactions.length * 100).toFixed(1)
    : '0.0';
  const volumeChange = previousMonthVolume > 0 
    ? ((currentMonthVolume - previousMonthVolume) / previousMonthVolume * 100).toFixed(1)
    : '0.0';

  const statsData = [
    { name: 'Total Clients', value: clients.length.toString(), change: '+12%', icon: Users, color: 'bg-blue-500' },
    { name: 'Active Accounts', value: activeAccounts.toString(), change: '+8%', icon: CreditCard, color: 'bg-green-500' },
    { 
      name: 'Monthly Transactions', 
      value: monthlyTransactions.toString(), 
      change: `${parseFloat(transactionChange) >= 0 ? '+' : ''}${transactionChange}%`, 
      icon: ArrowLeftRight, 
      color: 'bg-purple-500' 
    },
    { 
      name: 'Transaction Volume', 
      value: formatCurrency(totalVolume), 
      change: `${parseFloat(volumeChange) >= 0 ? '+' : ''}${volumeChange}%`, 
      icon: DollarSign, 
      color: 'bg-orange-500' 
    },
  ];

  const recentAlerts = [
    { id: 1, type: 'warning', message: `${pendingApprovals} high-value transactions require approval`, time: '5 min ago', action: () => navigate('/msb/transactions') },
    { id: 2, type: 'info', message: 'New client registration pending KYC', time: '15 min ago', action: () => navigate('/msb/clients') },
    { id: 3, type: 'critical', message: `${openAlerts} compliance alerts need attention`, time: '1 hour ago', action: () => navigate('/msb/compliance') },
    { id: 4, type: 'success', message: 'Monthly compliance report generated', time: '2 hours ago', action: () => navigate('/msb/compliance') },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Skeleton loading for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="stat-card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))
        ) : (
          statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${parseFloat(stat.change.replace('%', '')) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Transaction Volume</h3>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {chartData.length > 0 ? `${chartData[0].month} - ${chartData[chartData.length - 1].month}` : 'Last 6 months'}
              </span>
            </div>
          </div>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="space-y-4 w-full">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transaction Count Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Transaction Count</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {chartData.length > 0 ? `${chartData[0].month} - ${chartData[chartData.length - 1].month}` : 'Growth trend'}
              </span>
            </div>
          </div>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="space-y-4 w-full">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="transactions" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        {/* <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <button 
              onClick={() => navigate('/msb/compliance')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton loading for alerts
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 rounded-full mt-2 bg-gray-200 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))
            ) : (
              recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  onClick={alert.action}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'critical' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' :
                    alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                  </div>
                  <button className="text-xs text-gray-400 hover:text-gray-600">
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div> */}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {isLoading ? (
              // Skeleton loading for quick actions
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="w-full p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <button 
                  onClick={() => navigate('/msb/clients')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Add New Client</p>
                      <p className="text-xs text-gray-600">Register new account holder</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/msb/transactions')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <ArrowLeftRight className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Review Transactions</p>
                      <p className="text-xs text-gray-600">{pendingApprovals} pending approvals</p>
                    </div>
                  </div>
                </button>
                {/* <button 
                  onClick={() => navigate('/msb/compliance')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Compliance Report</p>
                      <p className="text-xs text-gray-600">Generate monthly report</p>
                    </div>
                  </div>
                </button> */}
                <button 
                  onClick={() => navigate('/msb/accounts')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Overview</p>
                      <p className="text-xs text-gray-600">View all client accounts</p>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}