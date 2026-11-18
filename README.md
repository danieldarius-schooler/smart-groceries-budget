# 🛒 Smart Grocery & Budget Safety Tracker (PWA)
> **Aplikasi Web Mobile PWA Belanja Supermarket & Budget Safety Realtime untuk Siswa Rantau**

Aplikasi PWA (*Progressive Web App*) modern dan responsif yang dirancang khusus untuk memandu siswa rantau belanja kebutuhan bulanan di supermarket agar tidak kalap (*impulsive buying*) dan terhindar dari krisis keuangan sebelum akhir bulan. Dilengkapi dengan **Sistem Pengendali Anggaran Multi-Tier (Budget Safety Gauge)**, **Penanganan Diskon Bertingkat Kompound Supermarket**, **Penggandaan Kuantitas Otomatis Tanpa Delay**, **Radar Komparasi Fluktuasi Harga Realtime Antar Toko**, serta **Sinkronisasi Multi-Device Realtime Cloud Firestore (`onSnapshot`)** dengan persistensi data lokal tanpa batas.

---

## 📋 Matriks Kebutuhan SRS & Skenario Uji

| Skenario Uji | Kode SRS | Fitur & Implementasi Teknis | Status |
| :--- | :---: | :--- | :---: |
| **Skenario 1** | **SRS F-01** | Form Input Item lengkap (Nama, Kategori, Satuan, Harga, Qty, Catatan, Quick Suggestions), Selector Lokasi Supermarket (+ Toko Kustom), Selector Tanggal Transaksi. | ✅ **Lengkap** |
| **Skenario 2** | **SRS F-02** | Penggandaan Kuantitas Otomatis Tanpa Delay (Auto-merge nama barang sama di troli seketika) & Tombol Gandakan `+1 ⚡` (0 ms delay). | ✅ **Lengkap** |
| **Skenario 3** | **SRS F-03** | Penanganan Diskon Bertingkat Kompound Supermarket (e.g. 50% + 20% kompound + Kupon Kasir), Live Simulator Box, kalkulasi hemat, dan badge diskon. | ✅ **Lengkap** |
| **Skenario 4** | **SRS F-04** | Indikator Komparasi Fluktuasi Harga Realtime (Basis data indeks pasar, badge murah `▼` vs mahal `▲`, Radar Komparasi Harga Antar Supermarket). | ✅ **Lengkap** |
| **Skenario 5** | **SRS F-05** | Sistem Pengendali Anggaran Multi-Tier (Aman `<75%`, Waspada `75-89%`, Kritis `90-99%`, Overbudget `≥100%`), Audio Buzzer Alarm, Haptik, & Smart Budget Advisor. | ✅ **Lengkap** |
| **Skenario 6** | **SRS F-06A** | Persistensi Data Lokal (LocalStorage sinkron seketika, Fast First Paint, Panel Uji Persistensi F5 reload proof, Ekspor/Impor JSON, Reset demo). | ✅ **Lengkap** |
| **Skenario 7** | **SRS F-06B** | Sinkronisasi Realtime Cloud Multi-Device (`onSnapshot`), Fallback Multi-Tab Broadcast, Tombol 1-Klik Buka Tab Mitra HP, Log Stream Terkini. | ✅ **Lengkap** |
| **Skenario 8** | **UX Mobile** | Ergonomi Sentuh Mobile (Frame 430px, Touch Target ≥ 44px, Bottom Sheet, Web Audio Synthesizer, Haptic Vibration API, Floating Toasts). | ✅ **Lengkap** |
| **Skenario 9** | **PWA & Git** | Valid PWA (`manifest.json` standalone, `sw.js` Stale-While-Revalidate v2, icons 192/512/SVG), Server Lokal Zero-Dependency, Git Repository terstruktur. | ✅ **Lengkap** |

---

## 🛠️ Arsitektur & Teknologi

