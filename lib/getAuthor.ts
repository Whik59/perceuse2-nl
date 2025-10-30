import { getString } from './utils';
import commonStrings from '../locales/common.json';

export interface Author {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string;
  experience: string;
  image: string;
}

interface AuthorData {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string;
  experience: string;
  image: string;
}

/**
 * Get the single author for product pages
 */
export function getAuthor(): Author {
  console.log('🔍 [DEBUG] getAuthor() called');
  
  // Get the author data directly from common.json
  const authorData = (commonStrings as { author?: AuthorData }).author;
  console.log('🔍 [DEBUG] authorData from common.json:', authorData);
  
  if (!authorData) {
    console.error('❌ [DEBUG] No author found in common.json');
    throw new Error('No author found in common.json');
  }
  
  // Replace domain name placeholder in bio
  const domainName = getString('product.ourShop');
  console.log('🔍 [DEBUG] domainName:', domainName);
  
  const bio = authorData.bio.replace('{domainName}', domainName);
  console.log('🔍 [DEBUG] bio after replacement:', bio);
  
  const author = {
    id: authorData.id,
    name: authorData.name,
    title: authorData.title,
    bio: bio,
    expertise: authorData.expertise,
    experience: authorData.experience,
    image: authorData.image
  };
  
  console.log('🔍 [DEBUG] Final author object:', author);
  return author;
}
