import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css"; // Assuming Tailwind CSS is configured

// --- UTILS/CONSTANTS ---

// Helper function for Celsius to Fahrenheit conversion
const toFahrenheit = (celsius) => (celsius * 9) / 5 + 32;

// WMO Weather interpretation codes (WMO CODE)
const WMO_WEATHER_ICONS = {
    0: <i className="bi bi-brightness-high-fill text-yellow-400 drop-shadow-lg animate-pulse-slow"></i>,
    1: <i className="bi bi-brightness-alt-high-fill text-yellow-300 drop-shadow-lg animate-pulse-slow"></i>,
    2: <i className="bi bi-cloud-sun-fill text-yellow-200 drop-shadow-lg animate-cloud-sun"></i>,
    3: <i className="bi bi-cloud-fill text-gray-300 drop-shadow-lg animate-cloud-slow"></i>,
    45: <i className="bi bi-cloud-fog-fill text-gray-400 drop-shadow-lg animate-fog-slow"></i>,
    48: <i className="bi bi-cloud-fog2-fill text-gray-400 drop-shadow-lg animate-fog-slow"></i>,
    51: <i className="bi bi-cloud-drizzle-fill text-blue-300 drop-shadow-lg animate-rain"></i>,
    53: <i className="bi bi-cloud-drizzle-fill text-blue-400 drop-shadow-lg animate-rain"></i>,
    55: <i className="bi bi-cloud-drizzle-fill text-blue-500 drop-shadow-lg animate-rain"></i>,
    56: <i className="bi bi-cloud-rain-fill text-blue-400 drop-shadow-lg animate-rain"></i>,
    57: <i className="bi bi-cloud-rain-fill text-blue-500 drop-shadow-lg animate-rain"></i>,
    61: <i className="bi bi-cloud-rain-fill text-blue-400 drop-shadow-lg animate-rain"></i>,
    63: <i className="bi bi-cloud-rain-fill text-blue-500 drop-shadow-lg animate-rain"></i>,
    65: <i className="bi bi-cloud-rain-heavy-fill text-blue-600 drop-shadow-lg animate-rain-heavy"></i>,
    66: <i className="bi bi-cloud-sleet-fill text-blue-400 drop-shadow-lg animate-sleet"></i>,
    67: <i className="bi bi-cloud-sleet-fill text-blue-600 drop-shadow-lg animate-sleet"></i>,
    71: <i className="bi bi-cloud-snow-fill text-sky-200 drop-shadow-lg animate-snow"></i>,
    73: <i className="bi bi-cloud-snow-fill text-sky-100 drop-shadow-lg animate-snow"></i>,
    75: <i className="bi bi-cloud-snow-fill text-white drop-shadow-lg animate-snow"></i>,
    77: <i className="bi bi-snow text-white drop-shadow-lg animate-snow-heavy"></i>,
    80: <i className="bi bi-cloud-rain-fill text-blue-400 drop-shadow-lg animate-rain"></i>,
    81: <i className="bi bi-cloud-rain-heavy-fill text-blue-500 drop-shadow-lg animate-rain-heavy"></i>,
    82: <i className="bi bi-cloud-rain-heavy-fill text-blue-600 drop-shadow-lg animate-rain-heavy"></i>,
    85: <i className="bi bi-cloud-snow-fill text-sky-200 drop-shadow-lg animate-snow"></i>,
    86: <i className="bi bi-cloud-snow-fill text-white drop-shadow-lg animate-snow"></i>,
    95: <i className="bi bi-cloud-lightning-rain-fill text-purple-500 drop-shadow-lg animate-lightning"></i>,
    96: <i className="bi bi-cloud-lightning-rain-fill text-purple-600 drop-shadow-lg animate-lightning-pulse"></i>,
    99: <i className="bi bi-cloud-lightning-rain-fill text-purple-700 drop-shadow-lg animate-lightning-pulse"></i>,
};

