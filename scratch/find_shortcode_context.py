import re

with open("scratch/embed_snippet.html", "r", encoding="utf-8") as f:
    html = f.read()

shortcode = "C3yLgL9M-2U"
for m in re.finditer(shortcode, html):
    start = max(0, m.start() - 2000)
    end = min(len(html), m.end() + 2000)
    print("--- MATCH CONTEXT ---")
    print(html[start:end])
    print("-" * 50)
