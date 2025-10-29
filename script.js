const ddlUnits = document.querySelector("#ddlUnits");
const ddlDay = document.querySelector("#ddlDay");
const txtSearch = document.querySelector("#txtSearch");
const btnSearch = document.querySelector("#btnSearch");
const dvCityCountry = document.querySelector("#dvCityCountry");
const dvCurrDate = document.querySelector("#dvCurrDate");
const dvCurrTemp = document.querySelector("#dvCurrTemp");
const pFeelsLike = document.querySelector("#pFeelsLike");
const pHumidity = document.querySelector("#pHumidity");
const pWind = document.querySelector("#pWind");
const pPrecipitation = document.querySelector("#pPrecipitation");

let cityName, countryName, weatherData;

const defaultLocation = "Berlin, Germany";

async function getGeoData() {
  let search = txtSearch.value.trim() || defaultLocation;

  const url = `https://nominatim.openstreetmap.org/search?q=${search}&format=jsonv2&addressdetails=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    let lat = result[0].lat;
    let lon = result[0].lon;

    loadLocationData(result);
    getWeatherData(lat, lon);
  } catch (error) {
    console.error(error.message);
  }
}

function loadLocationData(locationData) {
  let location = locationData[0].address;
  cityName = location.city || location.town || location.state;
  countryName = location.country_code.toUpperCase();

  const dateOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "long",
  };

  dvCityCountry.textContent = `${cityName}, ${countryName}`;
  dvCurrDate.textContent = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());
}

async function getWeatherData(lat, lon) {
  let tempUnit = ddlUnits.value === "F" ? "fahrenheit" : "celsius";
  let windUnit = ddlUnits.value === "F" ? "mph" : "kmh";
  let precipUnit = ddlUnits.value === "F" ? "inch" : "mm";

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}`;

  try {
    const response = await fetch(url);
    weatherData = await response.json();

    loadCurrentWeather();
    loadDailyForecast();
    loadHourlyForecast();
  } catch (error) {
    console.error(error.message);
  }
}

function loadCurrentWeather() {
  dvCurrTemp.textContent = Math.round(weatherData.current.temperature_2m);
  pFeelsLike.textContent = Math.round(weatherData.current.apparent_temperature);
  pHumidity.textContent = weatherData.current.relative_humidity_2m;
  pWind.textContent = `${weatherData.current.wind_speed_10m} ${weatherData.current_units.wind_speed_10m.replace("mp/h", "mph")}`;
  pPrecipitation.textContent = `${weatherData.current.precipitation} ${weatherData.current_units.precipitation.replace("inch", "in")}`;
}

function loadDailyForecast() {
  let daily = weatherData.daily;

  for (let i = 0; i < 7; i++) {
    let dvForecastDay = document.querySelector(`#dvForecastDay${i + 1}`);
    while (dvForecastDay.firstChild) dvForecastDay.removeChild(dvForecastDay.firstChild);

    let date = new Date(daily.time[i]);
    let day = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
    let icon = getWeatherCodeName(daily.weather_code[i]);

    addDailyElement("p", "daily__day-title", day, "", dvForecastDay, "afterbegin");
    addDailyElement("img", "daily__day-icon", "", icon, dvForecastDay, "beforeend");

    let tempDiv = document.createElement("div");
    tempDiv.classList.add("daily__day-temps");
    tempDiv.innerHTML = `
      <p class="daily__day-high">${Math.round(daily.temperature_2m_max[i])}°</p>
      <p class="daily__day-low">${Math.round(daily.temperature_2m_min[i])}°</p>
    `;
    dvForecastDay.appendChild(tempDiv);
  }
}

function addDailyElement(tag, className, content, icon, parent, pos) {
  const el = document.createElement(tag);
  el.className = className;
  if (content) el.textContent = content;
  if (tag === "img") {
    el.src = `/images/icon-${icon}.webp`;
    el.alt = icon;
    el.width = 320;
    el.height = 320;
  }
  parent.insertAdjacentElement(pos, el);
}

function loadHourlyForecast() {
  let index = parseInt(ddlDay.value);
  let start = index * 24;
  let end = start + 23;

  let { weather_code, temperature_2m, time } = weatherData.hourly;
  let slot = 1;

  for (let i = start; i <= end; i++) {
    let dv = document.querySelector(`#dvForecastHour${slot}`);
    while (dv.firstChild) dv.firstChild.remove();

    let icon = getWeatherCodeName(weather_code[i]);
    let hour = new Date(time[i]).toLocaleString("en-US", { hour: "numeric", hour12: true });

    addDailyElement("img", "hourly__hour-icon", "", icon, dv, "afterbegin");
    addDailyElement("p", "hourly__hour-time", hour, "", dv, "beforeend");
    addDailyElement("p", "hourly__hour-temp", Math.round(temperature_2m[i]) + "°", "", dv, "beforeend");

    slot++;
  }
}

function getWeatherCodeName(code) {
  const codes = {
    0: "sunny", 1: "partly-cloudy", 2: "partly-cloudy", 3: "overcast",
    45: "fog", 48: "fog", 51: "drizzle", 53: "drizzle", 55: "drizzle",
    56: "drizzle", 57: "drizzle", 61: "rain", 63: "rain", 65: "rain",
    66: "rain", 67: "rain", 80: "rain", 81: "rain", 82: "rain",
    71: "snow", 73: "snow", 75: "snow", 77: "snow", 85: "snow", 86: "snow",
    95: "storm", 96: "storm", 99: "storm"
  };
  return codes[code];
}

function populateDayOfWeek() {
  let date = new Date();
  for (let i = 0; i < 7; i++) {
    let opt = document.createElement("option");
    opt.value = i;
    opt.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    ddlDay.appendChild(opt);
    date.setDate(date.getDate() + 1);
  }
}

populateDayOfWeek();
getGeoData();

btnSearch.addEventListener("click", getGeoData);
ddlUnits.addEventListener("change", getGeoData);
ddlDay.addEventListener("change", loadHourlyForecast);
