// ============================================================================
// FIREBASE CONFIGURATION & REALTIME MULTI-DEVICE SYNC ENGINE
// "Smart Grocery & Budget Safety Tracker"
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Cloud Firestore Anda
// Catatan: Ganti nilai apiKey, projectId, dll. dengan kredensial Firebase Console Anda.
export const defaultFirebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "proyek-kamu.firebaseapp.com",
  projectId: "proyek-kamu",
  storageBucket: "proyek-kamu.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:..."
};

// Ambil config tersimpan di LocalStorage jika pengguna pernah mengupdate lewat UI
const storedConfig = localStorage.getItem("firebase_custom_config");
export let activeFirebaseConfig = storedConfig ? JSON.parse(storedConfig) : defaultFirebaseConfig;

let app = null;
let db = null;
let unsubscribeSnapshot = null;
let broadcastChannel = null;

// Cek apakah konfigurasi sudah diganti dari placeholder
export function isConfigPlaceholder(cfg) {
  return !cfg || !cfg.apiKey || cfg.apiKey.includes("...") || cfg.projectId === "proyek-kamu";
}

// Inisialisasi Firebase App & Firestore
export function initFirebase() {
  if (isConfigPlaceholder(activeFirebaseConfig)) {
    console.info("ℹ️ Firebase menggunakan config placeholder. Mengaktifkan Realtime Local-Broadcast & Fallback Mode.");
    return false;
  }

  try {
    app = initializeApp(activeFirebaseConfig);
    db = getFirestore(app);
    console.log("✅ Firebase Firestore berhasil diinisialisasi.");
    return true;
  } catch (error) {
    console.warn("⚠️ Gagal inisialisasi Firebase:", error);
    return false;
  }
}

// Inisialisasi awal saat script dimuat
const isFirebaseLive = initFirebase();

// Setup BroadcastChannel untuk sinkronisasi multi-tab/perangkat lokal saat offline/demo
if ('BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('grocery_realtime_channel');
  } catch (e) {
    console.warn("BroadcastChannel tidak tersedia", e);
  }
}

// ============================================================================
// REALTIME LISTENER ENGINE (onSnapshot) DENGAN FALLBACK LOCALSTORAGE
// ============================================================================

/**
 * Mendengarkan perubahan data sesi belanja secara REALTIME.
 * @param {string} sessionId ID sesi belanja (misal: "sesi-lotte-mart-puri")
 * @param {function} onDataReceived Callback saat data berubah (otomatis render UI)
 * @param {function} onStatusChanged Callback indikator status koneksi
 */
