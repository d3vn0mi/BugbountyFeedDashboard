import type { DashboardStats } from "../api";
import ThemeToggle from "./ThemeToggle";

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
    <header className="bg-brand-bg border-b border-brand-border text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              <span className="text-brand-cyan">d3vn0mi</span>
              <span className="text-brand-red">@sec</span>
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              Bug Bounty Feed &middot; {stats?.platforms.length ?? 0} platforms
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {loading ? (
              <div className="flex gap-2 animate-pulse">
                <div className="h-7 w-24 bg-brand-surface rounded-lg" />
                <div className="h-6 w-20 bg-brand-surface rounded-md" />
                <div className="h-6 w-20 bg-brand-surface rounded-md" />
              </div>
            ) : stats ? (
              <>
                <span className="bg-brand-surface border border-brand-border text-white px-3 py-1.5 rounded-lg text-sm font-medium">
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
            <ThemeToggle />
          </div>
        </div>
        {stats?.last_refresh && (
          <p className="text-brand-muted text-xs mt-2">
            Last refresh: {new Date(stats.last_refresh).toLocaleString()}
          </p>
        )}
      </div>
    </header>
  );
}
