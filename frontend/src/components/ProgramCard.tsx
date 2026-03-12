import type { Program } from "../api";
import PlatformBadge from "./PlatformBadge";

interface ProgramCardProps {
  program: Program;
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const statusColor =
    program.status === "open"
      ? "bg-emerald-400"
      : "bg-yellow-400";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
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
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
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
              <h3 className="font-semibold text-gray-900 truncate">
                {program.name}
              </h3>
            </div>
          </div>
        </div>
        <PlatformBadge platform={program.platform} />
      </div>

      {/* Reward and asset types */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
          {program.reward_range}
        </span>
        {program.asset_types.length > 0 && (
          <span className="text-gray-500">|</span>
        )}
        {program.asset_types.slice(0, 4).map((t) => (
          <span
            key={t}
            className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md capitalize"
          >
            {t.replace("_", " ")}
          </span>
        ))}
      </div>

      {/* Scope */}
      {program.assets.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Scope: </span>
          {program.assets.slice(0, 3).join(", ")}
          {program.assets.length > 3 && (
            <span className="text-gray-400">
              {" "}+{program.assets.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {program.description && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">
          {program.description}
        </p>
      )}

      {/* Footer: response time + link */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {program.response_time && (
            <span>{program.response_time}</span>
          )}
          {program.managed && (
            <span className="ml-2 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              Managed
            </span>
          )}
        </div>
        <a
          href={program.platform_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
