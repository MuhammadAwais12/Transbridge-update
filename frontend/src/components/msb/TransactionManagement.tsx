import { useState } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Eye,
  MoreVertical,
  TrendingUp,
  DollarSign,
  MapPin,
  User,
  X,
  Check,
  AlertCircle as AlertIcon
} from 'lucide-react';
import { useMSBTransactions, manuallyCompleteTransaction } from '../../hooks/useDatabase';
import { notAvailable } from '../../lib/notAvailable';
import { formatCurrency, formatTransactionAmount } from '../../lib/formatters';

export default function TransactionManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { transactions, loading, error, total, totalPages, refetch } = useMSBTransactions(currentPage, pageSize, statusFilter !== 'all' ? statusFilter : undefined, typeFilter !== 'all' ? typeFilter : undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const [actionError, setActionError] = useState('');

  const showActionError = (error: unknown) => {
    setActionError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    setTimeout(() => setActionError(''), 6000);
  };

  // Transaction management functions. The backend has no routes for these yet
  // (PUT /transaction/approve|reject|update-status/:id), so they fail with a clear message.
  const approveTransaction = async (transactionId: string) => {
    notAvailable('Approving transactions', `PUT /transaction/approve/${transactionId}`);
  };

  const rejectTransaction = async (transactionId: string, _reason?: string) => {
    notAvailable('Rejecting transactions', `PUT /transaction/reject/${transactionId}`);
  };

  const updateTransactionStatus = async (transactionId: string, _status: string, _reason?: string) => {
    notAvailable('Changing transaction status', `PUT /transaction/update-status/${transactionId}`);
  };

  const handleManualComplete = async (transactionId: string) => {
    setActionLoading(transactionId);
    try {
      await manuallyCompleteTransaction({ transaction_id: transactionId });
      showSuccessMessage('Transaction manually completed successfully');
      refetch();
    } catch (error) {
      console.error('Error manually completing transaction:', error);
      alert(`Failed to manually complete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string, category: string) => {
    switch (category) {
      case 'transfer': return <ArrowLeftRight className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'deposit': return <TrendingUp className="w-4 h-4" />;
      case 'withdrawal': return <ArrowLeftRight className="w-4 h-4" />;
      default: return <ArrowLeftRight className="w-4 h-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const handleApprove = async (transactionId: string) => {
    setActionLoading(transactionId);
    try {
      await approveTransaction(transactionId);
      showSuccessMessage('Transaction approved successfully');
      refetch();
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      showActionError(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (transactionId: string, reason?: string) => {
    setActionLoading(transactionId);
    try {
      await rejectTransaction(transactionId, reason);
      showSuccessMessage('Transaction rejected successfully');
      setShowRejectModal(false);
      setRejectReason('');
      refetch();
    } catch (error) {
      console.error('Failed to reject transaction:', error);
      showActionError(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (transactionId: string, status: string, reason?: string) => {
    setActionLoading(transactionId);
    try {
      await updateTransactionStatus(transactionId, status, reason);
      showSuccessMessage(`Transaction ${status} successfully`);
      refetch();
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      showActionError(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: string, transactionIds: string[]) => {
    for (const id of transactionIds) {
      switch (action) {
        case 'approve':
          await approveTransaction(id);
          break;
        case 'reject':
          await rejectTransaction(id, 'Bulk rejection');
          break;
        case 'complete':
          await updateTransactionStatus(id, 'completed');
          break;
      }
    }
    showSuccessMessage(`Bulk ${action} completed for ${transactionIds.length} transactions`);
    refetch();
  };

  const exportTransactions = () => {
    const dataToExport = filteredTransactions;
    
    // Create CSV content
    const headers = ['Transaction Number', 'Client', 'Type', 'Amount', 'Description', 'Status', 'Date', 'Risk Score'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(txn => [
        `"${txn.transaction_number}"`,
        `"${txn.client_info?.name || `${txn.clients?.first_name} ${txn.clients?.last_name}`}"`,
        `"${txn.category}"`,
        `"${txn.amount}"`,
        `"${txn.description}"`,
        `"${txn.status}"`,
        `"${new Date(txn.created_at).toLocaleDateString()}"`,
        `"${txn.risk_score}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSuccessMessage(`Exported ${dataToExport.length} transactions`);
  };

  // Client-side search filtering (status and type are handled server-side)
  const filteredTransactions = transactions.filter(txn => {
    if (!searchTerm) return true;
    
    const clientName = `${txn.client_info?.name || txn.clients?.first_name || ''} ${txn.clients?.last_name || ''}`.toLowerCase();
    const matchesSearch = clientName.includes(searchTerm.toLowerCase()) ||
                         txn.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const pendingCount = transactions.filter(t => t.status === 'pending' && t.requires_approval).length;
  const todayVolume = transactions
    .filter(t => new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const highRiskCount = transactions.filter(t => t.risk_score >= 70).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading transactions: {error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Action error (fixed so it shows above the detail / reject modals; outside space-y so the layout doesn't shift) */}
      {actionError && (
        <div role="alert" className="fixed top-4 right-4 z-[60] max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <AlertIcon className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-800 flex-1">{actionError}</p>
            <button onClick={() => setActionError('')} className="ml-3 text-red-400 hover:text-red-600" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600 mt-1">Monitor and approve client transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={exportTransactions}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(todayVolume)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>
            <ArrowLeftRight className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-gray-900">{highRiskCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
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
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Types</option>
                  <option value="transfer">Transfer</option>
                  <option value="payment">Payment</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="fee">Fee</option>
                  <option value="interest">Interest</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
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

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {getTypeIcon(transaction.type, transaction.category)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{transaction.transaction_number}</div>
                        <div className="text-sm text-gray-500">{transaction.description}</div>
                        {transaction.flags && transaction.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {transaction.flags.map((flag: string, index: number) => (
                              <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
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
                          {transaction.client_info?.name || `${transaction.clients?.first_name} ${transaction.clients?.last_name}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.main_account?.account_name} ({transaction.main_account?.account_number})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTransactionAmount(transaction.amount, transaction.type)} {transaction.currency}
                    </div>
                    {transaction.location && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {transaction.location}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                    {transaction.requires_approval && transaction.status === 'pending' && (
                      <div className="text-xs text-yellow-600 mt-1">Requires Approval</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getRiskColor(transaction.risk_score)}`}>
                      {transaction.risk_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* {transaction.status === 'pending' && transaction.requires_approval && (
                        <>
                          <button
                            onClick={() => handleApprove(transaction.id)}
                            disabled={actionLoading === transaction.id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === transaction.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowRejectModal(true);
                            }}
                            disabled={actionLoading === transaction.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )} */}
                      {/* {transaction.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(transaction.id, 'completed')}
                          disabled={actionLoading === transaction.id}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Mark as Completed"
                        >
                          {actionLoading === transaction.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )} */}
                      {/* {transaction.status === 'payout_pending' && (
                        <button
                          onClick={() => handleManualComplete(transaction.id)}
                          disabled={actionLoading === transaction.id}
                          className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
                          title="Manually Complete (Webhook Fix)"
                        >
                          {actionLoading === transaction.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )} */}
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          {transaction.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(transaction.id, 'cancelled', 'Cancelled by admin')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Cancel Transaction
                              </button>
                            </>
                          )}
                          {/* {transaction.status === 'completed' && (
                            <button
                              onClick={() => handleStatusChange(transaction.id, 'failed', 'Marked as failed')}
                              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              Mark as Failed
                            </button>
                          )} */}
                          <button
                            onClick={() => {
                              // Export single transaction
                              const csvContent = `Transaction Number,Client,Type,Amount,Description,Status,Date\n"${transaction.transaction_number}","${transaction.client_info?.name || `${transaction.clients?.first_name} ${transaction.clients?.last_name}`}","${transaction.category}","${transaction.amount}","${transaction.description}","${transaction.status}","${new Date(transaction.created_at).toLocaleDateString()}"`;
                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `transaction_${transaction.transaction_number}.csv`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reject Transaction</h3>
                  <p className="text-sm text-gray-600">
                    {selectedTransaction.transaction_number}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The client will be notified of this rejection and the reason provided.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={actionLoading === selectedTransaction.id}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedTransaction.id, rejectReason)}
                  disabled={actionLoading === selectedTransaction.id}
                  className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedTransaction.id ? 'Rejecting...' : 'Reject Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && !showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Transaction Header */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                    {getTypeIcon(selectedTransaction.type, selectedTransaction.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{selectedTransaction.description}</h4>
                    <p className="text-sm text-gray-600">{selectedTransaction.transaction_number}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {selectedTransaction.category}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getRiskColor(selectedTransaction.risk_score)}`}>
                        Risk: {selectedTransaction.risk_score}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatTransactionAmount(selectedTransaction.amount, selectedTransaction.type)}
                    </p>
                    <p className="text-sm text-gray-600">{selectedTransaction.currency}</p>
                  </div>
                </div>

                {/* Transaction Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.client_info?.name || `${selectedTransaction.clients?.first_name} ${selectedTransaction.clients?.last_name}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.main_account?.account_name} ({selectedTransaction.main_account?.account_number})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.reference || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {selectedTransaction.payment_method?.replace('_', ' ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedTransaction.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Balance After</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.balance_after 
                        ? formatCurrency(selectedTransaction.balance_after)
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {selectedTransaction.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedTransaction.location}
                    </p>
                  </div>
                )}

                {selectedTransaction.merchant && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Merchant</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.merchant}</p>
                  </div>
                )}

                {selectedTransaction.flags && selectedTransaction.flags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Risk Flags</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedTransaction.flags.map((flag: string, index: number) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTransaction.approved_by && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approved/Rejected By</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTransaction.approved_by}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Action Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedTransaction.approved_at ? new Date(selectedTransaction.approved_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedTransaction.status === 'pending' && selectedTransaction.requires_approval && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleApprove(selectedTransaction.id);
                        setSelectedTransaction(null);
                      }}
                      disabled={actionLoading === selectedTransaction.id}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Transaction
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading === selectedTransaction.id}
                      className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Transaction
                    </button>
                  </div>
                )}

                {selectedTransaction.status === 'approved' && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleStatusChange(selectedTransaction.id, 'completed');
                        setSelectedTransaction(null);
                      }}
                      disabled={actionLoading === selectedTransaction.id}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}