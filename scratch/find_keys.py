import re

with open("scratch/embed_snippet.html", "r", encoding="utf-8") as f:
    html = f.read()

print("HTML length:", len(html))

# Let's search for "login" or similar to see if we were blocked or redirected
login_matches = re.findall(r'login', html, re.IGNORECASE)
print("Login occurrences:", len(login_matches))

# Let's search for the shortcode in the HTML to see if the video data is actually there
shortcode = "C3yLgL9M-2U"
print(f"Shortcode '{shortcode}' occurrences:", len(re.findall(shortcode, html)))

# Let's see some text content (e.g. within <title> tag)
title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
if title_match:
    print("Title tag content:", title_match.group(1))

# Let's print the first 1000 characters of the HTML to see the header
print("\nFirst 1000 chars of HTML:")
print(html[:1000])