1. **Frontend Architecture:**
   - **Pure Vanilla ES6 JavaScript (ES Modules):** Tanpa dependensi framework yang berat, cepat, ringan (< 100 KB total), instan dimuat di perangkat smartphone hemat kuota.
   - **Mobile-First CSS Design (Layar Max 430px):** Menggunakan Flexbox, CSS Grid, Glassmorphism Backdrop Filter, Touch Target Ramah Jempol (min 44px – 48px).
2. **Audio & Haptic Feedback Engine (100% Offline):**
   - **Web Audio API:** Mensintesis frekuensi audio secara murni (*sine/sawtooth oscillators*) tanpa memuat file audio eksternal. Nada bel *chime* saat belanja, *double pop* saat kuantitas digandakan, dan *warning buzzer* saat overbudget.
   - **Navigator Vibration API:** Memberikan respons getaran haptik saat tombol ditekan dan saat batas anggaran terlampaui.
3. **Realtime Multi-Device Sync & Local Storage (Hybrid Architecture):**
   - **Cloud Firestore `onSnapshot` Stream:** Mendengarkan dan memancarkan perubahan troli antar perangkat detik itu juga tanpa reload halaman.
   - **BroadcastChannel & Storage Event Fallback:** Bekerja otomatis 100% saat offline atau menggunakan kredensial demo untuk sinkronisasi antar-tab / antar-jendela browser.
   - **LocalStorage Synchronous Commit:** Setiap penambahan/perubahan barang langsung ditulis ke LocalStorage secara instan (kebal tombol F5 / refresh halaman).
4. **PWA Offline Engine:**
   - **Service Worker (`sw.js`):** Menggunakan strategi *Stale-While-Revalidate* untuk app shell, font, stylesheet, dan ikon.
   - **Web App Manifest (`manifest.json`):** Tampilan *standalone*, splash screen, *theme color* `#0b1120`, dan ikon resolusi tinggi (192px, 512px, SVG vector).

---

## 🚀 Panduan Menjalankan Aplikasi

Aplikasi telah dilengkapi server web lokal zero-dependency menggunakan Node.js.

### Cara 1: Menggunakan Shortcut Desktop (Paling Mudah)
Cukup klik ganda (double click) file:
```
Buka Smart Grocery Tracker.bat
```
di Desktop Anda. Server lokal akan aktif di port `5173` dan browser otomatis terbuka ke `http://localhost:5173`.

### Cara 2: Menjalankan via Terminal
1. Buka PowerShell atau Command Prompt.
2. Masuk ke direktori proyek:
   ```powershell
   cd "C:\Users\Student\Desktop\Smart-Grocery-Tracker"
   ```
3. Jalankan server:
   ```powershell
   node server.js
   ```
4. Buka browser ke alamat: `http://localhost:5173`

---

## 🧪 Panduan Verifikasi 9 Skenario Uji

Berikut langkah-langkah praktis untuk menguji dan memvalidasi setiap skenario secara langsung di aplikasi:

### 🔹 Skenario Uji 1: Form Input Item, Lokasi Toko & Selector Tanggal (SRS F-01)
1. **Pilih Lokasi Supermarket:**
   - Klik dropdown toko di header atas. Pilih toko default (misal: *Super Indo - Intercon*).
   - Klik opsi **"➕ Tambah Toko Kustom..."** di paling bawah dropdown. Masukkan nama toko baru (misal: *Alfamart Fresh Meruya*) lalu klik simpan. Toko kustom akan otomatis terpilih dan tersimpan di memori.
2. **Pilih Tanggal Belanja:**
   - Ubah tanggal pada input tanggal di samping kanan selector toko. Tanggal akan tersimpan di state dan LocalStorage.
3. **Input Barang Baru:**
   - Klik tombol hijau **"+ Tambah Barang"**.
   - Klik salah satu *chip saran cepat* di bawah input nama (misal: *🍚 Beras 5kg* atau *🥚 Telur 1kg*). Perhatikan nama, kategori, satuan, dan harga otomatis terisi!
   - Tekan tombol **"+5rb"** atau **"+10rb"** pada harga satuan untuk menambah harga dengan cepat.
   - Klik **"✓ Masukkan ke Troli"**. Barang akan muncul di daftar belanja dengan bunyi bel konfirmasi.

