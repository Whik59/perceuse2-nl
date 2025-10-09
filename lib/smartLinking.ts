interface ProductData {
  productId: string;
  name: string;
  slug: string;
  price?: string;
}

interface ProductMatch {
  product: ProductData;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

class SmartProductLinker {
  private products: ProductData[] = [];
  private productCache: Map<string, ProductData> = new Map();
  private initialized = false;

  constructor() {
    // Don't load products in constructor for client-side
  }

  /**
   * Initialize the linker by fetching products from API
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const response = await fetch('/api/products/list');
      const data = await response.json();
      this.products = data.products || [];
      
      // Create cache for faster lookups
      this.products.forEach(product => {
        this.productCache.set(product.productId, product);
      });
      
      this.initialized = true;
      console.log(`Loaded ${this.products.length} products for smart linking`);
    } catch (error) {
      console.error('Error loading products for smart linking:', error);
      this.products = [];
      this.initialized = true;
    }
  }

  /**
   * Find product mentions in text and return matches with their positions
   */
  private findProductMentions(text: string): ProductMatch[] {
    const matches: ProductMatch[] = [];
    
    // Sort products by name length (longest first) to avoid partial matches
    const sortedProducts = [...this.products].sort((a, b) => b.name.length - a.name.length);
    
    for (const product of sortedProducts) {
      if (!product.name || !product.slug) continue;
      
      // Create various patterns to match the product name
      const patterns = [
        // Exact product name
        product.name,
        // Brand + model (e.g., "WORX Landroid Plus")
        this.extractBrandModel(product.name),
        // Just the model name (e.g., "Landroid Plus")
        this.extractModel(product.name),
        // Brand only (e.g., "WORX")
        this.extractBrand(product.name)
      ].filter(Boolean);

      for (const pattern of patterns) {
        if (!pattern) continue;
        
        // Use case-insensitive regex to find all occurrences
        const regex = new RegExp(this.escapeRegex(pattern), 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          // Check if this match is already covered by a longer match
          const isOverlapped = matches.some(existingMatch => 
            match.index >= existingMatch.startIndex && 
            match.index < existingMatch.endIndex
          );
          
          if (!isOverlapped) {
            matches.push({
              product,
              matchedText: match[0],
              startIndex: match.index,
              endIndex: match.index + match[0].length
            });
          }
        }
      }
    }
    
    // Sort by start index
    return matches.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Extract brand and model from product name (e.g., "WORX Landroid Plus WR165E" -> "WORX Landroid Plus")
   */
  private extractBrandModel(name: string): string | null {
    // Remove common suffixes like model numbers, capacity, etc.
    const cleaned = name
      .replace(/\s+(WR\d+[A-Z]*|MCM\d+[A-Z]*|PC-KM\s+\d+).*$/i, '') // Remove model numbers
      .replace(/\s+\d+[A-Z]*\s*W.*$/i, '') // Remove power ratings
      .replace(/\s+\d+[.,]\d+\s*L.*$/i, '') // Remove capacity
      .replace(/\s+\d+\s*kg.*$/i, '') // Remove weight
      .trim();
    
    return cleaned.length > 10 ? cleaned : null;
  }

  /**
   * Extract just the model name (e.g., "WORX Landroid Plus WR165E" -> "Landroid Plus")
   */
  private extractModel(name: string): string | null {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      // Take the second and third parts (usually the model name)
      const model = parts.slice(1, 3).join(' ');
      return model.length > 5 ? model : null;
    }
    return null;
  }

  /**
   * Extract just the brand name (e.g., "WORX Landroid Plus WR165E" -> "WORX")
   */
  private extractBrand(name: string): string | null {
    const parts = name.split(' ');
    const brand = parts[0];
    
    // Only return brand if it's substantial and not a common word
    const commonWords = ['robot', 'kitchen', 'kitchenaid', 'bosch', 'worx', 'cheflee', 'facelle'];
    if (brand.length > 2 && !commonWords.includes(brand.toLowerCase())) {
      return brand;
    }
    return null;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Convert text with product mentions to HTML with clickable links
   */
  public async linkProducts(text: string): Promise<string> {
    if (!text || typeof text !== 'string') return text;
    
    // Initialize if not already done
    await this.initialize();
    
    const matches = this.findProductMentions(text);
    if (matches.length === 0) return text;
    
    // Limit the number of links to avoid over-linking (max 3 per paragraph)
    const limitedMatches = this.limitLinksPerParagraph(text, matches, 3);
    
    let result = '';
    let lastIndex = 0;
    
    for (const match of limitedMatches) {
      // Add text before the match
      result += text.slice(lastIndex, match.startIndex);
      
      // Add the linked product with better anchor text
      const linkText = this.createBetterAnchorText(match.matchedText, match.product);
      const productUrl = `/product/${match.product.slug}`;
      
      result += `<a href="${productUrl}" class="text-blue-600 hover:text-blue-800 underline font-medium transition-colors" title="Voir le produit ${match.product.name}">${linkText}</a>`;
      
      lastIndex = match.endIndex;
    }
    
    // Add remaining text
    result += text.slice(lastIndex);
    
    return result;
  }

  /**
   * Limit the number of links per paragraph to avoid over-linking
   */
  private limitLinksPerParagraph(text: string, matches: ProductMatch[], maxPerParagraph: number): ProductMatch[] {
    const paragraphs = text.split(/\n\s*\n/);
    const limitedMatches: ProductMatch[] = [];
    
    for (const paragraph of paragraphs) {
      const paragraphMatches = matches.filter(match => 
        match.startIndex >= text.indexOf(paragraph) && 
        match.endIndex <= text.indexOf(paragraph) + paragraph.length
      );
      
      // Sort by match length (longest first) and take only the best matches
      const sortedMatches = paragraphMatches.sort((a, b) => b.matchedText.length - a.matchedText.length);
      const selectedMatches = sortedMatches.slice(0, maxPerParagraph);
      
      limitedMatches.push(...selectedMatches);
    }
    
    return limitedMatches.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Create better anchor text for links
   */
  private createBetterAnchorText(matchedText: string, product: ProductData): string {
    // If the matched text is already a good anchor (brand + model), use it as is
    if (matchedText.length > 10 && matchedText.split(' ').length >= 2) {
      return matchedText;
    }
    
    // Otherwise, create a better anchor from the product name
    const productName = product.name;
    const words = productName.split(' ');
    
    // Take first 2-3 words for a good anchor
    if (words.length >= 3) {
      return words.slice(0, 3).join(' ');
    } else if (words.length >= 2) {
      return words.slice(0, 2).join(' ');
    } else {
      return words[0] || matchedText;
    }
  }

  /**
   * Get product by ID
   */
  public async getProductById(productId: string): Promise<ProductData | null> {
    await this.initialize();
    return this.productCache.get(productId) || null;
  }

  /**
   * Get all products
   */
  public async getAllProducts(): Promise<ProductData[]> {
    await this.initialize();
    return [...this.products];
  }
}

// Create singleton instance
const smartLinker = new SmartProductLinker();

export default smartLinker;
export { SmartProductLinker, ProductData, ProductMatch };
