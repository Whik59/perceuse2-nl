import { CartItem, CartState, Product } from './types';

export const createCartItem = (
  product: Product, 
  selectedVariation?: Record<string, string>, 
  quantity: number = 1
): CartItem => {
  // Cast product to access actual JSON properties
  const productData = product as Product & { 
    productNameCanonical?: string;
  };
  
  // Calculate price and Amazon URL based on variation
  let price = product.basePrice;
  let amazonUrl = product.amazonUrl;

  if (selectedVariation && product.variations.length > 0) {
    // Find the selected variation option and update price/URL
    for (const variation of product.variations) {
      const selectedValue = selectedVariation[variation.type];
      if (selectedValue) {
        const option = variation.options.find(opt => opt.value === selectedValue);
        if (option) {
          price = option.price;
          amazonUrl = option.amazonUrl || product.amazonUrl;
        }
      }
    }
  }

  return {
    productId: product.productId,
    slug: product.slug,
    title: product.title || productData.productNameCanonical || 'Product',
    price,
    compareAtPrice: product.compareAtPrice,
    imagePath: product.imagePaths[0],
    amazonUrl,
    selectedVariation,
    quantity
  };
};

export const addToCart = (currentCart: CartState, newItem: CartItem): CartState => {
  const existingItemIndex = currentCart.items.findIndex(item => 
    item.productId === newItem.productId &&
    JSON.stringify(item.selectedVariation || {}) === JSON.stringify(newItem.selectedVariation || {})
  );

  let updatedItems;
  if (existingItemIndex >= 0) {
    // Update existing item quantity
    updatedItems = currentCart.items.map((item, index) => 
      index === existingItemIndex 
        ? { ...item, quantity: item.quantity + newItem.quantity }
        : item
    );
  } else {
    // Add new item
    updatedItems = [...currentCart.items, newItem];
  }

  return calculateCartTotals({ ...currentCart, items: updatedItems });
};

export const removeFromCart = (currentCart: CartState, productId: number, selectedVariation?: Record<string, string>): CartState => {
  const updatedItems = currentCart.items.filter(item => 
    !(item.productId === productId && 
      JSON.stringify(item.selectedVariation || {}) === JSON.stringify(selectedVariation || {}))
  );

  return calculateCartTotals({ ...currentCart, items: updatedItems });
};

export const clearCart = (): CartState => {
  return {
    items: [],
    subtotal: 0
  };
};

export const updateCartItemQuantity = (
  currentCart: CartState, 
  productId: number, 
  newQuantity: number, 
  selectedVariation?: Record<string, string>
): CartState => {
  if (newQuantity <= 0) {
    return removeFromCart(currentCart, productId, selectedVariation);
  }

  const updatedItems = currentCart.items.map(item => {
    if (item.productId === productId && 
        JSON.stringify(item.selectedVariation || {}) === JSON.stringify(selectedVariation || {})) {
      return { ...item, quantity: newQuantity };
    }
    return item;
  });

  return calculateCartTotals({ ...currentCart, items: updatedItems });
};

export const calculateCartTotals = (cart: CartState): CartState => {
  // Ensure cart has items array
  const items = cart.items || [];
  
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return {
    ...cart,
    items,
    subtotal
  };
};

// Helper function to redirect to Amazon with all cart items
export const redirectToAmazonCart = (cart: CartState): void => {
  if (cart.items.length === 0) return;
  
  if (cart.items.length === 1) {
    // Single item - direct redirect
    window.open(cart.items[0].amazonUrl, '_blank');
  } else {
    // Multiple items - open each in new tab (Amazon doesn't support multi-item cart URLs easily)
    cart.items.forEach(item => {
      window.open(item.amazonUrl, '_blank');
    });
  }
};

// Helper to get Amazon URL with affiliate tag
export const getAmazonUrlWithAffiliateTag = (baseUrl: string, affiliateTag: string): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('tag', affiliateTag);
  return url.toString();
}; 