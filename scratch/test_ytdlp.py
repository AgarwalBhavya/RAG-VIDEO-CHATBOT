import yt_dlp
import json

url = "https://www.instagram.com/reel/C3yLgL9M-2U/"
ydl_opts = {
    'quiet': False,
    'no_warnings': False,
    'cookiefile': 'cookies.txt'
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        print("Success!")
        print("Title:", info.get("title"))
        print("Uploader:", info.get("uploader"))
        print("Likes:", info.get("like_count"))
except Exception as e:
    print("Failed with error:", e)
