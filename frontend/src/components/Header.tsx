import type { DashboardStats } from "../api";

const PLATFORM_COLORS: Record<string, string> = {
  hackerone: "bg-purple-600",
  bugcrowd: "bg-orange-500",
  intigriti: "bg-blue-600",
  immunefi: "bg-cyan-600",
  yeswehack: "bg-red-600",
};

interface HeaderProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function Header({ stats, loading }: HeaderProps) {
  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bug Bounty Feed
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Aggregated programs from {stats?.platforms.length ?? 0} platforms
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : stats ? (
              <>
                <span className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                  {stats.total_programs.toLocaleString()} programs
                </span>
                {stats.platforms.map((p) => (
                  <span
                    key={p.platform}
                    className={`${PLATFORM_COLORS[p.platform] ?? "bg-gray-600"} text-white px-2.5 py-1 rounded-md text-xs font-medium`}
                  >
                    {p.platform} ({p.program_count})
                  </span>
                ))}
              </>
            ) : null}
          </div>
        </div>
        {stats?.last_refresh && (
          <p className="text-gray-500 text-xs mt-2">
            Last refresh: {new Date(stats.last_refresh).toLocaleString()}
          </p>
        )}
      </div>
    </header>
  );
}
