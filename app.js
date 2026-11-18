// ============================================================================
// SMART GROCERY & BUDGET SAFETY TRACKER - APPLICATION CORE LOGIC
// ============================================================================

import { 
  listenToShoppingSession, 
  saveSessionData, 
  getBackupFromLocalStorage,
  createDefaultSessionData,
  saveCustomFirebaseConfig,
  activeFirebaseConfig,
  isConfigPlaceholder
} from "./firebase-config.js";

// ============================================================================
// STATE APLIKASI
// ============================================================================
const state = {
  sessionId: localStorage.getItem("active_grocery_session_id") || "sesi-lotte-mart-puri",
  storeLocation: "Lotte Mart Grocery - Puri Indah",
  shoppingDate: new Date().toISOString().split("T")[0],
  walletLimit: 500000,
  items: [],
  totalSpent: 0,
  activeCategory: "ALL",
  activeTab: "paneBelanja",
  isMuted: false
};

// ============================================================================
// AUDIO FEEDBACK SYNTHESIZER (WEB AUDIO API - 100% OFFLINE)
// ============================================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Suara "Ting" saat item dimasukkan ke troli
function playCartSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

// Suara "Warning Buzz" saat overbudget
function playOverbudgetAlarm() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(196, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

// ============================================================================
// FORMATTER HELPERS
// ============================================================================
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number || 0);
}

// ============================================================================
// DOM ELEMENTS SELECTION
// ============================================================================
const elements = {
  storeSelector: document.getElementById("storeSelector"),
  shoppingDateInput: document.getElementById("shoppingDateInput"),
  syncBadgeBtn: document.getElementById("syncBadgeBtn"),
  syncStatusLabel: document.getElementById("syncStatusLabel"),
  
  // Budget Safety Card
  budgetSafetyCard: document.getElementById("budgetSafetyCard"),
  displayTotalSpent: document.getElementById("displayTotalSpent"),
  displayWalletLimit: document.getElementById("displayWalletLimit"),
  openBudgetLimitBtn: document.getElementById("openBudgetLimitBtn"),
  budgetProgressFill: document.getElementById("budgetProgressFill"),
  displayRemaining: document.getElementById("displayRemaining"),
  remainingVal: document.getElementById("remainingVal"),
  spentPercent: document.getElementById("spentPercent"),
  budgetStatusPill: document.getElementById("budgetStatusPill"),
  overbudgetAlert: document.getElementById("overbudgetAlert"),

  // Items List
  groceryItemList: document.getElementById("groceryItemList"),
  itemSummaryCount: document.getElementById("itemSummaryCount"),
  countInCart: document.getElementById("countInCart"),
  countTotal: document.getElementById("countTotal"),
  catChipsContainer: document.getElementById("catChipsContainer"),
  openAddItemModalBtn: document.getElementById("openAddItemModalBtn"),

  // Tabs & Nav
  bottomNavBar: document.getElementById("bottomNavBar"),
  paneBelanja: document.getElementById("paneBelanja"),
  paneRiwayat: document.getElementById("paneRiwayat"),
  paneAnggaran: document.getElementById("paneAnggaran"),
  categoryBreakdownList: document.getElementById("categoryBreakdownList"),
  historyListContainer: document.getElementById("historyListContainer"),
  saveSessionToHistoryBtn: document.getElementById("saveSessionToHistoryBtn"),

  // Budget Settings Tab
  inputWalletLimitSettings: document.getElementById("inputWalletLimitSettings"),
  btnSaveLimitSettings: document.getElementById("btnSaveLimitSettings"),

  // Modals
  itemModalOverlay: document.getElementById("itemModalOverlay"),
  closeItemModalBtn: document.getElementById("closeItemModalBtn"),
  itemForm: document.getElementById("itemForm"),
  editItemId: document.getElementById("editItemId"),
  modalTitle: document.getElementById("modalTitle"),
  inputItemName: document.getElementById("inputItemName"),
  inputItemCategory: document.getElementById("inputItemCategory"),
  inputItemUnit: document.getElementById("inputItemUnit"),
  inputItemPrice: document.getElementById("inputItemPrice"),
  inputItemQty: document.getElementById("inputItemQty"),
  inputItemNotes: document.getElementById("inputItemNotes"),

  // Sync Modal
  syncModalOverlay: document.getElementById("syncModalOverlay"),
  closeSyncModalBtn: document.getElementById("closeSyncModalBtn"),
  inputSessionId: document.getElementById("inputSessionId"),
  syncDetailsBox: document.getElementById("syncDetailsBox"),
  inputCustomFirebaseJson: document.getElementById("inputCustomFirebaseJson"),
  btnApplySessionSettings: document.getElementById("btnApplySessionSettings")
};

