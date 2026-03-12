import { useState } from "react";

interface FilterPanelProps {
  platforms: string[];
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  minReward: string;
  maxReward: string;
  onMinRewardChange: (value: string) => void;
  onMaxRewardChange: (value: string) => void;
  selectedAssetType: string;
  onAssetTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (field: string, order: string) => void;
  scopeSearch: string;
  onScopeSearchChange: (value: string) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  onExport: () => void;
}

const ASSET_TYPES = ["web", "web-application", "api", "mobile", "smart_contract", "blockchain", "web3", "url", "wildcard"];

const PLATFORM_LABELS: Record<string, string> = {
  hackerone: "HackerOne",
  bugcrowd: "Bugcrowd",
  intigriti: "Intigriti",
  immunefi: "Immunefi",
  yeswehack: "YesWeHack",
};

function countActiveFilters(props: FilterPanelProps): number {
  let count = 0;
  if (props.selectedPlatform) count++;
  if (props.selectedStatus) count++;
  if (props.selectedAssetType) count++;
  if (props.minReward || props.maxReward) count++;
  if (props.scopeSearch) count++;
  if (props.favoritesOnly) count++;
  return count;
}

const selectClass = "bg-white dark:bg-brand-surface border border-gray-300 dark:border-brand-border rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan shadow-sm";
const inputClass = "w-24 bg-white dark:bg-brand-surface border border-gray-300 dark:border-brand-border rounded-lg px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan shadow-sm";

export default function FilterPanel(props: FilterPanelProps) {
  const {
    platforms, selectedPlatform, onPlatformChange,
    minReward, maxReward, onMinRewardChange, onMaxRewardChange,
    selectedAssetType, onAssetTypeChange,
    selectedStatus, onStatusChange,
    sortBy, sortOrder, onSortChange,
    scopeSearch, onScopeSearchChange,
    favoritesOnly, onFavoritesOnlyChange,
    onExport,
  } = props;

  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = countActiveFilters(props);

  const filterContent = (
    <>
      {/* Platform filter */}
      <select value={selectedPlatform} onChange={(e) => onPlatformChange(e.target.value)} className={selectClass}>
        <option value="">All Platforms</option>
        {platforms.map((p) => (
          <option key={p} value={p}>{PLATFORM_LABELS[p] ?? p}</option>
        ))}
      </select>

      {/* Status filter */}
      <select value={selectedStatus} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
        <option value="">Any Status</option>
        <option value="open">Open</option>
        <option value="paused">Paused</option>
      </select>

      {/* Asset type filter */}
      <select value={selectedAssetType} onChange={(e) => onAssetTypeChange(e.target.value)} className={selectClass}>
        <option value="">All Asset Types</option>
        {ASSET_TYPES.map((t) => (
          <option key={t} value={t}>{t.replace("_", " ")}</option>
        ))}
      </select>

      {/* Reward range */}
      <div className="flex items-center gap-1.5">
        <input type="number" placeholder="Min $" value={minReward} onChange={(e) => onMinRewardChange(e.target.value)} className={inputClass} />
        <span className="text-gray-400 dark:text-brand-muted text-sm">-</span>
        <input type="number" placeholder="Max $" value={maxReward} onChange={(e) => onMaxRewardChange(e.target.value)} className={inputClass} />
      </div>

      {/* Scope search */}
      <input
        type="text"
        placeholder="Search scope..."
        value={scopeSearch}
        onChange={(e) => onScopeSearchChange(e.target.value)}
        className="w-32 bg-white dark:bg-brand-surface border border-gray-300 dark:border-brand-border rounded-lg px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan shadow-sm"
      />

      {/* Sort */}
      <select
        value={`${sortBy}:${sortOrder}`}
        onChange={(e) => {
          const [field, order] = e.target.value.split(":");
          onSortChange(field, order);
        }}
        className={selectClass}
      >
        <option value="name:asc">Name (A-Z)</option>
        <option value="name:desc">Name (Z-A)</option>
        <option value="reward_max:desc">Reward (High-Low)</option>
        <option value="reward_max:asc">Reward (Low-High)</option>
        <option value="platform:asc">Platform (A-Z)</option>
      </select>

      {/* Favorites toggle */}
      <button
        onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          favoritesOnly
            ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"
            : "bg-white dark:bg-brand-surface border-gray-300 dark:border-brand-border text-gray-600 dark:text-brand-text hover:border-yellow-300"
        }`}
      >
        <svg className="w-4 h-4" fill={favoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Favorites
      </button>

      {/* CSV export */}
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-brand-surface border border-gray-300 dark:border-brand-border text-gray-600 dark:text-brand-text hover:bg-gray-50 dark:hover:bg-brand-pill transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>
    </>
  );

  return (
    <div>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-brand-surface border border-gray-300 dark:border-brand-border rounded-lg text-sm text-gray-700 dark:text-gray-300 shadow-sm w-full justify-center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="bg-brand-red text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {/* Desktop: always visible. Mobile: toggle */}
      <div className={`flex-wrap items-center gap-3 mt-2 md:mt-0 ${mobileOpen ? "flex" : "hidden md:flex"}`}>
        {filterContent}
      </div>
    </div>
  );
}
