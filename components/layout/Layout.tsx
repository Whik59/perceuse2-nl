'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Banner from '../Banner';
import FloatingButtons from '../FloatingButtons';
import CartDrawer from '../CartDrawer';
import ExitIntentPopup from '../ExitIntentPopup';
import { Category, CartState } from '../../lib/types';
import { useExitIntent } from '../../lib/useExitIntent';
import { calculateCartTotals } from '../../lib/cart';

interface LayoutProps {
  children: ReactNode;
  categories?: Category[];
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  showBanner?: boolean;
  bannerMessage?: string;
  showFloatingButtons?: boolean;
  showVideoButton?: boolean;
  videoUrl?: string;
  disableExitIntent?: boolean; // Allow disabling on checkout/payment pages
}

const Layout: React.FC<LayoutProps> = ({
  children,
  categories = [],
  cartItemCount = 0,
  onCartClick,
  onSearchSubmit,
  showBanner = false,
  bannerMessage,
  showFloatingButtons = true,
  showVideoButton = false, // Video disabled
  videoUrl = "/video.mov",
  disableExitIntent = false
}) => {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });

  // Load cart data for exit intent
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          const recalculatedCart = calculateCartTotals(parsedCart);
          setCart(recalculatedCart);
        }
      } catch (error) {
        console.error('Error loading cart for exit intent:', error);
      }
    };

    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Exit intent configuration
  const exitIntentConfig = {
    sensitivity: 50, // Trigger when mouse is within 50px of top
    delay: 4, // Don't show again for 4 hours after dismissal
    threshold: 45, // Wait 45 seconds before exit intent can trigger
    minCartValue: 25 // Only show if cart value is at least 25€
  };

  // Exit intent hook
  const {
    isVisible: isExitIntentVisible,
    closePopup: closeExitIntent,
    continueShopping,
    goToCheckout
  } = useExitIntent(
    disableExitIntent ? [] : cart.items, // Disable if specified
            disableExitIntent ? 0 : cart.subtotal,
    exitIntentConfig
  );

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      setIsCartDrawerOpen(true);
    }
  };

  const handleOpenCartDrawer = () => {
    setIsCartDrawerOpen(true);
  };

  // Listen for cart updates and auto-open drawer
  useEffect(() => {
    const handleCartUpdated = () => {
      // Small delay to ensure the cart data is updated
      setTimeout(() => {
        setIsCartDrawerOpen(true);
      }, 100);
    };

    // Listen for the cartItemAdded event
    window.addEventListener('cartItemAdded', handleCartUpdated);

    // Expose the openCartDrawer function globally for child components
    if (typeof window !== 'undefined') {
      (window as Window & { openCartDrawer?: () => void }).openCartDrawer = handleOpenCartDrawer;
    }

    return () => {
      window.removeEventListener('cartItemAdded', handleCartUpdated);
      if (typeof window !== 'undefined') {
        delete (window as Window & { openCartDrawer?: () => void }).openCartDrawer;
      }
    };
  }, []);

  // Children can access openCartDrawer via the global window object

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showBanner && bannerMessage && (
        <Banner 
          message={bannerMessage}
          type="amazon-partner"
          urgency={true}
        />
      )}
      
      <Header
        categories={categories}
        cartItemCount={cartItemCount}
        onCartClick={handleCartClick}
        onSearchSubmit={onSearchSubmit}
      />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />

      {/* Global Floating Buttons */}
      {showFloatingButtons && (
        <FloatingButtons
          showVideoButton={showVideoButton}
          videoUrl={videoUrl}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />

      {/* Exit Intent Popup - Cart Abandonment Prevention */}
      {!disableExitIntent && (
        <ExitIntentPopup
          isVisible={isExitIntentVisible}
          onClose={closeExitIntent}
          onContinueShopping={continueShopping}
          onCheckout={goToCheckout}
          cartItems={cart.items}
          cartTotal={cart.subtotal}
        />
      )}
    </div>
  );
};

export default Layout; 