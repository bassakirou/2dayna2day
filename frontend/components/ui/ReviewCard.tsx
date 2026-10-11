"use client";
import { useState } from "react";
import Image from "next/image";
import { Check, Star, Reply, AlertTriangle } from "lucide-react";
import type { Review } from "@/lib/wp-reviews";
import { siteConfig } from "@/lib/data";
import Pagination from "./Pagination";
export default function ReviewCard({
  review,
  onReply,
  onReport,
  onImage,
  showReplies = true,
}: {
  review: Review;
  onReply?: (id: number) => void;
  onReport?: (id: number) => void;
  onImage?: (images: string[], index: number) => void;
  showReplies?: boolean;
}) {
  const [page, setPage] = useState(1);
  const replies = review.replies || [];
  const date = (s: string) =>
    new Date(s.replace(" ", "T")).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const stars = (rating: number) => (
    <span
      className="inline-flex gap-0.5 text-amber-600"
      aria-label={`${rating} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={15}
          aria-hidden="true"
          fill={n <= rating ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
            {review.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{review.author}</span>
              {review.verified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700">
                  <Check size={13} />
                  Achat vérifié
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {review.location && `${review.location} · `}
              {date(review.date)}
            </p>
          </div>
        </div>
        {stars(review.rating)}
      </div>
      <div>
        <h3 className="font-bold text-lg">{review.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mt-2">
          {review.content}
        </p>
      </div>
      {review.images?.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {review.images.map((src, i) => (
            <button
              key={src + i}
              disabled={!onImage}
              onClick={() => onImage?.(review.images, i)}
              aria-label={`Agrandir la photo ${i + 1}`}
              className="relative w-20 h-20 rounded-lg overflow-hidden"
            >
              <Image
                src={src}
                alt={`Photo de l’avis ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {Object.keys(review.criteria || {}).length > 0 && (
        <dl className="flex flex-wrap gap-5 border-t pt-4">
          {Object.entries(review.criteria).map(([label, rating]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 mb-1">{label}</dt>
              <dd>{stars(rating)}</dd>
            </div>
          ))}
        </dl>
      )}
      {(onReply || onReport) && (
        <div className="flex justify-between items-center gap-3 border-t pt-4 text-xs text-gray-600">
          {onReply && (
            <button
              onClick={() => onReply(review.id)}
              className="inline-flex gap-1 items-center hover:text-accent-red"
            >
              <Reply size={15} />
              Répondre
            </button>
          )}
          {onReport && (
            <button
              onClick={() => onReport(review.id)}
              className="inline-flex gap-1 items-center hover:text-red-700"
            >
              <AlertTriangle size={15} />
              Signaler
            </button>
          )}
        </div>
      )}
      {showReplies && replies.length > 0 && (
        <section
          aria-label="Réponses à l’avis"
          className="border-t pt-4 space-y-4"
        >
          <h4 className="font-semibold text-sm">{replies.length} réponse(s)</h4>
          {replies.slice((page - 1) * 4, page * 4).map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-xl ${r.isAdmin ? "bg-red-50" : "bg-gray-50"}`}
            >
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <strong>
                  {r.isAdmin
                    ? "Service client " + siteConfig.siteName
                    : r.author}
                </strong>
                <time className="text-gray-500 text-xs">{date(r.date)}</time>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mt-2">
                {r.content}
              </p>
              {onReply && (
                <button
                  onClick={() => onReply(r.id)}
                  className="text-xs mt-3 text-gray-600 hover:text-accent-red"
                >
                  Répondre
                </button>
              )}
            </div>
          ))}
          {replies.length > 4 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(replies.length / 4)}
              onPageChange={setPage}
            />
          )}
        </section>
      )}
    </article>
  );
}
