'use client';

import Image from 'next/image';

interface ImageLeftTextRightProps {
  image: string;
  title: string;
  text: string;
}

export default function ImageLeftTextRight({ image, title, text }: ImageLeftTextRightProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="lg:pl-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-6">
              {title}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
