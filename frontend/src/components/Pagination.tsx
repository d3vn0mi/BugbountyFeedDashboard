interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-600">
        Showing {start}-{end} of {total.toLocaleString()} programs
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600 px-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
