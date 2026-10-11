import { wpFetch } from './wp-client';

export interface WPPage {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt?: {
    rendered: string;
  };
}

export interface WPFAQ {
  id: number;
  question: string;
  answer: string;
}

export async function getPageBySlug(slug: string): Promise<WPPage | null> {
  try {
    const pages = await wpFetch<WPPage[]>(`/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}`);
    if (pages && pages.length > 0) {
      return pages[0];
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch page with slug ${slug}:`, error);
    throw error;
  }
}

export async function getFAQs(): Promise<WPFAQ[]> {
  try {
    const faqs = await wpFetch<WPFAQ[]>('/wp-json/2day/v1/faqs');
    if (!Array.isArray(faqs)) throw new Error("Réponse FAQ invalide.");
    return faqs;
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    throw error;
  }
}
