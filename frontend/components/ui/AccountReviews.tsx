"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from 'lucide-react';
import { Link } from "@/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getMyReviews,
  getMyReview,
  type AccountReview,
} from "@/lib/wp-account";
import ReviewCard from "./ReviewCard";
import AccountSkeleton from "./skeletons/AccountSkeleton";
import Pagination from "./Pagination";
import ImageLightbox from "./ImageLightbox";
export default function AccountReviews() {
  const { token } = useAuth();
  const params = useSearchParams();
  const id = params.get("id");
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [items, setItems] = useState<AccountReview[]>([]);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    const request = id
      ? getMyReview(token, id).then((r) => ({ items: [r], pages: 1, total: 1 }))
      : getMyReviews(token, page, rating, sort);
    request
      .then((r) => {
        if (active) {
          setItems(r.items);
          setPages(r.pages);
          setTotal(r.total);
        }
      })
      .catch(() => {
        if (active) setError("Impossible de charger vos avis.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, id, page, rating, sort, retry]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          {id ? "Détail de mon avis" : "Mes avis"}
        </h1>
        <p className="text-gray-600 mt-1">
          Retrouvez vos avis et les réponses reçues.
        </p>
      </header>
      {id ? (
        <Link href="/account/avis" className="inline-flex items-center gap-2 text-accent-red">
          <ArrowLeft size={18} aria-hidden="true" />
          Retour à mes avis
        </Link>
      ) : (
        <div className="flex flex-wrap gap-4">
          <label className="text-sm">
            Note
            <select
              aria-label="Note"
              className="block border rounded-lg p-2 mt-1 bg-white"
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Toutes les notes</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} sur 5
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Trier
            <select
              aria-label="Trier"
              className="block border rounded-lg p-2 mt-1 bg-white"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Plus récents</option>
              <option value="oldest">Plus anciens</option>
            </select>
          </label>
        </div>
      )}
      {loading ? (
        <AccountSkeleton rows={2} />
      ) : error ? (
        <div role="alert">
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)} className="underline">
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {!id && (
            <p className="text-sm text-gray-500">{total} avis trouvé(s)</p>
          )}
          {!items.length ? (
            <p className="bg-white border rounded-2xl p-8">
              Aucun avis pour ces filtres.
            </p>
          ) : (
            items.map((review) => (
              <section key={review.id} className="space-y-3">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <p className="font-medium">
                    {review.productName} ·{" "}
                    <span className="text-gray-500">{review.status}</span>
                  </p>
                  {!id && (
                    <Link
                      href={`/account/avis?id=${review.id}`}
                      className="text-accent-red font-semibold"
                    >
                      Voir les détails et réponses
                    </Link>
                  )}
                </div>
                <ReviewCard
                  review={review}
                  showReplies={!!id}
                  onImage={(images, index) => {
                    setPhotos(images);
                    setPhotoIndex(index);
                  }}
                />
              </section>
            ))
          )}
          {!id && pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      {photos.length > 0 && (
        <ImageLightbox
          images={photos}
          initialIndex={photoIndex}
          isOpen
          onClose={() => setPhotos([])}
        />
      )}
    </div>
  );
}
