/**
 * Formats a numerical amount into Indian notation (Lakhs and Crores).
 */
export function formatIndianCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const absAmount = Math.abs(amount);

  if (absAmount >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores.toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  } else {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Formats a full INR string with standard Indian thousands/lakh separators.
 */
export function formatFullINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
