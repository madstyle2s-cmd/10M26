const API_URL = "https://sheetdb.io/api/v1/8gj9zo6f4dmjc";

let currentData = [];
let filteredData = [];
let currentPage = 1;
const pageSize = 10;
let selectedRow = null;

// Split phone numbers into mobiles and TNT
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

// Load data
async function loadData() {
  const res = await fetch(API_URL + "?sheet=MainDB");
  currentData = await res.json();
  filteredData = currentData;

  console.log("SheetDB data:", currentData);

  // Populate supervisor filter
  const supervisors = [...new Set(currentData.map(r => r["Supervisor Name"]).filter(Boolean))];
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

// KPI calculations
function updateKPIs() {
  const totalPortfolio = currentData.reduce((sum, r) => {
    return sum + (parseFloat(r["Pay off"]) || 0);
  }, 0);
  document.getElementById("kpiPortfolio").textContent = `$${totalPortfolio.toLocaleString()}`;
  document.getElementById("kpiCases").textContent = currentData.length;
  document.getElementById("kpiRecovery").textContent = "68%";
  document.getElementById("kpiContact").textContent = "82%";
}

// Render list of names
function renderPage() {
  const list = document.getElementById("account-list");
  list.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filteredData.slice(start, end);

  pageData.forEach((row) => {
    const li = document.createElement("li");
    li.className = "p-3 cursor-pointer hover:bg-slate-100";
    li.textContent = row["A/C Name"] || "Unknown";
    li.onclick = () => showDetails(row);
    list.appendChild(li);
  });

  document.getElementById("pageInfo").textContent =
    `Page ${currentPage} of ${Math.ceil(filteredData.length / pageSize)}`;
}

// Show details in modal
function showDetails(row) {
  selectedRow = row;
  document.getElementById("detailTitle").textContent = row["A/C Name"];

  const body = document.getElementById("detailBody");
  body.innerHTML = "";

  Object.entries(row).forEach(([key, val]) => {
    const p = document.createElement("p");
    p.textContent = `${key}: ${val}`;
    body.appendChild(p);
  });

  // Phone buttons
  if (row["Customer Phone"]) {
    const { mobiles, tnts } = formatNumbers(row["Customer Phone"]);
    mobiles.forEach(m => {
      const div = document.createElement("div");
      div.innerHTML = `
        <a href="tel:+88${m}" class="bg-green-600 text-white px-2 py-1 rounded mr-2">Call</a>
        <a href="${whatsappLink(m)}" target="_blank" class="bg-green-500 text-white px-2 py-1 rounded">WhatsApp</a>
      `;
      body.appendChild(div);
    });
    tnts.forEach(t => {
      const p = document.createElement("p");
      p.textContent = `TNT: ${t}`;
      body.appendChild(p);
    });
  }

  document.getElementById("detailModal").classList.remove("hidden");
}

// Save edits back to SheetDB using Customer ID
async function saveEdits() {
  if (!selectedRow) return;
  const remarks = document.getElementById("modalRemarks").value;
  const paid = document.getElementById("modalPaid").value;
  const today = new Date().toISOString().split("T")[0];

  const idVal = selectedRow["Customer ID"];

  const payload = {
    REMARKS: remarks,
    Req: paid,
    LastUpdated: today,
    EditedOn: today,
    RemarksDate: today
  };

  await fetch(`${API_URL}/search?Customer ID=${idVal}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  alert("Saved successfully!");
  document.getElementById("detailModal").classList.add("hidden");
  loadData();
}

// Event listeners
document.getElementById("closeModal").onclick = () => {
  document.getElementById("detailModal").classList.add("hidden");
};
document.getElementById("saveBtn").onclick = saveEdits;
document.getElementById("prevBtn").onclick = () => {
  if (currentPage > 1) { currentPage--; renderPage(); }
};
document.getElementById("nextBtn").onclick = () => {
  if (currentPage < Math.ceil(filteredData.length / pageSize)) { currentPage++; renderPage(); }
};

// Init
loadData();