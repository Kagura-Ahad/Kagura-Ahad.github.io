"""Generates layouts/partials/graphrag-svg.html: the GraphRAG layer pyramid used on the DocsKeeping page.
Run from the repo root:  python3 scripts/graphrag_pyramid.py
Colours that are not theme tokens match the LLM icon (static/images/icons/llm.svg)."""
import math, random
random.seed(11)
CX = 320
COL = ["#68B3E3", "#8AD07B", "#F08898", "#F4A345", "#9B7FE8"]           # blue, green, pink, orange, purple
UNIT = [(-0.60, -0.10), (-0.20, -0.55), (0.40, -0.45), (0.64, 0.18), (-0.08, 0.46)]
TOP = dict(cy=78, rx=92, ry=26); MID = dict(cy=232, rx=172, ry=50); BOT = dict(cy=402, rx=252, ry=76); BASE = dict(cy=548, rx=288, ry=42)
T = 12   # disc thickness
out = []
def add(s): out.append(s)
def pos(layer, u, v, k=0.80): return (CX + layer["rx"] * k * u, layer["cy"] + layer["ry"] * k * v)

def disc(layer, cls=""):
    cy, rx, ry = layer["cy"], layer["rx"], layer["ry"]
    add(f'<g class="disc {cls}"><path class="disc-side" d="M{CX-rx},{cy} v{T} a{rx},{ry} 0 0 0 {2*rx},0 v{-T} a{rx},{ry} 0 0 1 {-2*rx},0Z"/>'
        f'<ellipse class="disc-top" cx="{CX}" cy="{cy}" rx="{rx}" ry="{ry}"/></g>')

add('<svg class="gr-svg" viewBox="-78 0 800 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GraphRAG layers">')
add('<defs><marker id="gr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10Z" class="gr-ah"/></marker></defs>')
# silhouette
for sx in (-1, 1):
    add(f'<path class="silhouette" d="M{CX+sx*BASE["rx"]},{BASE["cy"]} L{CX+sx*BOT["rx"]},{BOT["cy"]} L{CX+sx*MID["rx"]},{MID["cy"]} L{CX+sx*TOP["rx"]},{TOP["cy"]}"/>')

# ---------------- base: text
disc(BASE, "base")
docs = []
for i in range(11):
    t = -0.86 + i * 0.172
    x = CX + BASE["rx"] * 0.86 * t * 1.0
    y = BASE["cy"] + BASE["ry"] * 0.30 * math.sin(t * 2.2) - 4
    docs.append((x, y))
    add(f'<g class="doc" transform="translate({x:.1f},{y:.1f}) scale(1.3) translate(-7,-9)"><rect width="14" height="18" rx="2.5"/><path d="M3,6 H11 M3,10 H11 M3,14 H8"/></g>')

# ---------------- bottom: entities and relations
disc(BOT)
clusters = []
for ci, (u, v) in enumerate(UNIT):
    hx, hy = pos(BOT, u, v, 0.80)
    add(f'<ellipse class="halo" cx="{hx:.1f}" cy="{hy:.1f}" rx="62" ry="30" fill="{COL[ci]}"/>')
    nodes = [(hx, hy, 10)]
    n = 6
    for k in range(n):
        ang = 2 * math.pi * (k + random.uniform(-0.2, 0.2)) / n
        rr = random.uniform(0.55, 1.0)
        nodes.append((hx + math.cos(ang) * 42 * rr, hy + math.sin(ang) * 20 * rr, 7))
    clusters.append(nodes)
edges = []
for ci, nodes in enumerate(clusters):
    for k in range(1, len(nodes)):
        edges.append((nodes[0], nodes[k], COL[ci], 0.85))
        if k > 1 and k % 2 == 0: edges.append((nodes[k - 1], nodes[k], COL[ci], 0.6))
for ci in range(5):                                                  # a few links between neighbouring clusters
    a, b = clusters[ci], clusters[(ci + 1) % 5]
    best = min(((p, q) for p in a[1:] for q in b[1:]), key=lambda pq: (pq[0][0]-pq[1][0])**2 + ((pq[0][1]-pq[1][1])*2)**2)
    edges.append((best[0], best[1], None, 0.7))
for p, q, col, op in edges:
    cls = 'edge' if col is None else 'edge-c'
    st = '' if col is None else f' stroke="{col}"'
    add(f'<line class="{cls}"{st} x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke-opacity="{op}"/>')
for ci, nodes in enumerate(clusters):
    for (x, y, r) in nodes:
        add(f'<circle class="node" cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{COL[ci]}"/>')
# faint links from the text up into the graph
for (x, y) in docs[1::2]:
    near = min((n for c in clusters for n in c[1:]), key=lambda n: (n[0]-x)**2 + ((n[1]-y)*0.3)**2)
    add(f'<line class="rise" x1="{x:.1f}" y1="{y-9:.1f}" x2="{near[0]:.1f}" y2="{near[1]+5:.1f}"/>')

