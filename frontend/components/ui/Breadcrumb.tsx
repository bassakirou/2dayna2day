import Link from 'next/link';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="bg-neutral-light border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <div key={`${item.label}-${index}`} className="flex items-center space-x-2">
                {item.href && !isLast ? (
                  <Link href={item.href} className="text-gray-500 hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-primary font-medium' : 'text-gray-500'}>
                    {item.label}
                  </span>
                )}

                {!isLast && <span className="text-gray-400">/</span>}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

