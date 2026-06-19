"""
API client for fetching race data from procyclingstats

This module handles fetching real-time race data and calculating
fantasy team scores based on rider performance.
"""

from procyclingstats import Race, Stage
import streamlit as st
from typing import Dict, List, Tuple, Optional
from team_config import TEAM_ROSTERS, RACE_CONFIG
from pcs_time import time_str_to_seconds, seconds_to_time_str


@st.cache_data(ttl=300)  # Cache for 5 minutes
def fetch_stage_gc(stage_number: int, race_url: str = None) -> Optional[Dict]:
    """
    Fetch General Classification (GC) data for a specific stage

    Args:
        stage_number: Stage number (1-21)
        race_url: URL path for the race (e.g., "race/tour-de-france/2025")

    Returns:
        Dictionary mapping rider URLs to their GC data, or None if error
    """
    if race_url is None:
        race_url = RACE_CONFIG["race_url"]

    try:
        stage_url = f"{race_url}/stage-{stage_number}"
        stage = Stage(stage_url)
        stage_data = stage.parse()

        if not stage_data or 'gc' not in stage_data:
            return None

        # Convert list of GC entries to dictionary keyed by rider_url
        gc_dict = {}
        for entry in stage_data['gc']:
            rider_url = entry.get('rider_url')
            if rider_url:
                gc_dict[rider_url] = entry

        return gc_dict

    except Exception as e:
        st.error(f"Error fetching stage {stage_number} GC data: {str(e)}")
        return None


@st.cache_data(ttl=300)
def get_latest_completed_stage(race_url: str = None) -> int:
    """
    Determine the latest completed stage by checking which stages have GC data

    Args:
        race_url: URL path for the race

    Returns:
        Latest completed stage number (1-21)
    """
    if race_url is None:
        race_url = RACE_CONFIG["race_url"]

    try:
        race = Race(race_url)
        race_data = race.parse()

        if not race_data or 'stages' not in race_data:
            return 1

        # Check stages in reverse order to find the latest with data
        total_stages = RACE_CONFIG.get("total_stages", 21)

        for stage_num in range(total_stages, 0, -1):
            gc_data = fetch_stage_gc(stage_num, race_url)
            if gc_data and len(gc_data) > 0:
                return stage_num

        return 1

    except Exception as e:
        st.error(f"Error determining latest stage: {str(e)}")
        return 1


def calculate_team_time(team_riders: List[str], gc_data: Dict) -> Tuple[int, int]:
    """
    Calculate total team time by summing rider cumulative times

    Args:
        team_riders: List of rider URLs for the team
        gc_data: Dictionary of GC data keyed by rider_url

    Returns:
        Tuple of (total_time_seconds, riders_counted)
    """
    total_seconds = 0
    riders_counted = 0

    for rider_url in team_riders:
        if rider_url in gc_data:
            rider_gc = gc_data[rider_url]
            time_str = rider_gc.get('time', '0:00:00')
            rider_seconds = time_str_to_seconds(time_str)

            if rider_seconds > 0:
                total_seconds += rider_seconds
                riders_counted += 1

    return total_seconds, riders_counted


@st.cache_data(ttl=300)
def fetch_fantasy_standings(stage_number: int = None, race_url: str = None) -> Optional[Dict]:
    """
    Fetch and calculate fantasy standings for all teams

    Args:
        stage_number: Specific stage number, or None for latest
        race_url: URL path for the race

    Returns:
        Dictionary with standings data, or None if error
    """
    if race_url is None:
        race_url = RACE_CONFIG["race_url"]

    # Determine stage to fetch
    if stage_number is None:
        stage_number = get_latest_completed_stage(race_url)

    # Fetch GC data for this stage
    gc_data = fetch_stage_gc(stage_number, race_url)
    if not gc_data:
        return None

    # Calculate team scores
    team_scores = {}
    team_rider_details = {}

    for participant, riders in TEAM_ROSTERS.items():
        total_time, riders_counted = calculate_team_time(riders, gc_data)

        team_scores[participant] = {
            'total_time_seconds': total_time,
            'total_time': seconds_to_time_str(total_time),
            'riders_counted': riders_counted,
            'total_riders': len(riders)
        }

        # Store individual rider details
        rider_details = []
        for rider_url in riders:
            if rider_url in gc_data:
                rider_gc = gc_data[rider_url]
                rider_details.append({
                    'name': rider_gc.get('rider_name', 'Unknown'),
                    'time': rider_gc.get('time', '0:00:00'),
                    'rank': rider_gc.get('rank', '-'),
                    'team': rider_gc.get('team_name', 'Unknown')
                })
            else:
                # Rider not in GC (DNF, DNS, etc.)
                rider_details.append({
                    'name': rider_url.split('/')[-1].replace('-', ' ').title(),
                    'time': 'DNF',
                    'rank': '-',
                    'team': 'Unknown'
                })

        team_rider_details[participant] = rider_details

    # Sort teams by total time (ascending - lower is better)
    sorted_teams = sorted(
        team_scores.items(),
        key=lambda x: x[1]['total_time_seconds']
    )

    # Calculate gaps and positions
    leader_time = sorted_teams[0][1]['total_time_seconds'] if sorted_teams else 0

    for i, (participant, data) in enumerate(sorted_teams):
        data['position'] = i + 1
        gap_seconds = data['total_time_seconds'] - leader_time
        if gap_seconds == 0:
            data['gap'] = "Leader"
        else:
            data['gap'] = f"+{seconds_to_time_str(gap_seconds)}"

    return {
        'standings': sorted_teams,
        'latest_stage': stage_number,
        'rider_details': team_rider_details,
        'gc_data': gc_data
    }


@st.cache_data(ttl=300)
def fetch_stage_by_stage_data(latest_stage: int, race_url: str = None) -> Dict:
    """
    Fetch GC data for all completed stages to enable stage-by-stage analysis

    Args:
        latest_stage: The latest completed stage number
        race_url: URL path for the race

    Returns:
        Dictionary mapping participants to their stage-by-stage data
    """
    if race_url is None:
        race_url = RACE_CONFIG["race_url"]

    stage_data = {}

    # Initialize data structure for each participant
    for participant in TEAM_ROSTERS.keys():
        stage_data[participant] = {}

    # Fetch GC data for each stage
    for stage_num in range(1, latest_stage + 1):
        gc_data = fetch_stage_gc(stage_num, race_url)

        if gc_data:
            for participant, riders in TEAM_ROSTERS.items():
                total_time, riders_counted = calculate_team_time(riders, gc_data)

                if total_time > 0:
                    stage_data[participant][stage_num] = {
                        'time': seconds_to_time_str(total_time),
                        'time_seconds': total_time,
                        'riders_counted': riders_counted
                    }

    return stage_data