### 🔹 Skenario Uji 2: Penggandaan Kuantitas Otomatis Tanpa Delay (SRS F-02)
1. **Uji Auto-Merge Form:**
   - Dalam troli sudah ada barang *"Beras Ramos Premium 5kg"*.
   - Klik tombol **"+ Tambah Barang"**, lalu pilih atau ketik nama yang sama: *"Beras Ramos Premium 5kg"*, Qty = 2.
   - Klik **"✓ Masukkan ke Troli"**.
   - **Hasil:** Aplikasi **tidak membuat baris baru yang menduplikasi nama barang**, melainkan secara otomatis menggandakan/menambahkan kuantitas barang yang sudah ada secara instan dengan notifikasi mengambang:
     `⚡ Kuantitas "Beras Ramos Premium 5kg" otomatis digandakan menjadi 3 (+2) tanpa delay!`
2. **Uji Tombol Gandakan Instan (+1 ⚡) di Kartu Barang:**
   - Pada kartu barang mana saja di daftar troli, klik tombol biru **`+1 ⚡`**.
   - **Hasil:** Kuantitas langsung bertambah 1 dalam waktu **0 milidetik**, subtotal dan progress bar anggaran seketika terhitung ulang tanpa jeda ataupun kedip halaman.

### 🔹 Skenario Uji 3: Penanganan Diskon Bertingkat Kompound (SRS F-03)
1. **Buka Form Tambah Barang:**
   - Klik **"+ Tambah Barang"**.
   - Masukkan Nama: *"Deterjen Konsentrat 1kg"*, Harga: `100000`.
2. **Uji Preset Diskon Bertingkat:**
   - Di kartu *"🏷️ Diskon Bertingkat Kompound"*, klik preset **"50% + 20%"**.
   - Nilai *Disc 1 (%)* otomatis terisi `50` dan *Disc 2 Kompound (%)* terisi `20`.
   - Perhatikan kotak simulator di bawahnya:
     - **Harga Asli Satuan:** `Rp 100.000`
     - **Potongan Diskon Kompound:** `-Rp 60.000 (60%)` *(Bukan Rp 70.000, melainkan 50% lalu 20% atas sisa Rp 50.000 = Rp 40.000)*.
     - **Harga Bersih Satuan:** `Rp 40.000`.
3. **Uji Potongan Kupon Kasir:**
   - Tambahkan *Pot. Kupon (Rp)*: `5000`.
   - **Harga Bersih Satuan** otomatis menjadi `Rp 35.000` *(Hemat Rp 65.000 / 65%)*.
4. **Cek Tampilan di Troli:**
   - Klik simpan. Kartu barang menampilkan badge `🏷️ Promo 50% + 20% + Rp5000`, harga asli dicoret ~~Rp 100.000~~, harga bersih tebal `Rp 35.000`, serta label hijau `Hemat Rp 65.000`.
   - Di kartu atas, muncul chip total penghematan: `🏷️ Hemat Diskon: Rp 65.000`.

### 🔹 Skenario Uji 4: Indikator Komparasi Fluktuasi Harga Realtime (SRS F-04)
1. **Indikator Fluktuasi di Kartu Barang:**
   - Tambahkan item *"Minyak Goreng Refill 2L"* dengan harga `Rp 30.000` di Lotte Mart.
   - Pada kartu barang akan muncul label hijau:
     `▼ Hemat!: ▼ 16% lebih hemat dari rata-rata (Termurah: Lotte Mart)`.
   - Jika harga dimasukkan `Rp 42.000`, label akan otomatis berubah menjadi merah:
     `▲ Fluktuasi Naik: ▲ +18% lebih mahal dari pasaran`.
