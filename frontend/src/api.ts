const API_BASE = "/api";

export interface Program {
  id: string;
  name: string;
  platform: string;
  platform_url: string;
  reward_min: number | null;
  reward_max: number | null;
  reward_range: string;
  assets: string[];
  asset_types: string[];
  status: string;
  response_time: string | null;
  managed: boolean;
  logo_url: string | null;
  description: string | null;
  last_updated: string | null;
  fetched_at: string | null;
}

export interface ProgramListResponse {
  programs: Program[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PlatformStats {
  platform: string;
  program_count: number;
}

export interface DashboardStats {
  total_programs: number;
  platforms: PlatformStats[];
  last_refresh: string | null;
  highest_bounty: number | null;
  total_open: number;
}

export interface ProgramFilters {
  search?: string;
  platform?: string;
  min_reward?: number;
  max_reward?: number;
  asset_type?: string;
  status?: string;
  scope_search?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
}

export async function fetchPrograms(
  filters: ProgramFilters = {}
): Promise<ProgramListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const resp = await fetch(`${API_BASE}/programs?${params}`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function fetchStats(): Promise<DashboardStats> {
  const resp = await fetch(`${API_BASE}/stats`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function fetchPlatforms(): Promise<PlatformStats[]> {
  const resp = await fetch(`${API_BASE}/platforms`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export function getExportUrl(filters: ProgramFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "" && key !== "page" && key !== "per_page") {
      params.set(key, String(value));
    }
  }
  return `${API_BASE}/programs/export?${params}`;
}
