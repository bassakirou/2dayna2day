export default function AccountSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Chargement de votre compte"
      className="space-y-5 motion-safe:animate-pulse"
    >
      <span className="sr-only">Chargement…</span>
      <div className="h-7 w-48 rounded-lg bg-gray-200" />
      <div className="h-4 w-64 max-w-full rounded bg-gray-200" />
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6"
        >
          <div className="flex justify-between gap-4">
            <div className="h-5 w-40 rounded bg-gray-100" />
            <div className="h-8 w-24 rounded-lg bg-gray-100" />
          </div>
          <div className="flex gap-5">
            <div className="h-20 w-20 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-4 pt-2">
              <div className="h-5 w-3/4 rounded bg-gray-100" />
              <div className="h-4 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
