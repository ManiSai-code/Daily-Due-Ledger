import { Types } from 'mongoose';

export interface ClearanceProjection {
  remainingBalance: number;
  dailyAmount: number;
  remainingDays: number;
  estimatedClearanceDate: Date | null;
}

/**
 * Converts a Decimal128 or number input safely to a JavaScript float.
 */
export const toNum = (val: Types.Decimal128 | number | string): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val);
  return parseFloat(val.toString());
};

/**
 * Calculates remaining repayment days and estimated clearance date.
 * 
 * Formula:
 * remainingDays = Math.ceil(remainingBalance / dailyAmount)
 * 
 * @param balance - Current outstanding balance
 * @param daily - Configured daily payment amount
 * @param startDate - Base date from which to project (defaults to today)
 */
export const calculateClearanceProjection = (
  balance: Types.Decimal128 | number | string,
  daily: Types.Decimal128 | number | string,
  startDate: Date = new Date()
): ClearanceProjection => {
  const remainingBalance = toNum(balance);
  const dailyAmount = toNum(daily);

  // Edge cases: fully settled or invalid daily payment
  if (remainingBalance <= 0) {
    return {
      remainingBalance: 0,
      dailyAmount,
      remainingDays: 0,
      estimatedClearanceDate: new Date(startDate),
    };
  }

  if (dailyAmount <= 0) {
    return {
      remainingBalance,
      dailyAmount: 0,
      remainingDays: 0,
      estimatedClearanceDate: null, // Infinite / Indefinite
    };
  }

  // Ceiling division ensures partial final days count as a full day
  const remainingDays = Math.ceil(remainingBalance / dailyAmount);

  const estimatedClearanceDate = new Date(startDate);
  estimatedClearanceDate.setDate(estimatedClearanceDate.getDate() + remainingDays);

  return {
    remainingBalance,
    dailyAmount,
    remainingDays,
    estimatedClearanceDate,
  };
};