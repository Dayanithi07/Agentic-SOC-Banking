from pydantic import BaseModel
import asyncio
from typing import Optional

class ReplayState(BaseModel):
    status: str = "stopped"
    speed: int = 10
    progress: int = 0
    current_index: int = 0
    total_events: int = 0

class Scheduler:
    def __init__(self):
        self.state = ReplayState()
        self._task: Optional[asyncio.Task] = None
        self._pause_event = asyncio.Event()
        self._pause_event.set()

    def start(self, task_coro):
        if self.state.status == "stopped":
            self.state.status = "running"
            self._pause_event.set()
            self._task = asyncio.create_task(task_coro())
        elif self.state.status == "paused":
            self.state.status = "running"
            self._pause_event.set()

    def pause(self):
        if self.state.status == "running":
            self.state.status = "paused"
            self._pause_event.clear()

    def stop(self):
        self.state.status = "stopped"
        if self._task:
            self._task.cancel()
            self._task = None
        self.state.current_index = 0
        self.state.progress = 0

    def restart(self, task_coro):
        self.stop()
        self.start(task_coro)

    def set_speed(self, speed: int):
        self.state.speed = speed

scheduler = Scheduler()
