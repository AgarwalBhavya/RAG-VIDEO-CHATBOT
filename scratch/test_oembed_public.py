import httpx

url = "https://api.instagram.com/oembed/?url=https://www.instagram.com/reel/C3yLgL9M-2U/"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

try:
    r = httpx.get(url, headers=headers, timeout=10.0)
    print("Status Code:", r.status_code)
    print("Response:")
    print(r.text)
except Exception as e:
    print("Error:", e)
