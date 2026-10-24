/* SiLaporFasum PWA: instalasi dan cache offline untuk berkas statis. */
(() => {
  "use strict";

  let installPromptEvent = null;
  const installButtons = Array.from(document.querySelectorAll("[data-install-app]"));
  const helpPanels = Array.from(document.querySelectorAll("[data-install-help]"));
  const closeButtons = Array.from(document.querySelectorAll("[data-close-install-help]"));

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function showHelp() {
    helpPanels.forEach((panel) => {
      panel.hidden = false;
    });
  }

  function hideHelp() {
    helpPanels.forEach((panel) => {
      panel.hidden = true;
    });
  }

  function setInstalledState() {
    installButtons.forEach((button) => {
      button.disabled = true;
      button.innerHTML = '<span aria-hidden="true">✓</span> Aplikasi Terpasang';
      button.setAttribute("aria-label", "SiLaporFasum sudah terpasang");
    });
  }

  if (isStandalone()) setInstalledState();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPromptEvent = event;
    installButtons.forEach((button) => {
      button.innerHTML = '<span aria-hidden="true">↓</span> Instal Aplikasi';
      button.dataset.installReady = "true";
    });
  });

  installButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (isStandalone()) {
        setInstalledState();
        return;
      }

      if (!installPromptEvent) {
        showHelp();
        return;
      }

      installPromptEvent.prompt();
      try {
        const choice = await installPromptEvent.userChoice;
        if (choice && choice.outcome === "accepted") {
          button.textContent = "Memproses instalasi…";
        }
      } catch (error) {
        console.info("Dialog instalasi ditutup atau tidak tersedia.", error);
      } finally {
        installPromptEvent = null;
      }
    });
  });

  closeButtons.forEach((button) => button.addEventListener("click", hideHelp));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideHelp();
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    hideHelp();
    setInstalledState();
  });

  const year = document.getElementById("currentYear");
  if (year) year.textContent = String(new Date().getFullYear());

  if ("serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .catch((error) => console.warn("Service worker belum bisa didaftarkan:", error));
    });
  }
})();
