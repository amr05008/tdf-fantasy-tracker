"""Pure time-conversion helpers shared by the app and the data pipeline.

No Streamlit / network imports — safe to use anywhere.
"""


def time_str_to_seconds(time_str: str) -> int:
    """Convert 'H:MM:SS' / 'HH:MM:SS' to integer seconds (0 on bad input)."""
    try:
        if not time_str or time_str == "0:00:00":
            return 0
        parts = time_str.split(":")
        if len(parts) != 3:
            return 0
        hours, minutes, seconds = (int(parts[0]), int(parts[1]), int(parts[2]))
        return hours * 3600 + minutes * 60 + seconds
    except Exception:
        return 0


def seconds_to_time_str(seconds: int) -> str:
    """Convert integer seconds to 'H:MM:SS'."""
    if seconds == 0:
        return "0:00:00"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours}:{minutes:02d}:{secs:02d}"
