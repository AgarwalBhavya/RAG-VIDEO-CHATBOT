import re
import json

with open("scratch/reel_page.html", "r", encoding="utf-8") as f:
    html = f.read()

print("HTML Length:", len(html))

# Let's search for some patterns
print("\n--- Searching for title or meta tags ---")
meta_tags = re.findall(r'<meta[^>]+>', html)
for meta in meta_tags:
    if any(k in meta for k in ['title', 'description', 'og:title', 'og:description', 'twitter:title']):
        print(meta)

print("\n--- Searching for og:video or video source ---")
for meta in meta_tags:
    if 'video' in meta:
        print(meta)

# Let's find username
username_match = re.search(r'"owner":\s*\{\s*"id":[^,]+,\s*"username":\s*"([^"]+)"', html)
if username_match:
    print("Found username in owner object:", username_match.group(1))

# Let's search for script blocks containing data
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"\nFound {len(scripts)} script blocks.")

for i, script in enumerate(scripts):
    if '"shortcode_media"' in script:
        print(f"Script block {i} contains 'shortcode_media'!")
        # Let's print a portion of it
        idx = script.find('"shortcode_media"')
        print(script[idx:idx+1500])
        print("..." * 10)
