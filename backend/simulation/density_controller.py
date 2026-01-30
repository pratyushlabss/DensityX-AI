# simulation/density_controller.py
# Pure logic: maintain current user count and apply surge. No API calls.

# Base crowd size (dynamic; can be changed at runtime)
_base_count: int = 200
# Extra count added by surge (instant spike)
_surge_extra: int = 0


def get_target_count() -> int:
    """Total number of attendees to simulate (base + surge)."""
    return _base_count + _surge_extra


def set_base_count(count: int) -> None:
    """Set the base crowd size (used for continuous generation)."""
    global _base_count
    _base_count = max(0, count)


def trigger_surge(extra: int) -> None:
    """Increase density instantly by adding `extra` to the target count."""
    global _surge_extra
    _surge_extra = max(0, _surge_extra + extra)


def clear_surge() -> None:
    """Reset surge extra to zero (optional; keeps implementation simple)."""
    global _surge_extra
    _surge_extra = 0
