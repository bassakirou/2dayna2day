"use client";

import { useState, useRef } from "react";
import { X, Star, Upload, Check } from "lucide-react";
import { Product } from "@/lib/data";
import { postReview, uploadReviewImage, ReviewCriteria } from "@/lib/wp-reviews";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface ReviewModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

const PREDEFINED_TAGS = [
  "Excellente autonomie",
  "Confortable",
  "Bon ANC",
  "Livraison rapide",
  "Bon rapport qualité-prix",
  "Câble court",
  "Recommande",
];

export default function ReviewModal({ product, onClose, onSuccess }: ReviewModalProps) {
  const { user, token } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const [criteriaRatings, setCriteriaRatings] = useState<ReviewCriteria>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recommend, setRecommend] = useState(true);
  
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCriteriaChange = (criterion: string, val: number) => {
    setCriteriaRatings((prev) => ({ ...prev, [criterion]: val }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (images.length + e.target.files.length > 5) {
      setError("Maximum 5 photos.");
      return;
    }

    setIsUploading(true);
    setError("");

    const newImages = [...images];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError(`Le fichier ${file.name} dépasse 5 Mo.`);
        continue;
      }
      
      const res = await uploadReviewImage(file);
      if (res.success && res.url) {
        newImages.push(res.url);
      } else {
        setError(res.message || "Erreur lors de l'upload d'une image.");
      }
    }

    setImages(newImages);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Veuillez donner une note globale.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Veuillez remplir le titre et le contenu de votre avis.");
      return;
    }

    if (!user) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab: "login" } }));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await postReview({
        product_id: parseInt(product.wpId || "0", 10),
        rating,
        title,
        content,
        name: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ""}`.trim() : "Client 2day",
        email: user.profile?.email || "",
        recommend,
        criteria: criteriaRatings,
        tags: selectedTags,
        images,
      }, token);

      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || "Erreur lors de la soumission de l'avis.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl my-8">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-body">Écrire un avis</h2>
            <p className="text-sm text-gray-500">Aidez la communauté 2dayna2day à mieux choisir.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-body hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 p-4 mb-8 bg-neutral-light rounded-xl">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white">
              <Image src={product.thumbnail} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-body">{product.name}</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Note globale */}
            <div>
              <label className="block text-sm font-bold text-body mb-3">Note globale *</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoveredRating || rating) >= star
                          ? "fill-[#f59e0b] text-[#f59e0b]"
                          : "text-gray-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
                <span className="ml-4 font-medium text-[#f59e0b]">
                  {rating === 5 ? "Excellent !" : rating === 4 ? "Très bon" : rating === 3 ? "Moyen" : rating === 2 ? "Décevant" : rating === 1 ? "Très mauvais" : ""}
                </span>
              </div>
            </div>

            {/* Critères détaillés */}
            {product.reviewCriteria && product.reviewCriteria.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-body mb-4">Critères détaillés</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {product.reviewCriteria.map((crit) => (
                    <div key={crit}>
                      <span className="block text-sm text-gray-700 mb-2">{crit}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleCriteriaChange(crit, star)}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                (criteriaRatings[crit] || 0) >= star
                                  ? "fill-[#f59e0b] text-[#f59e0b]"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Titre et contenu */}
            <div>
              <label className="block text-sm font-bold text-body mb-2">Titre de votre avis *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Résumez votre avis en quelques mots"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-body mb-2">Votre avis *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Racontez-nous votre expérience avec ce produit..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-2">Plus c&apos;est précis, plus c&apos;est utile pour les autres acheteurs. Min. 30 caractères.</p>
            </div>

            {/* Étiquettes */}
            <div>
              <label className="block text-sm font-bold text-body mb-3">Étiquettes (optionnel)</label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-primary text-primary bg-primary/5"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 inline-block mr-1" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-bold text-body mb-3">Ajouter des photos (optionnel)</label>
              <div className="flex flex-wrap gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={img} alt={`Photo ${i+1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <span className="text-xs">Upload...</span>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-2xl font-light">+</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png, image/webp"
                  multiple
                  onChange={handleFileUpload}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Max 5 photos • format JPG/PNG • 5 Mo</p>
            </div>

            {/* Recommandation */}
            <div className="p-4 bg-neutral-light rounded-xl flex items-center justify-between cursor-pointer" onClick={() => setRecommend(!recommend)}>
              <div>
                <p className="font-bold text-body">Je recommande ce produit</p>
                <p className="text-sm text-gray-500">Sera affiché à côté de votre avis</p>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${recommend ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${recommend ? "translate-x-6" : "translate-x-0"}`} />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Votre avis sera modéré sous 24h.
              </p>
              <div className="flex w-full sm:w-auto gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-200 font-medium text-body hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0 || !title || !content}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Envoi..." : "Publier mon avis"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
