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

/* ---------------------------------------------------------------- MOTION */
(function () {
  'use strict';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // split a heading's text into per-word masks (preserves <br>, <em>, .hl)
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (tok === '') return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'w__i'; i.textContent = tok;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && !(n.classList && n.classList.contains('w'))) {
          walk(n);
        }
      });
    })(el);
    var ws = el.querySelectorAll('.w__i');
    for (var k = 0; k < ws.length; k++) ws[k].style.transitionDelay = (Math.min(k, 16) * 0.045) + 's';
  }

  var heads = Array.prototype.slice.call(document.querySelectorAll('main h1, main h2'));
  if (!RM) heads.forEach(function (h) { h.classList.remove('reveal'); h.classList.add('wordreveal'); splitWords(h); });

  var supportsIO = 'IntersectionObserver' in window;

  // reveal wordreveal headings
  if (!RM && supportsIO) {
    var ioW = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ioW.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    heads.forEach(function (h) {
      var r = h.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {           // above the fold: reveal next frame
        requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('in'); }); });
      } else ioW.observe(h);
    });
  } else { heads.forEach(function (h) { h.classList.add('in'); }); }

  // count-up stats
  var counts = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null, dur = 1200;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counts.length) {
    if (RM || !supportsIO) {
      counts.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
    } else {
      var ioC = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); ioC.unobserve(e.target); } });
      }, { threshold: 0.6 });
      counts.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); ioC.observe(el); });
    }
  }

  // waypoint dot pulse when reached
  if (!RM && supportsIO) {
    var ioP = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('pulse'); ioP.unobserve(e.target); } });
    }, { threshold: 1, rootMargin: '-42% 0px -42% 0px' });
    Array.prototype.slice.call(document.querySelectorAll('.pin[data-node]')).forEach(function (p) { ioP.observe(p); });
  }

  // hero ambient gating — keeps devices cool: mist only runs while hero is on screen and tab is visible
  var hero = document.querySelector('.trailhead');
  if (hero && !RM) {
    var heroVis = false;
    function setAnim() { document.body.classList.toggle('anim-on', heroVis && !document.hidden); }
    if (supportsIO) {
      var ioH = new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; setAnim(); }, { threshold: 0.04 });
      ioH.observe(hero);
    } else { heroVis = true; setAnim(); }
    document.addEventListener('visibilitychange', setAnim);

    // hero parallax — only computes near the top, rAF-throttled
    var pEls = Array.prototype.slice.call(hero.querySelectorAll('[data-depth]'));
    var ticking = false;
    function par() {
      var y = window.scrollY;
      for (var i = 0; i < pEls.length; i++) {
        var d = parseFloat(pEls[i].getAttribute('data-depth')) || 0;
        pEls[i].style.transform = 'translate3d(0,' + (y * d) + 'px,0)';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking && window.scrollY <= window.innerHeight) { ticking = true; requestAnimationFrame(par); }
    }, { passive: true });
    par();
  }

  // logo mark draws itself in (one-time)
  if (!RM) {
    Array.prototype.slice.call(document.querySelectorAll('.nav__mark path')).forEach(function (p, idx) {
      try {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.transition = 'stroke-dashoffset 1s var(--ease-soft) ' + (idx * 0.12) + 's';
        requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.strokeDashoffset = '0'; }); });
      } catch (e) {}
    });
    var mc = document.querySelector('.nav__mark circle');
    if (mc) {
      mc.style.transformBox = 'fill-box'; mc.style.transformOrigin = 'center';
      mc.style.transform = 'scale(0)'; mc.style.transition = 'transform .5s var(--ease-soft) .9s';
      requestAnimationFrame(function () { requestAnimationFrame(function () { mc.style.transform = 'scale(1)'; }); });
    }
  }
})();
