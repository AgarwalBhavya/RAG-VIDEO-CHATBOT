import yt_dlp
import json

url = "https://www.instagram.com/reel/DY6OHOfs4oy/"
ydl_opts = {
    'quiet': True,
    'no_warnings': True,
    'cookiefile': 'cookies.txt'
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        print("Success extracting info!")
        
        # Let's search for any key with 'view' or 'play' or 'count'
        found_keys = {}
        for k, v in info.items():
            if any(word in k.lower() for word in ['view', 'play', 'count', 'like', 'comment']):
                found_keys[k] = v
        
        print("\nFound interesting keys and values:")
        for k, v in found_keys.items():
            print(f"- {k}: {v}")
            
except Exception as e:
    print("Error:", e)
