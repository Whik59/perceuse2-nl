// Enhanced AWS S3 Helper for 10,000+ Product Images
// Supports multiple image sizes, CDN optimization, and WebP format

export const getS3ImageUrl = (imagePath: string, size?: 'thumb' | 'large'): string => {
  const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_S3_BASE_URL;
  
  if (!baseUrl) {
    console.warn('CDN_URL or S3_BASE_URL environment variable not set');
    return imagePath; // Return original path as fallback
  }
  
  // If imagePath already includes the full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Add size suffix for different image sizes
  if (size && imagePath.includes('.webp')) {
    const extension = imagePath.split('.').pop();
    const nameWithoutExt = imagePath.replace(`.${extension}`, '');
    imagePath = `${nameWithoutExt}-${size}.${extension}`;
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${baseUrl}/${cleanPath}`;
};

export const getProductImageSet = (imageName: string, productSlug: string) => {
  const basePath = `products/${productSlug}/${imageName}`;
  
  return {
    thumbnail: getS3ImageUrl(basePath, 'thumb'),    // 400x400 for cards
    standard: getS3ImageUrl(basePath),              // 800x800 for product pages  
    large: getS3ImageUrl(basePath, 'large')         // 1200x1200 for zoom/gallery
  };
};

export const getCategoryImageUrl = (imageName: string, size?: 'thumb' | 'large'): string => {
  const imagePath = `categories/${imageName}`;
  return getS3ImageUrl(imagePath, size);
};

export const getBannerImageUrl = (imageName: string): string => {
  const imagePath = `banners/${imageName}`;
  return getS3ImageUrl(imagePath);
};

export const generateImageSrcSet = (basePath: string, sizes: number[] = [400, 800, 1200]): string => {
  const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_S3_BASE_URL;
  
  if (!baseUrl) {
    return '';
  }
  
  return sizes
    .map(size => {
      let imagePath = basePath;
      
      // Add size suffix based on standard sizes
      if (size <= 400) {
        imagePath = basePath.replace('.webp', '-thumb.webp');
      } else if (size >= 1200) {
        imagePath = basePath.replace('.webp', '-large.webp');
      }
      
      return `${getS3ImageUrl(imagePath)} ${size}w`;
    })
    .join(', ');
};

export const getOptimizedImageUrl = (imagePath: string, width?: number, quality: number = 85): string => {
  // For CloudFront with Lambda@Edge or CloudFlare Images
  const baseUrl = getS3ImageUrl(imagePath);
  
  // If using a CDN with on-the-fly optimization (like Cloudinary or ImageKit)
  const cdnOptimizationEnabled = process.env.NEXT_PUBLIC_CDN_OPTIMIZATION === 'true';
  
  if (cdnOptimizationEnabled && (width || quality !== 85)) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (quality !== 85) params.append('q', quality.toString());
    params.append('f', 'webp'); // Force WebP format
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  return baseUrl;
};

export const getImageDimensions = (imagePath: string): { width: number; height: number } => {
  // Enhanced image dimension detection based on naming conventions
  
  if (imagePath.includes('-thumb')) {
    return { width: 400, height: 400 };
  }
  
  if (imagePath.includes('-large')) {
    return { width: 1200, height: 1200 };
  }
  
  if (imagePath.includes('products/')) {
    return { width: 800, height: 800 }; // Square product images
  }
  
  if (imagePath.includes('categories/')) {
    return { width: 600, height: 400 }; // 3:2 category images
  }
  
  if (imagePath.includes('banners/')) {
    return { width: 1920, height: 600 }; // Banner images
  }
  
  return { width: 800, height: 600 }; // Default fallback
};

export const validateImagePath = (imagePath: string): boolean => {
  // Enhanced validation for production use
  const validExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.avif'];
  const extension = imagePath.toLowerCase().substring(imagePath.lastIndexOf('.'));
  
  const isValidExtension = validExtensions.includes(extension);
  const isValidPath = imagePath.length > 0 && !imagePath.includes('..'); // Security check
  
  return isValidExtension && isValidPath;
};

export const generatePlaceholderImage = (width: number, height: number, text?: string): string => {
  // Generate optimized placeholder image URL
  const placeholderText = text || 'Image';
  
  // Use a modern placeholder service or your own placeholder generator
  const placeholderService = process.env.NEXT_PUBLIC_PLACEHOLDER_SERVICE || 'placeholder.com';
  
  switch (placeholderService) {
    case 'blurhash':
      // If using BlurHash for advanced placeholders
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="18" fill="#cccccc">
            ${placeholderText}
          </text>
        </svg>
      `)}`;
      
    default:
      return `https://via.placeholder.com/${width}x${height}/f0f0f0/333333?text=${encodeURIComponent(placeholderText)}`;
  }
};

// Helper for batch image operations
export const getBatchImageUrls = (imagePaths: string[], productSlug: string, size?: 'thumbnail' | 'standard' | 'large') => {
  return imagePaths.map(imagePath => {
    const imageSet = getProductImageSet(imagePath, productSlug);
    return size ? imageSet[size] : imageSet.standard;
  });
};

// Helper for image preloading (performance optimization)
export const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Helper for lazy loading detection
export const supportsLazyLoading = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'loading' in HTMLImageElement.prototype;
};

// Performance monitoring for images
export const trackImageLoad = (imageName: string, startTime: number) => {
  if (typeof window !== 'undefined' && window.performance) {
    const loadTime = performance.now() - startTime;
    console.log(`Image ${imageName} loaded in ${loadTime.toFixed(2)}ms`);
    
    // You can send this data to analytics
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag('event', 'image_load_time', {
        'custom_parameter': imageName,
        'value': Math.round(loadTime)
      });
    }
  }
}; 
    
 