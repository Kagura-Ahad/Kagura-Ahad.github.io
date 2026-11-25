// Skill pills: every row ends up the same length while each pill still hugs its text.
// All pills share one base side padding, chosen so the rows come out nearly full and any
// leftover space stays small and even. To get there, pills may move a little from their listed
// position (further on narrow screens). Without JavaScript the pills simply wrap and centre.
(function () {
  var list = document.querySelector("#about .skills-grid");
  if (!list || !list.children.length) return;
  var items = Array.prototype.slice.call(list.children); // listed order
  var lastWidth = 0;

  function sum(values) {
    return values.reduce(function (a, b) { return a + b; }, 0);
  }

  // Split widths into k rows no longer than `full`, moving pills at most `reach` rows from their
  // listed place. Returns the item indexes per row, or null if they do not fit.
  function pack(widths, k, full, gap, reach) {
    var n = widths.length;
    function length(row) {
      return sum(row.map(function (i) { return widths[i]; })) + gap * (row.length - 1);
    }
    // Penalise the extra width each pill in the row would have to take on.
    function penalty(slack, count) {
      return slack < 0 ? Infinity : (slack / count) * (slack / count);
    }
    function cost(row) {
      return penalty(full - length(row), row.length);
    }

    // Best split that keeps the listed order.
    var best = [[0]], from = [];
    for (var r = 1; r <= k; r++) {
      best[r] = [];
      from[r] = [];
      for (var end = 1; end <= n; end++) {
        best[r][end] = Infinity;
        var used = -gap;
        for (var start = end - 1; start >= 0; start--) {
          used += widths[start] + gap;
          if (used > full) break;
          var before = best[r - 1][start];
          if (before === undefined) continue;
          var total = before + penalty(full - used, end - start);
          if (total < best[r][end]) { best[r][end] = total; from[r][end] = start; }
        }
      }
    }
    if (!isFinite(best[k][n])) return null;
    var rows = [], home = [];
    for (var row = k, stop = n; row > 0; row--) {
      var begin = from[row][stop];
      rows[row - 1] = [];
      for (var i = begin; i < stop; i++) { rows[row - 1].push(i); home[i] = row - 1; }
      stop = begin;
    }

    // Even out further by moving or swapping pills between nearby rows. The first pill stays put.
    function near(i, target) { return i !== 0 && Math.abs(target - home[i]) <= reach; }
    for (var pass = 0; pass < 200; pass++) {
      var gain = 0.5, change = null;
      for (var a = 0; a < k; a++) {
        for (var b = 0; b < k; b++) {
          if (a === b) continue;
          var current = cost(rows[a]) + cost(rows[b]);
          rows[a].forEach(function (i) {
            if (!near(i, b)) return;
            var without = rows[a].filter(function (x) { return x !== i; });
            // j === null moves pill i across; otherwise i and j trade places.
            [null].concat(rows[b]).forEach(function (j) {
              if (j === null ? !without.length : !near(j, a)) return;
              var nextA = j === null ? without : without.concat(j);
              var nextB = rows[b].filter(function (x) { return x !== j; }).concat(i);
              var saved = current - cost(nextA) - cost(nextB);
              if (saved > gain) { gain = saved; change = [a, nextA, b, nextB]; }
            });
          });
        }
      }
      if (!change) break;
      rows[change[0]] = change[1];
      rows[change[2]] = change[3];
    }
    rows.forEach(function (r) { r.sort(function (x, y) { return x - y; }); });
    return rows;
  }

  function layout(force) {
    var full = list.getBoundingClientRect().width;
    if (!full || (!force && Math.abs(full - lastWidth) < 0.5)) return;
    lastWidth = full;

    items.forEach(function (li) { li.removeAttribute("style"); list.appendChild(li); });
    var style = getComputedStyle(items[0]);
    var font = parseFloat(style.fontSize);
    var basePad = parseFloat(style.paddingLeft);
    var gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    var text = items.map(function (li) { return li.getBoundingClientRect().width - 2 * basePad; });
    var n = items.length;
    var minPad = font * 0.85, maxPad = font * 1.6;
    var usable = full - 0.5; // leaves room for sub-pixel rounding

    function widthsAt(pad) {
      return text.map(function (t) { return Math.min(t + 2 * pad, usable); });
    }

    // Try a range of paddings and keep the one whose worst row needs the least stretching.
    var reach = full < 600 ? 4 : full < 900 ? 2 : 1;
    var first = Math.max(1, Math.ceil((sum(widthsAt(minPad)) + n * gap) / (usable + gap)));
    for (var k = first; k <= n; k++) {
      var chosen = null;
      for (var pad = minPad; pad <= maxPad; pad += 0.5) {
        var widths = widthsAt(pad);
        var rows = pack(widths, k, usable, gap, reach);
        if (!rows) continue;
        var stretch = Math.max.apply(null, rows.map(function (row) {
          var slack = usable - sum(row.map(function (i) { return widths[i]; })) - gap * (row.length - 1);
          return slack / row.length;
        }));
        var score = stretch + 0.25 * Math.abs(pad - font * 1.25);
        if (!chosen || score < chosen.score) chosen = { score: score, rows: rows, widths: widths, pad: pad };
      }
      if (chosen) { apply(chosen.rows, chosen.widths, chosen.pad, usable, gap); return; }
    }
  }

  // Share each row's leftover space: a little into the gaps, any remainder into the pills.
  function apply(rows, widths, pad, full, gap) {
    rows.forEach(function (row) {
      var slack = full - sum(row.map(function (i) { return widths[i]; })) - gap * (row.length - 1);
      var extraGap = row.length > 1 ? Math.min(slack / (row.length - 1), 6) : 0;
      var extraWidth = (slack - extraGap * (row.length - 1)) / row.length;
      row.forEach(function (i, position) {
        var li = items[i];
        li.style.paddingLeft = li.style.paddingRight = pad + "px";
        li.style.width = Math.floor((widths[i] + extraWidth) * 100) / 100 + "px";
        if (widths[i] < full) li.style.whiteSpace = "nowrap";
        if (position < row.length - 1) li.style.marginRight = Math.floor(extraGap * 100) / 100 + "px";
        list.appendChild(li);
      });
    });
  }

  layout(true);
  if (document.fonts) {
    document.fonts.ready.then(function () { layout(true); });
    document.fonts.addEventListener("loadingdone", function () { layout(true); });
  }
  if (window.ResizeObserver) new ResizeObserver(function () { layout(false); }).observe(list);
  else window.addEventListener("resize", function () { layout(false); });
})();
