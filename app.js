const API_URL = "https://sheetdb.io/api/v1/5s9tjrpao9b8v";

let currentData = [];
let filteredData = [];
let currentPage = 1;
const pageSize = 10;
let selectedRow = null;

function formatNumbers(raw) {
  if (!raw) return { mobiles: [], tnts: [] };
  const numbers = raw.split(",").map(n => n.trim());
  const mobiles = [];
  const tnts = [];
  numbers.forEach(num => {
    const clean = num.replace(/\s+/g, "");
    if (/^\+88\d{11}$/.test(clean)) {
      mobiles.push(clean.slice(3)); // only 11 digits after +88
    } else {
      tnts.push(clean);
    }
  });
  return { mobiles, tnts };
}

function whatsappLink(mobile11) {
  return `https://wa.me/${mobile11}`;
}

async function loadData() {
  const res = await fetch(API_URL);
  currentData = await res.json();
  filteredData = currentData;

  console.log("SheetDB data:", currentData);

  const supervisors = [...new Set(currentData.map(r => {
    const supKey = Object.keys(r).find(k => k.toLowerCase().includes("supervisor"));
    return supKey ? r[supKey] : null;
  }).filter(Boolean))];

  const supervisorSelect = document.getElementById("supervisorSelect");
  supervisors.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    supervisorSelect.appendChild(opt);
  });

  updateKPIs();
  renderPage();
}

function updateKPIs() {
  const totalPortfolio = currentData.reduce((sum, r) => {
    const payoffKey = Object.keys(r).find(k => k.toLowerCase().includes("pay"));
    return sum + (parseFloat(r[payoffKey]) || 0);
  }, 0);
  document.getElementById("kpiPortfolio").textContent = `$${totalPortfolio.toLocaleString()}`;
  document.getElementById("kpiCases").textContent = currentData.length;
  document.getElementById("kpiRecovery").textContent = "68%";
  document.getElementById("kpiContact").textContent = "82%";
}

function renderPage() {
  const list = document.getElementById("account-list");
  list.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filteredData.slice(start, end);

  pageData.forEach((row) => {
    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes("name"));
    const li = document.createElement("li");
    li.className = "p-3 cursor-pointer hover:bg-slate-100";
    li.textContent = row[nameKey] || "Unknown";
    li.onclick = () => showDetails(row);
    list.appendChild(li);
  });

  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${Math.ceil(filteredData.length / pageSize)}`;
}

function showDetails(row) {
  selectedRow = row;
  const nameKey = Object.keys(row).find(k => k.toLowerCase().includes("name"));
  document.getElementById("detailTitle").textContent = row[nameKey] || "Customer";

  const body = document.getElementById("detailBody");
  body.innerHTML = "";

  Object.entries(row).forEach(([key, val]) => {
    const p = document.createElement("p");
    p.textContent = `${key}: ${val}`;
    body.appendChild(p);
  });

  // Phone buttons
  const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes("phone"));
  if (phoneKey && row[phoneKey]) {

    const { mobiles, tnts } = formatNumbers
