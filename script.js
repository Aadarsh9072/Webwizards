const twelveApiKey = "5138ca38303e4af19b38b08e35f9c629";
const fmpApiKey = "ouRjyJrZ2NiHvEqVDK5lsvAMh51DFfiw";

let chartRef = null;

function isIndianStock(symbol) {
  return symbol.endsWith(".NS") || symbol.endsWith(".BSE");
}

async function fetchPrice(symbol) {
  try {
    const res = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${twelveApiKey}`);
    const data = await res.json();
    if (data.status === "error" || !data.price) {
      document.getElementById("price").innerHTML = `<p>⚠ Price not available for ${symbol}</p>`;
      return;
    }
    document.getElementById("price").innerHTML = `<h3>Current Price: ₹${data.price}</h3>`;
  } catch {
    document.getElementById("price").innerHTML = `<p>⚠ Error fetching price</p>`;
  }
}

async function fetchFundamentals(symbol) {
  if (isIndianStock(symbol)) {
    document.getElementById("fundamentals").innerHTML = `
      <p>⚠ Fundamentals not available for Indian stocks in free version.</p>
    `;
    return;
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${fmpApiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("fundamentals").innerHTML = `<p>⚠ No fundamentals found for ${symbol}</p>`;
      return;
    }

    const company = data[0];
    document.getElementById("fundamentals").innerHTML = `
      <h3>${company.companyName}</h3>
      <p><b>Industry:</b> ${company.industry}</p>
      <p><b>Exchange:</b> ${company.exchange}</p>
      <p><b>Country:</b> ${company.country}</p>
      <p><b>Market Cap:</b> ₹${Number(company.mktCap).toLocaleString()}</p>
      <p><b>PE Ratio:</b> ${company.priceEarningsRatio ?? 'N/A'}</p>
      <p><b>ROE:</b> ${company.returnOnEquityTTM ?? 'N/A'}%</p>
      <p><b>EPS:</b> ₹${company.eps ?? 'N/A'}</p>
      <p><b>Dividend Yield:</b> ${company.lastDiv ?? 'N/A'}%</p>
      <p><b>52 Week Range:</b> ${company.range ?? 'N/A'}</p>
      <p><b>IPO Date:</b> ${company.ipoDate ?? 'N/A'}</p>
      <p><b>CEO:</b> ${company.ceo ?? 'N/A'}</p>
      <p><b>Website:</b> <a href="${company.website}" target="_blank">${company.website}</a></p>
      <p style="margin-top: 10px;"><b>Description:</b><br>${company.description ?? 'N/A'}</p>
    `;
  } catch {
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
  } catch {
    alert("⚠ Error loading chart.");
  }
}

async function fetchAllData() {
  const symbol = document.getElementById("symbolInput").value.toUpperCase();
  if (!symbol) return alert("Please enter a stock symbol like TATAMOTORS.NS or GOOGL");

  fetchPrice(symbol);
  fetchFundamentals(symbol);
  fetchChart("1month");
  if (!isIndianStock(symbol)){
    fetchPeerComparison(symbol);
  }
  localStorage.setItem("lastSearchedSymbol", symbol);
  localStorage.setItem("isIndianStock", isIndianStock(symbol));
}

// 🧠 Symbol Suggestion
async function suggestSymbols() {
  const input = document.getElementById("symbolInput").value.trim().toUpperCase();
  const suggestionBox = document.getElementById("suggestions");

  if (input.length < 2) {
    suggestionBox.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${input}&limit=5&apikey=${fmpApiKey}`);
    const data = await res.json();

    if (data.length === 0) {
      suggestionBox.innerHTML = `<p>No suggestions found</p>`;
      return;
    }

    suggestionBox.innerHTML = data.map(stock => `
      <div class="suggestion-item" onclick="selectSymbol('${stock.symbol}')">
        ${stock.symbol} - ${stock.name}
      </div>
    `).join("");
  } catch (err) {
    suggestionBox.innerHTML = `<p>⚠ Error loading suggestions</p>`;
  }
}

function selectSymbol(symbol) {
  document.getElementById("symbolInput").value = symbol;
  document.getElementById("suggestions").innerHTML = "";
  fetchAllData();
}

// Toggle Dropdown
function toggleDropdown() {
  document.getElementById("dropdownMenu").classList.toggle("show");
}
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    document.querySelectorAll(".dropdown-content.show").forEach(d => d.classList.remove('show'));
  }
}

async function runScreener() {
  const minCap = Number(document.getElementById("minMarketCap").value || 0);
  const minDiv = Number(document.getElementById("minDividend").value || 0);
  const resultBox = document.getElementById("screenerResults");

  resultBox.innerHTML = `<p>🔄 Loading...</p>`;

  try {
    const res = await fetch(`https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=${minCap}&dividendMoreThan=${minDiv}&limit=10&exchange=NASDAQ&apikey=${fmpApiKey}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      resultBox.innerHTML = `<p>⚠ No stocks found matching your criteria.</p>`;
      return;
    }

    resultBox.innerHTML = `
      <table border="1" style="width:100%; border-collapse: collapse; text-align:center;">
        <tr style="background-color:#f0f0f0;">
          <th>Symbol</th>
          <th>Company</th>
          <th>Market Cap</th>
          <th>Dividend Yield</th>
        </tr>
        ${data.map(stock => `
          <tr>
            <td>${stock.symbol}</td>
            <td>${stock.companyName ?? 'N/A'}</td>
            <td>₹${Number(stock.marketCap).toLocaleString()}</td>
            <td>${stock.lastDiv ?? 'N/A'}%</td>
          </tr>
        `).join("")}
      </table>
    `;
  } catch (err) {
    resultBox.innerHTML = `<p>⚠ Error fetching screener data</p>`;
    console.error("Screener error:", err);
  }
}

// Dark Mode
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// 🔄 Trigger suggestions on typing
window.onload = () => {
  document.getElementById("symbolInput").addEventListener("input", suggestSymbols);
}