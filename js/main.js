// Flow with Chills — "The Trail"
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var trail = document.querySelector('.trail');
  var base = document.querySelector('.trail__base');
  var draw = document.querySelector('.trail__draw');
  var hiker = document.querySelector('.trail__hiker');

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---- trail geometry ----
  var L = 0, firstY = 0, lastY = 0, ready = false;

  function nodeCenters() {
    var pins = Array.prototype.slice.call(document.querySelectorAll('[data-node]'));
    var pts = pins.map(function (p) {
      var r = p.getBoundingClientRect();
      return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
    });
    pts.sort(function (a, b) { return a.y - b.y; });
    return pts;
  }

  // Catmull-Rom -> cubic bezier for a smooth winding path
  function smooth(pts) {
    if (pts.length < 2) return '';
    var d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
                   c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' +
                   p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }

  function build() {
    var pts = nodeCenters();
    if (pts.length < 2) return;
    var docH = document.body.scrollHeight;
    var w = window.innerWidth;
    trail.setAttribute('viewBox', '0 0 ' + w + ' ' + docH);
    trail.setAttribute('width', w);
    trail.setAttribute('height', docH);
    trail.style.height = docH + 'px';
    var d = smooth(pts);
    base.setAttribute('d', d);
    draw.setAttribute('d', d);
    L = draw.getTotalLength();
    draw.style.strokeDasharray = L;
    firstY = pts[0].y;
    lastY = pts[pts.length - 1].y;
    ready = true;
    update();
  }

  function update() {
    if (!ready || !L) return;
    var walk = window.scrollY + window.innerHeight * 0.58;
    var prog = (walk - firstY) / (lastY - firstY);
    prog = Math.max(0, Math.min(1, prog));
    draw.style.strokeDashoffset = L * (1 - prog);
    if (prog > 0.001) {
      var pt = draw.getPointAtLength(L * prog);
      hiker.setAttribute('cx', pt.x);
      hiker.setAttribute('cy', pt.y);
      hiker.style.opacity = prog < 0.999 ? '1' : '0';
    } else {
      hiker.style.opacity = '0';
    }
  }

  // ---- nav state ----
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    update();
  }

  // ---- reveals ----
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) {
      var sib = el.parentElement ? el.parentElement.children : [];
      var pos = Array.prototype.indexOf.call(sib, el);
      el.style.transitionDelay = Math.min(Math.max(pos, 0), 4) * 65 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- mobile menu ----
  var toggle = document.getElementById('navToggle');
  var panel = document.createElement('div');
  panel.className = 'nav__panel';
  var navLinks = document.querySelector('.nav__links');
  panel.innerHTML = (navLinks ? navLinks.innerHTML : '') +
    '<a href="contact.html">Plan a retreat</a>';
  document.body.appendChild(panel);
  function closeMenu() { panel.classList.remove('open'); if (toggle) toggle.classList.remove('is-open'); }
  if (toggle) toggle.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    toggle.classList.toggle('is-open', open);
  });
  panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });

  // ---- lifecycle ----
  window.addEventListener('scroll', onScroll, { passive: true });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 160); });
  window.addEventListener('load', function () { build(); setTimeout(build, 400); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(build, 60); });
  build();
  onScroll();
})();
