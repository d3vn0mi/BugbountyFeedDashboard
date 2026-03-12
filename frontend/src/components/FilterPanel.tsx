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
}

const ASSET_TYPES = ["web", "api", "mobile", "smart_contract", "hardware", "web3", "iot"];

const PLATFORM_LABELS: Record<string, string> = {
  hackerone: "HackerOne",
  bugcrowd: "Bugcrowd",
  intigriti: "Intigriti",
  immunefi: "Immunefi",
  hackenproof: "HackenProof",
};

export default function FilterPanel({
  platforms,
  selectedPlatform,
  onPlatformChange,
  minReward,
  maxReward,
  onMinRewardChange,
  onMaxRewardChange,
  selectedAssetType,
  onAssetTypeChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  sortOrder,
  onSortChange,
}: FilterPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Platform filter */}
      <select
        value={selectedPlatform}
        onChange={(e) => onPlatformChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
      >
        <option value="">All Platforms</option>
        {platforms.map((p) => (
          <option key={p} value={p}>
            {PLATFORM_LABELS[p] ?? p}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
      >
        <option value="">Any Status</option>
        <option value="open">Open</option>
        <option value="paused">Paused</option>
      </select>

      {/* Asset type filter */}
      <select
        value={selectedAssetType}
        onChange={(e) => onAssetTypeChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
      >
        <option value="">All Asset Types</option>
        {ASSET_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.replace("_", " ")}
          </option>
        ))}
      </select>

      {/* Reward range */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder="Min $"
          value={minReward}
          onChange={(e) => onMinRewardChange(e.target.value)}
          className="w-24 bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <span className="text-gray-400 text-sm">-</span>
        <input
          type="number"
          placeholder="Max $"
          value={maxReward}
          onChange={(e) => onMaxRewardChange(e.target.value)}
          className="w-24 bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Sort */}
      <select
        value={`${sortBy}:${sortOrder}`}
        onChange={(e) => {
          const [field, order] = e.target.value.split(":");
          onSortChange(field, order);
        }}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
      >
        <option value="name:asc">Name (A-Z)</option>
        <option value="name:desc">Name (Z-A)</option>
        <option value="reward_max:desc">Reward (High-Low)</option>
        <option value="reward_max:asc">Reward (Low-High)</option>
        <option value="platform:asc">Platform (A-Z)</option>
      </select>
    </div>
  );
}
