// Amazon-Inspired Color System
// Professional e-commerce palette inspired by Amazon's brand colors
// Focused on trust, reliability, and conversion optimization

module.exports = {
  // Core Amazon Brand Colors
  primary: "#FF9900",           // Amazon Orange - primary CTA and highlights
  secondary: "#232F3E",         // Amazon Squid Ink - headers and dark elements
  accent: "#ffffff",            // Pure white - backgrounds and contrast
  
  // Amazon-Inspired Neutrals
  neutral: {
    50: "#f8f9fa",              // Lightest gray - subtle backgrounds
    100: "#f1f3f4",             // Very light gray - section dividers
    200: "#e8eaed",             // Light gray - borders and lines
    300: "#dadce0",             // Medium-light gray - inactive elements
    400: "#9aa0a6",             // Medium gray - secondary text
    500: "#5f6368",             // Balanced gray - tertiary text
    600: "#3c4043",             // Dark-medium gray - important secondary text
    700: "#202124",             // Dark gray - emphasis text
    800: "#232F3E",             // Amazon Squid Ink - headers
    900: "#000000",             // Pure black - primary text
  },
  
  // Semantic Colors - Amazon-inspired
  success: "#137333",           // Amazon green - success states
  warning: "#ea8600",           // Amazon warning orange
  error: "#d93025",             // Amazon red - errors
  info: "#1a73e8",              // Amazon blue - information
  
  // Interactive States - Amazon-style
  hover: "#f7f8f8",             // Subtle hover state
  focus: "#FF9900",             // Amazon orange focus ring
  disabled: "#dadce0",          // Disabled state
  
  // Brand Semantic Colors - E-commerce specific
  price: "#B12704",             // Amazon price red
  originalPrice: "#9aa0a6",     // Crossed-out price
  discount: "#B12704",          // Amazon discount red
  inStock: "#137333",           // Amazon green - in stock
  outOfStock: "#5f6368",        // Out of stock
  
  // Surface Colors - Amazon-style layering
  background: "#ffffff",        // Main background
  surface: "#ffffff",           // Card backgrounds
  surfaceElevated: "#f8f9fa",   // Elevated surfaces
  overlay: "rgba(35, 47, 62, 0.6)", // Amazon Squid Ink overlay
  
  // Border System - Amazon-inspired
  border: {
    light: "#f1f3f4",           // Barely visible borders
    default: "#e8eaed",         // Standard borders
    emphasis: "#dadce0",        // Emphasized borders
    interactive: "#FF9900",     // Amazon orange interactive borders
  },
  
  // Typography Colors - Amazon hierarchy
  text: {
    primary: "#000000",         // Primary text (black)
    secondary: "#3c4043",       // Secondary text
    tertiary: "#5f6368",        // Tertiary text
    muted: "#9aa0a6",           // Muted text
    inverse: "#ffffff",         // Text on dark backgrounds
  },
  
  // Special Effects - Amazon-style
  shadow: {
    light: "rgba(0, 0, 0, 0.05)",
    default: "rgba(0, 0, 0, 0.1)",
    emphasis: "rgba(0, 0, 0, 0.15)",
  },
  
  // Trust & Quality - Amazon indicators
  premium: "#FF9900",           // Amazon orange premium badges
  quality: "#137333",           // Amazon green quality indicators
  
  // Utility Colors
  transparent: "transparent",
  current: "currentColor",
  
  // Gradients - Amazon-inspired
  gradient: {
    subtle: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
    emphasis: "linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)",
    dark: "linear-gradient(135deg, #232F3E 0%, #000000 100%)",
    orange: "linear-gradient(135deg, #FF9900 0%, #ea8600 100%)",
  },
}; 