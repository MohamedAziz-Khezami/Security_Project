import os
import binascii
import numpy as np
from PIL import Image
from Crypto.Cipher import AES, ChaCha20, ARC4
from Crypto.Util import Counter
from typing import List, Dict, Optional
import io
import base64

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