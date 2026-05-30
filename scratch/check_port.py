import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    # Try to bind to 5173 to see if it is in use
    s.bind(("127.0.0.1", 5173))
    print("Port 5173 is FREE! No active server is running on this port.")
except Exception as e:
    print("Port 5173 is BUSY! An active server is currently using this port:", e)
finally:
    s.close()
