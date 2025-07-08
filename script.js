// API Keys
const twelveApiKey = "5138ca38303e4af19b38b08e35f9c629"; // Your TwelveData key
const fmpApiKey = "ouRjyJrZ2NiHvEqVDK5lsvAMh51DFfiw";     // Your FMP key

let chartRef = null;

async function fetchPrice(symbol) {
  try {
    const res = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${twelveApiKey}`);
    const data = await res.json();

    if (data.status === "error" || !data.price) {
      document.getElementById("price").innerHTML = `<p>⚠ Price not available for ${symbol}</p>`;
      return;
    }

    document.getElementById("price").innerHTML = `<h3>Current Price: ₹${data.price}</h3>`;
  } catch (err) {
    document.getElementById("price").innerHTML = `<p>⚠ Error fetching price</p>`;
  }
}

async function fetchFundamentals(symbol) {
  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${fmpApiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("fundamentals").innerHTML = `<p>⚠ Fundamentals not available for ${symbol}</p>`;
      return;
    }

    const company = data[0];

    document.getElementById("fundamentals").innerHTML = `
      <h3>${company.companyName}</h3>
      <p><b>Industry:</b> ${company.industry}</p>
      <p><b>Market Cap:</b> ₹${Number(company.mktCap).toLocaleString()}</p>
      <p><b>PE Ratio:</b> ${company.pe}</p>
      <p><b>ROE:</b> ${company.roe}%</p>
      <p><b>Book Value:</b> ₹${company.price}</p>
      <p><b>Dividend Yield:</b> ${company.lastDiv}%</p>
      <p><b>52 Week Range:</b> ${company.range}</p>
    `;
  } catch (err) {
    document.getElementById("fundamentals").innerHTML = `<p>⚠ Error fetching fundamentals</p>`;
  }
}

async function fetchChart(period = '1month') {
  const symbol = document.getElementById("symbolInput").value.toUpperCase();
  let interval = "1day";
  let outputsize = 30;

  if (period === "6month") outputsize = 180;
  if (period === "1year") outputsize = 365;

  try {
    const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${twelveApiKey}`);
    const json = await res.json();

    if (!json.values) {
      alert("⚠ Chart data not found.");
      return;
    }

    const labels = json.values.map(v => v.datetime).reverse();
    const prices = json.values.map(v => parseFloat(v.close)).reverse();

    const ctx = document.getElementById('stockChart').getContext('2d');
    if (chartRef) chartRef.destroy();

    chartRef = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Price (${period})`,
          data: prices,
          borderColor: '#0061ff',
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { display: true },
          y: { display: true }
        }
      }
    });
  } catch (err) {
    alert("⚠ Error loading chart.");
  }
}

async function fetchAllData() {
  const symbol = document.getElementById("symbolInput").value.toUpperCase();
  if (!symbol) return alert("Please enter a stock symbol like TATAMOTORS.NS or INFY.BSE");
  fetchPrice(symbol);
  fetchFundamentals(symbol);
  fetchChart("1month");
}

function runScreener() {
  document.getElementById("screenerResults").innerHTML = `
    <p>📢 Screener temporarily disabled or not supported for Indian stocks in this version.</p>
  `;
}