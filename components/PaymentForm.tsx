'use client';

import React from 'react';
import { Button } from './ui/Button';
import { CartState } from '../lib/types';
import { redirectToAmazonCart } from '../lib/cart';
import { formatCurrency } from '../lib/utils';
import { ExternalLink } from 'lucide-react';

interface PaymentFormProps {
  cart: CartState;
  onClose?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ cart, onClose }) => {
  const handleRedirectToAmazon = () => {
    redirectToAmazonCart(cart);
    if (onClose) onClose();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Finaliser l'achat</h2>
      
      <div className="mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-800 mb-2">Achat sur Amazon</h3>
          <p className="text-sm text-orange-700 mb-4">
            Vous allez être redirigé vers Amazon pour finaliser votre achat. 
            Profitez de la sécurité et de la garantie Amazon.
          </p>
          <div className="text-sm text-orange-600">
            Total estimé: <span className="font-semibold">{formatCurrency(cart.subtotal)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleRedirectToAmazon}
        className="w-full bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center space-x-2"
        size="lg"
      >
        <span>Continuer sur Amazon</span>
        <ExternalLink className="w-4 h-4" />
      </Button>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant les conditions requises.
        </p>
      </div>
    </div>
  );
};

export default PaymentForm; 