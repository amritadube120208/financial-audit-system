"""Initialize the real application schema in an isolated temporary test database."""
import asyncio
import os
import tempfile
from pathlib import Path
import pytest

_test_state = tempfile.TemporaryDirectory(prefix="auditgraph-tests-")
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///" + (Path(_test_state.name) / "tests.db").as_posix()
os.environ["RECOVERY_DIR"] = str(Path(_test_state.name) / "recovery")


@pytest.fixture(scope="session", autouse=True)
def initialize_application():
    from app.persistence.database import init_db, engine
    from app.ml.registry import model_registry
    asyncio.run(init_db())
    assert model_registry.load_default_model()
    yield
    asyncio.run(engine.dispose())
    _test_state.cleanup()
