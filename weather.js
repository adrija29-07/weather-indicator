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
    weatherDataEl.style.opacity = "0.5";
    
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
        weatherDataEl.style.opacity = "1";
    }
}

function updateUI(data, cityName, country) {
    const current = data.current;
    const daily = data.daily;

    // Update Main Info
    document.getElementById("city-name").textContent = `${cityName}, ${country}`;
    document.getElementById("date-now").textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const weatherInfo = getWeatherInfo(current.weather_code);
    weatherDataEl.querySelector(".icon").innerHTML = `<img src="${weatherInfo.icon}" alt="Weather Icon">`;
    weatherDataEl.querySelector(".temperature").textContent = Math.round(current.temperature_2m);
    weatherDataEl.querySelector(".description").textContent = weatherInfo.description;

    // Update Stats
    document.getElementById("feels-like").textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
    document.getElementById("wind-speed").textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById("visibility").textContent = "High"; // Open-Meteo current doesn't always have visibility easily without extra params

    // Update Forecast
    forecastContainer.innerHTML = daily.time.map((date, index) => {
        if (index === 0) return ''; // Skip today in forecast list
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        const dayInfo = getWeatherInfo(daily.weather_code[index]);
        return `
            <div class="forecast-item">
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

function handleError(error) {
    document.getElementById("city-name").textContent = "Error";
    document.getElementById("date-now").textContent = error.message;
    weatherDataEl.querySelector(".icon").innerHTML = "";
    weatherDataEl.querySelector(".temperature").textContent = "--";
    weatherDataEl.querySelector(".description").textContent = "Please try searching again.";
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
        61: { description: "Slight rain", icon: "10d" },
        63: { description: "Moderate rain", icon: "10d" },
        65: { description: "Heavy rain", icon: "10d" },
        71: { description: "Slight snow fall", icon: "13d" },
        73: { description: "Moderate snow fall", icon: "13d" },
        75: { description: "Heavy snow fall", icon: "13d" },
        95: { description: "Thunderstorm", icon: "11d" },
    };

    const res = mapping[code] || { description: "Unknown", icon: "01d" };
    return {
        description: res.description,
        icon: `https://openweathermap.org/img/wn/${res.icon}@4x.png`
    };
}