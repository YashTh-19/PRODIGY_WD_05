const API_KEY = 'd05b9d337f7b48edb9b100828250707'; 

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const weatherIcon = document.getElementById('weather-icon');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const themeToggle = document.getElementById('theme-toggle');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

// State
let currentUnit = 'celsius';
let currentData = null;

// Initialize
checkTimeForTheme();
getWeatherData('London');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

locationBtn.addEventListener('click', getLocationWeather);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'celsius') {
        currentUnit = 'celsius';
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
        updateTemperatureDisplay();
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'fahrenheit') {
        currentUnit = 'fahrenheit';
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
        updateTemperatureDisplay();
    }
});

themeToggle.addEventListener('click', toggleTheme);

// Weather Functions
async function getWeatherData(city) {
    try {
        showLoading();
        hideError();
        
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=no&alerts=no`
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'City not found');
        }
        
        const data = await response.json();
        currentData = data;
        displayWeatherData(data);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function getLocationWeather() {
    if (navigator.geolocation) {
        try {
            showLoading();
            hideError();
            
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const { latitude, longitude } = position.coords;
            
            const response = await fetch(
                `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=5&aqi=no&alerts=no`
            );
            
            const data = await response.json();
            currentData = data;
            displayWeatherData(data);
            
        } catch (error) {
            showError('Unable to retrieve your location');
        } finally {
            hideLoading();
        }
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

function displayWeatherData(data) {
    // Current weather
    const current = data.current;
    const location = data.location;
    
    cityName.textContent = `${location.name}, ${location.country}`;
    temperature.dataset.celsius = Math.round(current.temp_c);
    temperature.dataset.fahrenheit = Math.round(current.temp_f);
    updateTemperatureDisplay();
    
    weatherDescription.textContent = current.condition.text;
    
    // Fixed icon URL with error handling
    const iconUrl = `https:${current.condition.icon}`;
    weatherIcon.src = iconUrl;
    weatherIcon.alt = current.condition.text;
    weatherIcon.onerror = function() {
        this.src = 'https://cdn.weatherapi.com/weather/64x64/day/116.png';
    };
    
    humidity.textContent = `${current.humidity}%`;
    windSpeed.textContent = `${current.wind_kph} km/h`;
    pressure.textContent = `${current.pressure_mb} hPa`;
    
    // Forecast
    forecastContainer.innerHTML = '';
    
    data.forecast.forecastday.slice(0, 5).forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        // Fixed forecast icon URL
        const forecastIconUrl = `https:${day.day.condition.icon}`;
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">
                <img src="${forecastIconUrl}" alt="${day.day.condition.text}"
                     onerror="this.src='https://cdn.weatherapi.com/weather/64x64/day/116.png'">
            </div>
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(day.day.maxtemp_c)}°</span>
                <span class="min-temp">${Math.round(day.day.mintemp_c)}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
    
    cityInput.value = '';
}

function updateTemperatureDisplay() {
    if (!currentData) return;
    
    if (currentUnit === 'celsius') {
        temperature.textContent = temperature.dataset.celsius;
    } else {
        temperature.textContent = temperature.dataset.fahrenheit;
    }
}

// Theme Functions
function toggleTheme() {
    document.body.classList.toggle('day-mode');
    document.body.classList.toggle('night-mode');
    
    // Save preference to localStorage
    const isNightMode = document.body.classList.contains('night-mode');
    localStorage.setItem('nightMode', isNightMode);
}

function checkTimeForTheme() {
    // Check for saved preference first
    const savedMode = localStorage.getItem('nightMode');
    
    if (savedMode !== null) {
        if (savedMode === 'true') {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.add('day-mode');
        }
    } else {
        // No preference saved - check time
        const hours = new Date().getHours();
        const isNightTime = hours < 6 || hours >= 18;
        
        if (isNightTime) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.add('day-mode');
        }
    }
}

// UI Helpers
function showLoading() {
    loadingSpinner.classList.add('active');
}

function hideLoading() {
    loadingSpinner.classList.remove('active');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('active');
}