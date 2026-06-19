# Fantasy Grand Tours

A Streamlit web application for tracking fantasy cycling competition results across multiple Grand Tours with real-time data from procyclingstats.com.

> **New web app (React + Vite) — go-forward UI:** a redesigned, mobile-first frontend lives in [`web/`](web/), deployed on **Vercel** (`tdf-fantasy-tracker.vercel.app`). It currently runs on placeholder data; wiring the real procyclingstats feed is a planned phase-2 step. See [web/README.md](web/README.md). The Streamlit app documented below remains available.

## Features

- **Multi-Race Support**: Switch between Tour de France, Giro d'Italia, and Vuelta a España
- **Dynamic Leader Jersey Colors**: Yellow (TDF), Pink (Giro), Red (Vuelta)
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

Currently configured Grand Tours:
- **Tour de France 2025** ✅ (Complete - Winner: Aaron)
- **Giro d'Italia 2026** (Upcoming)
- **Tour de France 2026** (Upcoming)
- **Vuelta a España 2026** (Upcoming)

## Data Source

The app automatically fetches real-time race data from **procyclingstats.com**:
- General Classification (GC) standings for all stages
- Individual rider times and positions
- Fantasy team scores calculated by summing rider GC times
- Automatic handling of DNF/DNS riders

**Configuration**: Team rosters and race metadata are defined in `races_config.py`. Rosters can also be managed via a published Google Sheet — see [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) for setup instructions. See [CLAUDE.md](CLAUDE.md) for full configuration details.

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

See [STREAMLIT_MIGRATION.md](STREAMLIT_MIGRATION.md) for complete migration documentation.

### Alternative Platforms

The app can also be deployed on:
- **Railway** - Modern hosting with GitHub integration
- **Render** - Free tier with auto-deploys
- **Google Cloud Run** - Containerized deployment
- **Heroku** - Traditional PaaS hosting

## Project Documentation

- [CLAUDE.md](CLAUDE.md) - Project overview and architecture
- [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) - Guide for managing rosters via Google Sheets
- [MULTI_RACE_IMPLEMENTATION_PLAN.md](MULTI_RACE_IMPLEMENTATION_PLAN.md) - Multi-race feature implementation guide
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Google Sheets → procyclingstats API migration details
- [races_config.py](races_config.py) - Multi-race configuration file
- [STREAMLIT_MIGRATION.md](STREAMLIT_MIGRATION.md) - Deployment platform migration guide

## License

MIT License