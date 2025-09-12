// Stripe integration disabled for Amazon affiliate site
// This file is kept for compatibility but all functions return errors

import { CartState } from './types';

export const createPaymentIntent = async (cart: CartState): Promise<any> => {
  throw new Error('Stripe payment not available. Please use Amazon checkout.');
};

export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

// Keep utility functions for compatibility
export const isStripeAvailable = () => false; 