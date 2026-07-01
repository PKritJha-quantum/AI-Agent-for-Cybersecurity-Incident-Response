"""
chat_history.py
Core functions for saving and retrieving chat exchanges.
This is the main file for Member 3's task.
"""

from db import get_connection


def save_exchange(question, answer):
    """
    Save a new question/answer exchange to the database.
    Call this every time the AI model generates a reply.
    """
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO chat_history (question, answer) VALUES (?, ?)",
        (question, answer),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "question": question, "answer": answer}


def get_history():
    """
    Fetch the complete chat history, oldest first.
    Use this to populate the chat screen on load or on request.
    """
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, question, answer, timestamp FROM chat_history ORDER BY id ASC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_recent_history(limit=20):
    """Fetch only the most recent N exchanges."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, question, answer, timestamp FROM chat_history ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in reversed(rows)]


def clear_history():
    """Clear all chat history. Useful for testing or a 'reset chat' button."""
    conn = get_connection()
    conn.execute("DELETE FROM chat_history")
    conn.commit()
    conn.close()
