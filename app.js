const STORE_KEY = "silaporfasum_reports_v1";
const getReports = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; } };
const saveReports = reports => localStorage.setItem(STORE_KEY, JSON.stringify(reports));
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateText = value => new Date(value).toLocaleString("id-ID", {dateStyle:"medium",timeStyle:"short"});
const statusClass = status => status.toLowerCase().replaceAll(" ","-").replaceAll("/","-");
let cameraStream = null;
let capturedData = "";

const form = document.getElementById("reportForm");
if (form) {
  const fileInput = document.getElementById("foto");
  const preview = document.getElementById("preview");
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const message = document.getElementById("formMessage");
  fileInput.addEventListener("change", () => {
    capturedData = "";
    const file = fileInput.files[0];
    if (!file) { preview.hidden = true; return; }
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      fileInput.value = ""; preview.hidden = true; message.textContent = "Format foto harus JPG, PNG, atau WebP."; return;
    }
    if (file.size > 900 * 1024) {
      fileInput.value = ""; preview.hidden = true; message.textContent = "Ukuran foto maksimal 900 KB."; return;
    }
    const reader = new FileReader();
    reader.onload = () => { preview.src = reader.result; preview.hidden = false; };
    reader.readAsDataURL(file);
    message.textContent = "";
  });
  document.getElementById("openCamera").addEventListener("click", async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
      video.srcObject = cameraStream; video.hidden = false;
      document.getElementById("takePhoto").disabled = false;
      message.textContent = "";
    } catch (e) { message.textContent = "Kamera tidak tersedia. Coba gunakan HTTPS atau pilih foto dari perangkat."; }
  });
  const stopCamera = () => { if(cameraStream) cameraStream.getTracks().forEach(t => t.stop()); cameraStream=null; video.srcObject=null; video.hidden=true; document.getElementById("takePhoto").disabled=true; };
  document.getElementById("closeCamera").addEventListener("click", stopCamera);
  document.getElementById("takePhoto").addEventListener("click", () => {
    if (!video.videoWidth) return;
    canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    canvas.getContext("2d").drawImage(video,0,0);
    capturedData=canvas.toDataURL("image/jpeg",0.78);
    if (capturedData.length > 1_200_000) { message.textContent="Foto terlalu besar untuk demo. Silakan ambil foto ulang."; return; }
    preview.src=capturedData; preview.hidden=false; fileInput.required=false;
    document.getElementById("retakePhoto").hidden=false;
    stopCamera(); message.textContent="Foto berhasil diambil.";
  });
  document.getElementById("retakePhoto").addEventListener("click", () => { capturedData=""; preview.hidden=true; fileInput.required=true; document.getElementById("retakePhoto").hidden=true; });
  document.getElementById("getLocation").addEventListener("click", () => {
    const info=document.getElementById("locationMessage");
    if (!navigator.geolocation) { info.textContent="Browser tidak mendukung fitur lokasi."; return; }
    info.textContent="Sedang mengambil lokasi...";
    navigator.geolocation.getCurrentPosition(pos => {
      document.getElementById("lat").value=pos.coords.latitude.toFixed(6);
      document.getElementById("lon").value=pos.coords.longitude.toFixed(6);
      info.textContent="Lokasi berhasil diambil. Isi alamat/patokan lokasi secara manual.";
    }, () => info.textContent="Lokasi gagal diambil. Pastikan izin lokasi aktif dan gunakan HTTPS.", {enableHighAccuracy:true,timeout:12000});
  });
  form.addEventListener("submit", async e => {
    e.preventDefault(); message.textContent="";
    const file=fileInput.files[0];
    if (!capturedData && !file) { message.textContent="Silakan pilih atau ambil foto kerusakan."; return; }
    let photo=capturedData;
    if (!photo && file) {
      if(file.size>900*1024){message.textContent="Ukuran foto maksimal 900 KB.";return;}
      photo=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
    }
    const reports=getReports();
    const report={id:"SF-"+Date.now().toString().slice(-8),nama:document.getElementById("nama").value.trim(),kontak:document.getElementById("kontak").value.trim(),kategori:document.getElementById("kategori").value,alamat:document.getElementById("alamat").value.trim(),lat:document.getElementById("lat").value.trim(),lon:document.getElementById("lon").value.trim(),deskripsi:document.getElementById("deskripsi").value.trim(),foto:photo,status:"Laporan Dikirim",createdAt:new Date().toISOString()};
    reports.unshift(report);
    try { saveReports(reports); }
    catch(err) { message.textContent="Penyimpanan browser penuh. Coba gunakan foto yang lebih kecil."; return; }
    alert("Laporan demo berhasil disimpan di browser ini. Nomor laporan: "+report.id);
    form.reset(); capturedData=""; preview.hidden=true; fileInput.required=true; document.getElementById("retakePhoto").hidden=true; stopCamera();
    location.href="lacak.html";
  });
}

const trackForm=document.getElementById("trackForm");
if(trackForm){
  trackForm.addEventListener("submit",e=>{
    e.preventDefault();
    const contact=document.getElementById("trackContact").value.trim().toLowerCase();
    const found=getReports().filter(r=>r.kontak.toLowerCase()===contact);
    const container=document.getElementById("trackResults");
    if(!found.length){container.innerHTML='<div class="panel"><p>Belum ada laporan dengan email atau nomor kontak tersebut di browser ini.</p></div>';return;}
    container.innerHTML=found.map(r=>`<article class="report-card"><div class="admin-row"><h3>${esc(r.kategori)} · ${esc(r.id)}</h3><span class="status ${statusClass(r.status)}">${esc(r.status)}</span></div><p><strong>Lokasi:</strong> ${esc(r.alamat)}</p><p>${esc(r.deskripsi)}</p><p><small>Dikirim ${dateText(r.createdAt)}</small></p>${r.foto?`<img class="preview" src="${r.foto}" alt="Foto laporan">`:""}</article>`).join("");
  });
}
const adminList=document.getElementById("adminList");
if(adminList){
  const renderAdmin=()=>{
    const reports=getReports();
    if(!reports.length){adminList.innerHTML='<div class="panel">Belum ada laporan demo. Coba buat laporan terlebih dahulu.</div>';return;}
    adminList.innerHTML=reports.map(r=>`<article class="report-card"><div class="admin-row"><div><h3>${esc(r.kategori)} · ${esc(r.id)}</h3><p><strong>${esc(r.nama)}</strong> · ${esc(r.kontak)}</p><p>${esc(r.alamat)}</p><p>${esc(r.deskripsi)}</p><p><small>${dateText(r.createdAt)}${r.lat&&r.lon?" · "+esc(r.lat)+", "+esc(r.lon):""}</small></p></div><div><label>Ubah status<select data-id="${esc(r.id)}"><option ${r.status==="Laporan Dikirim"?"selected":""}>Laporan Dikirim</option><option ${r.status==="Diverifikasi"?"selected":""}>Diverifikasi</option><option ${r.status==="Sedang Diproses"?"selected":""}>Sedang Diproses</option><option ${r.status==="Selesai Diperbaiki"?"selected":""}>Selesai Diperbaiki</option></select></label></div></div>${r.foto?`<img class="preview" src="${r.foto}" alt="Foto laporan">`:""}</article>`).join("");
    adminList.querySelectorAll("select[data-id]").forEach(sel=>sel.addEventListener("change",()=>{const all=getReports();const item=all.find(x=>x.id===sel.dataset.id);if(item){item.status=sel.value;saveReports(all);renderAdmin();}}));
  }; renderAdmin();
}