// Draws the connector lines of HTML flow diagrams (see layouts/partials/flow.html).
// Connectors come from data-connectors (JSON): {mode, from, to, label}
//   elbow   : right side of `from` -> left side of `to` (source box into a row)   [desktop only]
//   down    : bottom of `from` -> top of `to`, routed just above the target         [desktop only]
//   bracket : right sides of `from` and `to` joined by a bracket with a badge on the right
(function () {
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function draw(fig) {
    var svg = fig.querySelector(".flow-overlay");
    var base = fig.getBoundingClientRect();
    var wide = window.matchMedia("(min-width: 1100px)").matches;
    Array.prototype.forEach.call(fig.querySelectorAll(".parity-badge, .conn-label"), function (n) { n.remove(); });
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    function rect(id) {
      var e = id === "src" ? fig.querySelector("#flow-src") : fig.querySelector('[data-step="' + id + '"]');
      if (!e) return null;
      var r = e.getBoundingClientRect();
      return { l: r.left - base.left, r: r.right - base.left, t: r.top - base.top, b: r.bottom - base.top,
               cx: (r.left + r.right) / 2 - base.left, cy: (r.top + r.bottom) / 2 - base.top };
    }
    function label(text, x, y, cls) {
      var d = document.createElement("div");
      d.className = cls || "conn-label"; d.textContent = text;
      d.style.left = x + "px"; d.style.top = y + "px";
      fig.appendChild(d); return d;
    }
    function arrowDown(x, y) { return el("polygon", { points: x + "," + y + " " + (x - 5) + "," + (y - 9) + " " + (x + 5) + "," + (y - 9) }); }

    var conns = JSON.parse(fig.getAttribute("data-connectors") || "[]");
    var rows = fig.querySelector(".flow-rows").getBoundingClientRect();
    var rowsR = rows.right - base.left, rowsL = rows.left - base.left;

    conns.forEach(function (c) {
      var a = rect(c.from), b = rect(c.to);
      if (!a || !b) return;
      var d;
      if (c.mode === "elbow" && wide) {
        var xm = a.r + (rowsL - a.r) / 2;
        svg.appendChild(el("path", { "class": "conn-src", d: "M" + a.r + " " + a.cy + " H" + xm + " V" + b.cy + " H" + (b.l - 7) }));
        svg.appendChild(el("polygon", { points: (b.l - 1) + "," + b.cy + " " + (b.l - 9) + "," + (b.cy - 5) + " " + (b.l - 9) + "," + (b.cy + 5) }));
      } else if (c.mode === "down" && wide) {
        var yt = b.t - 20;
        d = (Math.abs(a.cx - b.cx) < 2)
          ? "M" + a.cx + " " + a.b + " V" + (b.t - 9)
          : "M" + a.cx + " " + a.b + " V" + yt + " H" + b.cx + " V" + (b.t - 9);
        svg.appendChild(el("path", { "class": "halo", d: d }));
        svg.appendChild(el("path", { "class": "conn-src conn-down", d: d }));
        svg.appendChild(arrowDown(b.cx, b.t - 1));
        if (c.label) label(c.label, (a.cx + b.cx) / 2, yt);
      } else if (c.mode === "bracket") {
        var xb = rowsR + Math.min(30, (base.width - rowsR) / 2);
        d = "M" + a.r + " " + a.cy + " H" + xb + " V" + b.cy + " H" + b.r;
        svg.appendChild(el("path", { "class": "halo", d: d }));
        svg.appendChild(el("path", { "class": "conn-parity", d: d }));
        var badge = document.createElement("div");
        badge.className = "parity-badge";
        badge.innerHTML = "<span>=</span>" + (c.label ? "<em>" + c.label + "</em>" : "");
        badge.style.left = xb + "px"; badge.style.top = (a.cy + b.cy) / 2 + "px";
        fig.appendChild(badge);
      }
    });
  }
  function init(fig) {
    var run = function () { draw(fig); };
    run();
    if (window.ResizeObserver) new ResizeObserver(run).observe(fig);
    window.addEventListener("resize", run);
    window.addEventListener("load", run);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-flow]"), init);
})();
