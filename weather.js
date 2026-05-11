const apikey = "46f80a02ecae410460d59960ded6e1c6";

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
    // Show loading state
    weatherDataEl.style.opacity = "0.5";
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityValue}&appid=${apikey}&units=metric`
        );

        if (!response.ok) {
            throw new Error("City not found");
        }

        const data = await response.json();

        const temperature = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const icon = data.weather[0].icon;
        
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const feelsLike = Math.round(data.main.feels_like);

        // Update main weather info
        weatherDataEl.querySelector(".icon").innerHTML = `
            <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="Weather Icon">
        `;
        weatherDataEl.querySelector(".temperature").textContent = `${temperature}°C`;
        weatherDataEl.querySelector(".description").textContent = description;

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
                <span class="value">${windSpeed} m/s</span>
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