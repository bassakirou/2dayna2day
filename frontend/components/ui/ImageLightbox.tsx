"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
      if (e.key === "ArrowRight") setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, images.length]);

  if (!isOpen || images.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Header / Close button */}
      <div className="absolute top-0 w-full flex justify-between items-center p-4 z-10">
        <div className="text-white font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Left */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevImage();
          }}
          className="absolute left-4 p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors z-10 backdrop-blur-md"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Main Image */}
      <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center p-4 outline-none" onClick={onClose}>
        <div 
          className="relative w-full h-full cursor-default flex items-center justify-center"
          onClick={(e) => e.stopPropagation()} // Prevent click propagation to parent
        >
          <Image
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Navigation Right */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          className="absolute right-4 p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors z-10 backdrop-blur-md"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