2. **Radar Harga Antar Supermarket (Tab 2):**
   - Klik tab **"Radar & Riwayat"** di navigasi bawah.
   - Perhatikan tabel **"Radar Harga Antar Supermarket (SRS F-04)"**:
     - Sistem secara realtime menghitung total biaya belanja untuk seluruh isi troli aktif jika dibeli di *Lotte Mart*, *Super Indo*, *Indomaret Fresh*, *Hypermart*, dll.
     - Supermarket dengan total terendah ditandai dengan badge hijau **"Termurah!"**.
     - Muncul rekomendasi penghematan: *"Tips Penghematan: Belanja keranjang ini di Lotte Mart lebih hemat Rp X dibanding toko lain!"*.

### 🔹 Skenario Uji 5: Sistem Pengendali Anggaran (Budget Warning - SRS F-05)
1. **Multi-Tier Gauge Card:**
   - Pagu default adalah `Rp 500.000`.
   - **Zona Aman (< 75%):** Bar berwarna hijau, status *"Aman (< 75%)"*.
   - **Zona Waspada (75% - 89%):** Tambahkan barang hingga belanja mencapai Rp 380.000. Bar berubah warna kuning/amber, status *"Waspada (75%-89%)"*.
   - **Zona Kritis (90% - 99%):** Tambahkan barang hingga Rp 460.000. Status berubah menjadi *"⚠️ KRITIS (90%-99%)"*.
   - **Zona Bahaya / Overbudget (≥ 100%):** Tambahkan barang hingga melebihi Rp 500.000.
     - Gauge bar menyala merah berdenyut.
     - Status berubah menjadi *"🚨 OVERBUDGET"*.
     - Muncul banner bahaya: *"🚨 DOMPET JEBOL: Belanjaan melebihi anggaran bulanan!"*.
     - Speaker memutar suara alarm bahaya (*warning buzz*).
     - Smartphone bergetar (*haptic vibration*).
2. **Smart Budget Safety Advisor:**
   - Saat status Waspada/Overbudget, muncul kartu **"💡 Saran Penyelamat Dompet Rantau"** yang mendeteksi barang sekunder (cemilan, snack, minuman) dan menyediakan tombol 1-klik:
     `✕ Keluarkan "[Nama Barang Sekunder]" Sekarang`
   - Sekali klik, barang sekunder dikeluarkan dari troli dan anggaran kembali aman!
3. **Ubah Pagu Cepat:**
   - Klik *"Pagu Anggaran"* di header atau buka Tab Anggaran, lalu pilih chip `Rp 300rb`, `Rp 750rb`, atau `Rp 1 Jt`.

### 🔹 Skenario Uji 6: Pemahaman & Uji Persistensi Data Lokal (SRS F-06A)
1. **Uji Reload Halaman (F5):**
   - Tambahkan beberapa barang ke troli belanja dan ubah kuantitasnya.
   - Buka tab **"Anggaran"** di navigasi bawah.
   - Pada panel **"Panel Uji Persistensi Data Lokal (SRS F-06A)"**, klik tombol **"🔄 Uji F5 (Reload & Cek)"** atau tekan tombol `F5` / `Ctrl+R` pada keyboard Anda.
   - **Hasil:** Halaman termuat ulang seketika (*Fast First Paint*), dan seluruh isi troli, status centang, toko, serta pagu anggaran **100% utuh tanpa ada satu pun data yang hilang**.
2. **Uji Ekspor & Impor Backup JSON:**
   - Klik tombol **"💾 Ekspor Backup JSON"**. Berkas JSON berisi snapshot troli akan terunduh ke komputer.
   - Klik tombol **"🧹 Reset Demo Awal"** untuk mengosongkan/mereset troli.
   - Klik tombol **"📂 Impor Restore JSON"** dan pilih berkas backup JSON yang tadi diunduh.
   - Seluruh data troli berhasil dipulihkan secara instan!

