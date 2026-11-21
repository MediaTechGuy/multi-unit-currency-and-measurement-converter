/* ------------------------------------------------------------------ *
 *  DATA
 *  Linear units: f = how many BASE units in 1 of this unit.
 *  Temperature and currency use their own logic below.
 * ------------------------------------------------------------------ */
const MEASURES = {
  length: { label: "Length", units: {
    mm: { name: "Millimetre", f: 0.001 }, cm: { name: "Centimetre", f: 0.01 },
    m: { name: "Metre", f: 1 }, km: { name: "Kilometre", f: 1000 },
    in: { name: "Inch", f: 0.0254 }, ft: { name: "Foot", f: 0.3048 },
    yd: { name: "Yard", f: 0.9144 }, mi: { name: "Mile", f: 1609.344 },
    nmi: { name: "Nautical mile", f: 1852 } }, def: ["km", "mi"] },
  mass: { label: "Mass", units: {
    mg: { name: "Milligram", f: 1e-6 }, g: { name: "Gram", f: 0.001 },
    kg: { name: "Kilogram", f: 1 }, t: { name: "Tonne", f: 1000 },
    oz: { name: "Ounce", f: 0.028349523125 }, lb: { name: "Pound", f: 0.45359237 },
    st: { name: "Stone", f: 6.35029318 } }, def: ["kg", "lb"] },
  volume: { label: "Volume", units: {
    mL: { name: "Millilitre", f: 0.001 }, L: { name: "Litre", f: 1 },
    m3: { name: "Cubic metre", f: 1000 }, tsp: { name: "Teaspoon (US)", f: 0.00492892159375 },
    tbsp: { name: "Tablespoon (US)", f: 0.01478676478125 }, floz: { name: "Fluid ounce (US)", f: 0.0295735295625 },
    cup: { name: "Cup (US)", f: 0.2365882365 }, pt: { name: "Pint (US)", f: 0.473176473 },
    qt: { name: "Quart (US)", f: 0.946352946 }, gal: { name: "Gallon (US)", f: 3.785411784 } }, def: ["L", "gal"] },
  area: { label: "Area", units: {
    cm2: { name: "Square cm", f: 1e-4 }, m2: { name: "Square metre", f: 1 },
    ha: { name: "Hectare", f: 1e4 }, km2: { name: "Square km", f: 1e6 },
    ft2: { name: "Square foot", f: 0.09290304 }, yd2: { name: "Square yard", f: 0.83612736 },
    ac: { name: "Acre", f: 4046.8564224 }, mi2: { name: "Square mile", f: 2589988.110336 } }, def: ["m2", "ft2"] },
  speed: { label: "Speed", units: {
    "m/s": { name: "Metre/second", f: 1 }, "km/h": { name: "Kilometre/hour", f: 1 / 3.6 },
    mph: { name: "Mile/hour", f: 0.44704 }, kn: { name: "Knot", f: 1852 / 3600 },
    "ft/s": { name: "Foot/second", f: 0.3048 } }, def: ["km/h", "mph"] },
  time: { label: "Time", units: {
    ms: { name: "Millisecond", f: 0.001 }, s: { name: "Second", f: 1 },
    min: { name: "Minute", f: 60 }, h: { name: "Hour", f: 3600 },
    d: { name: "Day", f: 86400 }, wk: { name: "Week", f: 604800 },
    yr: { name: "Year (365.25 d)", f: 31557600 } }, def: ["h", "min"] },
  data: { label: "Data", units: {
    bit: { name: "Bit", f: 0.125 }, B: { name: "Byte", f: 1 },
    KB: { name: "Kilobyte (1000)", f: 1e3 }, MB: { name: "Megabyte (1000²)", f: 1e6 },
    GB: { name: "Gigabyte (1000³)", f: 1e9 }, TB: { name: "Terabyte (1000⁴)", f: 1e12 },
    KiB: { name: "Kibibyte (1024)", f: 1024 }, MiB: { name: "Mebibyte (1024²)", f: 1024 ** 2 },
    GiB: { name: "Gibibyte (1024³)", f: 1024 ** 3 } }, def: ["GB", "MB"] },
  temperature: { label: "Temperature", units: {
    C: { name: "Celsius", toBase: v => v, fromBase: v => v },
    F: { name: "Fahrenheit", toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32 },
    K: { name: "Kelvin", toBase: v => v - 273.15, fromBase: v => v + 273.15 } }, def: ["C", "F"] },
};

