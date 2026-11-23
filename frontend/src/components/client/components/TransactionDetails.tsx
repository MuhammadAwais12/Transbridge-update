import React, { useEffect, useRef, useState } from "react";
import { Copy, RefreshCcw, X, XCircle } from "lucide-react";
import { API_BASE_URL } from "../../../lib/apiBase";
import { PayinTransaction } from "../../../api/types";

interface TransactionDetailsProps {
    onChange: () => void;
    status?: string;
    transactionId?: string; // Add transaction ID prop
}

const TransactionDetails: React.FC<TransactionDetailsProps> = 
    ({
        onChange,
        status,
        transactionId
    }) =>{
    const [method, setMethod] = useState<'ACH'|'Wire'|'RTP'>('ACH');
    const [transaction, setTransaction] = useState<PayinTransaction | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch transaction data
    const fetchTransaction = async () => {
        console.log('TransactionDetails: fetchTransaction called with transactionId:', transactionId);
        if (!transactionId) {
            console.log('TransactionDetails: No transactionId provided');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/transaction/${transactionId}/payin`, {
                headers: {
                    'accept': '*/*',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch transaction: ${response.status}`);
            }
            
            const data: PayinTransaction = await response.json();
            console.log('TransactionDetails: API response:', data);
            setTransaction(data);
        } catch (err) {
            console.error('Error fetching transaction:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transaction');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransaction();
    }, [transactionId]);

    // Format amount for display
    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount / 100); // Assuming amount is in cents
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status display
    const getStatusDisplay = () => {
        if (!status) return { text: 'Loading...', color: 'text-slate-500' };
        switch (status) {
                case 'completed': return { text: 'Completed', color: 'text-green-600' };
                case 'pending':
                case 'payin_pending':
                case 'payout_pending':
                    return { text: 'Pending', color: 'text-yellow-600' };
                case 'failed':
                case 'payin_failed':
                case 'payout_failed':
                    return { text: 'Failed', color: 'text-red-600' };
                case 'cancelled': return 'bg-gray-100 text-gray-800';
                default:  return { text: status, color: 'text-slate-600' };
            }
    };

    // Get status message
    const getStatusMessage = () => {
        if (!transaction) return 'Loading transaction details...';
        
        const status = transaction.status;
        switch (status) {
            case 'completed':
                return 'Transaction completed successfully';
            case 'processing':
                return 'Waiting for money arrival...';
            case 'pending':
                return 'Transaction is pending confirmation';
            case 'failed':
                return 'Transaction failed';
            default:
                return 'Processing transaction...';
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
      return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2">
        <div className="text-sm text-slate-500 font-medium">{label}</div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <div className="text-sm text-slate-900 break-all">{value}</div>
        </div>
      </div>
      );
    };

    // Loading state
    if (loading) {
        return (
            <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Loading...</h2>
                        <button
                            onClick={onChange}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Error</h2>
                        <button
                            onClick={onChange}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button
                        onClick={fetchTransaction}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // No transaction data
    if (!transaction) {
        return (
            <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">No Transaction</h2>
                        <button
                            onClick={onChange}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-slate-600">No transaction data available.</p>
                </div>
            </div>
        );
    }

    const statusDisplay = getStatusDisplay();

    return (
    <div>
        <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Onramp</h2>
                <button
                onClick={onChange}
                className="text-gray-400 hover:text-gray-600"
                >
                <XCircle className="w-6 h-6" />
                </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
                A payin to <span className="font-medium">{transaction.name}</span> was initiated on{' '}
                <span className="font-medium">{formatDate(transaction.created_at)}</span>
            </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-slate-900">Follow the instructions below</h3>
                <ol className="mt-3 space-y-4 list-decimal list-inside text-sm text-slate-700">
                <li>
                    Initiate a transfer with <span className="font-semibold">{formatAmount(transaction.sender_amount, transaction.currency)}</span> amount using your external bank.
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-1">
                    <div className="flex items-center justify-between border bg-white px-3 py-2">
                        <span className="text-slate-500 text-xs">Sender amount</span>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                            <UsFlag/> {formatAmount(transaction.sender_amount, transaction.currency)}
                        </div>
                    </div>
                    <div className="flex items-center justify-between border bg-white px-3 py-2">
                        <span className="text-slate-500 text-xs">Receiver amount</span>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 text-blue-600">
                            <CryptoIcon/> {transaction.receiver_amount / 100} {transaction.token}
                        </div>
                    </div>
                    </div>
                </li>
                <li>
                    Use these details to initiate a transaction from your external bank.
                    <div className="mt-3 rounded-xl border bg-slate-50">
                    {/* Tabs */}
                    <div className="flex gap-2 py-2 px-4">
                        <div className="bg-gray-200 py-1 px-1">
                        {(['ACH','Wire','RTP'] as const).map(t => (
                            <button
                            key={t}
                            onClick={() => setMethod(t)}
                            className={`px-3 py-1.5 text-sm border rounded transition ${method===t ? 'bg-slate-100 border-slate-100 shadow-sm text-slate-900' : 'bg-transparent border-transparent hover:bg-white/60 text-slate-600'}`}
                            >
                            {t}
                            </button>
                        ))}
                        </div>
                    </div>
                    {/* Details */}
                    <div className="px-4 pb-2">
                        <div className="rounded-xl">
                        <div className="p-4">
                            {method === 'ACH' && (
                            <div>
                                <InfoRow label="Account number" value={transaction.blindpay_bank_details.ach.account_number} />
                                <InfoRow label="Routing number" value={transaction.blindpay_bank_details.ach.routing_number} />
                                <InfoRow label="Account type" value={transaction.blindpay_bank_details.account_type} />
                                <InfoRow label="Beneficiary" value={<>
                                {transaction.blindpay_bank_details.beneficiary.name}<br/>
                                {transaction.blindpay_bank_details.beneficiary.address_line_1}<br/>
                                {transaction.blindpay_bank_details.beneficiary.address_line_2}
                                </>} />
                                <InfoRow label="Receiving bank" value={<>
                                {transaction.blindpay_bank_details.receiving_bank.name}<br/>
                                {transaction.blindpay_bank_details.receiving_bank.address_line_1}<br/>
                                {transaction.blindpay_bank_details.receiving_bank.address_line_2}
                                </>} />
                            </div>
                            )}
                            {method === 'Wire' && (
                                <div>
                                <InfoRow label="Account number" value={transaction.blindpay_bank_details.wire.account_number} />
                                <InfoRow label="Routing number" value={transaction.blindpay_bank_details.wire.routing_number} />
                                <InfoRow label="SWIFT / BIC Code" value={transaction.blindpay_bank_details.swift_bic_code} />
                                <InfoRow label="Account type" value={transaction.blindpay_bank_details.account_type} />
                                <InfoRow label="Beneficiary" value={
                                        <>
                                        {transaction.blindpay_bank_details.beneficiary.name}<br/>
                                        {transaction.blindpay_bank_details.beneficiary.address_line_1}<br/>
                                        {transaction.blindpay_bank_details.beneficiary.address_line_2}
                                        </>
                                    } 
                                    />
                                <InfoRow label="Receiving bank" value={<>
                                    {transaction.blindpay_bank_details.receiving_bank.name}<br/>
                                    {transaction.blindpay_bank_details.receiving_bank.address_line_1}<br/>
                                    {transaction.blindpay_bank_details.receiving_bank.address_line_2}
                                </>} />
                                </div>
                            )}
                            {method === 'RTP' && (
                            <div>
                                <InfoRow label="Account number" value={transaction.blindpay_bank_details.rtp.account_number} />
                                <InfoRow label="Routing number" value={transaction.blindpay_bank_details.rtp.routing_number} />
                                <InfoRow label="Account type" value={transaction.blindpay_bank_details.account_type} />
                                <InfoRow label="Beneficiary" value={<>
                                {transaction.blindpay_bank_details.beneficiary.name}<br/>
                                {transaction.blindpay_bank_details.beneficiary.address_line_1}<br/>
                                {transaction.blindpay_bank_details.beneficiary.address_line_2}
                                </>} />
                                <InfoRow label="Receiving bank" value={<>
                                {transaction.blindpay_bank_details.receiving_bank.name}<br/>
                                {transaction.blindpay_bank_details.receiving_bank.address_line_1}<br/>
                                {transaction.blindpay_bank_details.receiving_bank.address_line_2}
                                </>} />
                            </div>
                            )}
                        </div>
                        </div>
                    </div>
                    </div>
                </li>
                <li>
                    After the money arrives in bank account, the stablecoins will be sent to <span className="font-bold">{transaction.address.slice(0, 6)}...{transaction.address.slice(-4)}</span> address.
                </li>
                </ol>
            </div>
            </div>
            {/* Status */}
            <div className="px-6 pt-5 pb-4 bg-white shadow-sm overflow-hidden border-t border-dashed pt-8">
                <div className="flex flex-row">
                <h4 className="text-sm font-semibold text-slate-900">Status</h4>
                    <div className="flex flex-grow px-4 items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border-2 border-dashed px-3 py-1 text-xs font-medium ${statusDisplay.color}`}>
                        {statusDisplay.text}
                    </span>
                    <button 
                        onClick={fetchTransaction}
                        className="rounded-md border px-2 py-1 text-slate-600 hover:bg-slate-50" 
                        aria-label="Refresh status"
                    >
                        <RefreshCcw className="h-4 w-4"/>
                    </button>
                    </div>
                </div>
                <div className="mt-4">
                    <p className="mt-1 text-sm text-slate-600">{getStatusMessage()}</p>
                </div>
            </div>
        </div>            
      </div>
    );
}

export default TransactionDetails;