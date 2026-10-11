'use client';

import { useState, useEffect } from "react";
import { Link } from "@/navigation";

interface CountdownBlockProps {
  endDate: string;
  title?: string;
  subtitle?: string;
  discountType?: string;
  discountValue?: number;
  buttonText?: string;
  productSlug?: string;
  basePrice?: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownBlock({
  endDate,
  title,
  subtitle,
  discountType,
  discountValue,
  buttonText,
  productSlug,
  basePrice,
}: CountdownBlockProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const deadline = endDate ? Date.parse(endDate) : NaN;

  useEffect(() => {
    setIsExpired(false);
    if (!Number.isFinite(deadline)) {
      setTimeLeft({days:0,hours:0,minutes:0,seconds:0});
      return;
    }
    const calculateTimeLeft = () => {
      const difference = deadline - Date.now();

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      if (Date.now() >= deadline) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const checkoutHref = productSlug ? `/upsell/${productSlug}` : null;

  if (isExpired || !Number.isFinite(deadline)) return null;

  const timeBlocks = [
    { value: timeLeft.days, label: "Jours" },
    { value: timeLeft.hours, label: "Heures" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Secondes" },
  ];

  return (
    <section className="py-12 bg-red-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-white/80 mb-8">{subtitle}</p>
        )}

        <div className="flex justify-center space-x-4 sm:space-x-8">
          {timeBlocks.map((block, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl sm:text-4xl font-bold text-red-500">
                  {String(block.value).padStart(2, "0")}
                </span>
              </div>
              <span className="text-white text-xs sm:text-sm">{block.label}</span>
            </div>
          ))}
        </div>

        {checkoutHref && (
          <div className="mt-8">
            <Link
              href={checkoutHref}
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-red-600 font-bold hover:bg-white/90 transition-colors"
            >
              {(buttonText || "").trim() !== "" ? buttonText : "Commander"}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
