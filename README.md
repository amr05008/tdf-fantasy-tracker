# Fantasy Grand Tours

A Streamlit web application for tracking fantasy cycling competition results across multiple Grand Tours with real-time data from procyclingstats.com.

> **Web app (React + Vite) — go-forward UI:** the mobile-first frontend in [`web/`](web/) is deployed on **Vercel** (`tdf-fantasy-tracker.vercel.app`) and now serves **real data**: it defaults to the completed **Tour de France 2025** standings (generated from procyclingstats), and an upcoming race like **TDF 2026** shows an "Upcoming" notice until it starts. The app is **Tour de France only**. See [web/README.md](web/README.md) for the data flow and "Managing Your League" below for roster entry. The Streamlit app documented below remains available.

## Features

- **Tour de France focus**: tracks the Tour de France (2025 complete, 2026 upcoming)
- **Yellow Jersey styling**: the leader is highlighted in TDF yellow
- **Real-time Race Data**: Automatic scoring from procyclingstats.com API
- **Shareable URLs**: Direct links to specific races (e.g., `?race=tdf-2025`)
- **Interactive Charts**: Stage-by-stage performance analysis
- **Team Rosters**: Display professional riders for each fantasy team
- **Automatic Calculations**: Time gaps, rankings, and team scores
- **Mobile-Optimized**: Responsive interface with horizontal race selector
- **Auto-refresh**: 5-minute cache for real-time updates
- **Winner Celebrations**: Special UI for completed races
- **Google Sheets Roster Import**: Manage team rosters via a published Google Sheet without touching code

## Live Application

🌐 **Deployed on Streamlit Cloud** - Visit the live app to see current standings and analysis

The app displays current standings for 5 participants:
- Aaron (🏆 Champion - Tour de France 2025)
- Jeremy
- Leo
- Charles
- Nate

## Local Development

### Prerequisites
- Python 3.8+
- pip package manager

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/amr05008/Replit-FantasyTour2025.git
   cd Replit-FantasyTour2025
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   streamlit run app.py
   ```

4. Open your browser to `http://localhost:8501`

## Supported Races

Currently configured (Tour de France only):
- **Tour de France 2025** ✅ (Complete — Winner: Aaron)
- **Tour de France 2026** (Upcoming — starts Jul 4, 2026)

## Managing Your League

The draft happens offline (over text message); the app only *tracks* results. To enter or edit them:

- **Enter / edit rosters** — `python draft.py draft` (add participants + their 3 riders), `python draft.py swap` (mid-race injury swap; history-preserving), `python draft.py show`. Each rider name is resolved to the correct procyclingstats rider and validated before saving. You can also describe changes in natural language to Claude Code via the **`/draft` skill** — e.g. *"Nate swapped Roglič for Almeida effective stage 12"*, *"add a new team for Sarah: Pogačar, Vingegaard, Evenepoel"*, or *"remove Dave's team"*. Rosters live in `data/rosters.json` (don't hand-edit — go through the tooling, which enforces exactly 3 active riders per team per stage).
- **Publish to the live app** — `python scripts/generate_data.py <race-id>` writes `web/public/data/<race-id>.json` from real procyclingstats data; commit and push to deploy (Vercel redeploys). Run it **from a residential network** — procyclingstats is behind a Cloudflare challenge that datacenter IPs hit hardest.

See [CLAUDE.md](CLAUDE.md) (the "Roster Management + PCS Data Layer" section) for the full backend details.

## Data Source

The app automatically fetches real-time race data from **procyclingstats.com**:
- General Classification (GC) standings for all stages
- Individual rider times and positions
- Fantasy team scores calculated by summing rider GC times
- Automatic handling of DNF/DNS riders

**Configuration**: Race metadata is defined in `races_config.py`; fantasy rosters live in `data/rosters.json` (managed via the draft tooling — see "Managing Your League" above). See [CLAUDE.md](CLAUDE.md) for full configuration details.

## Technology Stack

- **Frontend**: Streamlit
- **Data Processing**: Pandas
- **Charts**: Plotly
- **API Client**: procyclingstats Python package
- **Data Source**: procyclingstats.com API
- **Styling**: Custom CSS with dynamic Grand Tour theming
- **Deployment**: Streamlit Cloud
- **Python Version**: 3.11 (pinned via `.python-version`)

## Deployment

### Streamlit Cloud (Current Host)

This app is deployed on **Streamlit Cloud** with automatic deployments from GitHub:

1. Push changes to the `main` branch
2. Streamlit Cloud automatically redeploys
3. Changes are live in ~2 minutes

**Requirements:**
- `requirements.txt` with all dependencies
- `.streamlit/config.toml` for server configuration
- `app.py` as the main application file

### Alternative Platforms

The app can also be deployed on:
- **Railway** - Modern hosting with GitHub integration
- **Render** - Free tier with auto-deploys
- **Google Cloud Run** - Containerized deployment
- **Heroku** - Traditional PaaS hosting

## Project Documentation

- [CLAUDE.md](CLAUDE.md) - Project overview and architecture (incl. the roster + PCS data layer)
- [web/README.md](web/README.md) - React app and the live data flow
- [races_config.py](races_config.py) - Race configuration

## License

MIT License