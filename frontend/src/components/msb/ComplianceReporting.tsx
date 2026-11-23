import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  Download, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ComplianceAlert {
  id: string;
  type: 'suspicious_activity' | 'large_transaction' | 'kyc_review' | 'aml_flag' | 'sanctions_check';
  clientName: string;
  clientId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'resolved' | 'false_positive';
  createdAt: string;
  assignedTo?: string;
  amount?: number;
  transactionId?: string;
}

interface ComplianceReport {
  id: string;
  name: string;
  type: 'sar' | 'ctr' | 'kyc_summary' | 'transaction_monitoring' | 'risk_assessment';
  period: string;
  status: 'draft' | 'pending' | 'submitted' | 'approved';
  createdAt: string;
  submittedAt?: string;
  dueDate: string;
}

const mockAlerts: ComplianceAlert[] = [
  {
    id: 'ALT-001',
    type: 'suspicious_activity',
    clientName: 'David Thompson',
    clientId: '4',
    description: 'Multiple large cash deposits in short timeframe',
    severity: 'high',
    status: 'open',
    createdAt: '2024-01-15T10:30:00Z',
    amount: 45000,
    transactionId: 'TXN-003'
  },
  {
    id: 'ALT-002',
    type: 'large_transaction',
    clientName: 'Sarah Johnson',
    clientId: '1',
    description: 'International wire transfer exceeds threshold',
    severity: 'medium',
    status: 'under_review',
    createdAt: '2024-01-15T09:15:00Z',
    assignedTo: 'Compliance Officer',
    amount: 25000,
    transactionId: 'TXN-001'
  },
  {
    id: 'ALT-003',
    type: 'kyc_review',
    clientName: 'Emma Rodriguez',
    clientId: '3',
    description: 'KYC documentation requires annual review',
    severity: 'low',
    status: 'resolved',
    createdAt: '2024-01-14T14:20:00Z',
    assignedTo: 'KYC Team'
  },
  {
    id: 'ALT-004',
    type: 'aml_flag',
    clientName: 'Michael Chen',
    clientId: '2',
    description: 'Transaction pattern matches AML risk criteria',
    severity: 'critical',
    status: 'open',
    createdAt: '2024-01-14T11:45:00Z',
    amount: 125000
  }
];

const mockReports: ComplianceReport[] = [
  {
    id: 'RPT-001',
    name: 'Suspicious Activity Report - January 2024',
    type: 'sar',
    period: 'January 2024',
    status: 'pending',
    createdAt: '2024-01-15T00:00:00Z',
    dueDate: '2024-01-30T23:59:59Z'
  },
  {
    id: 'RPT-002',
    name: 'Currency Transaction Report - Q4 2023',
    type: 'ctr',
    period: 'Q4 2023',
    status: 'submitted',
    createdAt: '2024-01-01T00:00:00Z',
    submittedAt: '2024-01-10T00:00:00Z',
    dueDate: '2024-01-15T23:59:59Z'
  },
  {
    id: 'RPT-003',
    name: 'KYC Summary Report - December 2023',
    type: 'kyc_summary',
    period: 'December 2023',
    status: 'approved',
    createdAt: '2023-12-28T00:00:00Z',
    submittedAt: '2024-01-05T00:00:00Z',
    dueDate: '2024-01-10T23:59:59Z'
  }
];

const alertTrendData = [
  { month: 'Jul', alerts: 12, resolved: 10 },
  { month: 'Aug', alerts: 15, resolved: 13 },
  { month: 'Sep', alerts: 8, resolved: 8 },
  { month: 'Oct', alerts: 18, resolved: 15 },
  { month: 'Nov', alerts: 22, resolved: 19 },
  { month: 'Dec', alerts: 16, resolved: 14 },
  { month: 'Jan', alerts: 25, resolved: 18 }
];

const alertTypeData = [
  { name: 'Suspicious Activity', value: 35, color: '#ef4444' },
  { name: 'Large Transactions', value: 28, color: '#f97316' },
  { name: 'KYC Reviews', value: 20, color: '#eab308' },
  { name: 'AML Flags', value: 17, color: '#3b82f6' }
];

export default function ComplianceReporting() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>(mockAlerts);
  const [reports] = useState<ComplianceReport[]>(mockReports);
  const [activeTab, setActiveTab] = useState<'alerts' | 'reports' | 'analytics'>('alerts');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_positive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAlertStatusChange = (alertId: string, newStatus: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: newStatus as any } : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const openAlerts = alerts.filter(a => a.status === 'open').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const resolvedThisMonth = alerts.filter(a => a.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance & Reporting</h1>
          <p className="text-gray-600 mt-1">Monitor compliance alerts and generate regulatory reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
          <button className="btn-primary">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{openAlerts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{criticalAlerts}</p>
            </div>
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved This Month</p>
              <p className="text-2xl font-bold text-gray-900">{resolvedThisMonth}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Compliance Alerts
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Regulatory Reports
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-field"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_positive">False Positive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alerts Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{alert.id}</div>
                          <div className="text-sm text-gray-500">{alert.description}</div>
                          <div className="text-xs text-gray-400 capitalize mt-1">
                            {alert.type.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{alert.clientName}</div>
                        <div className="text-sm text-gray-500">ID: {alert.clientId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status.replace('_', ' ')}
                        </span>
                        {alert.assignedTo && (
                          <div className="text-xs text-gray-500 mt-1">
                            Assigned to: {alert.assignedTo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {alert.amount ? (
                          <div className="text-sm font-medium text-gray-900">
                            ${alert.amount.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {alert.status === 'open' && (
                            <button
                              onClick={() => handleAlertStatusChange(alert.id, 'under_review')}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Start Review"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          {(alert.status === 'open' || alert.status === 'under_review') && (
                            <button
                              onClick={() => handleAlertStatusChange(alert.id, 'resolved')}
                              className="text-green-600 hover:text-green-800"
                              title="Mark Resolved"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-500">{report.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 uppercase">{report.type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{report.period}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReportStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(report.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert Trends */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Alert Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={alertTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="alerts" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="New Alerts"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Alert Types Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Alert Types Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={alertTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {alertTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Resolution Time</p>
                  <p className="text-2xl font-bold text-gray-900">2.3 days</p>
                  <p className="text-sm text-green-600">-15% from last month</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">False Positive Rate</p>
                  <p className="text-2xl font-bold text-gray-900">12%</p>
                  <p className="text-sm text-red-600">+3% from last month</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                  <p className="text-sm text-green-600">+2% from last month</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}