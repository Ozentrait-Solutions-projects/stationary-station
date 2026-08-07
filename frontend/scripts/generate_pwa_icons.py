import os
from PIL import Image

source_path = r"C:\Users\adity\.gemini\antigravity-ide\brain\f2722a85-971d-4ebe-acdf-d8bb36f16950\nexcart_pwa_icon_1786083440995.png"
output_dir = r"d:\stationary-station\frontend\public"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

img = Image.open(source_path).convert("RGBA")

# Ensure aspect ratio is square
width, height = img.size
min_dim = min(width, height)
if width != height:
    img = img.crop((0, 0, min_dim, min_dim))

sizes = {
    "favicon-16x16.png": (16, 16),
    "favicon-32x32.png": (32, 32),
    "favicon.ico": (32, 32),
    "icon-72x72.png": (72, 72),
    "icon-96x96.png": (96, 96),
    "icon-128x128.png": (128, 128),
    "icon-144x144.png": (144, 144),
    "icon-152x152.png": (152, 152),
    "apple-touch-icon.png": (180, 180),
    "logo192.png": (192, 192),
    "icon-192x192.png": (192, 192),
    "maskable-icon-192x192.png": (192, 192),
    "icon-384x384.png": (384, 384),
    "logo512.png": (512, 512),
    "icon-512x512.png": (512, 512),
    "maskable-icon-512x512.png": (512, 512),
}

for filename, size in sizes.items():
    dest_path = os.path.join(output_dir, filename)
    resized = img.resize(size, Image.Resampling.LANCZOS)
    if filename.endswith(".ico"):
        resized.save(dest_path, format="ICO")
    else:
        resized.save(dest_path, format="PNG", optimize=True)
    print(f"Generated {filename} ({size[0]}x{size[1]})")

print("All PWA icons successfully generated!")
