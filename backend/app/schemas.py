from pydantic import BaseModel
from datetime import datetime


class ProgramOut(BaseModel):
    id: str
    name: str
    platform: str
    platform_url: str
    reward_min: int | None = None
    reward_max: int | None = None
    reward_range: str = ""
    assets: list[str] = []
    asset_types: list[str] = []
    status: str = "open"
    response_time: str | None = None
    managed: bool = False
    logo_url: str | None = None
    description: str | None = None
    last_updated: datetime | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProgramListResponse(BaseModel):
    programs: list[ProgramOut]
    total: int
    page: int
    per_page: int
    total_pages: int


class PlatformStats(BaseModel):
    platform: str
    program_count: int


class DashboardStats(BaseModel):
    total_programs: int
    platforms: list[PlatformStats]
    last_refresh: datetime | None = None
    highest_bounty: int | None = None
    total_open: int = 0
