import json
import os

def load_events(filepath: str) -> list[dict]:
    if not os.path.exists(filepath):
        return []
        
    events = []
    with open(filepath, 'r') as f:
        for line in f:
            if line.strip():
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
                    
    # Sort events by timestamp
    events.sort(key=lambda x: x.get('timestamp', ''))
    return events
