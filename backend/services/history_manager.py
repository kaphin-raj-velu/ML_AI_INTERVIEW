import json
import os
from typing import Dict, List

class HistoryManager:
    def __init__(self, filename: str = "history.json"):
        # Absolute path relative to this service file (backend/data/history.json)
        self.filepath = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", filename))
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        self.data = self._load()

    def _load(self) -> Dict[str, List]:
        if not os.path.exists(self.filepath):
            return {}
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading history: {e}")
            return {}

    def save(self, username: str, audit_entry: Dict):
        if username not in self.data:
            self.data[username] = []
        self.data[username].append(audit_entry)
        self._sync()

    def _sync(self):
        try:
            with open(self.filepath, "w") as f:
                json.dump(self.data, f, indent=4)
        except Exception as e:
            print(f"Error saving history: {e}")

    def get_user_history(self, username: str) -> List:
        return self.data.get(username, [])
