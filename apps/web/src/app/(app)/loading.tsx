/** Shown instantly while a library page loads, so navigation feels immediate. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="mb-2 h-3 w-20 rounded bg-black/10 dark:bg-white/10" />
      <div className="mb-6 h-7 w-56 rounded bg-black/10 dark:bg-white/10" />
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {[96, 140, 80, 120, 100, 150].map((h, i) => (
          <div key={i} className="card mb-4 break-inside-avoid p-4">
            <div className="rounded bg-black/10 dark:bg-white/10" style={{ height: h }} />
            <div className="mt-3 h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
