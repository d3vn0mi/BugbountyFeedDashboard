export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-brand-surface rounded-xl border border-gray-200 dark:border-brand-border shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-brand-pill" />
          <div className="space-y-2">
            <div className="h-4 w-36 bg-gray-200 dark:bg-brand-pill rounded" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-brand-pill rounded" />
          </div>
        </div>
        <div className="h-5 w-16 bg-gray-200 dark:bg-brand-pill rounded-full" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-24 bg-gray-200 dark:bg-brand-pill rounded-md" />
        <div className="h-5 w-14 bg-gray-200 dark:bg-brand-pill rounded-md" />
        <div className="h-5 w-14 bg-gray-200 dark:bg-brand-pill rounded-md" />
      </div>
      <div className="mt-2 h-3 w-48 bg-gray-200 dark:bg-brand-pill rounded" />
      <div className="mt-3 flex justify-between">
        <div className="h-3 w-20 bg-gray-200 dark:bg-brand-pill rounded" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-brand-pill rounded" />
      </div>
    </div>
  );
}
