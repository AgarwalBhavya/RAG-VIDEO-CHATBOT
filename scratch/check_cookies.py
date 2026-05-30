import http.cookiejar
from datetime import datetime

cj = http.cookiejar.MozillaCookieJar('cookies.txt')
cj.load(ignore_discard=True, ignore_expires=True)

now = datetime.now().timestamp()
print("Current Time:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"({now})")

print("\nCookies in cookies.txt:")
for cookie in cj:
    exp_str = "No Expire"
    expired = False
    if cookie.expires:
        exp_date = datetime.fromtimestamp(cookie.expires)
        exp_str = exp_date.strftime("%Y-%m-%d %H:%M:%S")
        expired = cookie.expires < now
    print(f"Name: {cookie.name:<15} Expire: {exp_str:<20} Expired: {expired:<5} Value: {cookie.value[:30]}...")
