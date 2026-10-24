# SiLaporFasum User Website — UI Refresh + PWA

## Isi paket
- `index.html` — beranda dengan tampilan baru
- `lapor.html` — formulir laporan; ID elemen yang dipakai `app.js` dipertahankan
- `lacak.html` — halaman pelacakan dengan tampilan baru
- `app.js` — salinan dari kode yang diberikan, logika laporan tidak diubah
- `style.css` — desain responsif baru
- `manifest.json`, `service-worker.js`, `pwa.js` — dukungan instalasi PWA
- `icons/` — ikon aplikasi

## Cara memasang
1. Buat cadangan folder website yang sekarang.
2. Ekstrak ZIP ini.
3. Salin file-file di dalam folder hasil ekstrak ke folder website yang aktif.
4. Pertahankan file `admin.html` asli dari proyekmu. File itu tidak disertakan karena belum dikirim, dan link Admin Demo tetap diarahkan ke `admin.html`.
5. Pastikan semua file PWA (`manifest.json`, `service-worker.js`, `pwa.js`, folder `icons`) ikut diunggah ke lokasi yang sama dengan `index.html`.
6. Jalankan website lewat HTTPS. Kamera, GPS, service worker, dan instalasi PWA memerlukan HTTPS (localhost bisa dipakai untuk pengujian).
7. Buka website di Chrome Android. Tekan tombol **Instal Aplikasi**. Jika dialog instal belum muncul, buka menu Chrome lalu pilih **Instal aplikasi** atau **Tambahkan ke layar utama**.

## Catatan perilaku yang dipertahankan
- `app.js` tetap menggunakan Supabase project dan bucket `foto-laporan` yang ada di kode sumber.
- Pengiriman laporan, foto, kamera, GPS, dan validasi tidak diganti.
- Halaman `lacak.html` pada kode sumber masih membaca salinan laporan dari `localStorage` browser. Pelacakan lintas perangkat belum ditambahkan dalam paket ini.
- Service worker hanya melakukan cache pada berkas statis website. Permintaan API dan Storage Supabase tidak disimpan ke cache.
- Tombol instal memunculkan dialog instalasi bila browser mendukungnya; pada browser lain ditampilkan petunjuk instalasi manual.
- Jika file berubah setelah dipasang, tutup lalu buka kembali website. Bila versi lama masih tampil, hapus data situs/cache atau naikkan nama cache di `service-worker.js`.

## Keamanan
Kunci Supabase yang digunakan adalah publishable key untuk browser. Jangan pernah menaruh `service_role` key di file frontend. Pastikan Row Level Security (RLS) dan policy Supabase tetap aktif dan sesuai kebutuhan.
