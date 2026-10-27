// Docked section navigator: highlights the section in view.
(function () {
  var LABELS = {
    hero: "Home",
    about: "About",
    experience: "Experience",
    education: "Education",
    projects: "Projects",
    achievements: "Research & Recognition",
    contact: "Contact"
  };

  var sections = Array.prototype.slice.call(
    document.querySelectorAll("#content > section[id]")
  ).filter(function (s) { return LABELS[s.id]; });
  if (sections.length < 3) return;

  var nav = document.createElement("nav");
  nav.id = "section-nav";
  nav.setAttribute("aria-label", "Page sections");

  var current = document.createElement("div");
  current.className = "sn-current";
  var list = document.createElement("ol");
  var fill = document.createElement("span");
  fill.className = "sn-fill";
  list.appendChild(fill);

  var links = sections.map(function (s) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + s.id;
    a.innerHTML = '<span class="sn-label"></span><span class="sn-dot"></span>';
    a.firstChild.textContent = LABELS[s.id];
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      s.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      history.replaceState(null, "", "#" + s.id);
    });
    li.appendChild(a);
    list.appendChild(li);
    return a;
  });

  nav.appendChild(current);
  nav.appendChild(list);
  document.body.appendChild(nav);

  var activeIndex = -1;
  var ticking = false;

  function update() {
    ticking = false;
    var doc = document.documentElement;
    var line = window.innerHeight * 0.4;
    var idx = 0;
    sections.forEach(function (s, i) {
      if (s.getBoundingClientRect().top <= line) idx = i;
    });
    var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 4;
    if (atBottom) idx = sections.length - 1;

    var max = doc.scrollHeight - window.innerHeight;
    nav.style.setProperty("--sn-progress", max > 0 ? Math.min(window.scrollY / max, 1) : 0);

    if (idx !== activeIndex) {
      activeIndex = idx;
      links.forEach(function (a, i) {
        a.classList.toggle("active", i === idx);
        a.classList.toggle("passed", i < idx);
        if (i === idx) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      current.textContent = LABELS[sections[idx].id];
    }
    nav.classList.add("sn-ready");
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", update);
  update();
})();
