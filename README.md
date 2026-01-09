# Scrum of Scrums Dashboard

A modern, calendar-based Scrum of Scrums management system with trending analytics and team performance visualization.

## Features

- 📊 **Dashboard** with week-by-week trending charts
- 📅 **Calendar View** to navigate between reporting periods
- 👥 **Team Tracking** for all development teams
- 📈 **Trend Analysis** showing progress, blockers, and risks over time
- 🎨 **Modern UI** with dark theme and smooth animations

## Teams Tracked

- Salesforce Team
- Docs Team (formerly Team Hema)
- Team Arches & Zion
- Team Badlands
- Team Yosemite
- CX Team
- MX Team
- Team Capybara (Servicing)
- Team Panda (Servicing)

## Local Development

```bash
# Install dependencies
npm install

# Run local dev server
npm run dev
```

## Deployment

This project is configured for automatic deployment to Vercel:

```bash
# Deploy to production
npm run deploy
```

Or connect your GitHub repository to Vercel for automatic deployments on push.

## Project Structure

```
/
├── index.html              # Dashboard homepage with charts
├── data/                   # JSON data files for each week
│   ├── 2025-11-24.json
│   ├── 2025-12-08.json
│   ├── 2025-12-29.json
│   └── 2026-01-09.json
├── weeks/                  # Individual week detail pages
│   ├── 2025-11-24.html
│   ├── 2025-12-08.html
│   ├── 2025-12-29.html
│   └── 2026-01-09.html
├── assets/
│   ├── css/
│   │   └── styles.css      # Shared styles
│   └── js/
│       ├── app.js          # Main application logic
│       └── dashboard.js    # Dashboard charts and analytics
├── package.json
├── vercel.json
└── README.md
```

## Adding New Weeks

1. Create a new JSON file in `/data/` with the week ending date (YYYY-MM-DD.json)
2. Create a corresponding HTML file in `/weeks/`
3. The dashboard will automatically include the new week in trending charts

## Built With

- HTML5, CSS3, JavaScript (ES6+)
- Chart.js for data visualization
- Modern CSS Grid and Flexbox layouts
- Google Fonts (Plus Jakarta Sans, JetBrains Mono)

## License

ISC