// Logic to determine the main card background class based on weather code
const getCardClass = (code) => {
    if (code === 0) return "sunny-card bg-yellow-700/50 border-yellow-500/50 hover:shadow-yellow-500/60";
    if ([61, 63, 65, 80, 81, 82].includes(code)) return "rainy-card bg-blue-700/50 border-blue-500/50 hover:shadow-blue-500/60";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snowy-card bg-sky-600/50 border-sky-400/50 hover:shadow-sky-400/60";
    if ([95, 96, 99].includes(code)) return "thunder-card bg-purple-700/50 border-purple-500/50 hover:shadow-purple-500/60";
    if ([1, 2, 3, 45, 48].includes(code)) return "cloudy-card bg-gray-600/50 border-gray-400/50 hover:shadow-gray-400/60";
    return "bg-white/10 border-white/20";
};

// --- REUSABLE COMPONENTS ---

/**
 * A cool SVG loader for a modern look.
 */
const AnimatedLoader = React.memo(() => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <svg className="w-20 h-20 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75 animate-spin-slow" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-medium text-gray-300 animate-pulse">Fetching the forecast...</p>
    </div>
));

/**
 * Renders a single piece of weather detail (Wind, Sunrise, Sunset).
 */
const WeatherDetailItem = React.memo(({ icon, label, value, iconClass }) => (
    <p className="flex justify-between items-center px-4">
        <i className={`bi ${icon} mr-2 ${iconClass}`}></i> {label}: <span className="font-bold text-yellow-100">{value}</span>
    </p>
));

/**
 * Renders the temperature unit toggle.
 */
const UnitToggle = React.memo(({ unit, setUnit }) => (
    <div className="flex items-center justify-end z-10">
        <div className="p-1 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-inner flex transition duration-300 hover:scale-105">
            <button
                onClick={() => setUnit('C')}
                className={`px-4 py-2 rounded-full font-extrabold text-lg transition-all duration-300 ${unit === 'C' ? 'bg-blue-500 shadow-lg text-white' : 'text-gray-300 hover:text-white'}`}
            >
                °C
            </button>
            <button
                onClick={() => setUnit('F')}
                className={`px-4 py-2 rounded-full font-extrabold text-lg transition-all duration-300 ${unit === 'F' ? 'bg-blue-500 shadow-lg text-white' : 'text-gray-300 hover:text-white'}`}
            >
                °F
            </button>
        </div>
    </div>
));

/**
 * Renders the main current weather card with dynamic background.
 */
const CurrentWeatherCard = React.memo(({ current, sunrise, sunset, unit }) => {
    const { temperature, windspeed, weathercode } = current;
    
    // Use useMemo for computed values based on unit
    const { temp, tempUnit } = useMemo(() => {
        const temp = unit === 'C' ? temperature : toFahrenheit(temperature).toFixed(1);
        const tempUnit = unit === 'C' ? '°C' : '°F';
        return { temp, tempUnit };
    }, [temperature, unit]);

    const cardClass = getCardClass(weathercode);
    const windUnit = 'km/h';

    return (
        <div
            className={`p-8 rounded-3xl shadow-2xl backdrop-blur-lg transition text-center border-4 duration-500 transform hover:scale-[1.03] ${cardClass}`}
        >
            <h2 className="text-7xl font-extrabold text-shadow-lg animate-fade-in-down">
                {temp}<span className="text-4xl align-top">{tempUnit}</span>
            </h2>
            <div className="text-8xl my-4 animate-bounce-slow">
                {WMO_WEATHER_ICONS[weathercode] || (
                    <i className="bi bi-question-circle text-white"></i>
                )}
            </div>
            <div className="space-y-2 text-xl font-medium pt-4 border-t border-white/30">
                <WeatherDetailItem icon="bi-wind" label="Wind" value={`${windspeed} ${windUnit}`} iconClass="text-blue-300" />
                <WeatherDetailItem icon="bi-sunrise-fill" label="Sunrise" value={sunrise} iconClass="text-yellow-400" />
                <WeatherDetailItem icon="bi-sunset-fill" label="Sunset" value={sunset} iconClass="text-orange-400" />
            </div>
        </div>
    );
});

/**
 * Renders the location, current time, and timezone.
 */
const LocationClockCard = React.memo(({ city, time }) => (
    <div className="bg-gray-800/60 p-8 rounded-3xl shadow-2xl backdrop-blur-lg border border-blue-500/50 md:col-span-1 transform hover:scale-[1.01] transition duration-500 hover:shadow-2xl hover:shadow-blue-500/40">
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-2 text-yellow-500">{city}</h2>
        <h1 className="text-7xl font-light tracking-tighter mt-4 animate-glow">
            {time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })}
        </h1>
        <p className="text-blue-300 text-xl font-medium mt-1 border-b border-white/20 pb-3">{time.toDateString()}</p>
        <div className="mt-4 pt-4">
            <p className="text-sm text-gray-400 flex items-center">
                <i className="bi bi-globe mr-2"></i> Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
        </div>
    </div>
));

