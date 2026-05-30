import httpx
import re
import json

url = "https://www.instagram.com/reel/C3yLgL9M-2U/embed/captioned/"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

try:
    r = httpx.get(url, headers=headers, timeout=10.0)
    print("Status Code:", r.status_code)
    
    # Save a snippet of HTML for inspection
    with open("scratch/embed_snippet.html", "w", encoding="utf-8") as f:
        f.write(r.text)
        
    print("HTML saved to scratch/embed_snippet.html")
    
    # Search for JSON data or script blocks containing data
    # Standard Instagram embeds have window.__additionalDataLoaded or similar
    script_blocks = re.findall(r'<script[^>]*>(.*?)</script>', r.text, re.DOTALL)
    print("Found", len(script_blocks), "script blocks")
    
    for i, sb in enumerate(script_blocks):
        if "shortcode_media" in sb or "username" in sb or "caption" in sb:
            print(f"Script block {i} contains keywords!")
            print(sb[:300])
            
except Exception as e:
    print("Error:", e)
