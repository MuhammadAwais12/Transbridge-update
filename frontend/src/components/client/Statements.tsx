import { useState } from 'react';
import { useBranding } from '../../contexts/BrandingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAccounts } from '../../hooks/useDatabase';
import { 
  Download, 
  Calendar, 
  FileText, 
  Eye, 
  Filter,
  Search,
  Mail,
  Archive,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  TrendingUp,
  Building2,
  Globe,
  Loader,
  X,
  Check
} from 'lucide-react';

interface Statement {
  id: string;
  accountId: string;
  accountName: string;
  accountNumber: string;
  period: {
    start: string;
    end: string;
  };
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  status: 'available' | 'generating' | 'archived';
  fileSize: string;
  transactionCount: number;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  generatedAt: string;
  downloadCount: number;
}

const mockStatements: Statement[] = [
  {
    id: 'STMT-001',
    accountId: 'ACC-001',
    accountName: 'Primary Checking',
    accountNumber: '****1234',
    period: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    type: 'monthly',
    status: 'available',
    fileSize: '2.4 MB',
    transactionCount: 45,
    openingBalance: 8500.00,
    closingBalance: 12450.00,
    totalCredits: 5200.00,
    totalDebits: 1250.00,
    generatedAt: '2024-02-01T00:00:00Z',
    downloadCount: 3
  },
  {
    id: 'STMT-002',
    accountId: 'ACC-002',
    accountName: 'High Yield Savings',
    accountNumber: '****5678',
    period: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    type: 'monthly',
    status: 'available',
    fileSize: '1.8 MB',
    transactionCount: 8,
    openingBalance: 25000.00,
    closingBalance: 25890.50,
    totalCredits: 890.50,
    totalDebits: 0,
    generatedAt: '2024-02-01T00:00:00Z',
    downloadCount: 1
  }
];

