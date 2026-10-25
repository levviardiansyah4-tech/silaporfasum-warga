
"use strict";

/* =====================================================
   SiLaporFasum - User App
   GPS + Kamera + Galeri + Supabase + Pelacakan Lokal
   ===================================================== */

const SUPABASE_URL = "https://ytasgufassdscmxnjeyr.supabase.co";
const SUPABASE_KEY = "sb_publishable_NJw5OMlXyxk6MY5vb3eovw_LMsuclg2";

const STORE_KEY = "silaporfasum_reports_v1";
const STORAGE_BUCKET = "foto-laporan";

let supabaseClient = null;
let cameraStream = null;
let capturedData = "";

if (window.supabase?.createClient) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
}

/* =====================================================
   HELPER
   ===================================================== */

function getReports() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch (error) {
    console.error("Gagal membaca laporan lokal:", error);
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(STORE_KEY, JSON.stringify(reports));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function statusClass(status) {
  return String(status || "Laporan Dikirim")
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("/", "-");
}

function saveLocalReport(report) {
  try {
    const reports = getReports();
    const index = reports.findIndex((item) => item.id === report.id);

    if (index >= 0) {
      reports[index] = { ...reports[index], ...report };
    } else {
      reports.unshift(report);
    }

    saveReports(reports);
  } catch (error) {
    console.warn("Salinan laporan lokal gagal disimpan:", error);
  }
}

/* =====================================================
   ELEMEN FORM LAPORAN
   ===================================================== */

const form = document.getElementById("reportForm");

if (form) {
  const fileInput = document.getElementById("foto");
  const preview = document.getElementById("preview");
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const message = document.getElementById("formMessage");

  const openCameraBtn = document.getElementById("openCamera");
  const closeCameraBtn = document.getElementById("closeCamera");
  const takePhotoBtn = document.getElementById("takePhoto");
  const retakePhotoBtn = document.getElementById("retakePhoto");

  const getLocationBtn = document.getElementById("getLocation");
  const locationMessage = document.getElementById("locationMessage");

  const latitudeInput = document.getElementById("lat");
  const longitudeInput = document.getElementById("lon");

  function showMessage(text, type = "error") {
    if (!message) return;
    message.textContent = text;
    message.dataset.type = type;
  }

  function showLocationMessage(text, type = "info") {
    if (!locationMessage) return;
    locationMessage.textContent = text;
    locationMessage.dataset.type = type;
  }

  /* =====================================================
     KAMERA
     ===================================================== */

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }

    if (video) {
      video.pause();
      video.srcObject = null;
      video.hidden = true;
    }

    if (openCameraBtn) openCameraBtn.hidden = false;
    if (closeCameraBtn) closeCameraBtn.hidden = true;
    if (takePhotoBtn) {
      takePhotoBtn.hidden = true;
      takePhotoBtn.disabled = true;
    }
  }

  function showPhotoPreview(source) {
    if (!preview) return;

    preview.src = source;
    preview.hidden = false;
  }

  function resetPhoto() {
    capturedData = "";

    if (fileInput) {
      fileInput.value = "";
      fileInput.required = true;
    }

    if (preview) {
      preview.removeAttribute("src");
      preview.hidden = true;
    }

    if (retakePhotoBtn) retakePhotoBtn.hidden = true;
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];

      if (!file) {
        if (!capturedData && preview) preview.hidden = true;
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (!allowedTypes.includes(file.type)) {
        resetPhoto();
        showMessage("Format foto harus JPG, PNG, atau WebP.");
        return;
      }

      if (file.size > 900 * 1024) {
        resetPhoto();
        showMessage("Ukuran foto maksimal 900 KB.");
        return;
      }

      capturedData = "";
      fileInput.required = false;

      const reader = new FileReader();

      reader.onload = () => {
        showPhotoPreview(reader.result);

        if (retakePhotoBtn) retakePhotoBtn.hidden = false;

        showMessage("", "success");
      };

      reader.onerror = () => {
        showMessage("Foto gagal dibaca. Silakan pilih ulang.");
      };

      reader.readAsDataURL(file);
    });
  }

  if (openCameraBtn) {
    openCameraBtn.addEventListener("click", async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        showMessage(
          "Kamera tidak didukung. Buka website melalui HTTPS atau localhost."
        );
        return;
      }

      try {
        stopCamera();

        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }
          },
          audio: false
        });

        if (video) {
          video.srcObject = cameraStream;
          video.hidden = false;
          video.setAttribute("playsinline", "");
          video.muted = true;

          await video.play();
        }

        openCameraBtn.hidden = true;

        if (closeCameraBtn) closeCameraBtn.hidden = false;

        if (takePhotoBtn) {
          takePhotoBtn.hidden = false;
          takePhotoBtn.disabled = false;
        }

        showMessage("", "success");
      } catch (error) {
        console.error("Kamera gagal dibuka:", error);

        let text = "Kamera tidak dapat dibuka.";

        if (error.name === "NotAllowedError") {
          text = "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser.";
        } else if (error.name === "NotFoundError") {
          text = "Kamera tidak ditemukan pada perangkat ini.";
        } else if (error.name === "NotReadableError") {
          text = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut.";
        }

        showMessage(text);
        stopCamera();
      }
    });
  }

  if (closeCameraBtn) {
    closeCameraBtn.addEventListener("click", stopCamera);
  }

  if (takePhotoBtn) {
    takePhotoBtn.addEventListener("click", () => {
      if (!video || !canvas || !video.videoWidth) {
        showMessage("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        showMessage("Foto tidak dapat diproses oleh browser.");
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      capturedData = canvas.toDataURL("image/jpeg", 0.75);

      // Batas ukuran foto mengikuti batas formulir 900 KB.
      const approximateSize = Math.ceil(capturedData.length * 0.75);

      if (approximateSize > 900 * 1024) {
        capturedData = "";
        showMessage("Foto terlalu besar. Silakan ambil foto ulang.");
        return;
      }

      if (fileInput) {
        fileInput.value = "";
        fileInput.required = false;
      }

      showPhotoPreview(capturedData);

      if (retakePhotoBtn) retakePhotoBtn.hidden = false;

      stopCamera();
      showMessage("Foto berhasil diambil.", "success");
    });
  }

  if (retakePhotoBtn) {
    retakePhotoBtn.addEventListener("click", () => {
      resetPhoto();
      showMessage("Silakan ambil foto atau pilih foto dari galeri.", "info");
    });
  }

  /* =====================================================
     GPS
     ===================================================== */

  if (getLocationBtn) {
    getLocationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        showLocationMessage(
          "Browser ini tidak mendukung fitur GPS.",
          "error"
        );
        return;
      }

      getLocationBtn.disabled = true;
      showLocationMessage("Sedang mengambil lokasi GPS...", "info");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          if (latitudeInput) latitudeInput.value = lat.toFixed(6);
          if (longitudeInput) longitudeInput.value = lon.toFixed(6);

          showLocationMessage(
            "Lokasi berhasil diambil. Isi alamat atau patokan lokasi secara manual.",
            "success"
          );

          getLocationBtn.disabled = false;
        },
        (error) => {
          console.error("GPS gagal:", error);

          let text = "Gagal mengambil lokasi GPS.";

          if (error.code === 1) {
            text = "Izin lokasi ditolak. Izinkan akses lokasi melalui browser.";
          } else if (error.code === 2) {
            text = "Lokasi belum tersedia. Aktifkan layanan lokasi perangkat.";
          } else if (error.code === 3) {
            text = "GPS terlalu lama merespons. Coba lagi di area terbuka.";
          }

          showLocationMessage(text, "error");
          getLocationBtn.disabled = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    });
  }

  /* =====================================================
     KIRIM LAPORAN KE SUPABASE
     ===================================================== */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    if (!supabaseClient) {
      showMessage(
        "Supabase belum termuat. Periksa script CDN di lapor.html."
      );
      return;
    }

    const file = fileInput?.files?.[0] || null;

    if (!capturedData && !file) {
      showMessage("Silakan ambil foto atau pilih foto kerusakan.");
      return;
    }

    if (file && file.size > 900 * 1024) {
      showMessage("Ukuran foto maksimal 900 KB.");
      return;
    }

    const nama = document.getElementById("nama").value.trim();
    const kontak = document.getElementById("kontak").value.trim();
    const kategori = document.getElementById("kategori").value;
    const alamat = document.getElementById("alamat").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();

    if (!nama || !kontak || !kategori || !alamat || !deskripsi) {
      showMessage("Lengkapi semua data laporan terlebih dahulu.");
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalButtonText = button?.innerHTML;

    if (button) {
      button.disabled = true;
      button.textContent = "Mengirim laporan...";
    }

    let uploadedPhotoPath = null;

    try {
      const id = "SF-" + Date.now().toString().slice(-8);

      let photoBlob;
      let extension;

      if (capturedData) {
        const response = await fetch(capturedData);
        photoBlob = await response.blob();
        extension = "jpg";
      } else {
        photoBlob = file;
        extension =
          file.type === "image/png" ? "png" :
          file.type === "image/webp" ? "webp" : "jpg";
      }

      if (photoBlob.size > 900 * 1024) {
        throw new Error("Ukuran foto maksimal 900 KB.");
      }

      const contentType = photoBlob.type || "image/jpeg";
      uploadedPhotoPath = `${id}/${Date.now()}.${extension}`;

      // 1. Unggah foto ke bucket Storage.
      const { error: uploadError } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(uploadedPhotoPath, photoBlob, {
          contentType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: photoData } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadedPhotoPath);

      // 2. Siapkan data sesuai struktur public.laporan.
      const latValue = latitudeInput?.value.trim() || "";
      const lonValue = longitudeInput?.value.trim() || "";

      const report = {
        id,
        nama,
        kontak,
        kategori,
        alamat,
        lat: latValue ? Number(latValue) : null,
        lon: lonValue ? Number(lonValue) : null,
        deskripsi,
        foto_url: photoData.publicUrl,
        status: "Laporan Dikirim"
      };

      // 3. Simpan ke database Supabase.
      const { error: insertError } = await supabaseClient
        .from("laporan")
        .insert(report);

      if (insertError) throw insertError;

      // 4. Simpan salinan lokal untuk fitur tracking versi lama.
      saveLocalReport({
        ...report,
        foto: photoData.publicUrl,
        createdAt: new Date().toISOString()
      });

      alert(
        "Laporan berhasil dikirim ke database SiLaporFasum.\nNomor laporan: " +
        id
      );

      form.reset();
      resetPhoto();
      stopCamera();
      showLocationMessage("", "info");

      window.location.href = "lacak.html";
    } catch (error) {
      console.error("Pengiriman laporan gagal:", error);

      let text = error.message || "Terjadi kesalahan saat mengirim laporan.";

      if (
        /row-level security|permission denied|not allowed/i.test(text)
      ) {
        text += " Periksa kebijakan RLS tabel dan izin Storage di Supabase.";
      } else if (/bucket|storage/i.test(text)) {
        text += " Pastikan bucket foto-laporan tersedia dan kebijakan upload aktif.";
      }

      showMessage("Laporan gagal dikirim: " + text);
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButtonText || "Kirim Laporan →";
      }
    }
  });

  window.addEventListener("pagehide", stopCamera);
}

