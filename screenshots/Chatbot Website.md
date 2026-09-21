# Dokumentasi Visual & Tangkapan Layar Antarmuka Web ELYSIA
### Pengujian Sistem Asisten Rekomendasi Game Berbasis Web (Cloud Render & Fullstack Flask)

Dokumen ini memuat dokumentasi visual dan tangkapan layar pengujian antarmuka pengguna (*User Interface*) ELYSIA yang telah di-*deploy* secara langsung pada platform cloud **Render** ([elysia-video-game-recommendation.onrender.com](https://elysia-video-game-recommendation.onrender.com/)).

---

## 1. Tampilan Awal Antarmuka (*Welcome State*)
Tampilan beranda awal saat pengguna pertama kali mengakses aplikasi. Menampilkan *welcome hero* dengan nuansa *warm parchment*, status koneksi model (`Online (gemini-3.5-flash)`), panel input chat, dan tombol aksi cepat.

![Tampilan Awal Website ELYSIA](image.png)

---

## 2. Percakapan Interaktif Multi-Turn
Proses dialog interaktif dua arah antara pengguna dan ELYSIA. Pengguna menyampaikan kondisi emosional (*mood*), preferensi jenis permainan, dan batas anggaran, sementara ELYSIA memberikan tanggapan empati secara *real-time* dengan streaming teks.

### Bagian 1: Inisiasi Dialog & Penyampaian Kebutuhan
![Tampilan Chat Interaktif - Bagian 1](image.png)

### Bagian 2: Elaborasi Preferensi & Eksplorasi Judul Awal
ELYSIA merespons dengan gaya bahasa santun tanpa emoji, mendiskusikan opsi permainan yang sesuai, serta menanyakan batasan anggaran Steam IDR.

![Tampilan Chat Interaktif - Bagian 2](image-1.png)

---

## 3. Hasil Ekstraksi Preferensi & Kurasi Rekomendasi Game
Tampilan setelah pengguna menekan tombol **"Rekomendasikan Game"** atau memicu perintah kurasi. Sistem secara otomatis mengekstrak entitas preferensi, menghitung skor kecocokan Playstyle DNA 3D, dan menyajikan kartu rekomendasi game terstruktur pada drawer interaktif.

### Kartu Rekomendasi Game & Persentase Kecocokan
Menampilkan daftar judul game terkurasi lengkap dengan informasi harga pasar Steam IDR, label diskon aktif, badge genre, serta persentase kecocokan (*match rate*).

![Tampilan Hasil Rekomendasi Game - Ikhtisar](image-2.png)

### Detail Informasi Game & Link Steam
![Tampilan Detail Kartu Rekomendasi](image-3.png)

### Visualisasi 3D Playstyle DNA Radar Chart
Grafik radar SVG dinamis yang memetakan karakteristik game pada tiga dimensi psikografis: *Casual vs Hardcore*, *Simple vs Complex*, dan *Calming vs Adrenaline*.

![Visualisasi Playstyle DNA Radar Chart](image-4.png)

---

## 4. Manajemen Riwayat Sesi Percakapan
Fitur penyimpanan (*save session*) dan pemuatan kembali (*load session*) yang memungkinkan pengguna mengelola arsip konsultasi game masa lalu.

### Riwayat Tersimpan pada Drawer Samping
Menampilkan daftar sesi percakapan yang berhasil diekspor dan disimpan dalam format JSON berstempel waktu.

![Tampilan Riwayat Percakapan Tersimpan](image-5.png)

### Modal Dialog Pengelolaan Riwayat Percakapan
Panel modal untuk meninjau detail log percakapan tersimpan, memuat sesi lama kembali ke ruang obrolan, atau mereset memori sesi.

![Modal Riwayat Percakapan Sesi](image-9.png)

---

## 5. Pengujian Skenario & Kasus Uji Tambahan
Dokumentasi pengujian variasi skenario dialog dengan preferensi bermain yang berbeda untuk memvalidasi ketangguhan pemahaman konteks dan adaptabilitas kurasi ELYSIA.

### Uji Skenario 1: Variasi Preferensi Gameplay
![Pengujian Skenario Tambahan 1](image-6.png)

### Uji Skenario 2: Dialog Lanjutan & Penyesuaian Mood
![Pengujian Skenario Tambahan 2](image-7.png)

### Uji Skenario 3: Kurasi Hasil pada Skenario Berbeda
![Pengujian Skenario Tambahan 3](image-8.png)