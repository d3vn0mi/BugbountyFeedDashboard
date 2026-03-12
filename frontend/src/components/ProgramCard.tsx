import type { Program } from "../api";
import PlatformBadge from "./PlatformBadge";

interface ProgramCardProps {
  program: Program;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (program: Program) => void;
}

function isNew(fetchedAt: string | null): boolean {
  if (!fetchedAt) return false;
  const diff = Date.now() - new Date(fetchedAt).getTime();
  return diff < 24 * 60 * 60 * 1000;
}

export default function ProgramCard({ program, isFavorite, onToggleFavorite, onClick }: ProgramCardProps) {
  const statusColor =
    program.status === "open"
      ? "bg-emerald-400"
      : "bg-yellow-400";

  return (
    <div
      className="bg-white dark:bg-brand-surface rounded-xl border border-gray-200 dark:border-brand-border shadow-sm hover:shadow-md dark:hover:border-brand-border-hover transition-all p-5 cursor-pointer"
      onClick={() => onClick(program)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {program.logo_url ? (
            <img
              src={program.logo_url}
              alt=""
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-brand-pill flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 font-bold text-sm">
                {program.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`}
                title={program.status}
              />
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {program.name}
              </h3>
              {isNew(program.fetched_at) && (
                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                  New
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(program.id);
            }}
            className={`p-1 rounded transition-colors ${
              isFavorite
                ? "text-yellow-500 hover:text-yellow-600"
                : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <PlatformBadge platform={program.platform} />
        </div>
      </div>

      {/* Reward and asset types */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
          {program.reward_range}
        </span>
        {program.asset_types.length > 0 && (
          <span className="text-gray-500 dark:text-gray-600">|</span>
        )}
        {program.asset_types.slice(0, 4).map((t) => (
          <span
            key={t}
            className="text-gray-600 dark:text-brand-text bg-gray-100 dark:bg-brand-pill px-2 py-0.5 rounded-md capitalize"
          >
            {t.replace("_", " ")}
          </span>
        ))}
      </div>

      {/* Scope */}
      {program.assets.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-600 dark:text-gray-300">Scope: </span>
          {program.assets.slice(0, 3).join(", ")}
          {program.assets.length > 3 && (
            <span className="text-gray-400 dark:text-gray-500">
              {" "}+{program.assets.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {program.description && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {program.description}
        </p>
      )}

      {/* Footer: response time + link */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {program.response_time && (
            <span>{program.response_time}</span>
          )}
          {program.managed && (
            <span className="ml-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
              Managed
            </span>
          )}
        </div>
        <a
          href={program.platform_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-brand-cyan hover:text-blue-800 dark:hover:text-cyan-300 transition-colors"
        >
          View Program
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
