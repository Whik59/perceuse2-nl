import { useState, useEffect, useCallback } from 'react';
import { CartItem } from './types';

interface ExitIntentConfig {
  sensitivity?: number; // How close to top edge triggers exit intent (default: 50px)
  delay?: number; // Delay before popup can be shown again after closing (in hours)
  threshold?: number; // Minimum time on page before exit intent triggers (in seconds)
  minCartValue?: number; // Minimum cart value to show popup
}

interface ExitIntentState {
  isVisible: boolean;
  canShow: boolean;
  timeOnPage: number;
}

export const useExitIntent = (
  cartItems: CartItem[] = [],
  cartTotal: number = 0,
  config: ExitIntentConfig = {}
) => {
  const {
    sensitivity = 50,
    delay = 24,
    threshold = 30,
    minCartValue = 20
  } = config;

  const [state, setState] = useState<ExitIntentState>({
    isVisible: false,
    canShow: true,
    timeOnPage: 0
  });

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeOnPage: Math.floor((Date.now() - startTime) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check if popup was recently dismissed
  useEffect(() => {
    const lastDismissed = localStorage.getItem('exitIntentLastDismissed');
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed);
      const hoursElapsed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursElapsed < delay) {
        setState(prev => ({ ...prev, canShow: false }));
      }
    }
  }, [delay]);

  // Check if conditions are met to show popup
  const shouldShowPopup = useCallback(() => {
    return (
      state.canShow &&
      !state.isVisible &&
      cartItems.length > 0 &&
      cartTotal >= minCartValue &&
      state.timeOnPage >= threshold
    );
  }, [state.canShow, state.isVisible, cartItems.length, cartTotal, minCartValue, state.timeOnPage, threshold]);

  // Exit intent detection
  useEffect(() => {
    let exitIntentFired = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Check if mouse is moving towards top of screen (typical exit behavior)
      if (
        e.clientY <= sensitivity &&
        e.movementY < 0 &&
        !exitIntentFired &&
        shouldShowPopup()
      ) {
        exitIntentFired = true;
        setState(prev => ({ ...prev, isVisible: true }));
        
        // Track exit intent event
        if (typeof window !== 'undefined') {
          const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
          if (gtag) {
            gtag('event', 'exit_intent_triggered', {
              cart_value: cartTotal,
              cart_items: cartItems.length,
              time_on_page: state.timeOnPage
            });
          }
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldShowPopup() && !exitIntentFired) {
        e.preventDefault();
        exitIntentFired = true;
        setState(prev => ({ ...prev, isVisible: true }));
        return (e.returnValue = 'Vous avez des articles dans votre panier. Êtes-vous sûr de vouloir quitter ?');
      }
    };

    // Mobile: detect when page loses focus
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        shouldShowPopup() &&
        !exitIntentFired &&
        window.innerWidth <= 768 // Mobile breakpoint
      ) {
        exitIntentFired = true;
        setState(prev => ({ ...prev, isVisible: true }));
      }
    };

    // Desktop: mouse leave detection
    if (window.innerWidth > 768) {
      document.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      // Mobile: visibility change detection
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldShowPopup, sensitivity, cartTotal, cartItems.length, state.timeOnPage]);

  // Close popup
  const closePopup = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false, canShow: false }));
    
    // Store dismissal time
    localStorage.setItem('exitIntentLastDismissed', Date.now().toString());
    
    // Track dismissal event
    if (typeof window !== 'undefined') {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag('event', 'exit_intent_dismissed', {
          cart_value: cartTotal,
          cart_items: cartItems.length,
          time_on_page: state.timeOnPage
        });
      }
    }
  }, [cartTotal, cartItems.length, state.timeOnPage]);

  // Continue shopping (less aggressive dismissal)
  const continueShopping = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
    
    // Don't prevent showing again in same session for "continue shopping"
    // Track continue shopping event
    if (typeof window !== 'undefined') {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag('event', 'exit_intent_continue_shopping', {
          cart_value: cartTotal,
          cart_items: cartItems.length,
          time_on_page: state.timeOnPage
        });
      }
    }
  }, [cartTotal, cartItems.length, state.timeOnPage]);

  // Go to checkout
  const goToCheckout = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
    
    // Track conversion event
    if (typeof window !== 'undefined') {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag('event', 'exit_intent_converted', {
          cart_value: cartTotal,
          cart_items: cartItems.length,
          time_on_page: state.timeOnPage,
          value: cartTotal
        });
      }
    }
    
    // Apply discount code automatically
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    cart.discountCode = 'SAVE15';
    cart.discountAmount = Math.min(cartTotal * 0.15, 50);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Navigate to checkout
    window.location.href = '/checkout';
  }, [cartTotal, cartItems.length, state.timeOnPage]);

  // Reset popup visibility (for testing or special cases)
  const resetExitIntent = useCallback(() => {
    localStorage.removeItem('exitIntentLastDismissed');
    setState(prev => ({ ...prev, canShow: true, isVisible: false }));
  }, []);

  // Get popup statistics for analytics
  const getStats = useCallback(() => {
    const lastDismissed = localStorage.getItem('exitIntentLastDismissed');
    return {
      canShow: state.canShow,
      timeOnPage: state.timeOnPage,
      cartValue: cartTotal,
      cartItems: cartItems.length,
      lastDismissed: lastDismissed ? new Date(parseInt(lastDismissed)) : null,
      meetsThreshold: state.timeOnPage >= threshold,
      meetsMinValue: cartTotal >= minCartValue
    };
  }, [state.canShow, state.timeOnPage, cartTotal, cartItems.length, threshold, minCartValue]);

  return {
    isVisible: state.isVisible,
    canShow: state.canShow,
    timeOnPage: state.timeOnPage,
    closePopup,
    continueShopping,
    goToCheckout,
    resetExitIntent,
    getStats
  };
}; 