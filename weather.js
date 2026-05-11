const weatherDataEl = document.getElementById("weather-data");
const cityInputEl = document.getElementById("city-input");
const formEl = document.querySelector("form");

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
        // Step 1: Geocoding (Get lat/lon from city name)
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityValue)}&count=1&language=en&format=json`
        );
        
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }
        
        const { latitude, longitude, name, country } = geoData.results[0];

        // Step 2: Get Weather Data
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
        );

        if (!weatherResponse.ok) {
            throw new Error("Weather data unavailable");
        }

        const data = await weatherResponse.json();
        const current = data.current;

        const temperature = Math.round(current.temperature_2m);
        const feelsLike = Math.round(current.apparent_temperature);
        const humidity = current.relative_humidity_2m;
        const windSpeed = current.wind_speed_10m;
        const weatherCode = current.weather_code;

        // Map WMO Weather Codes to icons and descriptions
        const weatherInfo = getWeatherInfo(weatherCode);

        // Update main weather info
        weatherDataEl.querySelector(".icon").innerHTML = `
            <img src="${weatherInfo.icon}" alt="Weather Icon">
        `;
        weatherDataEl.querySelector(".temperature").textContent = `${temperature}°C`;
        weatherDataEl.querySelector(".description").textContent = `${weatherInfo.description} in ${name}, ${country}`;

        // Update details grid
        weatherDataEl.querySelector(".details").innerHTML = `
            <div class="detail-item">
                <span class="label">Feels Like</span>
                <span class="value">${feelsLike}°C</span>
            </div>
            <div class="detail-item">
                <span class="label">Humidity</span>
                <span class="value">${humidity}%</span>
            </div>
            <div class="detail-item">
                <span class="label">Wind</span>
                <span class="value">${windSpeed} km/h</span>
            </div>
        `;
        
        weatherDataEl.style.opacity = "1";
        
    } catch (error) {
        weatherDataEl.style.opacity = "1";
        weatherDataEl.querySelector(".icon").innerHTML = "";
        weatherDataEl.querySelector(".temperature").textContent = "";
        weatherDataEl.querySelector(".description").textContent = 
            error.message === "City not found" ? "City not found. Try another!" : "Something went wrong...";
        weatherDataEl.querySelector(".details").innerHTML = "";
    }
}

function getWeatherInfo(code) {
    // Mapping WMO codes to descriptions and OpenWeatherMap-style icons (using a fallback icon set)
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