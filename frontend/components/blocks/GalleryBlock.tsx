'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export type GalleryImage = string | {id?: number; url: string; alt?: string; caption?: string; description?: string};

export default function GalleryBlock({images, title}: {images: GalleryImage[]; title?: string}) {
  const photos = (Array.isArray(images) ? images : []).map(image => typeof image === 'string' ? {url:image} : image).filter(image => image && typeof image.url === 'string' && image.url.trim());
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const photo = selected === null ? null : photos[selected];
  const isLightboxOpen = selected !== null;
  useEffect(() => {
    if (!isLightboxOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
      if (event.key === 'ArrowRight') setSelected(index => index === null ? null : (index + 1) % photos.length);
      if (event.key === 'ArrowLeft') setSelected(index => index === null ? null : (index + photos.length - 1) % photos.length);
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {document.body.style.overflow = overflow; document.removeEventListener('keydown',onKey); trigger.current?.focus();};
  }, [isLightboxOpen, photos.length]);
  if (!photos.length) return null;
  return <section className="py-16 sm:py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl sm:text-4xl font-bold text-center text-body font-heading mb-12">{title || 'Galerie Photos'}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((image,index) => <button type="button" key={`${image.url}-${index}`} aria-label={`Agrandir ${image.alt || `la photo ${index+1}`}`} onClick={event => {trigger.current=event.currentTarget;setSelected(index);}} className="relative aspect-square rounded-xl overflow-hidden group">
          <Image src={image.url} alt={image.alt || `Photo ${index+1}`} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover group-hover:scale-110 transition-transform duration-500" />
        </button>)}
      </div>
    </div>
    {photo && selected !== null && createPortal(<div ref={dialog} role="dialog" aria-modal="true" aria-label="Photo agrandie" className="fixed inset-0 z-[100010] bg-black/95 flex flex-col items-center justify-center px-12 py-16" onClick={event => {if(event.target===event.currentTarget)setSelected(null);}}>
      <button type="button" aria-label="Fermer la galerie" onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 text-white"><X className="w-8 h-8" /></button>
      {photos.length>1 && <><button type="button" aria-label="Photo précédente" onClick={() => setSelected((selected+photos.length-1)%photos.length)} className="absolute left-1 sm:left-4 p-2 text-white"><ChevronLeft className="w-8 h-8" /></button>
      <button type="button" aria-label="Photo suivante" onClick={() => setSelected((selected+1)%photos.length)} className="absolute right-1 sm:right-4 p-2 text-white"><ChevronRight className="w-8 h-8" /></button></>}
      <figure className="w-full max-w-5xl flex flex-col min-h-0">
        <div className="relative w-full h-[60vh] shrink-0"><Image src={photo.url} alt={photo.alt || `Photo ${selected+1}`} fill sizes="90vw" className="object-contain" /></div>
        {(photo.caption || photo.description) && <figcaption className="text-white text-center mt-4 overflow-auto max-h-[18vh] whitespace-pre-line">
          {photo.caption && <p className="font-semibold mb-2">{photo.caption}</p>}
          {photo.description && <p>{photo.description}</p>}
        </figcaption>}
      </figure>
      <p className="text-white mt-4">{selected+1} / {photos.length}</p>
    </div>, document.body)}
  </section>;
}
