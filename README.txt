SiLaporFasum — Website Pengguna (UI Modern 2027)

MENU WEBSITE PENGGUNA
- Beranda
- Buat Laporan
- Lacak Laporan
- Histori Laporan
- Instal Aplikasi

Tidak ada menu Admin Demo atau halaman demo admin dalam paket website pengguna ini.

ISI PAKET
- index.html: beranda
- lapor.html: formulir laporan
- lacak.html: pelacakan laporan
- histori.html: histori laporan publik
- app.js: logika laporan dan integrasi Supabase
- style.css: desain responsif dan animasi
- manifest.json, service-worker.js, pwa.js: dukungan instalasi PWA
- icons/: ikon aplikasi

CARA MEMASANG
1. Cadangkan folder website yang aktif.
2. Ekstrak ZIP ini dan unggah semua isi folder ke repository GitHub Pages website pengguna.
3. Pastikan file index.html berada di folder root publik yang benar.
4. Commit dan push perubahan, lalu tunggu GitHub Pages selesai deploy.
5. Buka website melalui HTTPS. Kamera, GPS, service worker, dan instalasi PWA memerlukan HTTPS (localhost dapat dipakai untuk pengujian).
6. Jika website masih menampilkan tampilan lama, lakukan hard refresh (Ctrl+F5) pada desktop. Di HP, tutup tab, buka ulang; bila masih sama, hapus data situs/cache atau uninstall lalu instal ulang PWA. Service worker menggunakan versi cache baru untuk membantu memuat aset terbaru.

CATATAN FITUR
- Pengiriman laporan, foto, kamera, GPS, validasi, dan koneksi Supabase dipertahankan.
- Histori membutuhkan kedua sumber (website dan aplikasi Android) menyimpan laporan ke tabel Supabase yang sama dan policy SELECT yang sesuai.
- Lacak laporan lokal pada kode asal masih membaca salinan laporan di localStorage browser; fitur lintas perangkat bergantung pada integrasi database yang tersedia.
- Service worker tidak menyimpan respons API dan Storage Supabase ke cache.
- Tombol Instal Aplikasi menggunakan prompt browser jika didukung; jika tidak, petunjuk instalasi manual akan ditampilkan.

KEAMANAN
Gunakan Supabase publishable/anon key di frontend, bukan service_role key. Pastikan RLS dan policy database sesuai kebutuhan.
