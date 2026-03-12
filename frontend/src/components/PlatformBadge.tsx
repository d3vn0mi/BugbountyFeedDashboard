const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  hackerone: { label: "HackerOne", color: "bg-purple-100 text-purple-800 border-purple-200" },
  bugcrowd: { label: "Bugcrowd", color: "bg-orange-100 text-orange-800 border-orange-200" },
  intigriti: { label: "Intigriti", color: "bg-blue-100 text-blue-800 border-blue-200" },
  immunefi: { label: "Immunefi", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  hackenproof: { label: "HackenProof", color: "bg-green-100 text-green-800 border-green-200" },
};

interface PlatformBadgeProps {
  platform: string;
}

export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform] ?? {
    label: platform,
    color: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
