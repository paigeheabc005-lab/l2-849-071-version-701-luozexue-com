(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "").trim();
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
      button.setAttribute("aria-expanded", menu.classList.contains("is-open") ? "true" : "false");
    });
  }

  function initHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function activate(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        activate(dotIndex);
        start();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    activate(0);
    start();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
      var inputs = Array.prototype.slice.call(panel.querySelectorAll("input, select"));
      var emptyState = document.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");
      var keywordInput = panel.querySelector("[data-filter-keyword]");
      if (query && keywordInput && !keywordInput.value) {
        keywordInput.value = query;
      }

      function apply() {
        var keyword = normalize(keywordInput ? keywordInput.value : "");
        var region = normalize((panel.querySelector("[data-filter-region]") || {}).value);
        var genre = normalize((panel.querySelector("[data-filter-genre]") || {}).value);
        var year = normalize((panel.querySelector("[data-filter-year]") || {}).value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-year"),
            card.getAttribute("data-tags")
          ].join(" "));
          var match = true;
          if (keyword && haystack.indexOf(keyword) === -1) {
            match = false;
          }
          if (region && normalize(card.getAttribute("data-region")).indexOf(region) === -1) {
            match = false;
          }
          if (genre && normalize(card.getAttribute("data-genre")).indexOf(genre) === -1 && normalize(card.getAttribute("data-tags")).indexOf(genre) === -1) {
            match = false;
          }
          if (year && normalize(card.getAttribute("data-year")) !== year) {
            match = false;
          }
          card.style.display = match ? "" : "none";
          if (match) {
            visible += 1;
          }
        });

        if (emptyState) {
          emptyState.classList.toggle("is-visible", visible === 0);
        }
      }

      inputs.forEach(function (input) {
        input.addEventListener("input", apply);
        input.addEventListener("change", apply);
      });
      apply();
    });
  }

  function initPlayer() {
    var holder = document.querySelector("[data-player]");
    if (!holder) {
      return;
    }
    var video = holder.querySelector("video");
    var cover = holder.querySelector("[data-player-cover]");
    var button = holder.querySelector("[data-play-button]");
    var hlsInstance = null;
    var isReady = false;

    if (!video) {
      return;
    }

    function bindStream() {
      if (isReady) {
        return;
      }
      var stream = video.getAttribute("data-stream");
      if (!stream) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else {
        video.src = stream;
      }
      isReady = true;
    }

    function play() {
      bindStream();
      if (cover) {
        cover.classList.add("is-hidden");
      }
      var playAction = video.play();
      if (playAction && typeof playAction.catch === "function") {
        playAction.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener("click", play);
    }
    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        play();
      });
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (cover) {
        cover.classList.add("is-hidden");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayer();
  });
})();
