'use client';

import Image from 'next/image';

interface ImageRightTextLeftProps {
  image: string;
  title: string;
  text: string;
}

export default function ImageRightTextLeft({ image, title, text }: ImageRightTextLeftProps) {
  return (
    <section className="py-16 sm:py-24 bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="lg:pr-8 order-2 lg:order-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-6">
              {title}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {text}
            </p>
          </div>

          {/* Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl order-1 lg:order-2">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
