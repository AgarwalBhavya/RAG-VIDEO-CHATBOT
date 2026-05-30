import re
import json

with open("scratch/embed_snippet.html", "r", encoding="utf-8") as f:
    html = f.read()

# Search for JSON blocks
print("Searching for owner_username in script blocks...")
for m in re.finditer(r'"owner_username"\s*:\s*"([^"]+)"', html):
    print("Found owner_username:", m.group(1))

for m in re.finditer(r'"shortcode_media"\s*:\s*\{', html):
    print("Found shortcode_media block!")
    
# Let's search for "username" inside the script blocks
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
for i, script in enumerate(scripts):
    if "username" in script:
        # Search for any user data
        matches = re.findall(r'"username"\s*:\s*"([^"]+)"', script)
        if matches:
            print(f"Script {i} usernames: {matches}")
            
        # Search for "edge_media_preview_like" or likes
        like_matches = re.findall(r'"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)', script)
        if like_matches:
            print(f"Script {i} likes count: {like_matches}")
            
        # Search for comments count
        comment_matches = re.findall(r'"edge_media_to_comment"\s*:\s*\{\s*"count"\s*:\s*(\d+)', script)
        if comment_matches:
            print(f"Script {i} comments count: {comment_matches}")

        # Search for caption/text
        caption_matches = re.findall(r'"node"\s*:\s*\{\s*"text"\s*:\s*"([^"]+)"', script)
        if caption_matches:
            print(f"Script {i} caption nodes: {[c[:50] for c in caption_matches]}")
