// Projects page: show one project at a time, switched by the chip row.
// Without JavaScript every project simply stacks on the page.
(function () {
  var root = document.querySelector(".projects-page");
  if (!root) return;
  var entries = Array.prototype.slice.call(root.querySelectorAll(".project-entry"));
  var chips = Array.prototype.slice.call(root.querySelectorAll("a[data-project]"));
  if (!entries.length) return;
  var ids = entries.map(function (e) { return e.id; });

  function show(id) {
    if (ids.indexOf(id) < 0) id = ids[0];
    entries.forEach(function (e) { e.hidden = e.id !== id; });
    chips.forEach(function (c) {
      var on = c.getAttribute("data-project") === id;
      c.classList.toggle("active", on);
      if (on) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current");
    });
    return id;
  }

  root.classList.add("js-switcher");
  chips.forEach(function (c) {
    c.addEventListener("click", function (e) {
      e.preventDefault();
      var id = show(c.getAttribute("data-project"));
      history.pushState(null, "", "#" + id);
      var top = root.querySelector(".project-switcher").getBoundingClientRect().top;
      if (top < 0) window.scrollBy({ top: top - 8, behavior: "auto" });
    });
  });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
  show(location.hash.slice(1));
})();
