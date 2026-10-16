from PIL import Image, ImageDraw
import math

def make(size, path):
    s = size * 4
    img = Image.new("RGB", (s, s))
    px = img.load()
    for y in range(s):
        for x in range(s):
            t = (x + y) / (2 * s)
            px[x, y] = (int(79 + (6 - 79) * t), int(70 + (182 - 70) * t), int(229 + (212 - 229) * t))
    d = ImageDraw.Draw(img)
    c = s / 2
    r = s * 0.27
    w = int(s * 0.07)
    box = [c - r, c - r, c + r, c + r]
    d.arc(box, start=-60, end=250, fill="white", width=w)
    ang = math.radians(250)
    ex, ey = c + r * math.cos(ang), c + r * math.sin(ang)
    d.polygon([(ex - s * 0.09, ey - s * 0.02), (ex + s * 0.06, ey - s * 0.10), (ex + s * 0.07, ey + s * 0.07)], fill="white")
    d.ellipse([c - s * 0.05, c - s * 0.05, c + s * 0.05, c + s * 0.05], fill="white")
    img.resize((size, size), Image.LANCZOS).save(path)

make(192, "icon-192.png")
make(512, "icon-512.png")
make(180, "apple-touch-icon.png")
