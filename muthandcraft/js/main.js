/* Muth & Craft — site interactions */
(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
      var expanded = links.classList.contains("open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); });
    });
  }

  // Reveal-on-scroll
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Current year in footer
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // Contact form — client-side enhancement.
  // By default the form posts to a Formspree endpoint (set in the action attr).
  // If no real endpoint is configured, fall back to a mailto: link so leads are never lost.
  var form = document.querySelector("#contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (ev) {
      var action = form.getAttribute("action") || "";
      var notConfigured = action.indexOf("YOUR_FORM_ID") !== -1 || action === "";
      if (notConfigured) {
        ev.preventDefault();
        var data = new FormData(form);
        var subject = encodeURIComponent("Project inquiry — " + (data.get("service") || "General"));
        var body = encodeURIComponent(
          "Name: " + (data.get("name") || "") + "\n" +
          "Phone: " + (data.get("phone") || "") + "\n" +
          "Email: " + (data.get("email") || "") + "\n" +
          "Service: " + (data.get("service") || "") + "\n\n" +
          (data.get("message") || "")
        );
        window.location.href = "mailto:hello@muthandcraft.com?subject=" + subject + "&body=" + body;
        if (status) { status.textContent = "Opening your email app… or call us directly at (203) 555-0142."; status.classList.add("ok"); }
        return;
      }
      // Real endpoint: let it submit, show optimistic message.
      if (status) { status.textContent = "Sending your request…"; }
    });
  }
})();