export default function Statements() {
  const { branding } = useBranding();
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const [statements] = useState<Statement[]>(mockStatements);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [generateForm, setGenerateForm] = useState({
    accountId: '',
    type: 'custom' as 'monthly' | 'quarterly' | 'annual' | 'custom',
    startDate: '',
    endDate: '',
    format: 'pdf',
    includeImages: true,
    emailCopy: false
  });

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'current': return <CreditCard className="w-4 h-4" />;
      case 'savings': return <TrendingUp className="w-4 h-4" />;
      case 'multi_currency': return <Globe className="w-4 h-4" />;
      case 'business': return <Building2 className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'generating': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const filteredStatements = statements.filter(stmt => {
    const matchesSearch = stmt.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stmt.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stmt.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccount === 'all' || stmt.accountId === selectedAccount;
    const matchesType = selectedType === 'all' || stmt.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || stmt.status === selectedStatus;
    
    return matchesSearch && matchesAccount && matchesType && matchesStatus;
  });

  const handleDownload = async (statement: Statement) => {
    try {
      // In a real app, this would download the actual file
      // For demo purposes, we'll simulate the download
      showSuccessMessage(`Statement ${statement.id} downloaded successfully`);
      
      // Create a mock PDF blob for demonstration
      const pdfContent = `Statement for ${statement.accountName} (${statement.period.start} to ${statement.period.end})`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement_${statement.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      showErrorMessage('Failed to download statement');
    }
  };

  const handleEmail = async (statement: Statement) => {
    try {
      // In a real app, this would send an email
      showSuccessMessage(`Statement ${statement.id} sent to your email address`);
    } catch (err: any) {
      showErrorMessage('Failed to send statement via email');
    }
  };

  const handleGenerateStatement = async () => {
    if (!generateForm.accountId || !generateForm.startDate || !generateForm.endDate) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // In a real app, this would create a statement generation request
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      // Create statement record in database
      // const { data: clientData, error: clientError } = await supabase
      //   .from('clients')
      //   .select('id')
      //   .eq('user_id', user?.id)
      //   .single();

      // if (clientError) throw clientError;

      const selectedAccountData = accounts.find(acc => acc.id === generateForm.accountId);
      
      // await supabase
      //   .from('account_statements')
      //   .insert([{
      //     account_id: generateForm.accountId,
      //     client_id: clientData.id,
      //     msb_id: user?.msbId,
      //     statement_number: `STMT-${Date.now()}`,
      //     period_start: generateForm.startDate,
      //     period_end: generateForm.endDate,
      //     type: generateForm.type,
      //     status: 'generating',
      //     transaction_count: Math.floor(Math.random() * 50) + 10,
      //     opening_balance: selectedAccountData?.balance || 0,
      //     closing_balance: (selectedAccountData?.balance || 0) + Math.random() * 1000,
      //     total_credits: Math.random() * 5000,
      //     total_debits: Math.random() * 3000
      //   }]);

      if (generateForm.emailCopy) {
        // Send email notification
        // await supabase
        //   .from('notifications')
        //   .insert([{
        //     user_id: user?.id,
        //     msb_id: user?.msbId,
        //     type: 'statement_generated',
        //     title: 'Statement Generated',
        //     message: `Your custom statement for ${selectedAccountData?.account_name} has been generated and will be emailed to you.`,
        //     data: {
        //       account_id: generateForm.accountId,
        //       period_start: generateForm.startDate,
        //       period_end: generateForm.endDate
        //     },
        //     read: false
        //   }]);
      }

      setShowGenerateModal(false);
      setGenerateForm({
        accountId: '',
        type: 'custom',
        startDate: '',
        endDate: '',
        format: 'pdf',
        includeImages: true,
        emailCopy: false
      });
      
      showSuccessMessage('Statement generation initiated. You will be notified when it\'s ready.');
    } catch (err: any) {
      console.error('Statement generation error:', err);
      showErrorMessage(err.message || 'Failed to generate statement');
    } finally {
      setGenerating(false);
    }
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Statements</h1>
          <p className="text-gray-600 mt-1">Download and manage your account statements</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Statement
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Statements</p>
              <p className="text-2xl font-bold text-gray-900">
                {statements.filter(s => s.status === 'available').length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {statements.filter(s => 
                  new Date(s.period.end).getMonth() === new Date().getMonth() &&
                  new Date(s.period.end).getFullYear() === new Date().getFullYear()
                ).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">
                {statements.reduce((sum, s) => sum + s.downloadCount, 0)}
              </p>
            </div>
            <Download className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Generating</p>
              <p className="text-2xl font-bold text-gray-900">
                {statements.filter(s => s.status === 'generating').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
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
                placeholder="Search statements..."
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
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Types</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="generating">Generating</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedAccount('all');
                    setSelectedType('all');
                    setSelectedStatus('all');
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

      {/* Statements List */}
      <div className="card">
        <div className="space-y-4">
          {filteredStatements.map((statement) => (
            <div 
              key={statement.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {getAccountTypeIcon('current')}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{statement.accountName}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(statement.status)}`}>
                      {statement.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(statement.period.start).toLocaleDateString()} - {new Date(statement.period.end).toLocaleDateString()}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span>{statement.transactionCount} transactions</span>
                    <span>{statement.fileSize}</span>
                    <span>Downloaded {statement.downloadCount} times</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {statement.status === 'available' && (
                  <>
                    <button
                      onClick={() => setSelectedStatement(statement)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEmail(statement)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                      title="Email Statement"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(statement)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
                {statement.status === 'generating' && (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Generating...</span>
                  </div>
                )}
                {statement.status === 'archived' && (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Archive className="w-4 h-4" />
                    <span className="text-sm">Archived</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement Details Modal */}
      {selectedStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Statement Details</h3>
                <button
                  onClick={() => setSelectedStatement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statement ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStatement.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStatement.accountName} ({selectedStatement.accountNumber})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Period</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedStatement.period.start).toLocaleDateString()} - {new Date(selectedStatement.period.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedStatement.type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Opening Balance</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      ${selectedStatement.openingBalance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Closing Balance</label>
                    <p className="mt-1 text-lg font-semibold" style={{ color: branding.secondaryColor }}>
                      ${selectedStatement.closingBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Credits</label>
                    <p className="mt-1 text-sm font-medium text-green-600">
                      +${selectedStatement.totalCredits.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Debits</label>
                    <p className="mt-1 text-sm font-medium text-red-600">
                      -${selectedStatement.totalDebits.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transactions</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStatement.transactionCount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Size</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStatement.fileSize}</p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t">
                  <button 
                    onClick={() => handleDownload(selectedStatement)}
                    className="btn-primary flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                  <button 
                    onClick={() => handleEmail(selectedStatement)}
                    className="btn-secondary flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Statement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Statement Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Generate Custom Statement</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
                  <select
                    value={generateForm.accountId}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, accountId: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} ({account.account_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={generateForm.startDate}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input
                      type="date"
                      value={generateForm.endDate}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <select
                    value={generateForm.format}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, format: e.target.value }))}
                    className="input-field"
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generateForm.includeImages}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, includeImages: e.target.checked }))}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm text-gray-700">Include transaction images</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generateForm.emailCopy}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, emailCopy: e.target.checked }))}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm text-gray-700">Email a copy to my registered email</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="btn-secondary flex-1"
                    disabled={generating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateStatement}
                    disabled={generating || !generateForm.accountId || !generateForm.startDate || !generateForm.endDate}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Statement'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}