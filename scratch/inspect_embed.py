import re

with open("scratch/embed_snippet.html", "r", encoding="utf-8") as f:
    html = f.read()

# Let's search for some occurrences of words to see their context
def search_context(pattern, size=200):
    for m in re.finditer(pattern, html, re.IGNORECASE):
        start = max(0, m.start() - 100)
        end = min(len(html), m.end() + 100)
        print(f"--- MATCH FOR {pattern} ---")
        print(html[start:end])
        print("-" * 30)

print("Searching for Username class...")
search_context(r'class="Username"')

print("Searching for Caption class...")
search_context(r'class="Caption"')

print("Searching for Likes class...")
search_context(r'class="Likes"')
