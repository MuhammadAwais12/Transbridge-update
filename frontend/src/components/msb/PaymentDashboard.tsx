import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  Clock, 
  X,
  Filter,
  Search,
  Download,
  RefreshCw,
  Globe,
  CreditCard,
  Loader
} from 'lucide-react';
import { usePaymentProviders } from '../../hooks/usePaymentProviders';
import { useBranding } from '../../contexts/BrandingContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data for charts
const paymentVolumeData = [
  { date: '2024-01-01', volume: 125000 },
  { date: '2024-01-02', volume: 98000 },
  { date: '2024-01-03', volume: 132000 },
  { date: '2024-01-04', volume: 87000 },
  { date: '2024-01-05', volume: 142000 },
  { date: '2024-01-06', volume: 110000 },
  { date: '2024-01-07', volume: 95000 }
];

const paymentsByProviderData = [
  { provider: 'Bridge', count: 156, volume: 1250000 },
  { provider: 'BlindPay', count: 89, volume: 750000 },
  { provider: 'Routefusion', count: 45, volume: 500000 }
];

// Mock data for recent payments
const recentPayments = [
  {
    id: 'pmt-001',
    provider: 'Bridge',
    amount: 12500.00,
    currency: 'USD',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    description: 'International wire transfer',
    beneficiary: 'Global Supplies Ltd',
    reference: 'INV-2024-001'
  },
  {
    id: 'pmt-002',
    provider: 'BlindPay',
    amount: 8750.50,
    currency: 'EUR',
    status: 'pending',
    createdAt: '2024-01-15T09:15:00Z',
    description: 'SEPA payment',
    beneficiary: 'European Ventures GmbH',
    reference: 'SEPA-2024-001'
  },
  {
    id: 'pmt-003',
    provider: 'Routefusion',
    amount: 15000.00,
    currency: 'MXN',
    status: 'failed',
    createdAt: '2024-01-14T16:45:00Z',
    description: 'International payment',
    beneficiary: 'Mexican Imports SA de CV',
    reference: 'MEX-2024-001'
  },
  {
    id: 'pmt-004',
    provider: 'Bridge',
    amount: 5000.00,
    currency: 'USD',
    status: 'completed',
    createdAt: '2024-01-14T14:20:00Z',
    description: 'Domestic ACH transfer',
    beneficiary: 'US Suppliers Inc',
    reference: 'ACH-2024-001'
  }
];

export default function PaymentDashboard() {
  const { branding } = useBranding();
  const { providers, loading } = usePaymentProviders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'bridge':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'blindpay':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'routefusion':
        return <Globe className="w-4 h-4 text-purple-600" />;
      default:
        return <ArrowLeftRight className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredPayments = recentPayments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesProvider = providerFilter === 'all' || payment.provider.toLowerCase() === providerFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // In production, this would refresh data from the API
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage payment operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
          >
            {isRefreshing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Refresh</span>
          </button>
          <button className="btn-primary">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            New Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume (7d)</p>
              <p className="text-2xl font-bold text-gray-900">$789,000</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions (7d)</p>
              <p className="text-2xl font-bold text-gray-900">290</p>
            </div>
            <ArrowLeftRight className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Payments</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Volume Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Volume</h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={paymentVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke={branding.primaryColor} 
                strokeWidth={3}
                dot={{ fill: branding.primaryColor, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payments by Provider Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Payments by Provider</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Last 30 days</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentsByProviderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis />
              <Bar dataKey="volume" fill={branding.accentColor} name="Volume" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Providers</option>
              <option value="bridge">Bridge</option>
              <option value="blindpay">BlindPay</option>
              <option value="routefusion">Routefusion</option>
            </select>
            <button className="btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beneficiary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{payment.reference}</div>
                    <div className="text-sm text-gray-500">{payment.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getProviderIcon(payment.provider)}
                      <span className="ml-2 text-sm text-gray-900">{payment.provider}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.currency === 'USD' ? '$' : 
                       payment.currency === 'EUR' ? '€' : 
                       payment.currency === 'GBP' ? '£' : 
                       payment.currency === 'MXN' ? 'MX$' : ''}
                      {payment.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{payment.currency}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{payment.beneficiary}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center">
          <button className="btn-secondary">
            View All Payments
          </button>
        </div>
      </div>
    </div>
  );
}