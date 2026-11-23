import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../lib/apiBase';
import { getAuthHeaders } from '../lib/auth';

export interface TransactionStatus {
  id: string;
  status: string;
  updated_at: string;
  metadata?: any;
}

export function useTransactionStatus(transactionId: string | null) {
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!transactionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transfer/transaction/${transactionId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction status');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  // Initial fetch
  useEffect(() => {
    if (transactionId) {
      fetchStatus();
    }
  }, [transactionId, fetchStatus]);

  // Smart polling based on transaction status
  useEffect(() => {
    if (!transactionId) return;

    // Don't poll if transaction is in a final state
    if (status && ['completed', 'failed', 'refunded'].includes(status.status)) {
      return;
    }

    // Poll more frequently for pending transactions
    const pollInterval = status?.status?.includes('pending') ? 3000 : 5000;

    const interval = setInterval(() => {
      fetchStatus();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [transactionId, status, fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
}

// Hook for multiple transaction statuses
export function useMultipleTransactionStatuses(transactionIds: string[]) {
  const [statuses, setStatuses] = useState<Record<string, TransactionStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllStatuses = useCallback(async () => {
    if (transactionIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const promises = transactionIds.map(async (id) => {
        const response = await fetch(`${API_BASE_URL}/transfer/transaction/${id}`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch transaction ${id}`);
        }

        const data = await response.json();
        return { id, data };
      });

      const results = await Promise.all(promises);
      const newStatuses: Record<string, TransactionStatus> = {};
      
      results.forEach(({ id, data }) => {
        newStatuses[id] = data;
      });

      setStatuses(newStatuses);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction statuses');
    } finally {
      setLoading(false);
    }
  }, [transactionIds]);

  // Initial fetch
  useEffect(() => {
    if (transactionIds.length > 0) {
      fetchAllStatuses();
    }
  }, [transactionIds, fetchAllStatuses]);

  // Smart polling for multiple transactions
  useEffect(() => {
    if (transactionIds.length === 0) return;

    // Check if any transactions are still pending
    const hasPendingTransactions = Object.values(statuses).some(
      status => !['completed', 'failed', 'refunded'].includes(status.status)
    );

    if (!hasPendingTransactions) {
      return;
    }

    const interval = setInterval(() => {
      fetchAllStatuses();
    }, 10000); // Poll every 10 seconds for multiple transactions

    return () => clearInterval(interval);
  }, [transactionIds, statuses, fetchAllStatuses]);

  return {
    statuses,
    loading,
    error,
    refetch: fetchAllStatuses,
  };
} 