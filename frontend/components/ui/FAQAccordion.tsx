"use client";

import { sanitizeHtml } from "@/lib/html";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { WPFAQ } from "@/lib/wp-pages";

export default function FAQAccordion({ faqs }: { faqs: WPFAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (faqs.length === 0) {
    return <p className="text-gray-500 text-center py-8">Aucune question trouvée.</p>;
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div 
          key={faq.id} 
          className="border border-gray-200 rounded-lg bg-white overflow-hidden transition-all duration-200"
        >
          <button
            aria-expanded={openIndex === index}
            aria-controls={`faq-${faq.id}`}
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between p-4 sm:p-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
            <ChevronDown 
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <div 
            id={`faq-${faq.id}`}
            hidden={openIndex !== index}
          >
            <div 
              className="p-4 sm:p-6 pt-0 text-gray-600 prose prose-sm sm:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
