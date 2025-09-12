'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import { Button } from '../../../components/ui/Button';
import { CartState, Category } from '../../../lib/types';
import { redirectToAmazonCart, calculateCartTotals } from '../../../lib/cart';
import { formatCurrency } from '../../../lib/utils';
import { 
  ExternalLink,
  ShoppingBag,
  ArrowLeft,
  Shield,
  Truck,
  CreditCard
} from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });
  
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          const recalculatedCart = calculateCartTotals(parsedCart);
          setCart(recalculatedCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };

    const loadCategories = async () => {
      try {
        const categoriesData = await import('../../../data/categories.json');
        setCategories(categoriesData.default);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCart();
    loadCategories();
  }, []);

  const handleRedirectToAmazon = () => {
    redirectToAmazonCart(cart);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <Layout categories={categories}>
        <div className="min-h-screen bg-gray-50 pt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-8" />
              <h1 className="text-3xl font-light text-gray-900 mb-4">Votre panier est vide</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Ajoutez des friteuses à votre sélection avant de procéder à l'achat.
              </p>
              <Link href="/">
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                  Découvrir nos friteuses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

    return (
    <Layout categories={categories}>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="mb-8">
            <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au panier
                </Link>
            <h1 className="text-3xl font-light text-gray-900">Finaliser votre achat</h1>
            <p className="text-gray-600 mt-2">Vous allez être redirigé vers Amazon pour compléter votre commande</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column - Amazon Information */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <ExternalLink className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Achat sécurisé sur Amazon</h2>
                    <p className="text-gray-600">Profitez de la sécurité et des garanties Amazon</p>
                  </div>
                  </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Paiement 100% sécurisé</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Livraison rapide avec Amazon Prime</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Tous modes de paiement acceptés</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Garantie Amazon A-Z</h3>
                  <p className="text-sm text-blue-700">
                    Vos achats sont protégés par la garantie Amazon A-Z. 
                    Retours gratuits et remboursement intégral en cas de problème.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-medium text-orange-800 mb-2">Information Partenaire</h3>
                <p className="text-sm text-orange-700">
                  En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats 
                  remplissant les conditions requises. Cela n'affecte pas le prix que vous payez.
                </p>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Résumé de votre sélection</h2>
                
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${JSON.stringify(item.selectedVariation || {})}`} 
                         className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">Qté: {item.quantity}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-semibold">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de port</span>
                    <span>Calculés sur Amazon</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total estimé</span>
                      <span>{formatCurrency(cart.subtotal)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Prix final sur Amazon</p>
                  </div>
                </div>

                <Button
                  onClick={handleRedirectToAmazon}
                  className="w-full mt-6 bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center space-x-2"
                  size="lg"
                >
                  <span>Continuer sur Amazon</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <div className="mt-4 text-center">
                  <Link href="/cart">
                    <Button variant="outline" className="w-full">
                      Modifier ma sélection
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage; 