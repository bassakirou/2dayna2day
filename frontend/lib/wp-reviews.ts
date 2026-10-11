import { wpFetch, getWpOrigin } from "./wp-client";

export interface ReviewCriteria {
  [key: string]: number; // e.g. "Qualité du son": 4.5
}

export interface ReviewTag {
  tag: string;
  count: number;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: { [key: number]: number };
  recommendPercent: number;
  criteria: ReviewCriteria;
  tags: ReviewTag[];
  withPhotos: number;
}

export interface ReviewReply {
  id: number;
  author: string;
  content: string;
  date: string;
  isAdmin: boolean;
}

export interface Review {
  id: number;
  author: string;
  date: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  criteria: ReviewCriteria;
  images: string[];
  helpful: number;
  location: string;
  replies?: ReviewReply[];
}

export interface ReviewsResponse {
  items: Review[];
  page: number;
  stats: ReviewStats;
}

export async function getReviews(
  productId: string | number,
  params?: {
    page?: number;
    per_page?: number;
    rating?: number;
    sort?: "newest" | "oldest" | "highest" | "lowest";
  }
): Promise<ReviewsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
  if (params?.rating) searchParams.set("rating", params.rating.toString());
  if (params?.sort) searchParams.set("sort", params.sort);

  const qs = searchParams.toString();
  return wpFetch<ReviewsResponse>(
    `/wp-json/2day/v1/products/${productId}/reviews${qs ? `?${qs}` : ""}`
  );
}

export interface PostReviewInput {
  product_id: number;
  rating: number;
  title: string;
  content: string;
  name: string;
  email: string;
  recommend: boolean;
  criteria?: ReviewCriteria;
  tags?: string[];
  images?: string[];
}

export async function postReview(input: PostReviewInput, token?: string | null): Promise<{ success: boolean; id?: number; message?: string }> {
  return wpFetch<{ success: boolean; id?: number; message?: string }>(
    `/wp-json/2day/v1/reviews`,
    {
      method: "POST",
      body: input,
      token,
    }
  );
}

export async function reportReview(reviewId: number, reason: string, description: string): Promise<{ success: boolean; message?: string }> {
  return wpFetch<{ success: boolean; message?: string }>(
    `/wp-json/2day/v1/reviews/${reviewId}/report`,
    {
      method: "POST",
      body: { reason, description },
    }
  );
}

export async function replyToReview(
  reviewId: number,
  productId: number,
  content: string,
  name: string,
  email: string
): Promise<{ success: boolean; id?: number; message?: string }> {
  return wpFetch<{ success: boolean; id?: number; message?: string }>(
    `/wp-json/2day/v1/reviews/${reviewId}/reply`,
    {
      method: "POST",
      body: { product_id: productId, content, name, email },
    }
  );
}

function fixWpUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const urlObj = new URL(url);
    // Use http instead of https for local .test domains to avoid Next.js SSL certificate errors during image optimization
    if (urlObj.hostname.endsWith('.test') && urlObj.protocol === 'https:') {
      urlObj.protocol = 'http:';
      return urlObj.toString();
    }
  } catch (e) {
    // ignore
  }
  return url;
}

export async function uploadReviewImage(file: File): Promise<{ success: boolean; url?: string; message?: string }> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const origin = getWpOrigin();
    if (!origin) throw new Error("API origin not found");

    const response = await fetch(`${origin}/wp-json/2day/v1/reviews/upload`, {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type header manually when sending FormData, browser will set it with boundary
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.url) {
      data.url = fixWpUrl(data.url);
    }
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, message: "Erreur lors de l'upload" };
  }
}

export async function getRecentTestimonials(): Promise<import("@/lib/data").Testimonial[]> {
 const reviews = await wpFetch<Array<{ id: number; name: string; city?: string; text: string; rating: number; product?: string }>>("/wp-json/2day/v1/reviews/recent", { cache: "no-store" });
 return (Array.isArray(reviews) ? reviews : []).map(r => ({ id: String(r.id), name: r.name || "Client", city: r.city || "", text: r.text || "", rating: Math.max(0, Math.min(5, Number(r.rating) || 0)), product: r.product || "", avatar: "" }));
}
