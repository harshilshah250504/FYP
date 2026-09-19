# AQInsights — Air Quality Intelligence System

End-to-end air quality intelligence system that analyzes AQI data, attributes pollution sources, and delivers personalized health risk assessments. Integrates historical and real-time AQI data with traffic, wildfire, and weather context.

## Features

- **Search by place or coordinates** — AQI, traffic, wildfire, pollutants for any location (India-focused, supports worldwide)
- **Safety classification** — Safe / Moderate / Unsafe based on AQI
- **Personalized health advisories** — By age group (children, adults, elderly) and health conditions (asthma, heart, lung, pregnancy)
- **Data storage** — All API responses stored in SQLite for trend analysis
- **K-Means clustering** — Region-specific pollution behavior discovery (Insights page)
- **Optional GROQ LLM** — AI-generated health advisories when API key is set

## API Integrations

| Source | Purpose |
|--------|---------|
| OpenWeather | Geocoding, weather, air pollution |
| Open-Meteo | Geocoding (India), air quality fallback |
| NASA FIRMS | Wildfire detection |
| WAQI | AQI and dominant pollutant |
| TomTom | Traffic flow (optional) |
| GROQ | LLM health advisories (optional) |

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env` 
   - Add your API keys. Use your own credentials; no keys are supplied. Add `GROQ_API_KEY` for AI advisories.

3. **Initialize database**
   ```bash
   npx prisma db push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── search/     # Main search (AQI, weather, traffic, wildfire)
│   │   │   ├── cluster/    # K-Means clustering on stored data
│   │   │   └── llm-advisory/  # GROQ-based health advisory
│   │   ├── insights/       # Clustering dashboard
│   │   └── page.tsx        # Main search UI
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── ResultCard.tsx
│   │   └── MapView.tsx
│   └── lib/
│       ├── apis/           # External API clients
│       ├── health-advisory.ts
│       ├── pollution-causes.ts
│       └── utils.ts
├── prisma/
│   └── schema.prisma       # SQLite schema
└── .env
```

## API Keys (placeholders)

- **OPENWEATHER_API_KEY** — Required. Get at [openweathermap.org](https://openweathermap.org/api)
- **NASA_FIRMS_KEY** — For wildfire data. Get at [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/)
- **WAQI_TOKEN** — Optional. AQI source. [aqicn.org](https://aqicn.org/api/)
- **TOMTOM_KEY** — Optional. Traffic data. [developer.tomtom.com](https://developer.tomtom.com/)
- **GROQ_API_KEY** — Optional. LLM advisories. [console.groq.com](https://console.groq.com/)

## Research notebook and verification

`Final_Year_Project.ipynb` contains exploratory analysis in addition to the web application. Notebook outputs have been cleared and API credentials are read from environment variables. Its forecasting and source-attribution experiments have not been independently validated. The web app and notebook are separate workflows.

Historical commits have not been rewritten. Keep this repository private until previously embedded credentials have been revoked and repository history reviewed.

## Author

Harshil Prashant Shah · [Portfolio](https://harshil-prashant-shah.vercel.app/)
