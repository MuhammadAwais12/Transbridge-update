/**
 * Format currency amount with appropriate suffix (K for thousands, M for millions)
 * @param amount - The amount to format
 * @returns Formatted string with appropriate suffix
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  } else {
    return `$${amount.toFixed(0)}`;
  }
};

/**
 * Format currency amount with sign (for transactions)
 * @param amount - The amount to format
 * @param type - Transaction type ('credit' or 'debit')
 * @returns Formatted string with sign and appropriate suffix
 */
export const formatTransactionAmount = (amount: number, type: 'credit' | 'debit'): string => {
  const sign = type === 'credit' ? '+' : '';
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    return `${sign}$${(absAmount / 1000).toFixed(1)}K`;
  } else {
    return `${sign}$${absAmount.toFixed(0)}`;
  }
}; 