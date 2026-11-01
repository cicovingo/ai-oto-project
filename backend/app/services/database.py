import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


def _database_path() -> Path:
    configured_path = os.getenv("FLOWMIND_DB_PATH")
    if configured_path:
        path = Path(configured_path).expanduser()
    else:
        path = Path(__file__).resolve().parents[2] / "flowmind.sqlite3"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(_database_path(), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS workflows (
            workspace_id TEXT NOT NULL,
            id TEXT NOT NULL,
            document TEXT NOT NULL,
            PRIMARY KEY (workspace_id, id)
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS workflow_runs (
            workspace_id TEXT NOT NULL,
            id TEXT NOT NULL,
            workflow_id TEXT NOT NULL,
            document TEXT NOT NULL,
            PRIMARY KEY (workspace_id, id)
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS project_tasks (
            workspace_id TEXT NOT NULL,
            id TEXT NOT NULL,
            document TEXT NOT NULL,
            PRIMARY KEY (workspace_id, id)
        )
        """
    )
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()
