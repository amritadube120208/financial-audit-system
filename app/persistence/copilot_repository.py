import time
import logging
from datetime import datetime
from typing import Any
from sqlalchemy import select, delete
from app.persistence.database import AsyncSessionLocal
from app.persistence.models import CopilotSessionDB, CopilotMessageDB

logger = logging.getLogger(__name__)


class CopilotRepository:
    """
    Database-backed persistence repository for Copilot Sessions and Messages.
    Guarantees session durability across backend restarts and prevents phantom in-memory state.
    """

    async def create_session(
        self,
        session_id: str,
        run_id: str,
        title: str = "Financial Audit Copilot Session",
    ) -> CopilotSessionDB:
        async with AsyncSessionLocal() as db:
            session_obj = CopilotSessionDB(
                id=session_id,
                run_id=run_id,
                title=title,
                created_at=datetime.utcnow(),
            )
            db.add(session_obj)
            await db.commit()
            await db.refresh(session_obj)
            return session_obj

    async def get_session(self, session_id: str) -> CopilotSessionDB | None:
        """
        Retrieves durable session from SQLite.
        Returns None if session does not exist. NEVER auto-creates demo session.
        """
        async with AsyncSessionLocal() as db:
            stmt = select(CopilotSessionDB).where(CopilotSessionDB.id == session_id)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()

    async def save_message(
        self,
        message_id: str,
        session_id: str,
        role: str,
        content: str,
        mode: str = "groq_llm_grounded",
        grounded: bool = True,
        confidence: str = "high",
        citations: list[dict[str, Any]] | None = None,
        used_tools: list[str] | None = None,
        latency_ms: float = 0.0,
    ) -> CopilotMessageDB:
        async with AsyncSessionLocal() as db:
            msg_obj = CopilotMessageDB(
                id=message_id,
                session_id=session_id,
                role=role,
                content=content,
                mode=mode,
                grounded=grounded,
                confidence=confidence,
                citations_json=citations or [],
                used_tools_json=used_tools or [],
                latency_ms=latency_ms,
                created_at=datetime.utcnow(),
            )
            db.add(msg_obj)
            await db.commit()
            await db.refresh(msg_obj)
            return msg_obj

    async def get_messages(self, session_id: str) -> list[CopilotMessageDB]:
        async with AsyncSessionLocal() as db:
            stmt = (
                select(CopilotMessageDB)
                .where(CopilotMessageDB.session_id == session_id)
                .order_by(CopilotMessageDB.created_at.asc())
            )
            result = await db.execute(stmt)
            return list(result.scalars().all())

    async def delete_session(self, session_id: str) -> bool:
        async with AsyncSessionLocal() as db:
            # Delete messages first
            await db.execute(delete(CopilotMessageDB).where(CopilotMessageDB.session_id == session_id))
            # Delete session
            res = await db.execute(delete(CopilotSessionDB).where(CopilotSessionDB.id == session_id))
            await db.commit()
            return res.rowcount > 0


copilot_repo = CopilotRepository()