# ---------------- middle: topic clusters (full GraphRAG)
add('<g class="full">')
disc(MID, "mid")
mids = [pos(MID, u, v, 0.78) for (u, v) in UNIT]
for ci in range(5):
    a = mids[ci]; b = mids[(ci + 1) % 5]
    add(f'<line class="edge" x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke-opacity=".8"/>')
add(f'<line class="edge" x1="{mids[0][0]:.1f}" y1="{mids[0][1]:.1f}" x2="{mids[2][0]:.1f}" y2="{mids[2][1]:.1f}" stroke-opacity=".5"/>')
add(f'<line class="edge" x1="{mids[1][0]:.1f}" y1="{mids[1][1]:.1f}" x2="{mids[4][0]:.1f}" y2="{mids[4][1]:.1f}" stroke-opacity=".5"/>')
for ci, (x, y) in enumerate(mids):
    hub = clusters[ci][0]
    add(f'<line class="lift" stroke="{COL[ci]}" x1="{hub[0]:.1f}" y1="{hub[1]-6:.1f}" x2="{x:.1f}" y2="{y+19:.1f}"/>')
    add(f'<circle class="node-big" cx="{x:.1f}" cy="{y:.1f}" r="20" fill="{COL[ci]}"/><path class="gloss" d="M{x-9:.1f},{y-7:.1f} q9,-10 18,0"/>')
add('</g>')

# ---------------- top: overview (full GraphRAG)
add('<g class="full">')
disc(TOP, "top")
tx, ty = CX, TOP["cy"] - 2
for ci, (x, y) in enumerate(mids):
    add(f'<line class="lift" stroke="{COL[ci]}" x1="{x:.1f}" y1="{y-20:.1f}" x2="{tx:.1f}" y2="{ty+12:.1f}"/>')
add(f'<circle class="node-top" cx="{tx}" cy="{ty}" r="24"/>')
for ci in range(5):
    a = -math.pi / 2 + ci * 2 * math.pi / 5
    add(f'<circle cx="{tx+math.cos(a)*12.5:.1f}" cy="{ty+math.sin(a)*12.5:.1f}" r="4.6" fill="{COL[ci]}"/>')
add('</g>')

# ---------------- labels, numbers, LLM icons, brackets
def label(txt, y, cls="lbl"): add(f'<text class="{cls}" x="{CX}" y="{y}" text-anchor="middle">{txt}</text>')
label("OVERVIEW", TOP["cy"] + TOP["ry"] + T + 20)
label("TOPIC CLUSTERS", MID["cy"] + MID["ry"] + T + 20)
label("ENTITIES AND RELATIONS", BOT["cy"] + BOT["ry"] + T + 20)
label("TEXT: DOCS, REDDIT THREADS, SUBTITLES", BASE["cy"] + BASE["ry"] + T + 20)
for n, layer, k in ((4, TOP, 1.0), (3, MID, 1.0), (2, BOT, 1.0), (1, BASE, 1.0)):
    x = CX - layer["rx"] - 26; y = layer["cy"] + 4
    add(f'<circle class="num" cx="{x}" cy="{y}" r="14"/><text class="num-t" x="{x}" y="{y+5}" text-anchor="middle">{n}</text>')
LLM = '{{ "images/icons/llm.svg" | relURL }}'
for (y, txt) in ((468, "extracts"), (308, "summarises"), (148, "summarises")):
    add(f'<circle class="llm-bg" cx="-34" cy="{y}" r="36"/><image href="{LLM}" x="-62" y="{y-25}" width="56" height="50"/><text class="lbl-s" x="-34" y="{y+54}" text-anchor="middle">{txt}</text>')
# brackets (right) with vertical labels
def bracket(y0, y1, txt, cls):
    x = CX + BASE["rx"] + 38
    add(f'<path class="bracket {cls}" d="M{x-8},{y0} h8 V{y1} h-8"/>')
    add(f'<text class="brk {cls}" transform="translate({x+22},{(y0+y1)/2}) rotate(90)" text-anchor="middle">{txt}</text>')
bracket(BOT["cy"] - BOT["ry"] - 6, BASE["cy"] + BASE["ry"] + T + 4, "BUILT IN DOCSKEEPING", "in")
bracket(TOP["cy"] - TOP["ry"] - 6, MID["cy"] + MID["ry"] + T + 4, "FUTURE WORK: FULL GRAPHRAG LAYERS", "ext")
add('</svg>')
open("layouts/partials/graphrag-svg.html", "w").write("\n".join(out) + "\n")
print("ok", sum(len(s) for s in out), "bytes")
