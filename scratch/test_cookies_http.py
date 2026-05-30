import httpx
import http.cookiejar
import re

cj = http.cookiejar.MozillaCookieJar('cookies.txt')
try:
    cj.load(ignore_discard=True, ignore_expires=True)
    print("Loaded cookies.txt successfully. Number of cookies:", len(cj))
except Exception as e:
    print("Failed to load cookies.txt:", e)
    cj = None

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
}

client_kwargs = {
    'headers': headers,
    'follow_redirects': True,
    'timeout': 15.0
}
if cj:
    client_kwargs['cookies'] = cj

urls = [
    "https://www.instagram.com/reel/C3yLgL9M-2U/",
    "https://www.instagram.com/reel/C3yLgL9M-2U/embed/captioned/"
]

for url in urls:
    print(f"\nFetching {url} ...")
    try:
        with httpx.Client(**client_kwargs) as client:
            r = client.get(url)
            print("Status Code:", r.status_code)
            print("Response length:", len(r.text))
            
            # Save response to a scratch file
            filename = "scratch/reel_page.html" if "embed" not in url else "scratch/embed_page.html"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(r.text)
            print(f"Saved to {filename}")
            
            # Check for error page
            if "PolarisErrorRoute" in r.text or "httpErrorPage" in r.text:
                print("-> Detected HTTP Error Page / Redirected to Error!")
            else:
                print("-> Looks like a valid response!")
                
            # Search for username/owner
            username_matches = re.findall(r'"username"\s*:\s*"([^"]+)"', r.text)
            if username_matches:
                print("Found usernames in JSON:", set(username_matches))
                
            # Search for shortcode
            shortcode_matches = re.findall(r'"shortcode"\s*:\s*"([^"]+)"', r.text)
            if shortcode_matches:
                print("Found shortcodes in JSON:", set(shortcode_matches))
                
    except Exception as e:
        print("Error during fetch:", e)