const CURRENCIES = {
  USD: "US Dollar", NGN: "Nigerian Naira", EUR: "Euro", GBP: "British Pound",
  GHS: "Ghanaian Cedi", ZAR: "South African Rand", KES: "Kenyan Shilling",
  XOF: "West African CFA", EGP: "Egyptian Pound", CAD: "Canadian Dollar",
  AUD: "Australian Dollar", CHF: "Swiss Franc", JPY: "Japanese Yen",
  CNY: "Chinese Yuan", INR: "Indian Rupee", AED: "UAE Dirham", BRL: "Brazilian Real",
};

// Free, no API key. Tried in order; first one that works wins.
const fromLowercase = j => {
  if (!j || !j.usd) return null;
  const out = { USD: 1 };
  for (const [k, v] of Object.entries(j.usd)) out[k.toUpperCase()] = v;
  return out;
};
const RATE_SOURCES = [
  { name: "open.er-api.com", url: "https://open.er-api.com/v6/latest/USD",
    parse: j => (j && j.result === "success" ? j.rates : null) },
  { name: "jsdelivr currency-api", url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    parse: fromLowercase },
  { name: "pages.dev currency-api", url: "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
    parse: fromLowercase },
];
const CACHE_KEY = "uc_rates_v1";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

/* ------------------------------------------------------------------ *
 *  STATE
 * ------------------------------------------------------------------ */
const state = { cat: "currency", from: "USD", to: "NGN" };
let rates = null;       // { USD: 1, NGN: ..., ... }
let ratesTime = null;   // ms timestamp
let ratesStale = false;
let ratesError = "";

const $ = id => document.getElementById(id);

/* ------------------------------------------------------------------ *
 *  CONVERSION LOGIC
 * ------------------------------------------------------------------ */
function convertMeasure(value, cat, from, to) {
  const units = MEASURES[cat].units;
  const a = units[from], b = units[to];
  if (a.toBase) return b.fromBase(a.toBase(value));
  return (value * a.f) / b.f;
}

// Returns units-of-"to" per 1 unit-of-"from", or null when unavailable
function currencyRate(from, to) {
  const custom = parseFloat($("customRate").value);
  if (custom > 0 && from === state.from && to === state.to) return custom;
  if (!rates || !rates[from] || !rates[to]) return null;
  return rates[to] / rates[from];
}

function convert(value, from, to) {
  if (state.cat === "currency") {
    const r = currencyRate(from, to);
    return r === null ? null : value * r;
  }
  return convertMeasure(value, state.cat, from, to);
}

/* ------------------------------------------------------------------ *
 *  FORMATTING
 * ------------------------------------------------------------------ */
function fmt(n, isCurrency) {
  if (n === null || !isFinite(n)) return "–";
  if (isCurrency) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2, maximumFractionDigits: Math.abs(n) < 1 ? 6 : 2,
    }).format(n);
  }
  if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-6)) return n.toExponential(6);
  return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 10 }).format(n);
}

/* ------------------------------------------------------------------ *
 *  RATES (cache, fetch, graceful failure)
 * ------------------------------------------------------------------ */
function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
}
function writeCache(obj) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch {}
}

