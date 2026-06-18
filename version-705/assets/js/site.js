(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var button = document.querySelector(".mobile-menu-button");
    var nav = document.querySelector(".site-nav");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var root = document.querySelector("[data-hero-carousel]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }
    restart();
  }

  function fillFilterOptions(list, selector, attr) {
    var select = document.querySelector(selector);
    if (!select) {
      return;
    }
    var values = [];
    list.forEach(function (item) {
      var value = item.getAttribute(attr) || "";
      if (value && values.indexOf(value) === -1) {
        values.push(value);
      }
    });
    values.sort(function (a, b) {
      return String(b).localeCompare(String(a), "zh-Hans-CN");
    });
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function setupFilters() {
    var list = document.querySelector("[data-filter-list]");
    if (!list) {
      return;
    }
    var items = Array.prototype.slice.call(list.querySelectorAll(".movie-card, .rank-item"));
    var input = document.querySelector("[data-search-input]");
    var region = document.querySelector("[data-region-filter]");
    var year = document.querySelector("[data-year-filter]");
    var empty = document.querySelector("[data-empty-result]");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q");

    fillFilterOptions(items, "[data-region-filter]", "data-region");
    fillFilterOptions(items, "[data-year-filter]", "data-year");

    if (input && initial) {
      input.value = initial;
    }

    function filter() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var regionValue = region ? region.value : "";
      var yearValue = year ? year.value : "";
      var visible = 0;
      items.forEach(function (item) {
        var text = [
          item.getAttribute("data-title"),
          item.getAttribute("data-region"),
          item.getAttribute("data-year"),
          item.getAttribute("data-category"),
          item.getAttribute("data-tags"),
          item.textContent
        ].join(" ").toLowerCase();
        var ok = true;
        if (query && text.indexOf(query) === -1) {
          ok = false;
        }
        if (regionValue && item.getAttribute("data-region") !== regionValue) {
          ok = false;
        }
        if (yearValue && item.getAttribute("data-year") !== yearValue) {
          ok = false;
        }
        item.style.display = ok ? "" : "none";
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    [input, region, year].forEach(function (control) {
      if (control) {
        control.addEventListener("input", filter);
        control.addEventListener("change", filter);
      }
    });
    filter();
  }

  window.initializeMoviePlayer = function (streamUrl, videoId, overlayId) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    if (!video || !overlay || !streamUrl) {
      return;
    }
    var attached = false;
    var hlsPlayer = null;

    function attach() {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsPlayer = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hlsPlayer.loadSource(streamUrl);
        hlsPlayer.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function start() {
      attach();
      overlay.classList.add("is-hidden");
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          overlay.classList.remove("is-hidden");
        });
      }
    }

    overlay.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener("play", function () {
      overlay.classList.add("is-hidden");
    });
    window.addEventListener("pagehide", function () {
      if (hlsPlayer) {
        hlsPlayer.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
