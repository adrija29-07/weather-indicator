const weatherDataEl = document.getElementById("weather-data");
const cityInputEl = document.getElementById("city-input");
const formEl = document.querySelector("form");
const forecastContainer = document.getElementById("forecast-container");

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    // Optionally pre-load a default city
    getWeatherData("London");
});

formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const cityValue = cityInputEl.value;
    if (cityValue.trim() !== "") {
        getWeatherData(cityValue);
    }
});

async function getWeatherData(cityValue) {
    weatherDataEl.style.transform = "translateY(10px)";
    weatherDataEl.style.opacity = "0";
    
    setTimeout(async () => {
        try {
            // Step 1: Geocoding
            const geoResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityValue)}&count=1&language=en&format=json`
            );
            const geoData = await geoResponse.json();
            
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error("City not found");
            }
            
            const { latitude, longitude, name, country } = geoData.results[0];
    
            // Step 2: Get Current Weather & Forecast
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
            );
    
            if (!weatherResponse.ok) throw new Error("Weather data unavailable");
    
            const data = await weatherResponse.json();
            updateUI(data, name, country);
            
        } catch (error) {
            handleError(error);
        } finally {
            weatherDataEl.style.transform = "translateY(0)";
            weatherDataEl.style.opacity = "1";
        }
    }, 400);
}

function updateUI(data, cityName, country) {
    const current = data.current;
    const daily = data.daily;
    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;

    // Update Background based on conditions
    updateBackground(temp, code);

    // Update Main Info
    document.getElementById("city-name").textContent = `${cityName}, ${country}`;
    document.getElementById("date-now").textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const weatherInfo = getWeatherInfo(code);
    weatherDataEl.querySelector(".icon").innerHTML = `<img src="${weatherInfo.icon}" alt="Weather Icon">`;
    weatherDataEl.querySelector(".temperature").textContent = temp;
    weatherDataEl.querySelector(".description").textContent = weatherInfo.description;

    // Update Stats
    document.getElementById("feels-like").textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
    document.getElementById("wind-speed").textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById("visibility").textContent = "High";

    // Update Forecast with staggered animation
    forecastContainer.innerHTML = daily.time.map((date, index) => {
        if (index === 0) return ''; // Skip today in forecast list
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        const dayInfo = getWeatherInfo(daily.weather_code[index]);
        const delay = index * 0.1;
        return `
            <div class="forecast-item" style="animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${delay}s; opacity: 0;">
                <span class="forecast-day">${dayName}</span>
                <div class="forecast-icon"><img src="${dayInfo.icon}" alt="icon"></div>
                <div class="forecast-temp">
                    <span class="temp-max">${Math.round(daily.temperature_2m_max[index])}°</span>
                    <span class="temp-min">${Math.round(daily.temperature_2m_min[index])}°</span>
                </div>
            </div>
        `;
    }).join("");
}

function updateBackground(temp, code) {
    const body = document.body;
    let bgUrl = 'https://images.unsplash.com/photo-1534088568595-a066f710b81f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'; // Default
    
    // Rainy/Drizzle codes from Open-Meteo
    const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
    const isRainy = rainCodes.includes(code);

    if (isRainy) {
        // Moody rainy background
        bgUrl = 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1920&q=80';
    } else if (temp >= 30) {
        // Bright sunny background
        bgUrl = 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=1920&q=80';
    } else if (temp < 20) {
        // Cozy cold background
        bgUrl = 'https://images.unsplash.com/photo-1477601263568-180e2c6d046e?auto=format&fit=crop&w=1920&q=80';
    }

    body.style.setProperty('--bg-image', `url('${bgUrl}')`);
}

function handleError(error) {
    document.getElementById("city-name").textContent = "Oops!";
    document.getElementById("date-now").textContent = error.message === "City not found" ? "We couldn't find that city." : "Something went wrong.";
    weatherDataEl.querySelector(".icon").innerHTML = `<div style="font-size: 5rem; opacity: 0.5;">📍</div>`;
    weatherDataEl.querySelector(".temperature").textContent = "--";
    weatherDataEl.querySelector(".description").textContent = "Please check the spelling and try again.";
    forecastContainer.innerHTML = "";
}

function getWeatherInfo(code) {
    const mapping = {
        0: { description: "Clear sky", icon: "01d" },
        1: { description: "Mainly clear", icon: "02d" },
        2: { description: "Partly cloudy", icon: "03d" },
        3: { description: "Overcast", icon: "04d" },
        45: { description: "Foggy", icon: "50d" },
        48: { description: "Depositing rime fog", icon: "50d" },
        51: { description: "Light drizzle", icon: "09d" },
        53: { description: "Moderate drizzle", icon: "09d" },
        55: { description: "Dense drizzle", icon: "09d" },
        56: { description: "Freezing drizzle", icon: "09d" },
        57: { description: "Dense freezing drizzle", icon: "09d" },
        61: { description: "Slight rain", icon: "10d" },
        63: { description: "Moderate rain", icon: "10d" },
        65: { description: "Heavy rain", icon: "10d" },
        66: { description: "Light freezing rain", icon: "10d" },
        67: { description: "Heavy freezing rain", icon: "10d" },
        71: { description: "Slight snow fall", icon: "13d" },
        73: { description: "Moderate snow fall", icon: "13d" },
        75: { description: "Heavy snow fall", icon: "13d" },
        80: { description: "Slight rain showers", icon: "09d" },
        81: { description: "Moderate rain showers", icon: "09d" },
        82: { description: "Violent rain showers", icon: "09d" },
        95: { description: "Thunderstorm", icon: "11d" },
        96: { description: "Thunderstorm with hail", icon: "11d" },
        99: { description: "Heavy thunderstorm with hail", icon: "11d" },
    };

    const res = mapping[code] || { description: "Unknown", icon: "01d" };
    return {
        description: res.description,
        icon: `https://openweathermap.org/img/wn/${res.icon}@4x.png`
    };
}