// ============================================================================
// KALKULASI & LOGIKA ANGGARAN (BUDGET SAFETY)
// ============================================================================
function calculateBudgetSafety() {
  // Total belanja dihitung dari seluruh item yang ada di daftar belanja aktif
  // (atau item yang sudah diambil & masuk troli)
  const total = state.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const checkedTotal = state.items
    .filter(i => i.isChecked)
    .reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);

  state.totalSpent = total;
  const limit = state.walletLimit || 500000;
  const percentage = limit > 0 ? (total / limit) * 100 : 0;
  const remaining = limit - total;

  // Update UI Elements
  elements.displayTotalSpent.innerText = formatRupiah(total);
  elements.displayWalletLimit.innerText = formatRupiah(limit);
  elements.remainingVal.innerText = formatRupiah(remaining);
  elements.spentPercent.innerText = `${Math.round(percentage)}%`;

  // Update Progress Bar
  const visualWidth = Math.min(percentage, 100);
  elements.budgetProgressFill.style.width = `${visualWidth}%`;

  // Status Indikator: Hijau (<75%), Kuning (75-99%), Merah (>=100%)
  elements.budgetSafetyCard.classList.remove("safe", "warning", "danger");

  if (percentage < 75) {
    elements.budgetSafetyCard.classList.add("safe");
    elements.budgetStatusPill.innerText = "Aman (< 75%)";
    elements.overbudgetAlert.style.display = "none";
  } else if (percentage < 100) {
    elements.budgetSafetyCard.classList.add("warning");
    elements.budgetStatusPill.innerText = "Waspada (75%-99%)";
    elements.overbudgetAlert.style.display = "none";
  } else {
    elements.budgetSafetyCard.classList.add("danger");
    elements.budgetStatusPill.innerText = "🚨 OVERBUDGET";
    elements.overbudgetAlert.style.display = "flex";
    playOverbudgetAlarm();
  }

  // Summary Count
  const totalCount = state.items.length;
  const checkedCount = state.items.filter(i => i.isChecked).length;
  elements.countInCart.innerText = checkedCount;
  elements.countTotal.innerText = totalCount;
  elements.itemSummaryCount.innerHTML = `<span>${checkedCount}</span> / <span>${totalCount}</span> masuk troli (<b>${formatRupiah(checkedTotal)}</b>)`;

  // Update Breakdown Tab Anggaran
  renderCategoryBreakdown();
}

