import { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  CreditCard,
  Activity
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 125000, transactions: 1250, clients: 45 },
  { month: 'Feb', revenue: 142000, transactions: 1420, clients: 52 },
  { month: 'Mar', revenue: 138000, transactions: 1380, clients: 48 },
  { month: 'Apr', revenue: 165000, transactions: 1650, clients: 58 },
  { month: 'May', revenue: 178000, transactions: 1780, clients: 62 },
  { month: 'Jun', revenue: 195000, transactions: 1950, clients: 67 },
  { month: 'Jul', revenue: 210000, transactions: 2100, clients: 73 },
  { month: 'Aug', revenue: 225000, transactions: 2250, clients: 78 },
  { month: 'Sep', revenue: 240000, transactions: 2400, clients: 85 },
  { month: 'Oct', revenue: 258000, transactions: 2580, clients: 92 },
  { month: 'Nov', revenue: 275000, transactions: 2750, clients: 98 },
  { month: 'Dec', revenue: 290000, transactions: 2900, clients: 105 }
];

const transactionVolumeData = [
  { date: '2024-01-01', domestic: 45000, international: 25000, total: 70000 },
  { date: '2024-01-02', domestic: 52000, international: 28000, total: 80000 },
  { date: '2024-01-03', domestic: 48000, international: 22000, total: 70000 },
  { date: '2024-01-04', domestic: 65000, international: 35000, total: 100000 },
  { date: '2024-01-05', domestic: 58000, international: 32000, total: 90000 },
  { date: '2024-01-06', domestic: 72000, international: 38000, total: 110000 },
  { date: '2024-01-07', domestic: 68000, international: 42000, total: 110000 }
];

const clientSegmentData = [
  { name: 'Individual', value: 65, color: '#3b82f6', count: 1850 },
  { name: 'Small Business', value: 25, color: '#22c55e', count: 712 },
  { name: 'Corporate', value: 8, color: '#f97316', count: 228 },
  { name: 'High Net Worth', value: 2, color: '#8b5cf6', count: 57 }
];

const geographicData = [
  { country: 'United States', transactions: 45, volume: 2500000 },
  { country: 'Canada', transactions: 28, volume: 1800000 },
  { country: 'United Kingdom', transactions: 15, volume: 950000 },
  { country: 'Germany', transactions: 8, volume: 520000 },
  { country: 'Australia', transactions: 4, volume: 280000 }
];

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const currentMonthRevenue = 290000;
  const previousMonthRevenue = 275000;
  const revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1);

  const currentMonthTransactions = 2900;
  const previousMonthTransactions = 2750;
  const transactionGrowth = ((currentMonthTransactions - previousMonthTransactions) / previousMonthTransactions * 100).toFixed(1);

  const currentMonthClients = 105;
  const previousMonthClients = 98;
  const clientGrowth = ((currentMonthClients - previousMonthClients) / previousMonthClients * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${currentMonthRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+{revenueGrowth}%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonthTransactions.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+{transactionGrowth}%</span>
              </div>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonthClients}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+{clientGrowth}%</span>
              </div>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900">$1,250</p>
              <div className="flex items-center mt-1">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">-2.3%</span>
              </div>
            </div>
            <CreditCard className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Revenue and Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+18.5% YoY</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Volume */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Transaction Volume</h3>
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={transactionVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Area 
                type="monotone" 
                dataKey="domestic" 
                stackId="1"
                stroke="#22c55e" 
                fill="#22c55e"
                fillOpacity={0.8}
              />
              <Area 
                type="monotone" 
                dataKey="international" 
                stackId="1"
                stroke="#f97316" 
                fill="#f97316"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Client Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Segments */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Segments</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={clientSegmentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {clientSegmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {clientSegmentData.map((segment, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: segment.color }}
                  />
                  <span>{segment.name}</span>
                </div>
                <span className="font-medium">{segment.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Geographic Distribution</h3>
          <div className="space-y-4">
            {geographicData.map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{country.country}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {country.transactions}% of transactions
                    </div>
                    <div className="text-sm text-gray-500">
                      ${country.volume.toLocaleString()} volume
                    </div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${country.transactions * 2}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Performance Indicators */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Performance Indicators</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Client Acquisition Rate</span>
                <span className="text-sm font-bold text-gray-900">7.1%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '71%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Transaction Success Rate</span>
                <span className="text-sm font-bold text-gray-900">98.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '98.5%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Client Retention Rate</span>
                <span className="text-sm font-bold text-gray-900">94.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94.2%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Average Processing Time</span>
                <span className="text-sm font-bold text-gray-900">1.2s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Compliance Score</span>
                <span className="text-sm font-bold text-gray-900">96.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '96.8%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}