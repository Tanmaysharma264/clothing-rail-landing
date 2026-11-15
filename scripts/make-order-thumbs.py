"""
Makes the small product pictures that appear in the Google Sheet (one per product):
    public/order-thumbs/<product-id>.jpg

Run it after adding or changing products (needs Python with Pillow):
    pip install pillow
    python3 scripts/make-order-thumbs.py

It reads each product's main photo (`image`) from src/data/placeholder-items.ts, crops the empty space
around the garment, puts it on white, and saves a small JPEG.
"""
import os
import re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = open(os.path.join(ROOT, "src/data/placeholder-items.ts"), encoding="utf-8").read()
pairs = re.findall(r'id: "([^"]+)",.*?\n    image: `\$\{P\}/([^`]+)`', data, re.S)
out_dir = os.path.join(ROOT, "public/order-thumbs")
os.makedirs(out_dir, exist_ok=True)

for product_id, filename in pairs:
    photo = Image.open(os.path.join(ROOT, "public/products", filename)).convert("RGBA")
    box = photo.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox() or (0, 0, *photo.size)
    pad = int(0.03 * max(photo.size))
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(photo.width, box[2] + pad), min(photo.height, box[3] + pad))
    photo = photo.crop(box)
    photo.thumbnail((360, 360), Image.LANCZOS)
    white = Image.new("RGB", photo.size, (255, 255, 255))
    white.paste(photo, mask=photo.getchannel("A"))
    path = os.path.join(out_dir, f"{product_id}.jpg")
    white.save(path, "JPEG", quality=86, optimize=True)
    print(f"{product_id:24} {white.size[0]}x{white.size[1]}  {os.path.getsize(path) // 1024} KB")
print(len(pairs), "pictures written")
