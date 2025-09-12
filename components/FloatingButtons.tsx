'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, Maximize2 } from 'lucide-react';
import { CartItem } from '../lib/types';

interface FloatingButtonsProps {
  showVideoButton?: boolean;
  videoUrl?: string;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({
  showVideoButton = true,
  videoUrl = '/video.mov'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const modalVideoRef = useRef<HTMLVideoElement>(null)

  // Update cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cartData = localStorage.getItem('cart') || '{"items":[]}'
        const cart = JSON.parse(cartData)
        
        // Ensure cart has proper structure
        const safeCart = {
          items: Array.isArray(cart.items) ? cart.items : [],
          ...cart
        }
        
        const totalItems = safeCart.items.reduce((sum: number, item: CartItem) => sum + (item.quantity || 0), 0)
        setCartItemCount(totalItems)
      } catch (error) {
        console.error('Error reading cart from localStorage:', error)
        setCartItemCount(0)
      }
    }

    updateCartCount()
    
    // Listen for storage changes
    window.addEventListener('storage', updateCartCount)
    // Listen for custom cart update events
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])

  // Auto-play preview video when component mounts
  useEffect(() => {
    if (previewVideoRef.current) {
      // Small delay to ensure video is loaded
      setTimeout(() => {
        if (previewVideoRef.current) {
          previewVideoRef.current.muted = true
          previewVideoRef.current.play().catch(console.error)
        }
      }, 500)
    }
  }, [])

  const handleCartClick = () => {
    // Use the global cart drawer function if available
    if (typeof window !== 'undefined') {
      const openCartDrawer = (window as Window & { openCartDrawer?: () => void }).openCartDrawer;
      if (openCartDrawer) {
        openCartDrawer();
      } else {
        // Fallback to cart page
        window.location.href = '/cart';
      }
    }
  }

  const handleVideoPreviewClick = () => {
    // Open modal with bigger video and sound
    setIsModalOpen(true)
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = 0
      modalVideoRef.current.muted = false
      modalVideoRef.current.play()
    }
  }

  return (
    <>
      {/* Video Button - Bottom Left */}
      {showVideoButton && (
        <div className="fixed bottom-6 left-6 z-40">
          <div className="relative group">
            {/* Video Preview Container - Made Bigger */}
            <div 
              className="relative overflow-hidden rounded-2xl shadow-luxury transition-all duration-350 ease-luxury cursor-pointer w-32 hover:scale-105 border border-neutral-200"
              style={{ aspectRatio: '9/16', height: '200px' }}
              onClick={handleVideoPreviewClick}
            >
              {/* Auto-playing Muted Video Preview */}
              <video
                ref={previewVideoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                preload="metadata"
              />
              
              {/* Expand Icon Overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <Maximize2 className="w-6 h-6 text-black" />
                </div>
              </div>
            </div>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
              Voir la vidéo
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Button - Bottom Right - Premium Black & White */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative group">
          <button
            onClick={handleCartClick}
            className="bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            aria-label="Voir le panier"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-gray-900 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center min-w-[1.5rem] shadow-lg border border-gray-200">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>

          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
            Panier ({cartItemCount})
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Premium Video Modal - 9:16 Portrait */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-sm max-h-[90vh] w-full rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16' }}>
            <video
              ref={modalVideoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
              autoPlay
              playsInline
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-105"
              aria-label="Fermer la vidéo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default FloatingButtons 