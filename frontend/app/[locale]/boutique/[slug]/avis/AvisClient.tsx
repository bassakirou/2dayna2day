"use client";

import { useState, useEffect, use } from "react";
import { Link } from "@/navigation";
import Image from "next/image";
import { Check, Star, AlertTriangle, ArrowLeft, Plus, Filter, ChevronDown, MessageCircle, Reply } from "lucide-react";
import { Product } from "@/lib/data";
import { getProductBySlugConnected } from "@/lib/wp-products";
import { getReviews, ReviewsResponse } from "@/lib/wp-reviews";
import ReviewCard from '@/components/ui/ReviewCard';
import Breadcrumb from "@/components/ui/Breadcrumb";
import ReviewModal from "./ReviewModal";
import ReportReviewModal from "./ReportReviewModal";
import ReplyReviewModal from "./ReplyReviewModal";
import ProductMobileNav from "@/components/ui/ProductMobileNav";
import ImageLightbox from "@/components/ui/ImageLightbox";
import Pagination from "@/components/ui/Pagination";
import { ReviewSkeleton } from "@/components/ui/skeletons/ReviewSkeleton";

import { useAuth } from "@/context/AuthContext";

interface AvisPageProps {
  params: Promise<{ slug: string }>;
}

export default function AvisClient({ params }: AvisPageProps) {
  const { user } = useAuth();
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingReviewState, setPendingReviewState] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<number | null>(null);
  const [replyReviewId, setReplyReviewId] = useState<number | null>(null);
  const [pendingReplyState, setPendingReplyState] = useState<number | null>(null);
  
  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Filters and Pagination
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const REVIEWS_PER_PAGE = 15;
  
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const prod = await getProductBySlugConnected(slug);
      setProduct(prod);
      setIsLoading(false);
    };
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    async function load() {
      if (!product || !product.wpId) {
        return;
      }
      setIsLoading(true);
      try {
        const data = await getReviews(product.wpId, { 
          rating: filterRating || undefined,
          page: currentPage,
          per_page: REVIEWS_PER_PAGE
        });
        setReviewsData(data);
      } catch (err) {
        console.log("Impossible de charger les avis:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [product, filterRating, currentPage]);

  // Open review modal automatically after login if pending
  useEffect(() => {
    if (user && pendingReviewState) {
      setIsModalOpen(true);
      setPendingReviewState(false);
    }
    
    if (user && pendingReplyState !== null) {
      setReplyReviewId(pendingReplyState);
      setPendingReplyState(null);
    }
  }, [user, pendingReviewState, pendingReplyState]);

  const handleWriteReview = () => {
    if (!user) {
      setPendingReviewState(true);
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { tab: "login" } })
      );
      return;
    }
    setIsModalOpen(true);
  };

  const handleReport = (reviewId: number) => {
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { tab: "login" } })
      );
      return;
    }
    setReportReviewId(reviewId);
  };

  const handleReply = (reviewId: number) => {
    if (!user) {
      setPendingReplyState(reviewId);
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { tab: "login" } })
      );
      return;
    }
    setReplyReviewId(reviewId);
  };

  if (isLoading && !product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-8 lg:py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            {[...Array(3)].map((_, i) => (
              <ReviewSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-body mb-4">Produit non trouvé</h1>
          <Link href="/boutique" className="inline-flex items-center space-x-2 text-primary hover:text-accent-blue transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à la boutique</span>
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "sm") => {
    const starClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-6 h-6",
    };
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starClasses[size]} ${
              rating >= star ? "fill-[#f59e0b] text-[#f59e0b]" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-light pb-20 md:pb-0">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Boutique", href: "/boutique" },
          { label: product.name, href: `/boutique/${product.slug}` },
          { label: "Tous les avis" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/boutique/${product.slug}`}
          className="inline-flex items-center space-x-2 text-primary hover:text-accent-blue transition-colors font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour à la description</span>
        </Link>

        {/* Product Header Card */}
        <div className="bg-orange-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border border-orange-100">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0">
              <Image src={product.thumbnail} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                {product.category || "Produit"}
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-body leading-tight mb-2">
                {product.name}
              </h1>
              {reviewsData && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-bold text-body">{reviewsData.stats.average.toFixed(1)}</span>
                  {renderStars(reviewsData.stats.average, "sm")}
                  <span>• {reviewsData.stats.total} avis</span>
                  <span>• {reviewsData.stats.recommendPercent}% recommandent ce produit</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleWriteReview}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
          >
            Écrire un avis
          </button>
        </div>

        {reviewsData && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Filters */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
              <h3 className="font-bold text-body text-lg mb-4">Filtrer les avis</h3>
              
              <div>
                <h4 className="font-bold text-sm text-body mb-3">Note</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <label key={star} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterRating === star}
                        onChange={() => setFilterRating(filterRating === star ? null : star)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex items-center gap-2 text-sm text-gray-600 flex-1">
                        {renderStars(star, "sm")}
                        <span>{star} étoiles</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {reviewsData.stats.distribution[star] || 0}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-body mb-3">Avec photos</h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="text-sm text-gray-600">Uniquement avec photos</span>
                  </div>
                  <span className="text-xs text-gray-400">{reviewsData.stats.withPhotos}</span>
                </label>
              </div>

              {reviewsData.stats.tags && reviewsData.stats.tags.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-body mb-3">Mots-clés</h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewsData.stats.tags.map((tag) => (
                      <button
                        key={tag.tag}
                        className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-gray-300 bg-white"
                      >
                        {tag.tag} ({tag.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content - Stats & List */}
            <div className="flex-1">
              {/* Stats Panel */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Global Average */}
                <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
                  <div className="text-5xl font-black text-body mb-2">
                    {reviewsData.stats.average.toFixed(1).replace(".", ",")}
                  </div>
                  <div className="mb-1">{renderStars(reviewsData.stats.average, "md")}</div>
                  <div className="text-sm text-gray-500 mb-3">{reviewsData.stats.total} avis</div>
                  {reviewsData.stats.recommendPercent > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      {reviewsData.stats.recommendPercent}% recommandent
                    </div>
                  )}
                </div>

                {/* Distribution */}
                <div className="border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 pr-0 md:pr-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Distribution</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewsData.stats.distribution[star] || 0;
                      const percent = reviewsData.stats.total > 0 ? (count / reviewsData.stats.total) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="w-3">{star}</span>
                          <Star className="w-3 h-3 text-gray-400" />
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#f59e0b]" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-6 text-right">{Math.round(percent)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Criteria */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Critères détaillés</h4>
                  <div className="space-y-3">
                    {Object.entries(reviewsData.stats.criteria).map(([crit, val]) => (
                      <div key={crit} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex-1 truncate pr-2">{crit}</span>
                        <div className="flex items-center gap-2">
                          {renderStars(val, "sm")}
                          <span className="font-bold text-body w-6 text-right">{val.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                    {Object.keys(reviewsData.stats.criteria).length === 0 && (
                      <p className="text-xs text-gray-400">Pas encore de critères évalués.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className="font-bold text-body">
                    {reviewsData.stats.total} avis {filterRating && `(${filterRating} étoiles)`}
                  </h3>
                  <select className="text-sm border-gray-200 rounded-lg focus:ring-primary focus:border-primary">
                    <option>Plus récents</option>
                    <option>Meilleures notes</option>
                    <option>Moins bonnes notes</option>
                  </select>
                </div>

                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <ReviewSkeleton key={`skel-${i}`} />
                    ))}
                  </div>
                ) : reviewsData.items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Aucun avis trouvé pour les filtres sélectionnés.
                  </div>
                ) : (
                  <>
                    {reviewsData.items.map(review => <div key={review.id} className="mb-6"><ReviewCard review={review} onReply={handleReply} onReport={handleReport} onImage={(images, index) => { setLightboxImages(images); setLightboxIndex(index); setIsLightboxOpen(true); }} /></div>)}
                {Math.ceil(reviewsData.stats.total / REVIEWS_PER_PAGE) > 1 && (
                  <div className="border-t border-gray-100 pt-8 mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(reviewsData.stats.total / REVIEWS_PER_PAGE)}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ProductMobileNav productId={product.id} productSlug={product.slug} />

      {isModalOpen && (
        <ReviewModal
          product={product}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (product.wpId) {
              getReviews(product.wpId).then(setReviewsData).catch(err => console.error(err));
            }
          }}
        />
      )}

      {reportReviewId !== null && (
        <ReportReviewModal
          isOpen={true}
          onClose={() => setReportReviewId(null)}
          reviewId={reportReviewId}
        />
      )}

      {replyReviewId !== null && (
        <ReplyReviewModal
          isOpen={true}
          onClose={() => setReplyReviewId(null)}
          reviewId={replyReviewId}
          productId={parseInt(product.wpId || "0", 10)}
          onSuccess={() => {
            // Re-fetch to show new reply
            if (product.wpId) {
              getReviews(product.wpId).then(setReviewsData).catch(err => console.error(err));
            }
          }}
        />
      )}

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
