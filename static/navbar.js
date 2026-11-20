// Navbar: slides away while scrolling down, slides back after a deliberate scroll up.
// Replaces the theme's version, which toggled on every single scroll event and so
// flickered with trackpad/inertia scrolling. It also publishes the bar's visible height
// as --nav-offset so any sticky sub-bar (the project chips) can sit right under it.
// Also: with no saved preference, follow the system theme live.
(function () {
  var header = document.getElementById("profileHeader");
  var root = document.documentElement;

  // ---- follow the system theme while the visitor has not chosen one -------------
  var mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  if (mq) {
    var onScheme = function () {
      var saved = null;
      try { saved = localStorage.getItem("pref-theme"); } catch (e) {}
      if (saved) return;
      document.body.classList.toggle("dark", mq.matches);
      root.classList.toggle("dark", mq.matches);
    };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
  }

  if (!header) return;

  var DOWN = 16;   // px of continuous downward travel before hiding
  var UP = 8;      // px of continuous upward travel before showing
  var hidden = false, lastY = window.scrollY, dir = 0, anchorY = lastY, ticking = false;

  function setHidden(h) {
    hidden = h;
    header.classList.toggle("nav-hidden", h);
    publish();
  }
  function publish() {
    root.style.setProperty("--nav-offset", hidden ? "0px" : header.offsetHeight + "px");
  }
  function locked() {
    var menu = header.querySelector(".navbar-collapse");
    return (menu && menu.classList.contains("show")) || header.contains(document.activeElement);
  }

  function update() {
    ticking = false;
    var y = Math.max(0, window.scrollY);
    header.classList.toggle("nav-raised", y > 4);
    if (y <= header.offsetHeight / 2 || locked()) {   // near the top, or being used: always shown
      if (hidden) setHidden(false);
      lastY = y; dir = 0;
      return;
    }
    var dy = y - lastY;
    lastY = y;
    if (dy === 0) return;                              // identical position: ignore, never a reason to hide
    var d = dy > 0 ? 1 : -1;
    if (d !== dir) { dir = d; anchorY = y - dy; }      // direction changed: measure travel from here
    if (d > 0 && !hidden && y - anchorY > DOWN) setHidden(true);
    if (d < 0 && hidden && anchorY - y > UP) setHidden(false);
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", publish);
  header.addEventListener("focusin", function () { if (hidden) setHidden(false); });
  window.addEventListener("load", publish);
  publish();
  update();
})();
