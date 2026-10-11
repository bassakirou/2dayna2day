import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { reportReview } from "@/lib/wp-reviews";

const REPORT_REASONS = [
  "Contenu inapproprié ou offensant",
  "Spam ou publicité",
  "Harcèlement ou discours de haine",
  "Informations fausses ou trompeuses",
  "Autre"
];

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: number;
}

export default function ReportReviewModal({ isOpen, onClose, reviewId }: ReportReviewModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await reportReview(reviewId, reason, description);
      if (res.success) {
        toast.success("Signalement envoyé. Merci de nous aider à maintenir la qualité des avis !");
        onClose();
      } else {
        toast.error(res.message || "Erreur lors de l'envoi du signalement.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Signaler l&apos;avis</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-6">
            Votre signalement est anonyme et nous aidera à examiner cet avis.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Type de problème</label>
              <select
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description (optionnelle)</label>
              <textarea
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px]"
                placeholder="Fournissez plus de détails si nécessaire..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le signalement"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
