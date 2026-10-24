
"use strict";

/* =========================================================
   KONFIGURASI SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://ytasgufassdscmxnjeyr.supabase.co";
const SUPABASE_KEY = "sb_publishable_NJw5OMlXyxk6MY5vb3eovw_LMsuclg2";

const STORE_KEY = "silaporfasum_reports_v1";
const STORAGE_BUCKET = "foto-laporan";

let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === "function") {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
}

/* =========================================================
   PENYIMPANAN LOKAL
   ========================================================= */

function getReports() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch (error) {
    console.error("Gagal membaca data lokal:", error);
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(STORE_KEY, JSON.stringify(reports));
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
    console.warn("Salinan lokal tidak tersimpan:", error);
  }
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

/* =========================================================
   FORM LAPORAN, KAMERA, DAN GPS
   ========================================================= */

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
  const addressInput = document.getElementById("alamat");

  let cameraStream = null;
  let capturedData = "";

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
    if (takePhotoBtn) takePhotoBtn.hidden = true;
  }

  function showPhotoPreview(source) {
    if (!preview) return;

    // Mendukung elemen img maupun container preview.
    if (preview.tagName === "IMG") {
      preview.src = source;
    } else {
      let image = preview.querySelector("img");

      if (!image) {
        image = document.createElement("img");
        image.alt = "Preview foto kerusakan";
        image.style.maxWidth = "100%";
        image.style.maxHeight = "320px";
        image.style.objectFit = "contain";
        preview.replaceChildren(image);
      }

      image.src = source;
    }

    preview.hidden = false;
  }

  function resetPhoto() {
    capturedData = "";

    if (fileInput) {
      fileInput.value = "";
      fileInput.required = true;
    }

    if (preview) {
      preview.hidden = true;

      if (preview.tagName === "IMG") {
        preview.removeAttribute("src");
      } else {
        preview.replaceChildren();
      }
    }

    if (retakePhotoBtn) retakePhotoBtn.hidden = true;
  }

  // -------------------------
  // PILIH FOTO DARI GALERI
  // -------------------------

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];

      if (!file) return;

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

  // -------------------------
  // BUKA KAMERA
  // -------------------------

  if (openCameraBtn) {
    openCameraBtn.addEventListener("click", async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        showMessage(
          "Kamera tidak didukung browser ini. Buka website melalui HTTPS dan gunakan browser terbaru."
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

        if (openCameraBtn) openCameraBtn.hidden = true;
        if (closeCameraBtn) closeCameraBtn.hidden = false;
        if (takePhotoBtn) takePhotoBtn.hidden = false;

        showMessage("", "success");
      } catch (error) {
        console.error("Kamera gagal dibuka:", error);

        let errorText = "Kamera tidak bisa dibuka.";

        if (error.name === "NotAllowedError") {
          errorText = "Izin kamera ditolak. Izinkan kamera melalui pengaturan browser.";
        } else if (error.name === "NotFoundError") {
          errorText = "Kamera tidak ditemukan pada perangkat ini.";
        } else if (error.name === "NotReadableError") {
          errorText = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.";
        }

        showMessage(errorText);
        stopCamera();
      }
    });
  }

  // -------------------------
  // TUTUP KAMERA
  // -------------------------

  if (closeCameraBtn) {
    closeCameraBtn.addEventListener("click", () => {
      stopCamera();
    });
  }

  // -------------------------
  // AMBIL FOTO DARI KAMERA
  // -------------------------

  if (takePhotoBtn) {
    takePhotoBtn.addEventListener("click", () => {
      if (!video || !canvas || !video.videoWidth) {
        showMessage("Kamera belum siap. Tunggu beberapa saat lalu coba lagi.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        showMessage("Tidak bisa memproses foto pada browser ini.");
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      capturedData = canvas.toDataURL("image/jpeg", 0.75);

      const photoSize = Math.ceil(
        (capturedData.length * 3) / 4
      );

      if (photoSize > 900 * 1024) {
        capturedData = "";
        showMessage(
          "Ukuran foto terlalu besar. Silakan ambil foto ulang."
        );
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

  // -------------------------
  // AMBIL ULANG FOTO
  // -------------------------

  if (retakePhotoBtn) {
    retakePhotoBtn.addEventListener("click", () => {
      resetPhoto();
      showMessage("Silakan ambil foto atau pilih foto dari galeri.", "info");
    });
  }

  // -------------------------
  // AMBIL LOKASI GPS
  // -------------------------

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

          if (latitudeInput) latitudeInput.value = lat;
          if (longitudeInput) longitudeInput.value = lon;

          showLocationMessage(
            `Lokasi berhasil ditemukan: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            "success"
          );

          getLocationBtn.disabled = false;
        },
        (error) => {
          console.error("GPS gagal:", error);

          let errorText = "Gagal mengambil lokasi GPS.";

          if (error.code === 1) {
            errorText = "Izin lokasi ditolak. Izinkan akses lokasi pada pengaturan browser.";
          } else if (error.code === 2) {
            errorText = "Lokasi belum tersedia. Aktifkan layanan lokasi perangkat lalu coba lagi.";
          } else if (error.code === 3) {
            errorText = "GPS terlalu lama merespons. Coba lagi di area terbuka.";
          }

          showLocationMessage(errorText, "error");
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

  // -------------------------
  // KIRIM LAPORAN KE SUPABASE
  // -------------------------

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    if (!supabaseClient) {
      showMessage(
        "Supabase belum dimuat. Periksa script CDN pada lapor.html lalu muat ulang halaman."
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

    const nama = document.getElementById("nama")?.value.trim() || "";
    const kontak = document.getElementById("kontak")?.value.trim() || "";
    const kategori = document.getElementById("kategori")?.value || "";
    const alamat = addressInput?.value.trim() || "";
    const deskripsi = document.getElementById("deskripsi")?.value.trim() || "";

    if (!nama || !kontak || !kategori || !alamat || !deskripsi) {
      showMessage("Lengkapi semua data laporan terlebih dahulu.");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonHTML = submitButton?.innerHTML;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Mengirim laporan...";
    }

    const id = "SF-" + Date.now().toString().slice(-8);
    let photoPath = null;

    try {
      let photoBlob;
      let extension;

      if (capturedData) {
        const response = await fetch(capturedData);
        photoBlob = await response.blob();
        extension = "jpg";
      } else {
        photoBlob = file;
        extension =
          file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
              ? "webp"
              : "jpg";
      }

      if (photoBlob.size > 900 * 1024) {
        throw new Error("Ukuran foto maksimal 900 KB.");
      }

      const contentType =
        photoBlob.type ||
        file?.type ||
        "image/jpeg";

      photoPath = `${id}/${Date.now()}.${extension}`;

      // Upload foto ke Supabase Storage.
      const { error: uploadError } = await supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .upload(photoPath, photoBlob, {
          contentType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: photoData } = supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(photoPath);

      const latitude = latitudeInput?.value.trim();
      const longitude = longitudeInput?.value.trim();

      const report = {
        id,
        nama,
        kontak,
        kategori,
        alamat,
        lat: latitude ? Number(latitude) : null,
        lon: longitude ? Number(longitude) : null,
        deskripsi,
        foto_url: photoData.publicUrl,
        status: "Laporan Dikirim"
      };

      // Simpan laporan ke tabel public.laporan.
      const { error: insertError } = await supabaseClient
        .from("laporan")
        .insert(report);

      if (insertError) throw insertError;

      // Simpan salinan untuk fitur pelacakan lama di browser ini.
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
      capturedData = "";
      resetPhoto();
      stopCamera();
      showLocationMessage("");
      showMessage("");

      window.location.href = "lacak.html";
    } catch (error) {
      console.error("Pengiriman laporan gagal:", error);

      let errorText = error?.message || "Terjadi kesalahan yang tidak diketahui.";

      if (
        errorText.toLowerCase().includes("bucket") ||
        errorText.toLowerCase().includes("storage")
      ) {
        errorText +=
          " Pastikan bucket foto-laporan tersedia dan izin upload Storage sudah diatur.";
      } else if (
        errorText.toLowerCase().includes("row-level security") ||
        errorText.toLowerCase().includes("permission")
      ) {
        errorText +=
          " Periksa kebijakan RLS tabel laporan dan Storage di Supabase.";
      }

      showMessage("Laporan gagal dikirim: " + errorText);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML =
          originalButtonHTML || 'Kirim Laporan <span>→</span>';
      }
    }
  });

  // Pastikan kamera berhenti saat halaman ditinggalkan.
  window.addEventListener("pagehide", stopCamera);
}

/* =========================================================
   PELACAKAN LAPORAN LOKAL
   ========================================================= */

const trackForm = document.getElementById("trackForm");

if (trackForm) {
  const contactInput = document.getElementById("trackContact");
  const resultsContainer = document.getElementById("trackResults");

  trackForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!resultsContainer || !contactInput) return;

    const contact = contactInput.value.trim();

    const matches = getReports().filter(
      (report) => String(report.kontak || "").trim() === contact
    );

    if (matches.length === 0) {
      resultsContainer.innerHTML =
        '<p class="empty-state">Laporan tidak ditemukan pada data lokal browser ini. Pastikan kontak benar atau gunakan browser yang sama dengan saat mengirim laporan.</p>';
      return;
    }

    resultsContainer.innerHTML = matches.map((report) => `
      <article class="report-card">
        <h3>${escapeHTML(report.id)}</h3>
        <p><strong>Kategori:</strong> ${escapeHTML(report.kategori)}</p>
        <p><strong>Alamat:</strong> ${escapeHTML(report.alamat)}</p>
        <p><strong>Status:</strong> ${escapeHTML(report.status || "Laporan Dikirim")}</p>
        <p><strong>Tanggal:</strong> ${escapeHTML(formatDate(report.createdAt || report.created_at))}</p>
        <p>${escapeHTML(report.deskripsi)}</p>
        ${
          report.foto_url || report.foto
            ? `<img src="${escapeHTML(report.foto_url || report.foto)}" alt="Foto laporan" style="max-width:100%;max-height:240px;object-fit:contain;">`
            : ""
        }
      </article>
    `).join("");
  });
}

/* =========================================================
   DAFTAR LAPORAN LOKAL UNTUK HALAMAN DEMO ADMIN
   ========================================================= */

const adminList = document.getElementById("adminList");

if (adminList) {
  function renderAdminList() {
    const reports = getReports();

    if (reports.length === 0) {
      adminList.innerHTML =
        '<p class="empty-state">Belum ada laporan pada penyimpanan lokal browser ini.</p>';
      return;
    }

    adminList.innerHTML = reports.map((report) => `
      <article class="report-card" data-report-id="${escapeHTML(report.id)}">
        <h3>${escapeHTML(report.id)}</h3>
        <p><strong>Nama:</strong> ${escapeHTML(report.nama)}</p>
        <p><strong>Kontak:</strong> ${escapeHTML(report.kontak)}</p>
        <p><strong>Kategori:</strong> ${escapeHTML(report.kategori)}</p>
        <p><strong>Alamat:</strong> ${escapeHTML(report.alamat)}</p>
        <p><strong>Status:</strong> ${escapeHTML(report.status || "Laporan Dikirim")}</p>
        <p>${escapeHTML(report.deskripsi)}</p>
        ${
          report.foto_url || report.foto
            ? `<img src="${escapeHTML(report.foto_url || report.foto)}" alt="Foto laporan" style="max-width:100%;max-height:240px;object-fit:contain;">`
            : ""
        }
        <label>
          Ubah status (lokal)
          <select class="local-status-select" data-report-id="${escapeHTML(report.id)}">
            ${[
              "Laporan Dikirim",
              "Diverifikasi",
              "Sedang Diproses",
              "Selesai Diperbaiki"
            ].map((status) => `
              <option value="${escapeHTML(status)}" ${report.status === status ? "selected" : ""}>
                ${escapeHTML(status)}
              </option>
            `).join("")}
          </select>
        </label>
        <button type="button" class="save-local-status" data-report-id="${escapeHTML(report.id)}">
          Simpan Status Lokal
        </button>
      </article>
    `).join("");
  }

  adminList.addEventListener("click", (event) => {
    const button = event.target.closest(".save-local-status");

    if (!button) return;

    const reportId = button.dataset.reportId;
    const card = button.closest("[data-report-id]");
    const select = card?.querySelector(".local-status-select");

    if (!select) return;

    const reports = getReports();
    const report = reports.find((item) => item.id === reportId);

    if (!report) return;

    report.status = select.value;
    saveReports(reports);
    renderAdminList();

    alert("Status berhasil diubah pada data lokal browser ini.");
  });

  renderAdminList();
}
