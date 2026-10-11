import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { replyToReview } from "@/lib/wp-reviews";
import { useAuth } from "@/context/AuthContext";

interface ReplyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: number;
  productId: number;
  onSuccess: () => void;
}

export default function ReplyReviewModal({ isOpen, onClose, reviewId, productId, onSuccess }: ReplyReviewModalProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!content.trim()) {
      toast.error("Veuillez saisir votre réponse.");
      return;
    }

    setIsSubmitting(true);
    try {
      const name = user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ""}`.trim() : "Membre 2day";
      const email = user.profile?.email || "";

      const res = await replyToReview(reviewId, productId, content, name, email);
      if (res.success) {
        toast.success("Votre réponse a été publiée avec succès !");
        setContent("");
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Erreur lors de la publication de la réponse.");
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
          <div className="flex items-center gap-2 text-primary">
            <MessageCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Répondre à l&apos;avis</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Votre réponse</label>
              <textarea
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px]"
                placeholder="Rédigez votre réponse ici..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Publication en cours..." : "Publier ma réponse"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
