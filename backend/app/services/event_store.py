class EventStore:
    def __init__(self):
        self.events = []
    def add(self, event):
        self.events.append(event)
    def list(self):
        return self.events
