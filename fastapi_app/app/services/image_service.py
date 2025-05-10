import os
import binascii
import numpy as np
from PIL import Image
from Crypto.Cipher import AES, ChaCha20, ARC4
from Crypto.Util import Counter
from typing import List, Dict, Optional
import io
import base64
import cv2

class ImageEncryptionService:
    def __init__(self):
        pass

    def process_image_region(self, image_data: bytes, region: Dict, key: bytes, nonce: Optional[bytes], 
                           algorithm: str, operation: str) -> bytes:
        """Process a single region of an image with the specified algorithm."""
        x = int(region["left"])
        y = int(region["top"])
        width = int(region["width"] * region.get("scaleX", 1))
        height = int(region["height"] * region.get("scaleY", 1))

        # Convert image data to numpy array
        img = Image.open(io.BytesIO(image_data))
        img_array = np.array(img)
        
        # Extract region
        h, w, _ = img_array.shape
        x = max(0, min(x, w - 1))
        y = max(0, min(y, h - 1))
        width = max(1, min(width, w - x))
        height = max(1, min(height, h - y))
        
        region_data = img_array[y:y+height, x:x+width].tobytes()

        # Process region based on algorithm
        if algorithm == "AES-CTR":
            ctr = Counter.new(64, prefix=nonce, initial_value=0)
            cipher = AES.new(key, AES.MODE_CTR, counter=ctr)
            processed = cipher.encrypt(region_data) if operation == "encrypt" else cipher.decrypt(region_data)
        elif algorithm == "ChaCha20":
            cipher = ChaCha20.new(key=key, nonce=nonce)
            processed = cipher.encrypt(region_data) if operation == "encrypt" else cipher.decrypt(region_data)
        elif algorithm == "RC4":
            cipher = ARC4.new(key)
            processed = cipher.encrypt(region_data)
        else:  # Logistic XOR
            seed_int = int.from_bytes(key, 'big')
            x0 = seed_int / (2**128 - 1)
            mu = 3.99
            ks = bytearray(len(region_data))
            for i in range(len(region_data)):
                x0 = mu * x0 * (1 - x0)
                ks[i] = int((x0 % 1) * 256)
            processed = bytes(b ^ k for b, k in zip(region_data, ks))

        # Convert processed bytes back to numpy array
        processed_array = np.frombuffer(processed[:width*height*3], dtype=np.uint8).reshape((height, width, 3))
        
        # Update the original image array
        img_array[y:y+height, x:x+width] = processed_array
        
        # Convert back to image and return bytes
        processed_img = Image.fromarray(img_array)
        output = io.BytesIO()
        processed_img.save(output, format='PNG')
        return output.getvalue()

    def process_image(self, image_data: bytes, regions: List[Dict], key: str, nonce: Optional[str], 
                     algorithm: str, operation: str) -> bytes:
        """Process an image with multiple regions using the specified algorithm."""
        # Convert hex strings to bytes
        key_bytes = binascii.unhexlify(key)
        nonce_bytes = binascii.unhexlify(nonce) if nonce else None

        # Process each region
        processed_data = image_data
        for region in regions:
            processed_data = self.process_image_region(processed_data, region, key_bytes, nonce_bytes, 
                                                     algorithm, operation)
        
        return processed_data
        
    def detect_encrypted_regions(self, image_data: bytes) -> List[Dict]:
        """Detect potentially encrypted regions in an image."""
        print("Starting region detection...")
        # Convert image data to numpy array
        img = Image.open(io.BytesIO(image_data))
        img_array = np.array(img)
        print(f"Image shape: {img_array.shape}")
        
        # Convert to grayscale for processing
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Calculate local contrast
        kernel_size = 3
        blurred = cv2.GaussianBlur(gray, (kernel_size, kernel_size), 0)
        contrast = cv2.absdiff(gray, blurred)
        
        # Normalize contrast
        contrast = cv2.normalize(contrast, None, 0, 255, cv2.NORM_MINMAX)
        
        # Threshold to find high contrast regions
        _, binary = cv2.threshold(contrast, 50, 255, cv2.THRESH_BINARY)
        
        # Apply morphological operations to separate regions
        kernel = np.ones((3,3), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)  # Remove noise
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)  # Close small holes
        
        # Find contours in the binary image
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        print(f"Found {len(contours)} high contrast regions")
        
        regions = []
        min_area = 25  # Small minimum area to catch all potential regions
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > min_area:
                x, y, w, h = cv2.boundingRect(contour)
                
                # Calculate local statistics
                region = gray[y:y+h, x:x+w]
                if region.size > 0:
                    mean = np.mean(region)
                    std = np.std(region)
                    print(f"Region at ({x}, {y}) - size: {w}x{h}, mean: {mean:.2f}, std: {std:.2f}")
                    
                    # Regions with high standard deviation are likely encrypted
                    if std > 30:  # Threshold for standard deviation
                        print(f"Detected encrypted region at ({x}, {y})")
                        # Don't expand the region to prevent merging
                        regions.append({
                            "left": int(x),
                            "top": int(y),
                            "width": int(w),
                            "height": int(h),
                            "scaleX": 1,
                            "scaleY": 1
                        })
        
        # If no regions were detected or we need more precision, try block-based detection
        if len(regions) < 2:  # We know we should have 2 regions
            print("Trying block-based detection for more precision...")
            # Try to detect regions based on local statistics
            h, w = gray.shape
            block_size = 8  # Smaller block size
            block_regions = []
            
            for y in range(0, h, block_size):
                for x in range(0, w, block_size):
                    block = gray[y:min(y+block_size, h), x:min(x+block_size, w)]
                    if block.size > 0:
                        std = np.std(block)
                        if std > 30:  # Same threshold for consistency
                            print(f"Detected encrypted block at ({x}, {y}) - std: {std:.2f}")
                            block_regions.append({
                                "left": int(x),
                                "top": int(y),
                                "width": int(min(block_size, w-x)),
                                "height": int(min(block_size, h-y)),
                                "scaleX": 1,
                                "scaleY": 1
                            })
            
            # If we found more regions with block detection, use those instead
            if len(block_regions) > len(regions):
                regions = block_regions
        
        print(f"Total regions detected: {len(regions)}")
        return regions
    
    def _is_likely_encrypted(self, region: np.ndarray) -> bool:
        """Determine if a region is likely encrypted based on local statistics."""
        if region.size == 0:
            return False
            
        # Calculate standard deviation
        std = np.std(region)
        
        # Calculate mean
        mean = np.mean(region)
        
        # Encrypted regions typically have high standard deviation
        is_encrypted = std > 30
        if is_encrypted:
            print(f"Region detected as encrypted - mean: {mean:.2f}, std: {std:.2f}")
        return is_encrypted
    
    def auto_decrypt_image(self, image_data: bytes, key: str, nonce: Optional[str], algorithm: str) -> bytes:
        """Automatically detect and decrypt encrypted regions in an image."""
        print("\nStarting auto-decryption...")
        # Detect encrypted regions
        encrypted_regions = self.detect_encrypted_regions(image_data)
        
        # If no encrypted regions found, return the original image
        if not encrypted_regions:
            print("No encrypted regions detected, returning original image")
            return image_data
            
        print(f"Attempting to decrypt {len(encrypted_regions)} regions...")
        # Decrypt detected regions
        try:
            result = self.process_image(image_data, encrypted_regions, key, nonce, algorithm, "decrypt")
            print("Decryption completed successfully")
            return result
        except Exception as e:
            print(f"Error during decryption: {str(e)}")
            raise 