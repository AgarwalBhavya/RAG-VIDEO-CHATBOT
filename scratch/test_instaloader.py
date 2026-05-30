import instaloader
import sys

url = "https://www.instagram.com/reel/C3yLgL9M-2U/"
shortcode = "C3yLgL9M-2U"

print("Initializing Instaloader...")
L = instaloader.Instaloader()

try:
    print("Loading cookies from cookies.txt...")
    L.context.load_cookies(cookiefile="cookies.txt")
    print("Cookies loaded successfully!")
except Exception as e:
    print("Failed to load cookies:", e)
    # Continue anyway in case public info works

try:
    print(f"Fetching post with shortcode {shortcode}...")
    post = instaloader.Post.from_shortcode(L.context, shortcode)
    print("Success!")
    print("Title/Caption:", post.caption[:200] if post.caption else "No Caption")
    print("Owner/Creator:", post.owner_username)
    print("Likes:", post.likes)
    print("Comments count:", post.comments)
    print("Views (video):", post.video_view_count if post.is_video else "Not a video")
    print("Duration:", post.video_duration if post.is_video else "N/A")
    print("Date:", post.date_utc.isoformat() if post.date_utc else "N/A")
except Exception as e:
    print("Error fetching post:", e)
