# 🌦️ Weather & News Dashboard

A **React + TypeScript + Tailwind CSS** application that combines **live weather data** with **context-aware news filtering**.  
Instead of showing random news, the app adjusts the type of news you see based on the **temperature of your location**.  

---

## 🚀 Features

### 🌤 Weather & Forecast
- Current weather with temperature, condition, and icons.  
- **5-day forecast** with daily temperature snapshots.  
- City search with autocomplete.  
- Location detection using browser geolocation.  
- Toggle between **°C (Celsius)** and **°F (Fahrenheit)**.  

### 📰 Weather-Based News
The app fetches live headlines from **NewsAPI** and filters them depending on the **mood**, which is derived from the temperature:  

| Temperature | Mood   | News Type |
|-------------|--------|-----------|
| ≤ 15°C      | ❄️ Cold | **Depressing news** — crisis, conflict, disasters |
| 16°C–31°C   | 🌤 Cool | **Positive news** — wins, success, joy, growth |
| ≥ 32°C      | 🔥 Hot  | **Fear-related news** — risks, threats, warnings |

**Example:**  
- Searching **London (13°C)** → mood becomes *Cold* → shows mostly negative/conflict headlines.  
- Searching **Dubai (35°C)** → mood becomes *Hot* → shows fear/risk-oriented headlines.  
- Searching **New York (25°C)** → mood becomes *Cool* → shows positive/celebratory headlines.  

This is achieved by a **keyword mapping** system that matches headlines with mood-specific terms (e.g., *recession, layoff, war* for Cold; *win, happiness, growth* for Cool).  

### 🎨 UI/UX
- Responsive, mobile-friendly layout with Tailwind CSS.  
- Smooth hover animations and gradient backgrounds.  
- Scrollable news card for easy browsing.  
- Dark mode support.  

---

## 🛠 Tech Stack
- **Framework:** React + Vite + TypeScript  
- **Styling:** Tailwind CSS  
- **APIs Used:**
  - [OpenWeather API](https://openweathermap.org/) → Current & forecast data  
  - [NewsAPI](https://newsapi.org/) → News headlines  
  - [Open-Meteo Geocoding](https://open-meteo.com/) → City search autocomplete  
  - [OpenStreetMap (Nominatim)](https://nominatim.org/) → Reverse geocoding  

---

## ⚙️ Setup

```bash
# Clone repository
git clone https://github.com/your-username/Weather-and-News-Dashboard.git
cd Weather-and-News-Dashboard

# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