### 🔹 Skenario Uji 7: Pemahaman & Uji Sinkronisasi Realtime Cloud Multi-Device (SRS F-06B onSnapshot)
1. **Uji Simulasi HP & PC Berdampingan (1-Klik):**
   - Klik badge status di kanan atas header (*"Realtime / Offline"*).
   - Di modal sinkronisasi, klik tombol biru:
     **"🚀 Buka Jendela Simulasi Mitra (Tab HP)"**
   - Jendela popup berukuran smartphone (420x820) akan terbuka berdampingan dengan sesi ID yang sama.
2. **Uji Realtime Multi-Device Sync:**
   - Di jendela 1, tekan tombol **`+1 ⚡`** atau centang barang troli.
   - Perhatikan jendela 2: **Detik itu juga kuantitas dan total harga di jendela 2 langsung terupdate secara realtime tanpa perlu menekan tombol refresh!**
   - Buka kembali modal sinkronisasi untuk melihat **"Log Realtime Stream Terkini"** yang mencatat paket incoming/outgoing dengan timestamp detik.
3. **Koneksi Cloud Firestore (Opsional):**
   - Anda dapat memasukkan objek konfigurasi Firebase kustom di textarea modal untuk menghubungkan ke instance Cloud Firestore produksi Anda sendiri dengan listener `onSnapshot(docRef, ...)`.

### 🔹 Skenario Uji 8: Pengalaman Pengguna (UX & Ergonomi Sentuh Mobile)
1. **Mockup Frame Smartphone:** Tampilan desktop dibatasi ke lebar maksimal 430px dengan bezel melengkung, notch ponsel, dan status bar jam realtime.
2. **Jangkauan Jempol (Thumb Zone):** Seluruh elemen aksi utama (tombol centang bulat besar, stepper kuantitas, tombol gandakan, navigasi bawah) dirancang dengan ukuran sentuh minimal 44x44px.
3. **Umpan Balik Haptik & Audio Sintetis:**
   - Suara bel *chime* saat centang/tambah.
   - Suara *double pop* saat kuantitas digandakan.
   - Suara *sawtooth alarm* saat overbudget.
   - Getaran haptik responsif pada perangkat smartphone layar sentuh.
4. **Floating Toast Notifications:** Setiap aksi (tambah, gandakan, hapus, simpan struk) memunculkan notifikasi melayang yang ramah jempol dan menghilang otomatis dalam 2.5 detik.

### 🔹 Skenario Uji 9: Kerapian Mobile PWA & Deliverable GitHub (UI / Code)
1. **Validasi PWA Standalone:**
   - Buka DevTools Chrome (`F12`) -> Tab *Application* -> *Manifest*.
   - Periksa: Name, Short Name, Theme Color (`#0b1120`), Standalone Display, Orientation Portrait, dan Ikon (192px, 512px, SVG) terkonfigurasi dengan status valid.
   - Tab *Application* -> *Service Workers*: status `smart-grocery-v2` aktif dan berjalan (*running*).
2. **Deliverable GitHub:**
   - Repositori Git lokal telah diinisialisasi (`git init`).
   - Berkas `.gitignore` dan commit terstruktur rapi.

---

## 📦 Instruksi Push ke GitHub

Sesuai instruksi pada `Git Prompt.txt`, jalankan perintah berikut untuk mengunggah repositori ke GitHub:

```bash
# 1. Konfigurasi identitas Git Anda
git config --global user.name "Nama Lengkap Anda"
git config --global user.email "email-anda@domain.com"

# 2. Buat repositori baru di GitHub (misal: https://github.com/username/Smart-Grocery-Tracker.git)

# 3. Hubungkan remote repository dan push
git remote add origin https://github.com/username/Smart-Grocery-Tracker.git
git branch -M main
git push -u origin main
```

---

## 👥 Pengembang & Lisensi
- Proyek ini dikembangkan sebagai solusi cerdas pengelolaan anggaran belanja bulanan anak rantau.
- Berlisensi MIT. Bebas dimodifikasi dan dikembangkan untuk keperluan akademik & portofolio.
