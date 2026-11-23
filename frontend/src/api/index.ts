// Payment API integration layer
// Provides a unified interface to multiple payment providers

import * as bridge from './bridge';
import * as blindpay from './blindpay';
import * as routefusion from './routefusion';
import { getDefaultProvider } from './config';
import type { 
  PaymentRequest, 
  PaymentResponse, 
  AccountRequest, 
  AccountResponse,
  TransactionRecord,
  BalanceResponse,
  StatementRequest,
  StatementResponse
} from './types';

/**
 * Initiate a payment using the appropriate provider
 * @param paymentRequest Payment details
 * @param providerOverride Optional provider override
 * @returns Payment response
 */
export const initiatePayment = async (
  paymentRequest: PaymentRequest, 
  providerOverride?: string
): Promise<PaymentResponse> => {
  const provider = providerOverride || getDefaultProvider(
    paymentRequest.currency, 
    paymentRequest.metadata?.destinationCountry as string
  );
  
  try {
    switch (provider) {
      case 'bridge':
        return await bridge.initiatePayment(paymentRequest);
      case 'blindpay':
        return await blindpay.initiatePayment(paymentRequest);
      case 'routefusion':
        return await routefusion.initiatePayment(paymentRequest);
      default:
        throw new Error(`Unknown payment provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Payment initiation failed with provider ${provider}:`, error);
    return {
      success: false,
      status: 'failed',
      error: {
        code: 'provider_error',
        message: `Payment initiation failed with provider ${provider}`,
        details: error
      }
    };
  }
};

/**
 * Create a new account with the appropriate provider
 * @param accountRequest Account creation details
 * @param providerOverride Optional provider override
 * @returns Account creation response
 */
export const createAccount = async (
  accountRequest: AccountRequest, 
  providerOverride?: string
): Promise<AccountResponse> => {
  // Default to Bridge for account creation if not specified
  const provider = providerOverride || 'bridge';
  
  try {
    switch (provider) {
      case 'bridge':
        return await bridge.createAccount(accountRequest);
      case 'blindpay':
        return await blindpay.createAccount(accountRequest);
      case 'routefusion':
        return await routefusion.createAccount(accountRequest);
      default:
        throw new Error(`Unknown account provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Account creation failed with provider ${provider}:`, error);
    return {
      success: false,
      status: 'rejected',
      error: {
        code: 'provider_error',
        message: `Account creation failed with provider ${provider}`,
        details: error
      }
    };
  }
};

/**
 * Get transaction history from the appropriate provider
 * @param accountId Account ID
 * @param provider Provider name
 * @param startDate Optional start date filter
 * @param endDate Optional end date filter
 * @returns Array of transaction records
 */
export const getTransactions = async (
  accountId: string,
  provider: string,
  startDate?: string,
  endDate?: string
): Promise<TransactionRecord[]> => {
  try {
    switch (provider) {
      case 'bridge':
        return await bridge.getTransactions(accountId, startDate, endDate);
      case 'blindpay':
        return await blindpay.getTransactions(accountId, startDate, endDate);
      case 'routefusion':
        return await routefusion.getTransactions(accountId, startDate, endDate);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Transaction fetch failed with provider ${provider}:`, error);
    return [];
  }
};

/**
 * Get account balance from the appropriate provider
 * @param accountId Account ID
 * @param provider Provider name
 * @returns Balance information
 */
export const getBalance = async (
  accountId: string,
  provider: string
): Promise<BalanceResponse | null> => {
  try {
    switch (provider) {
      case 'bridge':
        return await bridge.getBalance(accountId);
      case 'blindpay':
        return await blindpay.getBalance(accountId);
      case 'routefusion':
        return await routefusion.getBalance(accountId);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Balance fetch failed with provider ${provider}:`, error);
    return null;
  }
};

/**
 * Generate account statement with the appropriate provider
 * @param statementRequest Statement generation parameters
 * @param provider Provider name
 * @returns Statement generation response
 */
export const generateStatement = async (
  statementRequest: StatementRequest,
  provider: string
): Promise<StatementResponse> => {
  try {
    switch (provider) {
      case 'bridge':
        return await bridge.generateStatement(statementRequest);
      case 'blindpay':
        return await blindpay.generateStatement(statementRequest);
      case 'routefusion':
        return await routefusion.generateStatement(statementRequest);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Statement generation failed with provider ${provider}:`, error);
    return {
      success: false,
      status: 'failed',
      error: {
        code: 'provider_error',
        message: `Statement generation failed with provider ${provider}`
      }
    };
  }
};

/**
 * Get payment status from the appropriate provider
 * @param paymentId Payment ID
 * @param provider Provider name
 * @returns Updated payment status
 */
export const getPaymentStatus = async (
  paymentId: string,
  provider: string
): Promise<PaymentResponse> => {
  try {
    switch (provider) {
      case 'bridge':
        return await bridge.getPaymentStatus(paymentId);
      case 'blindpay':
        return await blindpay.getPaymentStatus(paymentId);
      case 'routefusion':
        return await routefusion.getPaymentStatus(paymentId);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Payment status check failed with provider ${provider}:`, error);
    return {
      success: false,
      status: 'failed',
      error: {
        code: 'provider_error',
        message: `Payment status check failed with provider ${provider}`
      }
    };
  }
};

/**
 * Get account status from the appropriate provider
 * @param accountId Account ID
 * @param provider Provider name
 * @returns Updated account status
 */
export const getAccountStatus = async (
  accountId: string,
  provider: string
): Promise<AccountResponse> => {
  try {
    switch (provider) {
      case 'bridge':
        return await bridge.getAccountStatus(accountId);
      case 'blindpay':
        return await blindpay.getAccountStatus(accountId);
      case 'routefusion':
        return await routefusion.getAccountStatus(accountId);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Account status check failed with provider ${provider}:`, error);
    return {
      success: false,
      status: 'rejected',
      error: {
        code: 'provider_error',
        message: `Account status check failed with provider ${provider}`
      }
    };
  }
};