async function loadRates(force = false) {
  const cached = readCache();
  if (!force && cached && Date.now() - cached.t < CACHE_TTL) {
    rates = cached.rates; ratesTime = cached.t; ratesStale = false; ratesError = "";
    return;
  }
  // Try each source in order until one works
  let lastErr = "";
  for (const src of RATE_SOURCES) {
    try {
      const res = await fetch(src.url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const parsed = src.parse(await res.json());
      if (!parsed || !parsed.NGN) throw new Error("Unexpected data format");
      rates = parsed; ratesTime = Date.now(); ratesStale = false; ratesError = "";
      writeCache({ t: ratesTime, rates });
      return;
    } catch (e) {
      lastErr = `${src.name}: ${e.message}`;
      console.warn("Rate source failed:", lastErr);
    }
  }
  if (cached) {
    rates = cached.rates; ratesTime = cached.t; ratesStale = true;
    ratesError = "Could not refresh rates (" + lastErr + "). Showing saved rates.";
  } else {
    rates = null;
    ratesError = "Could not load rates (" + lastErr + "). If you opened this inside a preview panel, " +
      "open the file in a normal browser tab. You can still type a custom rate below.";
  }
}

/* ------------------------------------------------------------------ *
 *  UI
 * ------------------------------------------------------------------ */
function unitList() {
  if (state.cat === "currency")
    return Object.entries(CURRENCIES).map(([k, n]) => [k, `${k} · ${n}`]);
  return Object.entries(MEASURES[state.cat].units).map(([k, u]) => [k, `${u.name} (${k})`]);
}

function buildTabs() {
  const tabs = [["currency", "Currency"], ...Object.entries(MEASURES).map(([k, v]) => [k, v.label])];
  $("tabs").innerHTML = "";
  tabs.forEach(([key, label]) => {
    const b = document.createElement("button");
    b.className = "tab" + (key === state.cat ? " active" : "");
    b.textContent = label;
    b.onclick = () => setCategory(key);
    $("tabs").appendChild(b);
  });
}

function fillSelects() {
  const opts = unitList().map(([k, label]) => `<option value="${k}">${label}</option>`).join("");
  $("from").innerHTML = opts; $("to").innerHTML = opts;
  $("from").value = state.from; $("to").value = state.to;
}

function setCategory(cat) {
  state.cat = cat;
  const isC = cat === "currency";
  [state.from, state.to] = isC ? ["USD", "NGN"] : MEASURES[cat].def;
  $("customRate").value = "";
  $("customBox").classList.toggle("hidden", !isC);
  $("refresh").classList.toggle("hidden", !isC);
  buildTabs(); fillSelects(); render();
}

function render() {
  const isC = state.cat === "currency";
  const amount = parseFloat($("amount").value);
  const valid = !isNaN(amount);

  // main result
  const result = valid ? convert(amount, state.from, state.to) : null;
  $("out").textContent = result === null ? "–" : `${fmt(result, isC)} ${state.to}`;

  // rate line
  if (valid || true) {
    const one = convert(1, state.from, state.to);
    $("rateLine").textContent = one === null ? "" : `1 ${state.from} = ${fmt(one, isC)} ${state.to}`;
  }

  // custom rate labels
  $("cFrom").textContent = state.from; $("cTo").textContent = state.to;

  // status line
  const st = $("status");
  if (isC) {
    const usingCustom = parseFloat($("customRate").value) > 0;
    if (ratesError) { st.textContent = ratesError; st.className = "status warn"; }
    else if (ratesTime) {
      st.textContent = (usingCustom ? "Using your custom rate for this pair. " : "") +
        `Rates updated ${new Date(ratesTime).toLocaleString()}. Mid-market rates; real exchange rates differ.`;
      st.className = "status" + (ratesStale ? " warn" : "");
    } else { st.textContent = "Loading rates…"; st.className = "status"; }
  } else { st.textContent = ""; }

  // all-units table
  $("tblHead").textContent = `${amount_label(amount, valid)} in all units`;
  $("tbl").innerHTML = unitList().map(([k]) => {
    const v = valid ? convert(amount, state.from, k) : null;
    return `<tr class="clickable" data-u="${k}"><td>${k}</td><td class="num">${fmt(v, isC)}</td></tr>`;
  }).join("");
  document.querySelectorAll("#tbl tr").forEach(tr => {
    tr.onclick = () => { state.to = tr.dataset.u; $("to").value = state.to; render(); };
  });
}

function amount_label(a, valid) { return valid ? `${fmt(a, false)} ${state.from}` : "All units"; }

/* ------------------------------------------------------------------ *
 *  EVENTS + INIT
 * ------------------------------------------------------------------ */
$("amount").addEventListener("input", render);
$("customRate").addEventListener("input", render);
$("from").addEventListener("change", e => { state.from = e.target.value; $("customRate").value = ""; render(); });
$("to").addEventListener("change", e => { state.to = e.target.value; $("customRate").value = ""; render(); });
$("swap").addEventListener("click", () => {
  [state.from, state.to] = [state.to, state.from];
  $("from").value = state.from; $("to").value = state.to;
  $("customRate").value = ""; render();
});
$("copy").addEventListener("click", async () => {
  const text = $("out").textContent;
  try { await navigator.clipboard.writeText(text); $("copy").textContent = "Copied"; }
  catch { $("copy").textContent = "Copy failed"; }
  setTimeout(() => ($("copy").textContent = "Copy result"), 1200);
});
$("refresh").addEventListener("click", async () => {
  $("refresh").textContent = "Refreshing…";
  await loadRates(true); render();
  $("refresh").textContent = "Refresh rates";
});

(async function init() {
  buildTabs(); fillSelects();
  $("customBox").classList.remove("hidden");
  $("refresh").classList.remove("hidden");
  render();
  await loadRates();
  render();
})();
