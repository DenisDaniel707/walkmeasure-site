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
      if (playing && visible) {
        // Restart the CSS progress bar.
        var bar = demo.querySelector(".demo-progress span");
        if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
        timer = setTimeout(function () { show(index + 1); }, 5000);
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

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
