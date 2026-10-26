-- SiLaporFasum: fungsi histori publik tanpa data identitas pelapor.
-- Jalankan di Supabase Dashboard > SQL Editor pada proyek SiLaporFasum.
--
-- Mengembalikan seluruh laporan tanpa membagikan nama, kontak/nomor telepon,
-- email, koordinat presisi, petugas_id, atau catatan internal petugas.
-- Fungsi hanya membaca data; tidak mengubah atau menghapus baris laporan.

BEGIN;

DROP FUNCTION IF EXISTS public.silapor_get_laporan_publik_v2();

CREATE FUNCTION public.silapor_get_laporan_publik_v2()
RETURNS TABLE (
  id text,
  kategori text,
  alamat text,
  deskripsi text,
  foto_url text,
  foto_bukti_url text,
  status text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    l.id,
    l.kategori,
    l.alamat,
    l.deskripsi,
    l.foto_url,
    l.foto_bukti_url,
    l.status,
    l.created_at
  FROM public.laporan AS l
  ORDER BY l.created_at DESC NULLS LAST, l.id DESC;
$function$;

ALTER FUNCTION public.silapor_get_laporan_publik_v2() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.silapor_get_laporan_publik_v2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.silapor_get_laporan_publik_v2() TO anon, authenticated;

COMMIT;

-- Verifikasi: hasil tidak mencakup nama, kontak, email, koordinat, petugas_id,
-- atau catatan internal. Hapus LIMIT jika ingin memeriksa seluruh data.
SELECT *
FROM public.silapor_get_laporan_publik_v2()
LIMIT 5;