// ============================================================================
// RENDER ITEMS LIST (MOBILE CARD ITEM - BUKAN TABEL DESKTOP MELEBAR)
// ============================================================================
function renderGroceryItems() {
  const container = elements.groceryItemList;
  container.innerHTML = "";

  const filteredItems = state.activeCategory === "ALL" 
    ? state.items 
    : state.items.filter(i => i.category === state.activeCategory);

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <div class="empty-title">Troli Masih Kosong</div>
        <p class="empty-desc">Tekan tombol "+ Tambah Barang" untuk memasukkan belanjaan ke troli.</p>
      </div>
    `;
    return;
  }

  filteredItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = `grocery-item-card ${item.isChecked ? "checked" : ""}`;
    card.dataset.id = item.id;

    const subtotal = Number(item.price) * Number(item.qty);

    card.innerHTML = `
      <!-- Checkbox Bulat Besar (Ramah Jempol) -->
      <button class="item-check-btn" title="Tandai sudah di troli" data-action="toggle-check">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </button>

      <!-- Informasi Utama Barang -->
      <div class="item-content" data-action="edit-item">
        <div class="item-badge-row">
          <span class="item-cat-tag">${item.category || "Lain-lain"}</span>
          ${item.notes ? `<span class="item-notes">🏷️ ${escapeHtml(item.notes)}</span>` : ""}
        </div>
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-price-row">
          <span class="item-subtotal">${formatRupiah(subtotal)}</span>
          <span class="item-unit-calc">(${formatRupiah(item.price)}/${item.unit || "pcs"})</span>
        </div>
      </div>

      <!-- Stepper Kuantitas [-] Qty [+] -->
      <div class="stepper-group">
        <button class="stepper-btn" data-action="decrease-qty" title="Kurangi">−</button>
        <span class="stepper-val">${item.qty}</span>
        <button class="stepper-btn" data-action="increase-qty" title="Tambah">+</button>
      </div>

      <!-- Tombol Hapus -->
      <button class="item-delete-btn" data-action="delete-item" title="Hapus dari troli">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    `;

    // Event delegation handling per card
    card.addEventListener("click", (e) => {
      const targetBtn = e.target.closest("[data-action]");
      if (!targetBtn) return;
      const action = targetBtn.dataset.action;

      if (action === "toggle-check") {
        item.isChecked = !item.isChecked;
        playCartSound();
        commitStateChange();
      } else if (action === "increase-qty") {
        item.qty = (Number(item.qty) || 1) + 1;
        commitStateChange();
      } else if (action === "decrease-qty") {
        if (item.qty > 1) {
          item.qty -= 1;
          commitStateChange();
        } else {
          confirmDeleteItem(item.id);
        }
      } else if (action === "delete-item") {
        confirmDeleteItem(item.id);
      } else if (action === "edit-item") {
        openEditItemModal(item);
      }
    });

    container.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function confirmDeleteItem(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  if (confirm(`Hapus "${item.name}" dari keranjang troli?`)) {
    state.items = state.items.filter(i => i.id !== itemId);
    commitStateChange();
  }
}

// ============================================================================
// COMMIT STATE CHANGE (SINKRONISASI FIRESTORE & LOCALSTORAGE)
// ============================================================================
function commitStateChange() {
  calculateBudgetSafety();
  renderGroceryItems();

  const payload = {
    sessionId: state.sessionId,
    storeLocation: state.storeLocation,
    shoppingDate: state.shoppingDate,
    walletLimit: state.walletLimit,
    totalSpent: state.totalSpent,
    items: state.items
  };

  saveSessionData(state.sessionId, payload);
}

// ============================================================================
// RENDER BREAKDOWN KATEGORI (TAB ANGGARAN)
// ============================================================================
function renderCategoryBreakdown() {
  const container = elements.categoryBreakdownList;
  if (!container) return;
  container.innerHTML = "";

  const catMap = {};
  state.items.forEach(item => {
    const cat = item.category || "Lain-lain";
    const sub = Number(item.price) * Number(item.qty);
    catMap[cat] = (catMap[cat] || 0) + sub;
  });

  const total = state.totalSpent || 1;

  Object.keys(catMap).forEach(cat => {
    const val = catMap[cat];
    const pct = Math.round((val / total) * 100);

    const row = document.createElement("div");
    row.className = "category-breakdown-row";
    row.innerHTML = `
      <div class="cat-breakdown-labels">
        <span style="font-weight:600; color:#fff;">${cat}</span>
        <span style="color:var(--text-muted);">${formatRupiah(val)} (${pct}%)</span>
      </div>
      <div class="cat-breakdown-bar">
        <div class="cat-breakdown-fill" style="width: ${pct}%;"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

// ============================================================================
// RENDER RIWAYAT TOKO (TAB RIWAYAT)
// ============================================================================
function loadHistoryReceipts() {
  const container = elements.historyListContainer;
  if (!container) return;
  container.innerHTML = "";

  let historyData = [];
  try {
    const raw = localStorage.getItem("grocery_history_receipts");
    if (raw) historyData = JSON.parse(raw);
  } catch (e) {}

  if (historyData.length === 0) {
    // Berikan contoh riwayat belanja bulan sebelumnya jika kosong
    historyData = [
      {
        id: "hist_1",
        store: "Lotte Mart Grocery - Puri Indah",
        date: "2026-10-14",
        total: 485000,
        itemCount: 12,
        savings: "Hemat Rp 35.000 dengan promo karton"
      },
      {
        id: "hist_2",
        store: "Super Indo Intercon",
        date: "2026-09-28",
        total: 390000,
        itemCount: 9,
        savings: "Promo daging ayam segar"
      }
    ];
    localStorage.setItem("grocery_history_receipts", JSON.stringify(historyData));
  }

  historyData.forEach(h => {
    const el = document.createElement("div");
    el.className = "history-card";
    el.innerHTML = `
      <div class="history-header">
        <span class="history-store">🏪 ${escapeHtml(h.store)}</span>
        <span class="history-date">${h.date}</span>
      </div>
      <div class="history-stats">
        <div class="history-stat-box">
          <div class="history-stat-label">Total Belanja</div>
          <div class="history-stat-val">${formatRupiah(h.total)}</div>
        </div>
        <div class="history-stat-box">
          <div class="history-stat-label">Jumlah Barang</div>
          <div class="history-stat-val" style="color:#fff;">${h.itemCount} items</div>
        </div>
      </div>
      <p style="font-size:11px; color:#34d399;">💡 ${escapeHtml(h.savings || "Belanja bulanan terkendali")}</p>
    `;
    container.appendChild(el);
  });
}

function saveCurrentSessionToHistory() {
  if (state.items.length === 0) {
    alert("Troli masih kosong. Tambahkan barang sebelum menyelesaikan sesi.");
    return;
  }

  const receipt = {
    id: `receipt_${Date.now()}`,
    store: state.storeLocation,
    date: state.shoppingDate,
    total: state.totalSpent,
    itemCount: state.items.length,
    savings: `Selesai belanja di ${state.storeLocation}`
  };

  let historyData = [];
  try {
    const raw = localStorage.getItem("grocery_history_receipts");
    if (raw) historyData = JSON.parse(raw);
  } catch (e) {}

  historyData.unshift(receipt);
  localStorage.setItem("grocery_history_receipts", JSON.stringify(historyData));
  alert(`✅ Sesi belanja berhasil disimpan ke Riwayat Toko! Total: ${formatRupiah(state.totalSpent)}`);
  loadHistoryReceipts();
}

// ============================================================================
// MODAL INTERACTIONS
// ============================================================================
function openAddItemModal() {
  elements.modalTitle.innerText = "Tambah Barang Troli";
  elements.editItemId.value = "";
  elements.itemForm.reset();
  elements.inputItemQty.value = "1";
  elements.itemModalOverlay.classList.add("open");
  setTimeout(() => elements.inputItemName.focus(), 200);
}

function openEditItemModal(item) {
  elements.modalTitle.innerText = "Edit Barang Troli";
  elements.editItemId.value = item.id;
  elements.inputItemName.value = item.name;
  elements.inputItemCategory.value = item.category || "Kebutuhan Pokok";
  elements.inputItemUnit.value = item.unit || "pcs";
  elements.inputItemPrice.value = item.price;
  elements.inputItemQty.value = item.qty;
  elements.inputItemNotes.value = item.notes || "";
  elements.itemModalOverlay.classList.add("open");
}

function closeItemModal() {
  elements.itemModalOverlay.classList.remove("open");
}

// Submit Form Tambah/Edit Barang
elements.itemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const editId = elements.editItemId.value;
  const name = elements.inputItemName.value.trim();
  const category = elements.inputItemCategory.value;
  const unit = elements.inputItemUnit.value;
  const price = Number(elements.inputItemPrice.value) || 0;
  const qty = Number(elements.inputItemQty.value) || 1;
  const notes = elements.inputItemNotes.value.trim();

  if (!name || price <= 0) {
    alert("Harap isi nama barang dan harga yang valid.");
    return;
  }

  if (editId) {
    // Mode Edit
    const item = state.items.find(i => i.id === editId);
    if (item) {
      item.name = name;
      item.category = category;
      item.unit = unit;
      item.price = price;
      item.qty = qty;
      item.notes = notes;
    }
  } else {
    // Mode Tambah Baru
    const newItem = {
      id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      category,
      unit,
      price,
      qty,
      notes,
      isChecked: true // Otomatis masuk troli
    };
    state.items.push(newItem);
    playCartSound();
  }

  closeItemModal();
  commitStateChange();
});

