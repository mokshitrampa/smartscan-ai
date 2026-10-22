import cv2
import numpy as np
import os

def read_image_safe(file_path):
    """Safely read image with unicode / Windows paths."""
    try:
        with open(file_path, 'rb') as f:
            bytes_data = bytearray(f.read())
            np_arr = np.asarray(bytes_data, dtype=np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            return img
    except Exception as e:
        print(f"Error reading image: {e}")
        return cv2.imread(file_path)

def write_image_safe(file_path, img):
    """Safely write image with unicode / Windows paths with compression."""
    try:
        ext = os.path.splitext(file_path)[1].lower() or '.jpg'
        params = []
        if ext in ['.jpg', '.jpeg']:
            params = [cv2.IMWRITE_JPEG_QUALITY, 92]
        elif ext == '.png':
            params = [cv2.IMWRITE_PNG_COMPRESSION, 6]
        success, encoded = cv2.imencode(ext, img, params)
        if success:
            with open(file_path, 'wb') as f:
                f.write(encoded)
            return True
    except Exception as e:
        print(f"Error writing image: {e}")
        return cv2.imwrite(file_path, img)

def measure_blur_score(img):
    """Calculates image focus/sharpness using variance of the Laplacian."""
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        return round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 1)
    except Exception:
        return 0.0

def enhance_and_deblur_image(input_path, output_path=None):
    """
    Clears pixelation, removes blur, balances uneven illumination/shadows,
    and sharpens text edges on photos and scanned documents.
    """
    img = read_image_safe(input_path)
    if img is None:
        return None, 0, 0

    h, w = img.shape[:2]
    initial_blur = measure_blur_score(img)

    # 1. Super-resolution scaling: upscale small, compressed, or pixelated images
    # e.g., low-res WhatsApp or phone camera snapshots
    max_dim = max(h, w)
    if max_dim < 1300:
        scale = min(2.5, 1400.0 / max_dim)
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

    # 2. Unsharp Masking (high-frequency detail extraction & deblurring)
    # Subtracts soft Gaussian blur and adds back amplified high frequencies
    gaussian = cv2.GaussianBlur(img, (0, 0), 2.2)
    sharpened = cv2.addWeighted(img, 1.65, gaussian, -0.65, 0)

    # 3. Adaptive Illumination & Contrast Equalization (CLAHE on L-channel)
    # Corrects phone shadows, yellow lighting, and enhances text darkness
    lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    enhanced_color = cv2.cvtColor(cv2.merge((l_enhanced, a, b)), cv2.COLOR_LAB2BGR)

    # 4. Bilateral Edge-Preserving Denoising
    # Removes sensor noise and pixel compression artifacts while keeping letter strokes sharp
    denoised = cv2.bilateralFilter(enhanced_color, 5, 45, 45)

    # 5. Ink stroke enhancement: slight boost to high contrast edges
    kernel_sharpen = np.array([
        [0, -0.5, 0],
        [-0.5, 3.0, -0.5],
        [0, -0.5, 0]
    ], dtype=np.float32)
    final_cleared = cv2.filter2D(denoised, -1, kernel_sharpen)
    final_cleared = np.clip(final_cleared, 0, 255).astype(np.uint8)

    # Blend 85% enhanced with 15% original to avoid harsh over-sharpening
    final_result = cv2.addWeighted(final_cleared, 0.85, enhanced_color, 0.15, 0)

    final_blur = measure_blur_score(final_result)

    # Save output
    if not output_path:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_cleared.png"

    write_image_safe(output_path, final_result)

    return output_path, initial_blur, final_blur