export function listenToShoppingSession(sessionId, onDataReceived, onStatusChanged) {
  // 1. Hentikan listener lama jika ada pergantian sesi
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  // 2. FAST FIRST PAINT: Cek dan load segera dari LocalStorage agar tidak blank saat dibuka / F5
  const localCache = getBackupFromLocalStorage(sessionId);
  if (localCache) {
    console.log("⚡ [Fast First Paint] Memuat data dari LocalStorage:", localCache);
    onDataReceived(localCache, "local_cache");
  }

  // 3. JIKA FIREBASE AKTIF DAN BUKAN PLACEHOLDER: GUNAKAN onSnapshot()
  if (db && !isConfigPlaceholder(activeFirebaseConfig)) {
    try {
      onStatusChanged({ status: "connecting", text: "Menghubungkan ke Cloud Firestore..." });
      const sessionRef = doc(db, "shopping_sessions", sessionId);

      // PENTING: Gunakan onSnapshot (Realtime Listener Stream), JANGAN getDoc()
      unsubscribeSnapshot = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          console.log("🔥 [Cloud Firestore onSnapshot] Pembaruan realtime diterima:", cloudData);
          
          // Simpan snapshot terbaru ke LocalStorage sebagai backup offline seketika
          saveBackupToLocalStorage(sessionId, cloudData);

          // Update UI HP & PC secara instan
          onDataReceived(cloudData, "firestore_realtime");
          onStatusChanged({ status: "online", text: "Cloud Firestore Realtime Sync", device: "cloud" });
        } else {
          console.log("ℹ️ Sesi belum ada di Firestore, menginisialisasi sesi baru...");
          // Jika dokumen belum ada, gunakan data lokal jika ada, atau buat initial data
          const initial = localCache || createDefaultSessionData(sessionId);
          saveSessionData(sessionId, initial);
          onDataReceived(initial, "new_session");
          onStatusChanged({ status: "online", text: "Cloud Firestore Terhubung (Sesi Baru)" });
        }
      }, (error) => {
        console.error("❌ Firestore onSnapshot Error:", error);
        onStatusChanged({ status: "offline", text: "Offline / Fallback LocalStorage Aktif" });
      });

      return;
    } catch (err) {
      console.warn("⚠️ Gagal memasang onSnapshot, beralih ke Fallback Mode:", err);
    }
  }

  // 4. FALLBACK MODE (OFFLINE / PLACEHOLDER CONFIG):
  // Menjaga data tetap multi-device (multi-tab/window) menggunakan BroadcastChannel & Storage Event
  onStatusChanged({ 
    status: "local_ready", 
    text: "Mode Offline / LocalStorage Safe (Realtime Multi-Tab Aktif)" 
  });

  // Listener antar tab di browser yang sama (simulasi HP & PC)
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.sessionId === sessionId) {
        console.log("📡 [BroadcastChannel Realtime] Sinkronisasi antar-tab:", event.data.data);
        onDataReceived(event.data.data, "broadcast_realtime");
      }
    };
  }

  // Listener storage event untuk browser tanpa BroadcastChannel
  window.addEventListener('storage', (e) => {
    if (e.key === `grocery_session_${sessionId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onDataReceived(parsed, "storage_realtime");
      } catch (err) {}
    }
  });
}

// ============================================================================
// WRITE ENGINE: MENYIMPAN DATA KE FIRESTORE & LOCALSTORAGE
// ============================================================================

/**
 * Menyimpan data perubahan barang/anggaran ke Cloud Firestore dan LocalStorage sekaligus.
 */
export async function saveSessionData(sessionId, data) {
  // Tambahkan timestamp
  const payload = {
    ...data,
    sessionId: sessionId,
    lastUpdated: new Date().toISOString()
  };

  // 1. Selalu simpan ke LocalStorage seketika (Jaminan keamanan saat F5 / sinyal lemah)
  saveBackupToLocalStorage(sessionId, payload);

  // 2. Broadcast ke tab lain jika dalam mode local / multi-tab
  if (broadcastChannel) {
    broadcastChannel.postMessage({ sessionId, data: payload });
  }

  // 3. Simpan ke Cloud Firestore jika aktif
  if (db && !isConfigPlaceholder(activeFirebaseConfig) && navigator.onLine) {
    try {
      const sessionRef = doc(db, "shopping_sessions", sessionId);
      await setDoc(sessionRef, payload, { merge: true });
      console.log("☁️ [Firestore Saved] Berhasil sync ke Cloud Firestore");
      return { success: true, target: "cloud" };
    } catch (error) {
      console.warn("⚠️ Gagal menyimpan ke Firestore (tersimpan di LocalStorage):", error);
      return { success: true, target: "local_fallback", error };
    }
  }

  return { success: true, target: "local" };
}

// ============================================================================
// HELPER STORAGE & DATA DEFAULT
// ============================================================================

export function getBackupFromLocalStorage(sessionId) {
  try {
    const raw = localStorage.getItem(`grocery_session_${sessionId}`) || localStorage.getItem("grocery_backup");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Gagal membaca LocalStorage:", e);
  }
  return null;
}

export function saveBackupToLocalStorage(sessionId, data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(`grocery_session_${sessionId}`, serialized);
    localStorage.setItem("grocery_backup", serialized);
  } catch (e) {
    console.error("Gagal menulis ke LocalStorage:", e);
  }
}

export function createDefaultSessionData(sessionId = "sesi-lotte-mart-puri") {
  const today = new Date().toISOString().split("T")[0];
  return {
    sessionId: sessionId,
    storeLocation: "Lotte Mart Grocery - Puri Indah",
    shoppingDate: today,
    walletLimit: 500000, // Rp 500.000 batas standar belanja bulanan anak rantau
    totalSpent: 125500,
    items: [
      {
        id: "item_1",
        name: "Beras Ramos Premium 5kg",
        price: 72500,
        qty: 1,
        unit: "sak",
        category: "Kebutuhan Pokok",
        isChecked: true,
        notes: "Stok makan 3 minggu di kos"
      },
      {
        id: "item_2",
        name: "Telur Ayam Negeri 1kg (Isi 16)",
        price: 28000,
        qty: 1,
        unit: "kg",
        category: "Makanan & Lauk",
        isChecked: true,
        notes: "Lauk protein hemat"
      },
      {
        id: "item_3",
        name: "Sabun Mandi Cair Refill 450ml",
        price: 25000,
        qty: 1,
        unit: "pack",
        category: "Mandi & Cuci",
        isChecked: false,
        notes: "Cari yang sedang promo beli 1 gratis 1"
      }
    ],
    lastUpdated: new Date().toISOString()
  };
}

// Fungsi untuk update konfigurasi Firebase oleh user dari modal aplikasi
export function saveCustomFirebaseConfig(configObj) {
  try {
    localStorage.setItem("firebase_custom_config", JSON.stringify(configObj));
    activeFirebaseConfig = configObj;
    initFirebase();
    return true;
  } catch (e) {
    console.error("Gagal simpan konfigurasi Firebase kustom:", e);
    return false;
  }
}
