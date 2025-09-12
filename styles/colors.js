// Luxury Brand Color System
// Sophisticated, minimal palette focused on elegance and premium quality
// Inspired by high-end brands like Apple, Hermès, and luxury home decor

module.exports = {
  // Core Brand Colors - Ultra minimal palette
  primary: "#1a1a1a",           // Rich black - primary text and premium elements
  secondary: "#ffffff",         // Pure white - backgrounds and contrast
  accent: "#f5f5f0",            // Warm off-white - subtle backgrounds
  
  // Sophisticated Neutrals - The foundation of luxury
  neutral: {
    50: "#fafafa",              // Lightest gray - subtle backgrounds
    100: "#f5f5f5",             // Very light gray - section dividers
    200: "#e5e5e5",             // Light gray - borders and lines
    300: "#d4d4d4",             // Medium-light gray - inactive elements
    400: "#a3a3a3",             // Medium gray - secondary text
    500: "#737373",             // Balanced gray - tertiary text
    600: "#525252",             // Dark-medium gray - important secondary text
    700: "#404040",             // Dark gray - emphasis text
    800: "#262626",             // Very dark gray - headers
    900: "#171717",             // Almost black - primary text
  },
  
  // Semantic Colors - Refined and understated
  success: "#16a34a",           // Forest green - success states
  warning: "#d97706",           // Warm amber - warnings (minimal use)
  error: "#dc2626",             // Classic red - errors (minimal use)
  info: "#0ea5e9",              // Professional blue - information
  
  // Interactive States - Subtle and refined
  hover: "#f9f9f9",             // Subtle hover state
  focus: "#1a1a1a",             // Focus ring color
  disabled: "#e5e5e5",          // Disabled state
  
  // Brand Semantic Colors - E-commerce specific
  price: "#1a1a1a",             // Primary price color
  originalPrice: "#a3a3a3",     // Crossed-out price
  discount: "#dc2626",          // Discount indicator (minimal use)
  inStock: "#16a34a",           // In stock indicator
  outOfStock: "#737373",        // Out of stock
  
  // Surface Colors - Clean layering system
  background: "#ffffff",        // Main background
  surface: "#ffffff",           // Card backgrounds
  surfaceElevated: "#fafafa",   // Elevated surfaces
  overlay: "rgba(26, 26, 26, 0.6)", // Modal overlays
  
  // Border System - Minimal and refined
  border: {
    light: "#f5f5f5",           // Barely visible borders
    default: "#e5e5e5",         // Standard borders
    emphasis: "#d4d4d4",        // Emphasized borders
    interactive: "#1a1a1a",     // Interactive element borders
  },
  
  // Typography Colors - Clear hierarchy
  text: {
    primary: "#1a1a1a",         // Primary text
    secondary: "#525252",       // Secondary text
    tertiary: "#737373",        // Tertiary text
    muted: "#a3a3a3",           // Muted text
    inverse: "#ffffff",         // Text on dark backgrounds
  },
  
  // Special Effects - Luxury touches
  shadow: {
    light: "rgba(0, 0, 0, 0.05)",
    default: "rgba(0, 0, 0, 0.1)",
    emphasis: "rgba(0, 0, 0, 0.15)",
  },
  
  // Trust & Quality - Premium indicators
  premium: "#1a1a1a",           // Premium badges
  quality: "#16a34a",           // Quality indicators
  
  // Utility Colors
  transparent: "transparent",
  current: "currentColor",
  
  // Gradients - Subtle and sophisticated
  gradient: {
    subtle: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
    emphasis: "linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)",
    dark: "linear-gradient(135deg, #262626 0%, #1a1a1a 100%)",
  },
}; 