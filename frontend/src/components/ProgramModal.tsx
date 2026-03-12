import { useEffect } from "react";
import type { Program } from "../api";
import PlatformBadge from "./PlatformBadge";

interface ProgramModalProps {
  program: Program;
  onClose: () => void;
}

export default function ProgramModal({ program, onClose }: ProgramModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusColor =
    program.status === "open" ? "bg-emerald-400" : "bg-yellow-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-brand-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-brand-border">
        <div className="sticky top-0 bg-white dark:bg-brand-surface border-b border-gray-200 dark:border-brand-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {program.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${statusColor}`}
                />
                <span className="text-sm text-gray-500 dark:text-brand-text capitalize">
                  {program.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-pill transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Platform & Reward */}
          <div className="flex flex-wrap items-center gap-3">
            <PlatformBadge platform={program.platform} />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg text-sm">
              {program.reward_range}
            </span>
            {program.managed && (
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                Managed
              </span>
            )}
            {program.response_time && (
              <span className="text-xs text-gray-500 dark:text-brand-muted">
                Response: {program.response_time}
              </span>
            )}
          </div>

          {/* Description */}
          {program.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </h3>
              <p className="text-sm text-gray-600 dark:text-brand-text">
                {program.description}
              </p>
            </div>
          )}

          {/* Asset Types */}
          {program.asset_types.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Types
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {program.asset_types.map((t) => (
                  <span
                    key={t}
                    className="text-xs text-gray-600 dark:text-brand-text bg-gray-100 dark:bg-brand-pill px-2 py-0.5 rounded-md capitalize"
                  >
                    {t.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Scope */}
          {program.assets.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scope ({program.assets.length} targets)
              </h3>
              <div className="bg-gray-50 dark:bg-brand-bg rounded-lg p-3 max-h-48 overflow-y-auto border border-gray-100 dark:border-brand-border">
                <ul className="space-y-1">
                  {program.assets.map((asset, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-600 dark:text-brand-text font-mono"
                    >
                      {asset}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 dark:text-brand-muted space-y-1">
            {program.last_updated && (
              <p>Last updated: {new Date(program.last_updated).toLocaleString()}</p>
            )}
            {program.fetched_at && (
              <p>Fetched: {new Date(program.fetched_at).toLocaleString()}</p>
            )}
          </div>

          {/* Action */}
          <a
            href={program.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 w-full justify-center bg-brand-red hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
          >
            View on {program.platform.charAt(0).toUpperCase() + program.platform.slice(1)}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
