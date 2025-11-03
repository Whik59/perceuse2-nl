import { getString } from './utils';
import commonStrings from '../locales/common.json';

// Cache for author data to avoid repeated processing
let authorCache: Author | null = null;

// Define and export the Author type
export type Author = {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string;
  experience: string;
  image: string;
  publishedDate: string;
  updatedDate: string;
};

/**
 * Fetches and prepares author data, replacing placeholders.
 * Uses a simple cache to avoid reprocessing.
 * @returns {Author} The processed author object.
 */
export function getAuthor(): Author {
  if (authorCache) {
    return authorCache;
  }

  // Directly use the imported JSON data
  const authorData = commonStrings.author;
  const domainName = getString('siteConfig.site.url').replace(/https?:\/\//, '');

  // Replace the {domainName} placeholder in the bio
  const bio = authorData.bio.replace('{domainName}', domainName);

  // Construct the final author object
  const author: Author = {
    id: authorData.id,
    name: authorData.name,
    title: authorData.title,
    bio: bio,
    expertise: authorData.expertise,
    experience: authorData.experience,
    image: authorData.image,
    publishedDate: authorData.publishedDate || '2024-01-01',
    updatedDate: authorData.updatedDate || '2025-10-29',
  };

  // Cache the result
  authorCache = author;

  return author;
}
