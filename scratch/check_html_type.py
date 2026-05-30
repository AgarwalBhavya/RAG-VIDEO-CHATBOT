import re

with open("scratch/reel_page.html", "r", encoding="utf-8") as f:
    html = f.read()

print("HTML length:", len(html))

# Print first 200 lines or search for key text
# Let's search for heading tags
headings = re.findall(r'<h[1-6][^>]*>(.*?)</h[1-6]>', html, re.IGNORECASE)
print("Headings:", headings)

# Let's see if there are standard error phrases
error_phrases = ["page isn't available", "broken link", "removed", "log in", "sign up"]
for phrase in error_phrases:
    matches = len(re.findall(phrase, html, re.IGNORECASE))
    print(f"Matches for '{phrase}':", matches)

# Search for the word 'C3yLgL9M-2U' in the whole file
matches_shortcode = len(re.findall("C3yLgL9M-2U", html))
print("Shortcode matches:", matches_shortcode)