/**
 * A generalized item component for either Daily or Hourly forecast.
 * @param {object} props - Data and style props
 * @param {'daily' | 'hourly'} props.variant - Defines the layout and data to display
 */
const ForecastItem = React.memo(({ variant, data, unit }) => {
    const { date, max, min, time, temp, wind, code } = data;
    const isDaily = variant === 'daily';

    // Data computation
    const displayTemp = isDaily 
        ? `${unit === 'C' ? max : toFahrenheit(max).toFixed(0)} / ${unit === 'C' ? min : toFahrenheit(min).toFixed(0)}`
        : unit === 'C' ? temp : toFahrenheit(temp).toFixed(0);
    const tempUnit = unit === 'C' ? '°C' : '°F';
    const primaryLabel = isDaily ? date : time;
    const mainTemp = isDaily ? displayTemp.split(' ')[0] : displayTemp;
    const secondaryTemp = isDaily ? displayTemp.split(' ')[2] : null;

    // Styles for generalization
    const containerClass = isDaily
        ? "bg-white/20 rounded-xl text-center px-3 py-4 transition-all hover:scale-105 duration-300 hover:shadow-2xl border-2 border-white/30 cursor-pointer"
        : "bg-white/10 rounded-xl text-center px-2 py-3 transition-all hover:bg-white/30 duration-300 border border-white/10 shadow-inner hover:shadow-blue-500/50 cursor-pointer";
    const iconClass = isDaily ? "text-4xl my-2 transform hover:rotate-3 transition duration-500" : "text-3xl my-1";
    const tempClass = isDaily ? "text-lg font-extrabold" : "text-lg font-extrabold";

    return (
        <div className={containerClass}>
            <p className="text-base font-bold text-gray-200">{primaryLabel}</p>
            <div className={iconClass}>
                {WMO_WEATHER_ICONS[code] || <i className="bi bi-question-circle text-white"></i>}
            </div>
            <p className={tempClass}>
                {mainTemp}{tempUnit}
                {secondaryTemp && <span className="font-light text-white/70"> / {secondaryTemp}{tempUnit}</span>}
            </p>
            {!isDaily && (
                <p className="text-xs text-blue-300 font-medium mt-1">
                    <i className="bi bi-wind mr-1 animate-wind"></i> {wind} km/h
                </p>
            )}
        </div>
    );
});

/**
 * Renders the N-Day forecast section using the generalized item.
 */
const DailyForecast = React.memo(({ daily, unit }) => (
    <div className="bg-gray-800/60 p-6 rounded-3xl shadow-2xl backdrop-blur-lg border border-gray-700 hover:shadow-blue-500/30 transition-shadow duration-500">
        <h3 className="text-2xl font-extrabold mb-4 border-b-4 border-blue-500/50 pb-2 text-blue-200 flex items-center">
            <i className="bi bi-calendar-week-fill mr-2 text-blue-400"></i> 5 Days Forecast
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {daily.map((d, i) => (
                <ForecastItem key={i} variant="daily" data={d} unit={unit} />
            ))}
        </div>
    </div>
));

/**
 * Renders the N-Hour forecast section using the generalized item.
 */
const HourlyForecast = React.memo(({ hourly, unit }) => (
    <div className="bg-gray-800/60 p-6 rounded-3xl shadow-2xl backdrop-blur-lg border border-gray-700 hover:shadow-green-500/30 transition-shadow duration-500">
        <h3 className="text-2xl font-extrabold mb-4 border-b-4 border-green-500/50 pb-2 text-green-200 flex items-center">
            <i className="bi bi-clock-fill mr-2 text-green-400"></i> Next 6 Hours Forecast
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {hourly.map((h, i) => (
                <ForecastItem key={i} variant="hourly" data={h} unit={unit} />
            ))}
        </div>
    </div>
));

/**
 * Renders the search bar, suggestions, and action buttons.
 */
