"""
Multi-Race Configuration for Fantasy Grand Tours

This file defines multiple Grand Tour races and their associated team rosters.
Supports historical race data and upcoming races.

Structure designed to be database-compatible for future Phase 4 migration.
"""

# Available races configuration
RACES = {
    "tdf-2025": {
        "id": "tdf-2025",
        "name": "Tour de France 2025",
        "short_name": "TDF 2025",
        "race_url": "race/tour-de-france/2025",
        "total_stages": 21,
        "leader_color": "#FFD700",  # Yellow jersey (Maillot Jaune)
        "leader_jersey_emoji": "🟡",
        "start_date": "2025-07-05",
        "end_date": "2025-07-27",
        "is_complete": True,
        "winner": "Aaron",
        "completion_date": "July 27, 2025"
    },
    "tdf-2026": {
        "id": "tdf-2026",
        "name": "Tour de France 2026",
        "short_name": "TDF 2026",
        "race_url": "race/tour-de-france/2026",
        "total_stages": 21,
        "leader_color": "#FFD700",  # Yellow jersey (Maillot Jaune)
        "leader_jersey_emoji": "🟡",
        "start_date": "2026-07-04",
        "end_date": "2026-07-26",
        "is_complete": False,
        "winner": None,
        "completion_date": None
    },
}

# Team rosters per race
# Format: { race_id: { participant_name: [rider_urls] } }
TEAM_ROSTERS = {
    "tdf-2025": {
        "Jeremy": [
            "rider/sepp-kuss",
            "rider/jhonatan-narvaez",
            "rider/ben-healy"
        ],
        "Leo": [
            "rider/felix-gall",
            "rider/kevin-vauquelin",
            "rider/guillaume-martin"
        ],
        "Charles": [
            "rider/jordan-jegat",
            "rider/tobias-halland-johannessen",
            "rider/aleksandr-vlasov"
        ],
        "Aaron": [
            "rider/florian-lipowitz",
            "rider/oscar-onley",
            "rider/ben-o-connor"
        ],
        "Nate": [
            "rider/primoz-roglic",
            "rider/valentin-paret-peintre",
            "rider/geraint-thomas"
        ]
    },
    "tdf-2026": {
        # Placeholder - update with actual 2026 TDF team rosters
        "Jeremy": [],
        "Leo": [],
        "Charles": [],
        "Aaron": [],
        "Nate": []
    },
}

# Default active race (used when app first loads)
DEFAULT_RACE = "tdf-2025"

# ===== GOOGLE SHEETS ROSTER IMPORT =====
# Set this to your published Google Sheets URL to enable dynamic roster loading
# Sheet must be published to web (File → Share → Publish to web)
# Leave as None to use hardcoded TEAM_ROSTERS above
ROSTER_SHEET_URL = "https://docs.google.com/spreadsheets/d/1iRpOvAYQaJh2oCcIjZcLDLbJT0eGXqT0nZEXjttOOqI/edit"

# Helper functions for race selection

def get_race_config(race_id):
    """Get configuration for a specific race"""
    return RACES.get(race_id, RACES[DEFAULT_RACE])

def get_team_rosters(race_id):
    """
    Get team rosters for a specific race
    
    Priority:
    1. Google Sheets (if ROSTER_SHEET_URL is set)
    2. Hardcoded TEAM_ROSTERS dict (fallback)
    """
    # Try Google Sheets import first
    if ROSTER_SHEET_URL:
        try:
            from google_sheets_import import load_rosters_from_sheet
            sheet_rosters = load_rosters_from_sheet(ROSTER_SHEET_URL)
            
            if race_id in sheet_rosters:
                return sheet_rosters[race_id]
        except ImportError:
            # google_sheets_import.py not available
            pass
        except Exception:
            # Sheet loading failed, fall back to hardcoded
            pass
    
    # Fallback to hardcoded rosters
    return TEAM_ROSTERS.get(race_id, TEAM_ROSTERS[DEFAULT_RACE])

def get_all_races():
    """Get list of all available races sorted by start date"""
    return sorted(RACES.values(), key=lambda x: x['start_date'], reverse=True)

def get_active_races():
    """Get list of races that are currently in progress"""
    from datetime import datetime
    now = datetime.now().date()
    active = []
    for race in RACES.values():
        start = datetime.strptime(race['start_date'], '%Y-%m-%d').date()
        end = datetime.strptime(race['end_date'], '%Y-%m-%d').date()
        if start <= now <= end:
            active.append(race)
    return active

def get_upcoming_races():
    """Get list of races that haven't started yet"""
    from datetime import datetime
    now = datetime.now().date()
    upcoming = []
    for race in RACES.values():
        start = datetime.strptime(race['start_date'], '%Y-%m-%d').date()
        if start > now:
            upcoming.append(race)
    return sorted(upcoming, key=lambda x: x['start_date'])

def get_completed_races():
    """Get list of completed races"""
    return [race for race in RACES.values() if race['is_complete']]