// Shortcut Tambah Harga Cepat (+5k, +10k, dll)
document.querySelectorAll("[data-add-price]").forEach(btn => {
  btn.addEventListener("click", () => {
    const addVal = Number(btn.dataset.addPrice) || 0;
    const current = Number(elements.inputItemPrice.value) || 0;
    elements.inputItemPrice.value = current + addVal;
  });
});

// ============================================================================
// HEADER SELECTOR EVENTS
// ============================================================================
elements.storeSelector.addEventListener("change", (e) => {
  state.storeLocation = e.target.value;
  commitStateChange();
});

elements.shoppingDateInput.addEventListener("change", (e) => {
  state.shoppingDate = e.target.value;
  commitStateChange();
});

// Category Chips Filtering
elements.catChipsContainer.addEventListener("click", (e) => {
  const chip = e.target.closest(".cat-chip");
  if (!chip) return;
  document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  state.activeCategory = chip.dataset.cat;
  renderGroceryItems();
});

// Tab Navigation
elements.bottomNavBar.addEventListener("click", (e) => {
  const tabBtn = e.target.closest(".nav-tab-btn");
  if (!tabBtn) return;
  const targetPaneId = tabBtn.dataset.tab;

  document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
  tabBtn.classList.add("active");

  elements.paneBelanja.style.display = targetPaneId === "paneBelanja" ? "block" : "none";
  elements.paneRiwayat.style.display = targetPaneId === "paneRiwayat" ? "block" : "none";
  elements.paneAnggaran.style.display = targetPaneId === "paneAnggaran" ? "block" : "none";

  if (targetPaneId === "paneRiwayat") loadHistoryReceipts();
  if (targetPaneId === "paneAnggaran") renderCategoryBreakdown();
});

