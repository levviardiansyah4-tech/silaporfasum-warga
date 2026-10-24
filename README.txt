SILAPORFASUM CI3 + SUPABASE
============================

PENTING
- Ini adalah paket tambahan/overlay, bukan seluruh framework CodeIgniter 3.
- Harus dipasang ke project CI3 lengkap yang memiliki index.php dan folder system/.
- Backend PHP CI3 menghubungi Supabase REST API dan Storage. Service role key hanya disimpan di PHP config pada server, tidak pernah dikirim ke browser.
- Password admin sederhana disimpan pada config untuk prototipe tugas. Sebelum production, ganti dengan autentikasi yang lebih kuat, password hashing, rate limiting, HTTPS, dan CSRF protection.
- Bucket foto pada contoh ini public agar foto dapat ditampilkan. Jangan unggah foto berisi wajah, dokumen pribadi, atau data sensitif.

LANGKAH SETUP
1. Ekstrak zip ini.
2. Salin folder application/ dan assets/ ke root project CodeIgniter 3 lengkap. Gabungkan folder, jangan menghapus file lain.
3. Buka Supabase Dashboard > SQL Editor > New query.
4. Buka database/supabase_setup.sql, salin semua SQL, lalu jalankan.
5. Di Supabase Dashboard > Project Settings > API, salin Project URL dan service_role key. Gunakan secret/service_role key hanya di server.
6. Edit application/config/supabase.php:
   - supabase_url = URL project, misalnya https://abcdefgh.supabase.co
   - supabase_service_role_key = service_role key dari dashboard
   - silaporfasum_admin_password = password admin baru yang kuat
   Jangan commit atau bagikan file konfigurasi yang berisi key.
7. Aktifkan PHP cURL dan Fileinfo di php.ini XAMPP:
   extension=curl
   extension=fileinfo
   Hapus tanda ; di awal baris jika ada, simpan, lalu restart Apache.
8. Di application/config/autoload.php, pastikan helper URL tersedia. Tambahkan 'url' ke array helper yang sudah ada.
9. Jika memakai routes, salin routes_snippet.txt ke application/config/routes.php. Jika tidak, URL index.php tetap berfungsi karena controller memakai method CI3.
10. Pastikan application/config/config.php mempunyai base_url yang benar, contoh:
    $config['base_url'] = 'http://localhost/silaporfasum/';
11. Buka:
    http://localhost/silaporfasum/index.php/silaporfasum
    Buat laporan: /index.php/silaporfasum/lapor
    Lacak laporan: /index.php/silaporfasum/lacak
    Admin: /index.php/silaporfasum/admin

CARA KERJA
- Buat Laporan mengunggah foto ke Supabase Storage dan data ke tabel public.reports.
- Lacak Laporan mencari berdasarkan email/nomor kontak.
- Admin login dengan password dari config, melihat laporan, dan mengubah status.
- Jangan gunakan service_role key di file JavaScript, HTML, atau aplikasi klien.
- Data laporan memuat nama, kontak, alamat dan foto. Untuk production, tambahkan pembatasan percobaan pelacakan, CAPTCHA/rate limiting, HTTPS, CSRF protection, dan kebijakan privasi. Saat ini pelacakan berdasarkan kontak saja tidak cukup kuat untuk data sensitif.

TROUBLESHOOTING
- "Konfigurasi Supabase belum diisi": periksa application/config/supabase.php.
- "Ekstensi PHP cURL belum aktif": aktifkan extension=curl di php.ini, restart Apache.
- Foto gagal upload: pastikan SQL bucket sudah dijalankan, key benar, dan nama bucket report-photos.
- Database error: cek Project URL/key dan pastikan SQL tabel sudah dijalankan.
- 404: pastikan paket disalin ke project CI3 lengkap dan URL controller benar.
