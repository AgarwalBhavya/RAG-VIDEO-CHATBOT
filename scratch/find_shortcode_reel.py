with open("scratch/reel_page.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
shortcode = "C3yLgL9M-2U"
for m in re.finditer(shortcode, html):
    start = max(0, m.start() - 1000)
    end = min(len(html), m.end() + 1000)
    print("--- CONTEXT ---")
    print(html[start:end])
    print("-" * 50)
