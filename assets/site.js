// WalkMeasure — presentation site. No trackers, no cookies, no external requests.
(function () {
  document.documentElement.classList.remove("no-js");

  // Every load starts at the top: no restored scroll position after a
  // refresh, and no jump to a section left in the address (#pricing).
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var hadHash = location.hash !== "";
  if (hadHash) history.replaceState(null, "", location.pathname + location.search);
  function toTop() {
    // "instant": the page's smooth scrolling would otherwise animate it.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
  toTop();
  if (hadHash) window.addEventListener("load", toTop, { once: true });

  // Header border once the page scrolls.
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Hero film: load the background loop only for visitors who haven't asked for less
  // motion or to save data (they keep the poster), and play it only while it's on screen.
  var film = document.querySelector("[data-hero-video]");
  var saveData = navigator.connection && navigator.connection.saveData;
  if (film && !saveData && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    film.querySelectorAll("source[data-src]").forEach(function (source) {
      source.src = source.getAttribute("data-src");
      source.removeAttribute("data-src");
    });
    film.preload = "auto";
    film.load();
    function playFilm() {
      var playing = film.play();
      // Low Power Mode and some browsers refuse; the poster stays, which is fine.
      if (playing && playing.catch) playing.catch(function () {});
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) playFilm(); else film.pause();
      }).observe(film);
    } else {
      playFilm();
    }
  }

  // Mobile menu.
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Sections fade in as they scroll into view.
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add(entry.target.classList.contains("draw") ? "drawn" : "visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { observer.observe(el); });
    // The walked lines (hero plot, "who it's for" route) draw in once seen.
    document.querySelectorAll(".draw").forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
    document.querySelectorAll(".draw").forEach(function (el) { el.classList.add("drawn"); });
  }

  // The hero plot pops in each time it comes back into view.
  var pops = document.querySelectorAll(".pop");
  if ("IntersectionObserver" in window) {
    var popObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio >= 0.2) entry.target.classList.add("popped");
        else if (!entry.isIntersecting) entry.target.classList.remove("popped");
      });
    }, { threshold: [0, 0.2] });
    pops.forEach(function (el) { popObserver.observe(el); });
  } else {
    pops.forEach(function (el) { el.classList.add("popped"); });
  }

  // "How it works" presentation: slides advance on their own while visible.
  document.querySelectorAll("[data-demo]").forEach(function (demo) {
    var slides = demo.querySelectorAll(".slide");
    var captions = demo.querySelectorAll(".slide-caption p");
    var dots = demo.querySelectorAll(".demo-dots button");
    var pause = demo.querySelector(".demo-pause");
    var prev = demo.querySelector(".demo-prev");
    var next = demo.querySelector(".demo-next");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0;
    var playing = !reduced;
    var visible = false;
    var timer = null;

    // Each step is a short clip: it plays once when its step comes up and holds its last
    // frame. Visitors who ask for less motion or to save data, and pages without JavaScript,
    // see the posters (each clip's last frame) instead. HEVC first (smallest where it plays),
    // then AV1, then H.264; 720p on phones. Codec strings: scripts/encode-how-it-works.sh.
    var CLIP_SOURCES = [
      ["-1080.hevc.mp4", 'video/mp4; codecs="hvc1.1.6.L120.90"', "(min-width: 720px)"],
      ["-1080.av1.mp4", 'video/mp4; codecs="av01.0.08M.08"', "(min-width: 720px)"],
      ["-1080.mp4", 'video/mp4; codecs="avc1.640029"', "(min-width: 720px)"],
      ["-720.hevc.mp4", 'video/mp4; codecs="hvc1.1.6.L93.90"', ""],
      ["-720.av1.mp4", 'video/mp4; codecs="av01.0.05M.08"', ""],
      ["-720.mp4", 'video/mp4; codecs="avc1.64001f"', ""]
    ];
    var clips = Array.prototype.map.call(slides, function (slide) {
      return slide.querySelector("video[data-clip]");
    });
    var withClips = !reduced && !(navigator.connection && navigator.connection.saveData);
    if (withClips) {
      clips.forEach(function (video) {
        if (!video) return;
        CLIP_SOURCES.forEach(function (s) {
          var source = document.createElement("source");
          source.src = video.getAttribute("data-clip") + s[0];
          source.type = s[1];
          if (s[2]) source.media = s[2];
          video.appendChild(source);
        });
      });
      // Fetch all five (about 1 MB) once the section comes near, so steps don't wait.
      if ("IntersectionObserver" in window) {
        var near = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          near.disconnect();
          clips.forEach(function (video) {
            if (video) { video.preload = "auto"; video.load(); }
          });
        }, { rootMargin: "600px 0px" });
        near.observe(demo);
      }
    }

    // Each clip's overlay (svg.ov) runs on its own SMIL timeline, which starts when the clip
    // starts playing. Without motion, or when a clip can't play, the overlay shows its end
    // state, which matches the clip's last frame (the poster).
    var OVERLAY_END = 30;
    var overlays = Array.prototype.map.call(slides, function (slide) {
      var svg = slide.querySelector("svg.ov");
      return svg && svg.pauseAnimations ? svg : null;
    });
    function overlayAt(n, time, run) {
      var svg = overlays[n];
      if (!svg) return;
      svg.setCurrentTime(time);
      if (run) svg.unpauseAnimations(); else svg.pauseAnimations();
    }
    overlays.forEach(function (svg, n) { overlayAt(n, withClips ? 0 : OVERLAY_END, false); });

    var buzzTimer = null;
    if (withClips) {
      clips.forEach(function (video, n) {
        if (!video) return;
        video.addEventListener("playing", function () {
          if (n !== index) return;
          overlayAt(n, video.currentTime, true);
          // The step with data-buzz shakes the picture on the buzz (seconds into the clip).
          var at = parseFloat(slides[n].getAttribute("data-buzz"));
          clearTimeout(buzzTimer);
          if (at >= video.currentTime) {
            buzzTimer = setTimeout(function () {
              video.classList.remove("ov-shake");
              void video.offsetWidth;
              video.classList.add("ov-shake");
            }, (at - video.currentTime) * 1000);
          }
        });
        // Stalled while buffering: the overlay waits for the picture.
        video.addEventListener("waiting", function () {
          if (overlays[n]) overlays[n].pauseAnimations();
        });
      });
    }

    // The current step's clip starts with the progress bar; every other clip is paused.
    function syncClips(running) {
      if (!withClips) return;
      clearTimeout(buzzTimer);
      clips.forEach(function (video, n) {
        if (!video) return;
        if (running && n === index) {
          var wasPlaying = !video.paused;
          video.currentTime = 0;
          // A clip that was already playing sends no "playing" event, so restart its overlay here.
          overlayAt(n, 0, wasPlaying);
          var started = video.play();
          // Low Power Mode and some browsers refuse: show the end, as the poster does.
          if (started && started.catch) started.catch(function () {
            if (n !== index || !video.paused) return;
            if (video.duration) video.currentTime = video.duration;
            overlayAt(n, OVERLAY_END, false);
          });
        } else {
          video.pause();
          if (overlays[n]) overlays[n].pauseAnimations();
        }
      });
    }

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        slide.classList.toggle("active", n === index);
        slide.setAttribute("aria-hidden", n === index ? "false" : "true");
      });
      captions.forEach(function (caption, n) {
        caption.classList.toggle("active", n === index);
      });
      dots.forEach(function (dot, n) {
        dot.setAttribute("aria-current", n === index ? "true" : "false");
      });
      restart();
    }

    function restart() {
      clearTimeout(timer);
      demo.classList.toggle("playing", playing && visible);
      syncClips(playing && visible);
      if (playing && visible) {
        // A step lasts 5 seconds, or its figure's data-step (seconds) when its clip is short.
        var seconds = parseFloat(slides[index].getAttribute("data-step")) || 5;
        // Restart the CSS progress bar, at the step's length.
        var bar = demo.querySelector(".demo-progress span");
        if (bar) {
          bar.style.animation = "none";
          void bar.offsetWidth;
          bar.style.animation = "";
          bar.style.animationDuration = seconds + "s";
        }
        timer = setTimeout(function () { show(index + 1); }, seconds * 1000);
      }
    }

    function setPlaying(value) {
      playing = value;
      if (pause) {
        pause.setAttribute("aria-pressed", playing ? "false" : "true");
        pause.setAttribute("aria-label", playing ? pause.dataset.pauseLabel : pause.dataset.playLabel);
      }
      restart();
    }

    dots.forEach(function (dot, n) {
      dot.addEventListener("click", function () { show(n); });
    });
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });
    if (pause) pause.addEventListener("click", function () { setPlaying(!playing); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        restart();
      }, { threshold: 0.5 }).observe(demo);
    } else {
      visible = true;
    }
    setPlaying(playing);
    show(0);
  });

  // "Why WalkMeasure": each card's clip plays once when the card is in view and holds its
  // last frame (the poster). Until then the card shows the clip's first frame. Visitors who
  // ask for less motion or to save data, and pages without JavaScript, see the posters.
  // Codec strings: scripts/encode-why-clips.sh.
  var cardClips = document.querySelectorAll("video[data-card-clip]");
  var stillCards = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    (navigator.connection && navigator.connection.saveData);
  if (cardClips.length && !stillCards && "IntersectionObserver" in window) {
    var cardSources = [
      [".hevc.mp4", "hvc1.1.6.L90.90"],
      [".av1.mp4", "av01.0.04M.08"],
      [".mp4", "avc1.64001f"]
    ];
    var playCard = function (video) {
      if (video.ended) return;
      var started = video.play();
      if (started && started.catch) started.catch(function () {
        video.poster = video.getAttribute("data-card-clip") + "-poster.webp";
      });
    };
    var cardNear = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cardNear.unobserve(entry.target);
        entry.target.preload = "auto";
        entry.target.load();
      });
    }, { rootMargin: "400px 0px" });
    var cardSeen = new IntersectionObserver(function (entries) {
      // Cards that come into view together start one after another.
      var n = 0;
      entries.forEach(function (entry) {
        var video = entry.target;
        clearTimeout(video.cardTimer);
        if (entry.isIntersecting) {
          video.cardTimer = setTimeout(playCard, 450 * n++, video);
        } else if (!video.paused) {
          video.pause();
        }
      });
    }, { threshold: 0.6 });
    cardClips.forEach(function (video) {
      var base = video.getAttribute("data-card-clip");
      video.poster = base + "-first.webp";
      cardSources.forEach(function (s) {
        var source = document.createElement("source");
        source.src = base + "-540" + s[0];
        source.type = 'video/mp4; codecs="' + s[1] + '"';
        video.appendChild(source);
      });
      cardNear.observe(video);
      cardSeen.observe(video);
    });
  }

  // "Who it's for": a tape measure unwinds along the walk from corner to corner as the
  // page scrolls, turning at each corner circle and never running over text.
  var routeWrap = document.querySelector(".route-wrap");
  if (routeWrap && "ResizeObserver" in window) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = routeWrap.querySelector(".route-line");
    var list = routeWrap.querySelector(".route");
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var make = function (name, attrs, parent) {
      var node = document.createElementNS(NS, name);
      for (var key in attrs) node.setAttribute(key, attrs[key]);
      if (parent) parent.appendChild(node);
      return node;
    };
    var mask = make("mask", { id: "tape-reveal", maskUnits: "userSpaceOnUse" }, make("defs", {}, svg));
    var maskPath = make("path", { fill: "none", stroke: "#fff", "stroke-width": 44, "stroke-linejoin": "round" }, mask);
    var tape = make("g", { mask: "url(#tape-reveal)" }, svg);
    var edge = make("path", { "class": "tape-edge" }, tape);
    var band = make("path", { "class": "tape-band" }, tape);
    var ticks = make("g", { "class": "tape-ticks" }, tape);
    var tapeCase = make("g", { "class": "tape-case parked" }, svg);
    make("rect", { x: -19, y: -19, width: 38, height: 38, rx: 10 }, tapeCase);
    var reel = make("g", {}, tapeCase);
    make("circle", { "class": "reel", r: 11 }, reel);
    make("line", { "class": "spoke", x1: 0, y1: -8, x2: 0, y2: 8 }, reel);
    make("circle", { "class": "hub", r: 3 }, reel);
    var total = 0;
    var queued = false;

    var layout = function () {
      var w = routeWrap.clientWidth, h = routeWrap.clientHeight;
      if (!w || !h) return;
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      ["x", "y"].forEach(function (k) { mask.setAttribute(k, -60); });
      mask.setAttribute("width", w + 120);
      mask.setAttribute("height", h + 120);
      var corners = [].map.call(list.children, function (li) {
        var mark = getComputedStyle(li, "::before");
        var top = list.offsetTop + li.offsetTop;
        return {
          x: list.offsetLeft + li.offsetLeft + parseFloat(mark.left) + parseFloat(mark.width) / 2,
          y: top + parseFloat(mark.top) + parseFloat(mark.height) / 2,
          top: top,
          bottom: top + li.offsetHeight
        };
      });
      // The tape turns at every corner circle: it leaves a corner straight down past its
      // text, then crosses the gap to the next circle, which sits above its own text.
      var points = [{ x: corners[0].x, y: corners[0].y }];
      for (var i = 1; i < corners.length; i++) {
        var from = corners[i - 1], to = corners[i];
        points.push({ x: from.x, y: from.bottom, r: 36 }, { x: to.x, y: to.y, r: 12 });
      }
      // Each bend is rounded off; at a circle the small turn sits under the circle.
      var d = "M" + points[0].x + " " + points[0].y;
      for (var v = 1; v < points.length - 1; v++) {
        var prev = points[v - 1], at = points[v], next = points[v + 1];
        var inLen = Math.hypot(at.x - prev.x, at.y - prev.y), outLen = Math.hypot(next.x - at.x, next.y - at.y);
        if (!inLen || !outLen) continue;
        var r = Math.min(at.r, inLen / 2, outLen / 2);
        d += " L" + (at.x - (at.x - prev.x) * r / inLen) + " " + (at.y - (at.y - prev.y) * r / inLen) +
             " Q" + at.x + " " + at.y + " " + (at.x + (next.x - at.x) * r / outLen) + " " + (at.y + (next.y - at.y) * r / outLen);
      }
      d += " L" + points[points.length - 1].x + " " + points[points.length - 1].y;
      edge.setAttribute("d", d);
      band.setAttribute("d", d);
      maskPath.setAttribute("d", d);
      total = band.getTotalLength();
      maskPath.setAttribute("stroke-dasharray", total + " " + total);
      // Graduations from one edge of the band: short, longer every 5th, a number every 10th.
      while (ticks.firstChild) ticks.removeChild(ticks.firstChild);
      for (var n = 1, s = 8; s < total; n++, s += 8) {
        var p = band.getPointAtLength(s), q = band.getPointAtLength(Math.min(s + 1, total));
        var dx = q.x - p.x, dy = q.y - p.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var size = n % 10 === 0 ? 9 : n % 5 === 0 ? 6.5 : 4;
        make("line", { x1: p.x - nx * 8.5, y1: p.y - ny * 8.5, x2: p.x - nx * (8.5 - size), y2: p.y - ny * (8.5 - size) }, ticks);
        if (n % 10 === 0) {
          var angle = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angle > 90 || angle < -90) angle += 180; // never upside down
          make("text", { x: 0, y: 0, "text-anchor": "middle",
            transform: "translate(" + (p.x + nx * 3.5 + dx / len * 6) + " " + (p.y + ny * 3.5 + dy / len * 6) + ") rotate(" + angle + ")" }, ticks).textContent = n / 10;
        }
      }
      routeWrap.classList.add("taped");
      update();
    };

    // The case sits on the tape where it crosses 60% of the screen height.
    var update = function () {
      queued = false;
      if (!total) return;
      var target = window.innerHeight * 0.6 - svg.getBoundingClientRect().top;
      var shown = total;
      if (!still) {
        var lo = 0, hi = total;
        for (var k = 0; k < 18; k++) {
          var mid = (lo + hi) / 2;
          if (band.getPointAtLength(mid).y < target) lo = mid; else hi = mid;
        }
        shown = lo;
      }
      maskPath.setAttribute("stroke-dashoffset", total - shown);
      var at = band.getPointAtLength(shown);
      tapeCase.setAttribute("transform", "translate(" + at.x + " " + at.y + ")");
      reel.setAttribute("transform", "rotate(" + (shown * 1.5) + ")");
      tapeCase.classList.toggle("parked", still || shown < 2 || shown > total - 2);
    };

    new ResizeObserver(layout).observe(routeWrap);
    window.addEventListener("scroll", function () {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  // "Who it's for": the plus shows or hides each sentence (a mouse also shows it on hover).
  document.querySelectorAll(".route-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var open = button.closest("li").classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // Features: each tile's scene plays while the tile is on screen. Visitors who ask for
  // less motion (and pages without JavaScript) see the finished pictures instead.
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var feats = document.querySelector(".feats");
  var slope = feats && feats.querySelector(".feat-slope .scene");
  var rollSlope = slope ? slopeMesh(slope) : null;
  if (feats && !calm && "IntersectionObserver" in window) {
    feats.classList.add("anim");
    var featObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var live = entry.intersectionRatio >= 0.3;
        entry.target.classList.toggle("live", live);
        if (rollSlope && entry.target.contains(slope)) rollSlope(live);
      });
    }, { threshold: [0, 0.3] });
    feats.querySelectorAll(".feat").forEach(function (tile) { featObserver.observe(tile); });
  }

  // "Heights and slopes": the ground under the mesh rolls slowly and the probe reads the
  // height of one point on it. Same formula as the still picture written in the page.
  function slopeMesh(svg) {
    var lines = svg.querySelectorAll(".mesh polyline");
    var dot = svg.querySelector(".probe-dot"), stem = svg.querySelector(".probe-line");
    var tag = svg.querySelector(".probe-tag"), label = tag.querySelector("text");
    var comma = document.documentElement.lang === "ro";
    var N = 11, clock = 0, last = 0, running = false, written = 0;
    var height = function (x, y, t) {
      return 0.5 * Math.sin(1.6 * x + t) * Math.cos(1.2 * y + 0.7 * t) + 0.2 * Math.sin(2.1 * (x + y) - 0.5 * t);
    };
    var point = function (x, y) {
      return (200 + (x - y) * 92).toFixed(1) + "," + (122 + (x + y) * 40 - height(x, y, clock) * 40).toFixed(1);
    };
    var render = function (now) {
      for (var i = 0; i < N; i++) {
        var row = [], col = [], a = i / (N - 1) * 2 - 1;
        for (var j = 0; j < N; j++) {
          var b = j / (N - 1) * 2 - 1;
          row.push(point(a, b));
          col.push(point(b, a));
        }
        lines[2 * i].setAttribute("points", row.join(" "));
        lines[2 * i + 1].setAttribute("points", col.join(" "));
      }
      // The probe stands on grid point (0.2, -0.2); its label changes a few times a second.
      var z = height(0.2, -0.2, clock), y = (122 - z * 40).toFixed(1);
      dot.setAttribute("cy", y);
      stem.setAttribute("y2", y);
      tag.setAttribute("transform", "translate(236.8 " + (y - 34).toFixed(1) + ")");
      if (now - written > 160) {
        written = now;
        var text = ((z + 0.75) * 1.6).toFixed(2) + " m";
        label.textContent = comma ? text.replace(".", ",") : text;
      }
    };
    var frame = function (now) {
      if (!running) return;
      if (last) clock += Math.min(now - last, 50) / 1000 * 0.8;
      last = now;
      render(now);
      requestAnimationFrame(frame);
    };
    return function (on) {
      if (on === running) return;
      running = on;
      last = 0;
      if (on) requestAnimationFrame(frame);
    };
  }

  // Features: the bits floating beside the title drift at their own pace on scroll.
  var drifters = document.querySelectorAll("[data-drift]");
  if (drifters.length && !calm) {
    var drifting = false;
    var drift = function () {
      drifting = false;
      var mid = window.innerHeight / 2;
      drifters.forEach(function (el) {
        var box = el.parentNode.getBoundingClientRect();
        if (!box.height) return;
        el.style.translate = "0 " + ((box.top + box.height / 2 - mid) * parseFloat(el.dataset.drift)).toFixed(1) + "px";
      });
    };
    window.addEventListener("scroll", function () {
      if (!drifting) { drifting = true; requestAnimationFrame(drift); }
    }, { passive: true });
    drift();
  }

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
