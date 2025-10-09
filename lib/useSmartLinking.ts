import { useState, useEffect } from 'react';
import smartLinker from '../lib/smartLinking';

interface UseSmartLinkingResult {
  linkProducts: (text: string) => Promise<string>;
  isLoading: boolean;
  isInitialized: boolean;
}

export const useSmartLinking = (): UseSmartLinkingResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize the smart linker by calling getAllProducts
        await smartLinker.getAllProducts();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize smart linking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const linkProducts = async (text: string): Promise<string> => {
    if (!text || typeof text !== 'string') return text;
    
    try {
      return await smartLinker.linkProducts(text);
    } catch (error) {
      console.error('Error linking products:', error);
      return text; // Return original text if linking fails
    }
  };

  return {
    linkProducts,
    isLoading,
    isInitialized
  };
};
