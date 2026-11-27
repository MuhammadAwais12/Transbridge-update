import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as paymentApi from '../api';
import type { PaymentRequest, PaymentResponse, StatementRequest, StatementResponse } from '../api/types';

/**
 * Hook for managing payment provider operations
 */
export function usePaymentProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch configured payment providers for the MSB
  const fetchProviders = async () => {
    if (!user?.msbId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // This would be a real Supabase query in production
      // For now, return mock data
      const mockProviders = [
        {
          id: '1',
          msb_id: user.msbId,
          provider_name: 'Bridge',
          provider_type: 'banking',
          is_active: true,
          config: {
            supportedCurrencies: ['USD', 'EUR', 'GBP'],
            supportedCountries: ['US', 'CA', 'GB', 'EU']
          }
        },
        {
          id: '2',
          msb_id: user.msbId,
          provider_name: 'BlindPay',
          provider_type: 'payments',
          is_active: true,
          config: {
            supportedCurrencies: ['USD', 'EUR', 'GBP'],
            supportedCountries: ['US', 'CA', 'GB', 'EU']
          }
        },
        {
          id: '3',
          msb_id: user.msbId,
          provider_name: 'Routefusion',
          provider_type: 'fx',
          is_active: true,
          config: {
            supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'MXN'],
            supportedCountries: ['US', 'CA', 'GB', 'EU', 'MX']
          }
        }
      ];

      setProviders(mockProviders);
    } catch (err: any) {
      console.error('Error fetching payment providers:', err);
      setError(err.message || 'Failed to fetch payment providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [user?.msbId]);

  /**
   * Initiate a payment through the appropriate provider
   * @param paymentData Payment details
   * @returns Payment response
   */
  const initiatePayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
    try {
      // Call the payment API
      const response = await paymentApi.initiatePayment(paymentData);
      
      if (response.success) {
        // In production, this would create a record in the payment_transactions table
        console.log('Payment initiated successfully:', response);
      }
      
      return response;
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'payment_initiation_error',
          message: err.message || 'Failed to initiate payment'
        }
      };
    }
  };

  /**
   * Generate a statement for an account
   * @param statementData Statement generation parameters
   * @param provider Provider to use
   * @returns Statement generation response
   */
  const generateStatement = async (
    statementData: StatementRequest, 
    provider: string = 'bridge'
  ): Promise<StatementResponse> => {
    try {
      // Call the payment API
      const response = await paymentApi.generateStatement(statementData, provider);
      
      if (response.success) {
        // In production, this would create a record in the account_statements table
        console.log('Statement generation initiated:', response);
      }
      
      return response;
    } catch (err: any) {
      console.error('Error generating statement:', err);
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'statement_generation_error',
          message: err.message || 'Failed to generate statement'
        }
      };
    }
  };

  /**
   * Get the status of a payment
   * @param paymentId Payment ID
   * @param provider Provider name
   * @returns Payment status
   */
  const getPaymentStatus = async (
    paymentId: string,
    provider: string
  ): Promise<PaymentResponse> => {
    try {
      return await paymentApi.getPaymentStatus(paymentId, provider);
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'status_check_error',
          message: err.message || 'Failed to check payment status'
        }
      };
    }
  };

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
    initiatePayment,
    generateStatement,
    getPaymentStatus
  };
}