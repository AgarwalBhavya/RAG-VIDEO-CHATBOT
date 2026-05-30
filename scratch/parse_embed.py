import re

with open("scratch/embed_snippet.html", "r", encoding="utf-8") as f:
    html = f.read()

print("HTML Length:", len(html))

# Search for username
username_match = re.search(r'class="Username"[^>]*>([^<]+)</span>', html)
if username_match:
    print("Found username via class='Username':", username_match.group(1))
else:
    # Alternative username search
    username_match = re.search(r'instagram\.com/([a-zA-Z0-9_\.]+)/', html)
    if username_match:
        print("Found username via link:", username_match.group(1))

# Search for caption/description
caption_match = re.search(r'class="Caption"[^>]*>(.*?)</div>', html, re.DOTALL)
if caption_match:
    clean_caption = re.sub('<[^<]+?>', '', caption_match.group(1)).strip()
    print("Found caption:", clean_caption[:150])

# Search for likes
likes_match = re.search(r'class="Likes"[^>]*>([^<]+)</div>', html, re.DOTALL)
if likes_match:
    print("Found likes:", likes_match.group(1).strip())
else:
    likes_match = re.search(r'class="Likes"[^>]*>(.*?)</span>', html, re.DOTALL)
    if likes_match:
         print("Found likes (span):", likes_match.group(1).strip())
