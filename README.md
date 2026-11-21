# Universal Currency & Measurement Converter

A browser-based converter built with plain HTML, CSS and JavaScript. No frameworks, no build step, no installation.

**Author:** Holiness

## Features

- **Currency conversion** across 17 currencies, including NGN, USD, EUR, GBP, GHS, ZAR, KES and XOF, using live exchange rates
- **Measurement conversion** for 8 categories:
  - Length, Mass, Volume, Area
  - Speed, Time, Data (bits to GiB)
  - Temperature (Celsius, Fahrenheit, Kelvin)
- **Swap** button to reverse the conversion direction
- **All-units table** that shows the entered amount in every unit of the category; click any row to set it as the target unit
- **Copy result** button
- **Custom rate override** for currency, useful when the real-world rate differs from the market rate
- **Rate caching** in `localStorage` (refreshes every 12 hours) so the app keeps working when the network drops
- **Responsive layout** with automatic light and dark mode

## Project Structure

```
currency-converter/
├── index.html    Page structure
├── style.css     Styling (light and dark themes)
└── script.js     All logic: unit data, conversion, rate fetching, UI
```

## How to Run

1. Download or clone the folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

An internet connection is needed the first time for live currency rates. Measurement conversions work fully offline.

Opening the file inside an editor preview panel may block network requests. If currency rates do not load, open the file in a normal browser tab.

## How It Works

### Measurements

Every linear unit stores a factor that converts it to a base unit (for example, metres for length). A conversion goes from the source unit to the base unit, then to the target unit:

```
result = value × (factor of source) ÷ (factor of target)
```

Temperature is not linear, so each scale has its own `toBase` and `fromBase` functions that pass through Celsius.

### Currency

Rates are fetched with the `fetch` API from free sources that need no API key. The app tries them in this order and uses the first one that works:

1. `open.er-api.com`
2. `cdn.jsdelivr.net` (fawazahmed0 currency-api)
3. `latest.currency-api.pages.dev` (fawazahmed0 currency-api)

All rates are relative to USD. Converting between two currencies uses:

```
rate = rates[target] ÷ rates[source]
```

If every source fails, the app shows the saved rates from the last successful load (marked as stale). If nothing is saved, it shows an error message with the reason.

## Limitations

- Rates are mid-market rates, not the rates banks or exchange bureaus charge. The Nigerian Naira especially can trade at a different rate in practice. Use the custom rate field to enter a rate you trust.
- Free rate sources may change or go offline without notice. For a production product, use a paid provider through a server-side function so the API key stays private.
- The app is for reference and learning, not for financial transactions.

## Possible Improvements

- Add more currencies and units
- Convert one amount into several currencies at once
- Save favourite conversions
- Turn it into an installable offline app (PWA)
- Add a rate-history chart

## Technologies

HTML5, CSS3 (custom properties, grid), JavaScript (ES6+, `fetch`, `localStorage`, `Intl.NumberFormat`).
