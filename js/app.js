/* app.js — UI interactions: nav state, mobile menu, scroll reveals, stat count-up */
(function () {
  "use strict";

  // --- Nav background on scroll ---
  var nav = document.querySelector(".nav");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // --- Mobile menu ---
  var menuBtn = document.querySelector(".menu-btn");
  var links = document.querySelector(".nav .links");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  // --- Reveal on scroll ---
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // --- Stat count-up ---
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stats = document.querySelectorAll(".stat .n[data-to]");
  function countUp(el) {
    var to = parseFloat(el.getAttribute("data-to"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduceMotion) { el.textContent = prefix + to + suffix; return; }
    var start = null, dur = 1300;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = to % 1 === 0 ? Math.round(to * eased) : (to * eased).toFixed(1);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); sio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (s) { sio.observe(s); });
  } else {
    stats.forEach(countUp);
  }

  // --- Under-the-hood modals ---
  var openModal = null;
  function open(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    openModal = m;
    var closeBtn = m.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    if (!openModal) return;
    openModal.classList.remove("open");
    openModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    openModal = null;
  }
  document.querySelectorAll(".p-expand[data-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () { open(btn.getAttribute("data-modal")); });
  });
  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", close);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openModal) close();
  });

  // --- Year in footer ---
  var yr = document.getElementById("year");
  if (yr) yr.textContent = "2026";
})();
