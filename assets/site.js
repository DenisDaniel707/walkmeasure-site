// WalkMeasure — presentation site. No trackers, no cookies, no external requests.
(function () {
  document.documentElement.classList.remove("no-js");

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

  // "Who it's for" on wide screens: the walked line runs exactly through each corner
  // circle, wherever the layout puts them (redrawn when the window resizes).
  var routePath = document.querySelector(".route-line path");
  function drawRoute() {
    var wrap = routePath.ownerSVGElement.parentElement;
    var list = wrap.querySelector(".route");
    if (!wrap.clientWidth || !wrap.clientHeight) return;
    var points = [].map.call(list.children, function (li) {
      var mark = getComputedStyle(li, "::before");
      var x = list.offsetLeft + li.offsetLeft + parseFloat(mark.left) + parseFloat(mark.width) / 2;
      var y = list.offsetTop + li.offsetTop + parseFloat(mark.top) + parseFloat(mark.height) / 2;
      return (x / wrap.clientWidth * 100).toFixed(2) + " " + (y / wrap.clientHeight * 100).toFixed(2);
    });
    routePath.setAttribute("d", "M" + points.join(" L"));
  }
  if (routePath) {
    drawRoute();
    window.addEventListener("resize", drawRoute);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawRoute);
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
