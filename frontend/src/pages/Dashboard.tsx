import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPrograms,
  fetchStats,
  getExportUrl,
  type DashboardStats,
  type Program,
  type ProgramFilters,
} from "../api";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import ProgramCard from "../components/ProgramCard";
import SkeletonCard from "../components/SkeletonCard";
import Pagination from "../components/Pagination";
import ProgramModal from "../components/ProgramModal";

// --- URL param helpers ---
function readParams(): Record<string, string> {
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const [k, v] of p.entries()) out[k] = v;
  return out;
}

function writeParams(params: Record<string, string>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

// --- Favorites helpers ---
function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem("favorites");
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem("favorites", JSON.stringify([...favs]));
}

export default function Dashboard() {
  const params = useMemo(readParams, []);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state (initialized from URL params)
  const [search, setSearch] = useState(params.q || "");
  const [platform, setPlatform] = useState(params.platform || "");
  const [minReward, setMinReward] = useState(params.min || "");
  const [maxReward, setMaxReward] = useState(params.max || "");
  const [assetType, setAssetType] = useState(params.type || "");
  const [status, setStatus] = useState(params.status || "");
  const [scopeSearch, setScopeSearch] = useState(params.scope || "");
  const [sortBy, setSortBy] = useState(() => {
    if (params.sort) return params.sort.split(":")[0] || "name";
    return "name";
  });
  const [sortOrder, setSortOrder] = useState(() => {
    if (params.sort) return params.sort.split(":")[1] || "asc";
    return "asc";
  });
  const [page, setPage] = useState(() => {
    const p = parseInt(params.page || "1", 10);
    return isNaN(p) ? 1 : p;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [favoritesOnly, setFavoritesOnly] = useState(params.fav === "1");

  // Modal
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Sync filters to URL
  useEffect(() => {
    writeParams({
      q: search,
      platform,
      min: minReward,
      max: maxReward,
      type: assetType,
      status,
      scope: scopeSearch,
      sort: `${sortBy}:${sortOrder}`,
      page: page > 1 ? String(page) : "",
      fav: favoritesOnly ? "1" : "",
    });
  }, [search, platform, minReward, maxReward, assetType, status, scopeSearch, sortBy, sortOrder, page, favoritesOnly]);

  // Persist favorites
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await fetchStats();
      setStats(data);
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ProgramFilters = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search) filters.search = search;
      if (platform) filters.platform = platform;
      if (minReward) filters.min_reward = Number(minReward);
      if (maxReward) filters.max_reward = Number(maxReward);
      if (assetType) filters.asset_type = assetType;
      if (status) filters.status = status;
      if (scopeSearch) filters.scope_search = scopeSearch;

      const data = await fetchPrograms(filters);
      setPrograms(data.programs);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [search, platform, minReward, maxReward, assetType, status, scopeSearch, sortBy, sortOrder, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadPrograms(); }, [loadPrograms]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (val: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  const handleSortChange = (field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const handleExport = () => {
    const filters: ProgramFilters = {
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (search) filters.search = search;
    if (platform) filters.platform = platform;
    if (minReward) filters.min_reward = Number(minReward);
    if (maxReward) filters.max_reward = Number(maxReward);
    if (assetType) filters.asset_type = assetType;
    if (status) filters.status = status;
    if (scopeSearch) filters.scope_search = scopeSearch;
    window.open(getExportUrl(filters), "_blank");
  };

  const availablePlatforms = stats?.platforms.map((p) => p.platform) ?? [
    "hackerone",
    "bugcrowd",
    "intigriti",
    "immunefi",
    "yeswehack",
  ];

  // Client-side favorites filter
  const displayPrograms = favoritesOnly
    ? programs.filter((p) => favorites.has(p.id))
    : programs;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-bg">
      <Header stats={stats} loading={statsLoading} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-brand-surface rounded-xl border border-gray-200 dark:border-brand-border p-4">
              <p className="text-xs text-gray-500 dark:text-brand-muted uppercase font-medium">Total Programs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_programs.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-brand-surface rounded-xl border border-gray-200 dark:border-brand-border p-4">
              <p className="text-xs text-gray-500 dark:text-brand-muted uppercase font-medium">Platforms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-brand-cyan mt-1">{stats.platforms.length}</p>
            </div>
            <div className="bg-white dark:bg-brand-surface rounded-xl border border-gray-200 dark:border-brand-border p-4">
              <p className="text-xs text-gray-500 dark:text-brand-muted uppercase font-medium">Highest Bounty</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.highest_bounty != null ? `$${stats.highest_bounty.toLocaleString()}` : "N/A"}
              </p>
            </div>
            <div className="bg-white dark:bg-brand-surface rounded-xl border border-gray-200 dark:border-brand-border p-4">
              <p className="text-xs text-gray-500 dark:text-brand-muted uppercase font-medium">Open Programs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_open.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <SearchBar value={search} onChange={handleFilterChange(setSearch)} />
          <FilterPanel
            platforms={availablePlatforms}
            selectedPlatform={platform}
            onPlatformChange={handleFilterChange(setPlatform)}
            minReward={minReward}
            maxReward={maxReward}
            onMinRewardChange={handleFilterChange(setMinReward)}
            onMaxRewardChange={handleFilterChange(setMaxReward)}
            selectedAssetType={assetType}
            onAssetTypeChange={handleFilterChange(setAssetType)}
            selectedStatus={status}
            onStatusChange={handleFilterChange(setStatus)}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            scopeSearch={scopeSearch}
            onScopeSearchChange={handleFilterChange(setScopeSearch)}
            favoritesOnly={favoritesOnly}
            onFavoritesOnlyChange={setFavoritesOnly}
            onExport={handleExport}
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6">
            <p className="font-medium">Error loading programs</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadPrograms}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Programs grid */}
        {!loading && !error && displayPrograms.length > 0 && (
          <>
            <p className="text-sm text-gray-500 dark:text-brand-text mb-4">
              Showing {favoritesOnly ? `${displayPrograms.length} favorite` : total.toLocaleString()} program{(favoritesOnly ? displayPrograms.length : total) !== 1 ? "s" : ""}
              {search && (
                <span>
                  {" "}matching "<strong>{search}</strong>"
                </span>
              )}
            </p>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {displayPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  isFavorite={favorites.has(program.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={setSelectedProgram}
                />
              ))}
            </div>
            {!favoritesOnly && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                perPage={perPage}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && displayPrograms.length === 0 && (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-3 text-gray-500 dark:text-gray-400 font-medium">
              {favoritesOnly ? "No favorites yet" : "No programs found"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {favoritesOnly ? "Star programs to add them to your favorites" : "Try adjusting your search or filters"}
            </p>
          </div>
        )}
      </main>

      {/* Program detail modal */}
      {selectedProgram && (
        <ProgramModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  );
}
