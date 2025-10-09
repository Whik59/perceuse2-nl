import React, { useState, useEffect } from 'react';
import { useSmartLinking } from '../lib/useSmartLinking';

interface SmartLinkedTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
}

const SmartLinkedText: React.FC<SmartLinkedTextProps> = ({ 
  text, 
  className = '', 
  as: Component = 'span' 
}) => {
  const { linkProducts, isLoading, isInitialized } = useSmartLinking();
  const [linkedHtml, setLinkedHtml] = useState<string>('');

  useEffect(() => {
    const processText = async () => {
      if (!text || !isInitialized) return;
      
      try {
        const linked = await linkProducts(text);
        setLinkedHtml(linked);
      } catch (error) {
        console.error('Error processing text:', error);
        setLinkedHtml(text);
      }
    };

    processText();
  }, [text, linkProducts, isInitialized]);

  // Show loading state or original text while processing
  if (isLoading || !isInitialized) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: linkedHtml || text }}
    />
  );
};

export default SmartLinkedText;
