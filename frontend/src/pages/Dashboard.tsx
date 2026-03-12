import { useCallback, useEffect, useState } from "react";
import {
  fetchPrograms,
  fetchStats,
  type DashboardStats,
  type Program,
  type ProgramFilters,
} from "../api";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import ProgramCard from "../components/ProgramCard";
import Pagination from "../components/Pagination";

export default function Dashboard() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [minReward, setMinReward] = useState("");
  const [maxReward, setMaxReward] = useState("");
  const [assetType, setAssetType] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

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

      const data = await fetchPrograms(filters);
      setPrograms(data.programs);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [search, platform, minReward, maxReward, assetType, status, sortBy, sortOrder, page]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load programs when filters change
  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

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

  const availablePlatforms = stats?.platforms.map((p) => p.platform) ?? [
    "hackerone",
    "bugcrowd",
    "intigriti",
    "immunefi",
    "hackenproof",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header stats={stats} loading={statsLoading} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
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
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <p className="font-medium">Error loading programs</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadPrograms}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Loading programs...</span>
            </div>
          </div>
        )}

        {/* Programs grid */}
        {!loading && !error && programs.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing {total.toLocaleString()} program{total !== 1 ? "s" : ""}
              {search && (
                <span>
                  {" "}matching "<strong>{search}</strong>"
                </span>
              )}
            </p>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={perPage}
              onPageChange={setPage}
            />
          </>
        )}

        {/* Empty state */}
        {!loading && !error && programs.length === 0 && (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
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
            <p className="mt-3 text-gray-500 font-medium">No programs found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
