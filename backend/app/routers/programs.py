import csv
import io
import math
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Program
from app.schemas import ProgramOut, ProgramListResponse, DashboardStats, PlatformStats

router = APIRouter(prefix="/api", tags=["programs"])

# Whitelist sortable columns to prevent arbitrary attribute access
ALLOWED_SORT_COLUMNS = {"name", "platform", "reward_min", "reward_max", "status", "last_updated", "fetched_at"}


def _get_sort_column(sort_by: str):
    if sort_by not in ALLOWED_SORT_COLUMNS:
        sort_by = "name"
    return getattr(Program, sort_by)


@router.get("/programs", response_model=ProgramListResponse)
async def list_programs(
    search: str = Query(None, max_length=200, description="Search by name or description"),
    platform: str = Query(None, max_length=100, description="Comma-separated platform filter"),
    min_reward: int = Query(None, ge=0, le=100_000_000, description="Minimum reward"),
    max_reward: int = Query(None, ge=0, le=100_000_000, description="Maximum reward"),
    asset_type: str = Query(None, max_length=50, description="Filter by asset type"),
    status: str = Query(None, max_length=20, description="Filter by status (open/paused)"),
    scope_search: str = Query(None, max_length=200, description="Search within asset/scope names"),
    sort_by: str = Query("name", max_length=30, description="Sort field"),
    sort_order: str = Query("asc", max_length=4, description="Sort direction (asc/desc)"),
    page: int = Query(1, ge=1, le=10000),
    per_page: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Program)
    count_query = select(func.count(Program.id))

    # Filters
    filters = []

    if search:
        search_term = f"%{search}%"
        filters.append(
            or_(
                Program.name.ilike(search_term),
                Program.description.ilike(search_term),
            )
        )

    if platform:
        platforms = [p.strip().lower() for p in platform.split(",")]
        filters.append(Program.platform.in_(platforms))

    if min_reward is not None:
        filters.append(
            or_(
                Program.reward_max >= min_reward,
                and_(Program.reward_max.is_(None), Program.reward_min >= min_reward),
            )
        )

    if max_reward is not None:
        filters.append(
            or_(
                Program.reward_min <= max_reward,
                Program.reward_min.is_(None),
            )
        )

    if asset_type:
        # JSON contains filter - SQLite compatible
        filters.append(Program.asset_types.contains(asset_type.lower()))

    if status:
        filters.append(Program.status == status.lower())

    if scope_search:
        filters.append(Program.assets.contains(scope_search))

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    # Sorting
    sort_column = _get_sort_column(sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = max(1, math.ceil(total / per_page))

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    programs = result.scalars().all()

    return ProgramListResponse(
        programs=[ProgramOut.model_validate(p) for p in programs],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/programs/export")
async def export_programs_csv(
    search: str = Query(None, max_length=200),
    platform: str = Query(None, max_length=100),
    min_reward: int = Query(None, ge=0, le=100_000_000),
    max_reward: int = Query(None, ge=0, le=100_000_000),
    asset_type: str = Query(None, max_length=50),
    status: str = Query(None, max_length=20),
    scope_search: str = Query(None, max_length=200),
    sort_by: str = Query("name", max_length=30),
    sort_order: str = Query("asc", max_length=4),
    db: AsyncSession = Depends(get_db),
):
    query = select(Program)
    filters = []

    if search:
        search_term = f"%{search}%"
        filters.append(
            or_(
                Program.name.ilike(search_term),
                Program.description.ilike(search_term),
            )
        )
    if platform:
        platforms_list = [p.strip().lower() for p in platform.split(",")]
        filters.append(Program.platform.in_(platforms_list))
    if min_reward is not None:
        filters.append(
            or_(
                Program.reward_max >= min_reward,
                and_(Program.reward_max.is_(None), Program.reward_min >= min_reward),
            )
        )
    if max_reward is not None:
        filters.append(
            or_(
                Program.reward_min <= max_reward,
                Program.reward_min.is_(None),
            )
        )
    if asset_type:
        filters.append(Program.asset_types.contains(asset_type.lower()))
    if status:
        filters.append(Program.status == status.lower())
    if scope_search:
        filters.append(Program.assets.contains(scope_search))

    if filters:
        query = query.where(and_(*filters))

    sort_column = _get_sort_column(sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    query = query.limit(10000)
    result = await db.execute(query)
    programs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "platform", "status", "reward_min", "reward_max", "reward_range", "assets", "asset_types", "platform_url"])
    for p in programs:
        writer.writerow([
            p.name, p.platform, p.status,
            p.reward_min, p.reward_max, p.reward_range,
            "; ".join(p.assets if isinstance(p.assets, list) else []),
            "; ".join(p.asset_types if isinstance(p.asset_types, list) else []),
            p.platform_url,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=programs.csv"},
    )


@router.get("/programs/{program_id:path}", response_model=ProgramOut)
async def get_program(program_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Program).where(Program.id == program_id))
    program = result.scalar_one_or_none()
    if not program:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Program not found")
    return ProgramOut.model_validate(program)


@router.get("/platforms", response_model=list[PlatformStats])
async def list_platforms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Program.platform, func.count(Program.id))
        .group_by(Program.platform)
        .order_by(func.count(Program.id).desc())
    )
    return [
        PlatformStats(platform=row[0], program_count=row[1])
        for row in result.all()
    ]


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Total count
    total_result = await db.execute(select(func.count(Program.id)))
    total = total_result.scalar() or 0

    # Per-platform counts
    platform_result = await db.execute(
        select(Program.platform, func.count(Program.id))
        .group_by(Program.platform)
        .order_by(func.count(Program.id).desc())
    )
    platforms = [
        PlatformStats(platform=row[0], program_count=row[1])
        for row in platform_result.all()
    ]

    # Last refresh time
    refresh_result = await db.execute(
        select(func.max(Program.fetched_at))
    )
    last_refresh = refresh_result.scalar()

    # Highest bounty
    bounty_result = await db.execute(
        select(func.max(Program.reward_max))
    )
    highest_bounty = bounty_result.scalar()

    # Total open programs
    open_result = await db.execute(
        select(func.count(Program.id)).where(Program.status == "open")
    )
    total_open = open_result.scalar() or 0

    return DashboardStats(
        total_programs=total,
        platforms=platforms,
        last_refresh=last_refresh,
        highest_bounty=highest_bounty,
        total_open=total_open,
    )
