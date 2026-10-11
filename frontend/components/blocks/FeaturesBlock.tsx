"use client";

import Image from "next/image";

import {
  Zap,
  Shield,
  Package,
  CreditCard,
  Battery,
  Monitor,
  Smartphone,
  Truck,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  Volume2,
  AudioLines,
  Mic,
  VolumeX,
  Music,
  Touchpad,
  Database,
  Usb,
  Plug,
  Moon,
  Ruler,
} from "lucide-react";

interface Feature {
  icon?: string;
  image?: string;
  title: string;
  text: string;
}

interface FeaturesBlockProps {
  title: string;
  items: Feature[];
  columns?: 2 | 3 | 4;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Shield,
  Package,
  CreditCard,
  Battery,
  Monitor,
  Smartphone,
  Truck,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  Volume2,
  AudioLines,
  Mic,
  VolumeX,
  Music,
  Touchpad,
  Database,
  Usb,
  Plug,
  Moon,
  Ruler,
};

export default function FeaturesBlock({
  title,
  items,
  columns = 4,
}: FeaturesBlockProps) {
  const gridCols =
    columns === 2
      ? "lg:grid-cols-2"
      : columns === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-4";

  return (
    <section className="py-16 sm:py-24 bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-body font-heading mb-12">
          {title}
        </h2>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-6`}>
          {items.map((item, index) => {
            const IconComponent = (item.icon && iconMap[item.icon]) || Zap;

            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      width={28}
                      height={28}
                      unoptimized
                      className="w-7 h-7 object-contain"
                    />
                  ) : (
                    <IconComponent className="w-7 h-7 text-primary" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-body mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