const SearchBar = React.memo(({ searchInput, setSearchInput, suggestions, handleSearch, handleSuggestionClick, fetchCurrentLocationWeather }) => (
    <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-20">
        <div className="relative w-full sm:w-96">
            <input
                type="text"
                placeholder="Search for your preferred city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="px-5 py-3 w-full rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-400 shadow-2xl transition duration-500 border border-transparent hover:border-blue-300"
            />
            {suggestions.length > 0 && (
                <ul className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl overflow-hidden text-gray-900 border border-gray-200 animate-slide-down">
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            onClick={() => handleSuggestionClick(s)}
                            className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition duration-200 text-sm truncate border-b border-gray-100 last:border-b-0 flex items-center"
                        >
                            <i className="bi bi-pin-map-fill mr-2 text-blue-500"></i>
                            {s.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
        <div className="flex gap-3">
            <button
                onClick={handleSearch}
                className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold shadow-xl transition transform hover:scale-105 active:scale-95 duration-200 flex items-center justify-center space-x-1"
            >
                <i className="bi bi-search"></i> <span className="hidden sm:inline">Search</span>
            </button>
            <button
                onClick={fetchCurrentLocationWeather}
                className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-xl transition transform hover:scale-105 active:scale-95 duration-200 flex items-center justify-center space-x-1"
            >
                <i className="bi bi-geo-alt-fill"></i> <span className="hidden sm:inline">Current Location</span>
            </button>
        </div>
    </div>
));

// --- MAIN APP COMPONENT ---

function App() {
    const initialCity = "Madanapalle";
    const [searchInput, setSearchInput] = useState(initialCity);
    const [city, setCity] = useState(initialCity);
    
    const [loading, setLoading] = useState(false);
    const [weather, setWeather] = useState(null);
    const [daily, setDaily] = useState([]);
    const [hourly, setHourly] = useState([]);
    const [time, setTime] = useState(new Date());
    const [suggestions, setSuggestions] = useState([]);
    const [unit, setUnit] = useState('C');
    const abortControllerRef = useRef(null);

    // Initial load and time update effects remain the same
    useEffect(() => {
        getWeather(initialCity);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000 * 60);
        return () => clearInterval(interval);
    }, []);

    // Suggestion fetching effect (debounced) remains the same
    useEffect(() => {
        if (searchInput.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            fetchSuggestions(searchInput);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchInput]);

    // Handlers (modified to be wrapped in useCallback for ideal performance)

    const fetchSuggestions = useCallback(async (query) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`,
                { signal }
            );
            if (!geoRes.ok) throw new Error("Failed to fetch suggestions");
            const geoData = await geoRes.json();

            if (geoData.results) {
                setSuggestions(
                    geoData.results.map((r) => ({
                        name: `${r.name}${r.admin1 ? ", " + r.admin1 : ""}, ${r.country}`,
                        latitude: r.latitude,
                        longitude: r.longitude,
                    }))
                );
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Error fetching suggestions:", error);
            }
            setSuggestions([]);
        }
    }, []);

    const getWeather = useCallback(async (cityName, lat = null, lon = null) => {
        try {
            setLoading(true);
            setWeather(null);
            setSuggestions([]);

            let latitude, longitude, name, country;

            if (lat && lon) {
                // If coordinates are provided, use them directly (for suggestions/geolocation)
                const parts = cityName.split(', ');
                name = parts[0];
                country = parts.pop();
                latitude = lat;
                longitude = lon;
            } else {
                // Otherwise, perform geocoding lookup
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`);
                if (!geoRes.ok) throw new Error("Failed to fetch geocoding data");
                const geoData = await geoRes.json();

                if (!geoData.results) {
                    alert("City not found! Please check the spelling.");
                    setLoading(false);
                    return;
                }
                ({ latitude, longitude, name, country } = geoData.results[0]);
            }
            
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weathercode&hourly=temperature_2m,windspeed_10m,weathercode&timezone=auto&forecast_days=7`
            );
            if (!weatherRes.ok) throw new Error("Failed to fetch weather data");
            const data = await weatherRes.json();

            const fullCityName = `${name}${country ? ', ' + country : ''}`;
            
            setWeather({
                city: fullCityName,
                current: data.current_weather,
                sunrise: data.daily.sunrise[0].split("T")[1],
                sunset: data.daily.sunset[0].split("T")[1],
            });

            // 5-day forecast, skipping the current day if it's already shown in the main card.
            // Slicing from index 0 still includes today's max/min which is fine for the daily component
            setDaily(
                data.daily.time.slice(0, 5).map((day, i) => ({
                    date: new Date(day).toLocaleDateString("en-US", { weekday: "short" }),
                    max: data.daily.temperature_2m_max[i],
                    min: data.daily.temperature_2m_min[i],
                    code: data.daily.weathercode[i],
                }))
            );

            // Next 6 hours
            const currentHourTime = data.current_weather.time.slice(0, 13); // 'YYYY-MM-DDTHH'
            const currentHourIndex = data.hourly.time.findIndex(t => t.startsWith(currentHourTime));
            
            // Safety check: if currentHourIndex is not found, use 0
            const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
            
            setHourly(
                data.hourly.time.slice(startIndex, startIndex + 6).map((time, i) => ({
                    time: time.split("T")[1].slice(0, 5),
                    temp: data.hourly.temperature_2m[startIndex + i],
                    wind: data.hourly.windspeed_10m[startIndex + i],
                    code: data.hourly.weathercode[startIndex + i],
                }))
            );
            
            setCity(fullCityName);
            setSearchInput(name.trim());
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert("Error fetching weather data. Please try again.");
            setLoading(false);
        }
    }, []);

    const handleSearch = useCallback(() => {
        const cityToSearch = searchInput.trim();
        if (cityToSearch) {
            getWeather(cityToSearch);
        } else {
            alert("Please enter a city name!");
        }
    }, [searchInput, getWeather]);

    const handleSuggestionClick = useCallback((suggestion) => {
        setSearchInput(suggestion.name);
        getWeather(suggestion.name, suggestion.latitude, suggestion.longitude);
    }, [getWeather]);

    const fetchCurrentLocationWeather = useCallback(() => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                try {
                    // Reverse geocoding to get a readable location name
                    const geoRes = await fetch(
                        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`
                    ).then((res) => res.json());
                    
                    const locationData = geoRes.results ? geoRes.results[0] : null;

                    const locationCityName = locationData
                        ? `${locationData.name}${locationData.admin1 ? ", " + locationData.admin1 : ""}, ${locationData.country}`
                        : "Your Location";

                    getWeather(locationCityName, lat, lon);
                } catch(e) {
                    console.error("Reverse geocoding error:", e);
                    // Fallback to coordinates if reverse geocoding fails
                    getWeather("Current Location", lat, lon);
                }
            }, (error) => {
                console.error("Geolocation error:", error);
                alert("Geolocation denied or error occurred. Please enable location services.");
                setLoading(false);
            });
        } else {
            alert("Geolocation not supported by your browser!");
        }
    }, [getWeather]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white flex justify-center items-start p-4 sm:p-8 font-sans transition-all duration-1000">
            <div className="w-full max-w-7xl space-y-10">
                
                {/* Search Bar and Controls */}
                <SearchBar 
                    searchInput={searchInput} 
                    setSearchInput={setSearchInput} 
                    suggestions={suggestions} 
                    handleSearch={handleSearch} 
                    handleSuggestionClick={handleSuggestionClick} 
                    fetchCurrentLocationWeather={fetchCurrentLocationWeather}
                />

                {/* Loading spinner */}
                {loading && <AnimatedLoader />}

                {/* Dashboard */}
                {!loading && weather && (
                    <div className="space-y-8 animate-fade-in">
                        <UnitToggle unit={unit} setUnit={setUnit} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500">
                            
                            {/* Clock & Location Component */}
                            <LocationClockCard city={weather.city} time={time} />

                            {/* Current Weather Card Component */}
                            <div className="md:col-span-2">
                                <CurrentWeatherCard 
                                    current={weather.current} 
                                    sunrise={weather.sunrise} 
                                    sunset={weather.sunset} 
                                    unit={unit} 
                                />
                            </div>
                        </div>

                        {/* Forecasts */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Daily Forecast Component */}
                            <DailyForecast daily={daily} unit={unit} />

                            {/* Hourly Forecast Component */}
                            <HourlyForecast hourly={hourly} unit={unit} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;