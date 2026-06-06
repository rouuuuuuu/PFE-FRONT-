from PIL import Image

def crop_transparency(img_path):
    img = Image.open(img_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Get the bounding box of the non-zero alpha channel
    bbox = img.getbbox()
    if bbox:
        # crop to the bounding box
        cropped = img.crop(bbox)
        cropped.save(img_path)
        print(f"Cropped {img_path} to {bbox}")
    else:
        print(f"No content found in {img_path}")

crop_transparency('src/assets/orange-noc-horizontal-white-text.png')
crop_transparency('src/assets/orange-noc-horizontal-dark-text.png')
