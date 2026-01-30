# simulation/scheduler.py
# Run a callback every X seconds. Pure logic only (no API calls).

import threading
import time
from typing import Callable


def start_scheduler(interval_seconds: float, callback: Callable[[], None]) -> threading.Thread:
    """
    Start a background thread that calls `callback` every `interval_seconds`.
    Returns the thread so the caller can keep a reference (e.g. for shutdown).
    """
    def run() -> None:
        while True:
            callback()
            time.sleep(interval_seconds)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread
