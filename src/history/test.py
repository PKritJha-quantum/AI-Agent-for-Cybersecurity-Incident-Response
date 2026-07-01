"""
test.py
Quick manual test for the chat history functions.
Run with: python test.py
"""

from chat_history import save_exchange, get_history, clear_history

print("--- Clearing old history ---")
clear_history()

print("--- Saving sample exchanges ---")
save_exchange(
    "What is a phishing attack?",
    "A phishing attack tricks users into revealing sensitive info.",
)
save_exchange(
    "How does the AI agent block hackers?",
    "It detects anomalies and isolates the malicious session automatically.",
)

print("--- Fetching full history ---")
history = get_history()
for entry in history:
    print(entry)

print(f"\nTest passed: {'YES' if len(history) == 2 else 'NO'}")
