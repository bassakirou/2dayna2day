"use client";
import { useEffect, useState } from "react";
import { Testimonial } from "@/lib/data";
import { getRecentTestimonials } from "@/lib/wp-reviews";
import { Star } from "lucide-react";
export default function RecentTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  useEffect(() => { let active = true; getRecentTestimonials().then(result => { if (active) setItems(result); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!items.length) return null;
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{items.slice(0, 3).map(item => <figure key={item.id} className="bg-white rounded-xl p-6 border border-gray-100"><div className="flex mb-4" aria-label={`${item.rating} sur 5`}>{Array.from({length: 5}, (_, i) => <Star key={i} className={`w-5 h-5 ${i < item.rating ? "fill-accent-red text-accent-red" : "text-gray-300"}`} />)}</div><blockquote className="mb-6 break-words">{item.text}</blockquote><figcaption><strong>{item.name}</strong><p className="text-sm text-gray-600">{item.city}</p></figcaption></figure>)}</div>;
}
