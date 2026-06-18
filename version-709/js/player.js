(function () {
  function setupPlayer(shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('.play-overlay');
    var status = shell.querySelector('.player-status');
    var streamUrl = video ? video.getAttribute('data-stream') : '';
    var loaded = false;
    var hlsInstance = null;

    if (!video || !streamUrl) {
      return;
    }

    function setStatus(message) {
      if (status) {
        status.textContent = message || '';
      }
    }

    function loadStream() {
      if (loaded) {
        return;
      }

      loaded = true;
      setStatus('正在加载');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        setStatus('');
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);

        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus('');
        });

        hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            setStatus('播放暂时不可用');
          }
        });

        return;
      }

      video.src = streamUrl;
      setStatus('');
    }

    function startPlayback() {
      loadStream();
      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          shell.classList.remove('is-playing');
        });
      }
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        startPlayback();
      });
    }

    shell.addEventListener('click', function (event) {
      if (event.target === video || event.target === button || button && button.contains(event.target)) {
        return;
      }

      startPlayback();
    });

    video.addEventListener('play', function () {
      shell.classList.add('is-playing');
      setStatus('');
    });

    video.addEventListener('pause', function () {
      shell.classList.remove('is-playing');
    });

    video.addEventListener('ended', function () {
      shell.classList.remove('is-playing');
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.querySelectorAll('[data-player]').forEach(setupPlayer);
})();
