from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class Program(Base):
    __tablename__ = "programs"

    id = Column(String, primary_key=True)  # e.g. "hackerone:uber"
    name = Column(String, nullable=False, index=True)
    platform = Column(String, nullable=False, index=True)
    platform_url = Column(String, nullable=False)
    reward_min = Column(Integer, nullable=True)
    reward_max = Column(Integer, nullable=True)
    reward_range = Column(String, default="")
    assets = Column(JSON, default=list)
    asset_types = Column(JSON, default=list)
    status = Column(String, default="open")
    response_time = Column(String, nullable=True)
    managed = Column(Boolean, default=False)
    logo_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