// Budget Settings Handlers
elements.btnSaveLimitSettings.addEventListener("click", () => {
  const newLimit = Number(elements.inputWalletLimitSettings.value);
  if (newLimit > 0) {
    state.walletLimit = newLimit;
    commitStateChange();
    alert(`✅ Pagu anggaran berhasil diatur ke ${formatRupiah(newLimit)}`);
  }
});

document.querySelectorAll("[data-set-limit]").forEach(btn => {
  btn.addEventListener("click", () => {
    const val = Number(btn.dataset.setLimit);
    elements.inputWalletLimitSettings.value = val;
    state.walletLimit = val;
    commitStateChange();
  });
});

// Open modal triggers
elements.openAddItemModalBtn.addEventListener("click", openAddItemModal);
elements.closeItemModalBtn.addEventListener("click", closeItemModal);
elements.openBudgetLimitBtn.addEventListener("click", () => {
  // Buka tab anggaran
  document.querySelector('[data-tab="paneAnggaran"]').click();
});
elements.saveSessionToHistoryBtn.addEventListener("click", saveCurrentSessionToHistory);

// ============================================================================
// REALTIME SESSION & MULTI-DEVICE CONNECTION MODAL
// ============================================================================
elements.syncBadgeBtn.addEventListener("click", () => {
  elements.inputSessionId.value = state.sessionId;
  elements.inputCustomFirebaseJson.value = JSON.stringify(activeFirebaseConfig, null, 2);
  elements.syncModalOverlay.classList.add("open");
});

