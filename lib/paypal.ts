// PayPal integration disabled for Amazon affiliate site
// This file is kept for compatibility but all functions return errors

import { CartState } from './types';

export const createPayPalOrder = async (cart: CartState): Promise<any> => {
  throw new Error('PayPal payment not available. Please use Amazon checkout.');
};

export const capturePayPalOrder = async (orderID: string): Promise<any> => {
  throw new Error('PayPal payment not available. Please use Amazon checkout.');
};

export const formatCartForPayPal = (cart: CartState) => {
  throw new Error('PayPal payment not available. Please use Amazon checkout.');
};

// Keep other utility functions if needed
export const isPayPalAvailable = () => false; 