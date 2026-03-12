const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  hackerone: { label: "HackerOne", color: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  bugcrowd: { label: "Bugcrowd", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  intigriti: { label: "Intigriti", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  immunefi: { label: "Immunefi", color: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" },
  yeswehack: { label: "YesWeHack", color: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800" },
};

interface PlatformBadgeProps {
  platform: string;
}

export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform] ?? {
    label: platform,
    color: "bg-gray-100 dark:bg-brand-pill text-gray-800 dark:text-brand-text border-gray-200 dark:border-brand-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
