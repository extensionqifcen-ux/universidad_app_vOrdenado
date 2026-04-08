import qrcode

data = "https://extensionqifcen-ux.github.io/universidad_app_vOrdenado/"
img = qrcode.make(data)
img.save("qr.png")
