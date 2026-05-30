import instaloader

L = instaloader.Instaloader()
print("Attributes of Instaloader:")
print([attr for attr in dir(L) if "cookie" in attr.lower()])

print("\nAttributes of InstaloaderContext:")
print([attr for attr in dir(L.context) if "cookie" in attr.lower()])