/* =====================================================
   PELACAKAN LOKAL
   Data ini hanya salinan pada browser yang sama.
   ===================================================== */

const trackForm = document.getElementById("trackForm");

if (trackForm) {
  trackForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const contact = document
      .getElementById("trackContact")
      .value.trim()
      .toLowerCase();

    const container = document.getElementById("trackResults");

    const found = getReports().filter(
      (report) => String(report.kontak || "").trim().toLowerCase() === contact
    );

    if (!found.length) {
      container.innerHTML = `
        <div class="panel">
          <p>Belum ada laporan dengan kontak tersebut pada data lokal browser ini.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = found.map((report) => `
      <article class="report-card">
        <div class="admin-row">
          <h3>${escapeHTML(report.kategori)} · ${escapeHTML(report.id)}</h3>
          <span class="status ${statusClass(report.status)}">
            ${escapeHTML(report.status)}
          </span>
        </div>
        <p><strong>Lokasi:</strong> ${escapeHTML(report.alamat)}</p>
        <p>${escapeHTML(report.deskripsi)}</p>
        <p><small>Dikirim ${escapeHTML(formatDate(report.createdAt || report.created_at))}</small></p>
        ${
          report.foto_url || report.foto
            ? `<img class="preview" src="${escapeHTML(report.foto_url || report.foto)}" alt="Foto laporan">`
            : ""
        }
      </article>
    `).join("");
  });
}

/* =====================================================
   HISTORI PUBLIK LAPORAN
   Hanya mengambil kolom yang aman ditampilkan.
   Email dan nomor kontak tidak diminta dari database.
   ===================================================== */
const historyList = document.getElementById("historyList");

if (historyList) {
  const historyMessage = document.getElementById("historyMessage");
  const historySearch = document.getElementById("historySearch");
  const historyStatus = document.getElementById("historyStatus");
  const refreshHistory = document.getElementById("refreshHistory");
  let publicReports = [];

  function initials(name) {
    const parts = String(name || "Pengguna").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "P";
  }

  function renderPublicHistory() {
    const search = String(historySearch?.value || "").trim().toLowerCase();
    const status = String(historyStatus?.value || "");
    const filtered = publicReports.filter((report) => {
      const haystack = [report.nama, report.kategori, report.alamat, report.deskripsi]
        .map((value) => String(value || "").toLowerCase()).join(" ");
      return haystack.includes(search) && (!status || String(report.status || "Laporan Dikirim") === status);
    });

    if (!filtered.length) {
      historyList.innerHTML = '<div class="history-empty">Tidak ada histori laporan yang cocok dengan pencarian.</div>';
      return;
    }

    historyList.innerHTML = filtered.map((report) => {
      const photo = report.foto_url
        ? `<img class="history-photo" src="${escapeHTML(report.foto_url)}" alt="Foto kerusakan: ${escapeHTML(report.kategori || "Fasilitas umum")}" loading="lazy" referrerpolicy="no-referrer">`
        : '<div class="history-photo-placeholder">Foto laporan tidak tersedia</div>';
      const statusValue = report.status || "Laporan Dikirim";
      const date = report.created_at || report.createdAt || report.tanggal;
      return `
        <article class="history-card">
          ${photo}
          <div class="history-content">
            <div class="history-meta">
              <div class="history-person"><span class="history-avatar" aria-hidden="true">${escapeHTML(initials(report.nama))}</span><span>${escapeHTML(report.nama || "Pengguna SiLaporFasum")}</span></div>
              <span class="history-status">${escapeHTML(statusValue)}</span>
            </div>
            <h2>${escapeHTML(report.kategori || "Laporan fasilitas umum")}</h2>
            <p class="history-detail"><strong>Lokasi:</strong> ${escapeHTML(report.alamat || "Lokasi tidak dicantumkan")}</p>
            <p class="history-detail">${escapeHTML(report.deskripsi || "Tidak ada deskripsi.")}</p>
            <p class="history-detail"><small>Nomor laporan: ${escapeHTML(report.id || "-")} · ${escapeHTML(formatDate(date))}</small></p>
          </div>
        </article>`;
    }).join("");
  }

  async function loadPublicHistory() {
    if (!supabaseClient) {
      historyMessage.textContent = "Koneksi Supabase belum tersedia. Periksa koneksi internet dan konfigurasi Supabase.";
      return;
    }

    historyMessage.textContent = "Memuat histori laporan...";
    historyList.innerHTML = "";

    try {
      // Jangan mengambil kolom kontak/email agar tidak ikut dikirim ke halaman publik.
      let result = await supabaseClient
        .from("laporan")
        .select("id,nama,kategori,alamat,deskripsi,foto_url,status,created_at")
        .order("created_at", { ascending: false });

      // Fallback jika tabel lama belum memiliki kolom created_at.
      if (result.error && /created_at|column/i.test(result.error.message || "")) {
        result = await supabaseClient
          .from("laporan")
          .select("id,nama,kategori,alamat,deskripsi,foto_url,status")
          .order("id", { ascending: false });
      }

      if (result.error) throw result.error;
      publicReports = Array.isArray(result.data) ? result.data : [];
      historyMessage.textContent = publicReports.length
        ? `Menampilkan ${publicReports.length} laporan dari database SiLaporFasum.`
        : "Belum ada laporan yang tersimpan di database.";
      renderPublicHistory();
    } catch (error) {
      console.error("Gagal memuat histori publik:", error);
      historyMessage.textContent = "Histori belum dapat dimuat. Pastikan tabel laporan memiliki kebijakan SELECT yang sesuai di Supabase.";
      historyList.innerHTML = '<div class="history-empty">Data tidak dapat ditampilkan. Periksa struktur tabel dan izin baca (RLS) Supabase.</div>';
    }
  }

  historySearch?.addEventListener("input", renderPublicHistory);
  historyStatus?.addEventListener("change", renderPublicHistory);
  refreshHistory?.addEventListener("click", loadPublicHistory);
  loadPublicHistory();
}
