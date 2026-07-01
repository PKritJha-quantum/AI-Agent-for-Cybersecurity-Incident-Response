"""
db.py
Sets up a local SQLite database to persist chat history.
No external dependencies needed - uses Python's built-in sqlite3 module.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "chat_history.db")


def get_connection():
    """Return a connection to the chat history database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn


def init_db():
    """Create the chat_history table if it doesn't already exist."""
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


# Initialize the table as soon as this module is imported
init_db()
