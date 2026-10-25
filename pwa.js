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

  // Navigasi yang ringkas dan mudah digunakan pada layar ponsel.
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNavigation = document.querySelector("#main-navigation");
  if (menuToggle && mainNavigation) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      menuToggle.setAttribute("aria-label", expanded ? "Buka menu navigasi" : "Tutup menu navigasi");
      mainNavigation.classList.toggle("is-open", !expanded);
    });
    mainNavigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNavigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Buka menu navigasi");
      });
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) {
        mainNavigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Buka menu navigasi");
      }
    });
  }

  // Elemen muncul dengan halus ketika pengguna menggulir halaman.
  const revealTargets = document.querySelectorAll(
    "main > section, .page-heading, .panel, .feature, .history-card, .install-banner, .trust-item, .track-help, .notice"
  );
  revealTargets.forEach((element) => element.classList.add("reveal-on-scroll"));
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

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
