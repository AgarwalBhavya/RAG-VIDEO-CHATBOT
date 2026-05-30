import httpx
import re

urls = [
    "https://www.instagram.com/reel/C3yLgL9M-2U/embed/captioned/",
    "https://www.instagram.com/reel/DY6OHOfs4oy/embed/captioned/"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

for url in urls:
    print(f"\nFetching {url}...")
    try:
        r = httpx.get(url, headers=headers, timeout=10.0)
        print("Status Code:", r.status_code)
        print("Length:", len(r.text))
        
        # Check if error page
        if "PolarisErrorRoute" in r.text or "httpErrorPage" in r.text:
            print("-> ERROR page detected!")
        else:
            print("-> SUCCESS page detected!")
            # Search for creator or caption
            username_match = re.search(r'class="Username"[^>]*>([^<]+)</span>', r.text)
            if username_match:
                print("Found Username in HTML:", username_match.group(1))
            else:
                username_match = re.search(r'instagram\.com/([a-zA-Z0-9_\.]+)/', r.text)
                print("Username fallback link:", username_match.group(1) if username_match else "None")
                
            caption_match = re.search(r'class="Caption"[^>]*>(.*?)</div>', r.text, re.DOTALL)
            if caption_match:
                print("Caption:", re.sub('<[^<]+?>', '', caption_match.group(1)).strip()[:100])
    except Exception as e:
        print("Error:", e)
