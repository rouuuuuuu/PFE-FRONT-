from PIL import Image
import collections

img = Image.open('src/assets/orange-noc-horizontal-white-text.png').convert('RGBA')
pixels = img.getdata()

color_counts = collections.Counter()
for r, g, b, a in pixels:
    if a > 50:
        # Ignore mostly white, black, grays
        if max(r, g, b) - min(r, g, b) > 30 and sum((r,g,b)) > 100:
            color_counts[(r, g, b)] += 1

print("Top 10 colors:")
for color, count in color_counts.most_common(10):
    print(f"#{color[0]:02x}{color[1]:02x}{color[2]:02x} : {count}")
