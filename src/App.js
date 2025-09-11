import React, { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css"; // Tailwind CSS

const weatherIcons = {
  0: <i className="bi bi-brightness-high-fill text-yellow-400"></i>,
  1: <i className="bi bi-brightness-alt-high-fill text-yellow-300"></i>,
  2: <i className="bi bi-cloud-sun-fill text-yellow-200"></i>,
  3: <i className="bi bi-cloud-fill text-gray-300"></i>,
  45: <i className="bi bi-cloud-fog-fill text-gray-400"></i>,
  48: <i className="bi bi-cloud-fog2-fill text-gray-400"></i>,
  51: <i className="bi bi-cloud-drizzle-fill text-blue-300"></i>,
  53: <i className="bi bi-cloud-drizzle-fill text-blue-400"></i>,
  55: <i className="bi bi-cloud-drizzle-fill text-blue-500"></i>,
  56: <i className="bi bi-cloud-rain-fill text-blue-400"></i>,
  57: <i className="bi bi-cloud-rain-fill text-blue-500"></i>,
  61: <i className="bi bi-cloud-rain-fill text-blue-400"></i>,
  63: <i className="bi bi-cloud-rain-fill text-blue-500"></i>,
  65: <i className="bi bi-cloud-rain-heavy-fill text-blue-600"></i>,
  66: <i className="bi bi-cloud-sleet-fill text-blue-400"></i>,
  67: <i className="bi bi-cloud-sleet-fill text-blue-600"></i>,
  71: <i className="bi bi-cloud-snow-fill text-sky-200"></i>,
  73: <i className="bi bi-cloud-snow-fill text-sky-100"></i>,
  75: <i className="bi bi-cloud-snow-fill text-white"></i>,
  77: <i className="bi bi-snow text-white"></i>,
  80: <i className="bi bi-cloud-rain-fill text-blue-400"></i>,
  81: <i className="bi bi-cloud-rain-heavy-fill text-blue-500"></i>,
  82: <i className="bi bi-cloud-rain-heavy-fill text-blue-600"></i>,
  85: <i className="bi bi-cloud-snow-fill text-sky-200"></i>,
  86: <i className="bi bi-cloud-snow-fill text-white"></i>,
  95: <i className="bi bi-cloud-lightning-rain-fill text-purple-500"></i>,
  96: <i className="bi bi-cloud-lightning-rain-fill text-purple-600"></i>,
  99: <i className="bi bi-cloud-lightning-rain-fill text-purple-700"></i>,
};

function App() {
  const [city, setCity] = useState("Madanapalle");
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [daily, setDaily] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [time, setTime] = useState(new Date());
useEffect(() => {
  getWeather(city);
}, [city]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  const getWeather = async (cityName) => {
    try {
      setLoading(true);
      setWeather(null);
const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`);
if (!geoRes.ok) throw new Error("Failed to fetch geocoding data");
const geoData = await geoRes.json();

if (!geoData.results) {
  alert("City not found!");
  setLoading(false);
  return;
}

const { latitude, longitude, name, country } = geoData.results[0];

const weatherRes = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weathercode&hourly=temperature_2m,windspeed_10m,weathercode&timezone=auto`
);
if (!weatherRes.ok) throw new Error("Failed to fetch weather data");
const data = await weatherRes.json();

      //const data = weatherRes;

      setWeather({
        city: `${name}, ${country}`,
        current: data.current_weather,
        sunrise: data.daily.sunrise[0].split("T")[1],
        sunset: data.daily.sunset[0].split("T")[1],
      });

      setDaily(
        data.daily.time.slice(0, 5).map((day, i) => ({
          date: day,
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
          code: data.daily.weathercode[i],
        }))
      );

      setHourly(
        data.hourly.time.slice(0, 6).map((time, i) => ({
          time: time.split("T")[1],
          temp: data.hourly.temperature_2m[i],
          wind: data.hourly.windspeed_10m[i],
          code: data.hourly.weathercode[i],
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Error fetching weather data.");
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (city.trim()) {
      getWeather(city);
    } else {
      alert("Please enter a city name!");
    }
  };

  const fetchCurrentLocationWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`
        ).then((res) => res.json());

        const locationCity = geoRes.results
          ? geoRes.results[0].name
          : "Your Location";
        getWeather(locationCity);
      });
    } else {
      alert("Geolocation not supported!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex justify-center items-start p-6">
      <div className="w-full max-w-6xl space-y-6">
        {/* Search bar */}
        <div className="flex justify-center gap-3">
          <input
            type="text"
            placeholder="Search for your preferred city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-4 py-3 w-72 rounded-full text-gray-900 focus:outline-none shadow-lg"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-md transition transform hover:scale-105"
          >
            Search
          </button>
          <button
            onClick={fetchCurrentLocationWeather}
            className="px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition transform hover:scale-105"
          >
            📍 Current Location
          </button>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Dashboard */}
        {!loading && weather && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 opacity-100 scale-100">
            {/* Clock */}
            <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md hover:-translate-y-1 transition">
              <h2 className="text-2xl font-semibold">{weather.city}</h2>
              <h1 className="text-5xl font-bold mt-2">
                {time.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </h1>
              <p className="text-gray-300">{time.toDateString()}</p>
            </div>

            {/* Current Weather */}
            <div
  className={`bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md hover:-translate-y-1 transition text-center ${
    weather.current.weathercode === 0 ? "sunny-card" :
    [61,63,65,80,81,82].includes(weather.current.weathercode) ? "rainy-card" :
    [71,73,75,77,85,86].includes(weather.current.weathercode) ? "snowy-card" :
    [95,96,99].includes(weather.current.weathercode) ? "thunder-card" : ""
  }`}
>
  <h2 className="text-4xl font-bold">
                {weather.current.temperature}°C
              </h2>
              <div className="text-6xl my-2">
                {weatherIcons[weather.current.weathercode] || (
                  <i className="bi bi-question-circle text-white"></i>
                )}
              </div>
              <p>Feels like: {weather.current.temperature}°C</p>
              <p>🌅 Sunrise: {weather.sunrise}</p>
              <p>🌇 Sunset: {weather.sunset}</p>
              <p>💨 Wind: {weather.current.windspeed} km/h</p>
            </div>
          </div>
        )}

        {/* Forecasts */}
        {!loading && daily.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily */}
            <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md">
              <h3 className="text-xl font-semibold mb-4">5 Days Forecast</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {daily.map((d, i) => (
                  <div
                    key={i}
                    className="bg-white/20 rounded-lg text-center px-3 py-2"
                  >
                    <p className="text-sm">{d.date}</p>
                    <div className="text-2xl">
                      {weatherIcons[d.code] || (
                        <i className="bi bi-question-circle text-white"></i>
                      )}
                    </div>
                    <p className="text-sm">
                      {d.max}° / {d.min}°
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly */}
            <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md">
              <h3 className="text-xl font-semibold mb-4">Hourly Forecast</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {hourly.map((h, i) => (
                  <div
                    key={i}
                    className="bg-white/20 rounded-lg text-center px-3 py-2"
                  >
                    <p className="text-sm">{h.time}</p>
                    <div className="text-2xl">
                      {weatherIcons[h.code] || (
                        <i className="bi bi-question-circle text-white"></i>
                      )}
                    </div>
                    <p className="text-sm">{h.temp}°C</p>
                    <p className="text-xs">💨 {h.wind} km/h</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