elements.closeSyncModalBtn.addEventListener("click", () => {
  elements.syncModalOverlay.classList.remove("open");
});

elements.btnApplySessionSettings.addEventListener("click", () => {
  const newSessionId = elements.inputSessionId.value.trim();
  if (newSessionId) {
    state.sessionId = newSessionId;
    localStorage.setItem("active_grocery_session_id", newSessionId);
  }

  const rawJson = elements.inputCustomFirebaseJson.value.trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      saveCustomFirebaseConfig(parsed);
    } catch (e) {
      alert("Format JSON Firebase tidak valid. Pengaturan lokal tetap disimpan.");
    }
  }

  elements.syncModalOverlay.classList.remove("open");
  startRealtimeListener();
});

// ============================================================================
// REALTIME SNAPSHOT HANDLER & INITIALIZATION
// ============================================================================
function onDataReceivedFromStream(data, source) {
  if (!data) return;

  // Sinkronkan seluruh state aplikasi seketika tanpa refresh
  if (data.storeLocation) {
    state.storeLocation = data.storeLocation;
    elements.storeSelector.value = data.storeLocation;
  }
  if (data.shoppingDate) {
    state.shoppingDate = data.shoppingDate;
    elements.shoppingDateInput.value = data.shoppingDate;
  }
  if (data.walletLimit) {
    state.walletLimit = Number(data.walletLimit);
    elements.inputWalletLimitSettings.value = state.walletLimit;
  }
  if (Array.isArray(data.items)) {
    state.items = data.items;
  }

  calculateBudgetSafety();
  renderGroceryItems();
}

function onConnectionStatusChanged(statusInfo) {
  const badge = elements.syncBadgeBtn;
  const label = elements.syncStatusLabel;
  const details = elements.syncDetailsBox;

  badge.className = `sync-badge ${statusInfo.status}`;
  
  if (statusInfo.status === "online") {
    label.innerText = "Realtime Terhubung";
    if (details) details.innerHTML = `<span style="color:#34d399;">🟢 Cloud Firestore Realtime Stream Aktif</span><br>Sesi: <b>${state.sessionId}</b>`;
  } else if (statusInfo.status === "local_ready") {
    label.innerText = "Offline / Aman";
    if (details) details.innerHTML = `<span style="color:#fbbf24;">🟡 Fallback LocalStorage & Multi-Tab Broadcast Aktif</span><br>Data aman tersimpan di HP & tidak hilang saat F5. Sesi: <b>${state.sessionId}</b>`;
  } else {
    label.innerText = "Menghubungkan...";
    if (details) details.innerText = statusInfo.text;
  }
}

function startRealtimeListener() {
  listenToShoppingSession(state.sessionId, onDataReceivedFromStream, onConnectionStatusChanged);
}

// ============================================================================
// BOOTSTRAP INITIAL RUN
// ============================================================================
function initApp() {
  // Set default values
  elements.shoppingDateInput.value = state.shoppingDate;
  elements.storeSelector.value = state.storeLocation;
  elements.inputWalletLimitSettings.value = state.walletLimit;

  // Mulai listener realtime Firestore onSnapshot dengan Fallback LocalStorage
  startRealtimeListener();

  // Load history list awal
  loadHistoryReceipts();
}

initApp();
