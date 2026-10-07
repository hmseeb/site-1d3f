/* =========================================================
   Summit Ridge Plumbing — Site scripts
   - Mobile nav toggle
   - Sticky header shadow
   - Footer year
   - LeadrVision form handling (plain POST + fetch with inline confirmation)
   ========================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initStickyHeader();
    initYear();
    initFaq();
    initForm();
  });

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      nav.classList.toggle("is-open", !open);
    });

    // Close the menu after clicking a link (mobile UX)
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (link && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // Close the menu when resizing up to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760 && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Sticky header shadow ---------- */
  function initStickyHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------- FAQ: keep only one panel open at a time ---------- */
  function initFaq() {
    var items = document.querySelectorAll("#faqList details");
    if (!items.length) return;
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ---------- LeadrVision form handling ---------- */
  function initForm() {
    var form = document.getElementById("contactForm");
    var successBox = document.getElementById("formSuccess");
    var errorBox = document.getElementById("formError");

    // 1) Set the hidden _page field so visitors return to the right page.
    setPageField();

    // 2) Plain HTML submission returns here with ?submitted=1 — show confirmation.
    if (hasSubmittedParam()) {
      showSuccess();
      // Clean the URL so a refresh doesn't re-trigger the message.
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.delete("submitted");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    }

    if (!form) return;

    // 3) Progressive enhancement: submit via fetch to the same LeadrVision endpoint.
    form.addEventListener("submit", function (e) {
      // Native validation still applies for fetch submissions.
      if (typeof form.checkValidity === "function" && !form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }

      if (!window.fetch) return; // Fall back to the plain HTML POST.

      e.preventDefault();
      if (errorBox) errorBox.hidden = true;

      setPageField();
      var action = form.getAttribute("action");
      var data = new FormData(form);
      // Ensure _page is present in the JSON body too.
      data.set("_page", window.location.href);

      var payload = {};
      data.forEach(function (value, key) {
        payload[key] = value;
      });

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = "Sending\u2026";
      }

      fetch(action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () {
            return { ok: res.ok };
          });
        })
        .then(function (json) {
          if (json && json.ok) {
            showSuccess();
          } else {
            throw new Error("Submission failed");
          }
        })
        .catch(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.label || "Send Message";
          }
          if (errorBox) errorBox.hidden = false;
        });
    });

    function showSuccess() {
      if (form) form.hidden = true;
      if (errorBox) errorBox.hidden = true;
      if (successBox) {
        successBox.hidden = false;
        successBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  /* ---------- Helpers ---------- */
  function setPageField() {
    // Sets any hidden field named "_page" to the current URL on page load.
    var fields = document.querySelectorAll('input[type="hidden"][name="_page"]');
    fields.forEach(function (field) {
      field.value = window.location.href;
    });
  }

  function hasSubmittedParam() {
    try {
      return new URL(window.location.href).searchParams.get("submitted") === "1";
    } catch (err) {
      return window.location.search.indexOf("submitted=1") !== -1;
    }
  }
})();
