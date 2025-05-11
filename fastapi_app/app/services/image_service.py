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
import logging
from Crypto.Util.Padding import pad, unpad

logger = logging.getLogger(__name__)

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

    def partial_process_image(
        self,
        image_data: bytes,
        regions: List[Dict],
        operation: str,
        algorithm: str,
        password: Optional[str] = None,
        key_size: Optional[int] = None,
        mode: Optional[str] = None,
        iv: Optional[str] = None,
        nonce: Optional[str] = None,
        rc4_key: Optional[str] = None,
        logistic_initial: Optional[float] = None,
        logistic_parameter: Optional[float] = None
    ) -> bytes:
        """Process specific regions of an image with the specified algorithm."""
        try:
            logger.info(f"Starting image processing with {len(regions)} regions")
            logger.info(f"Operation: {operation}, Algorithm: {algorithm}")
            
            # Convert image data to numpy array
            img = Image.open(io.BytesIO(image_data))
            logger.info(f"Original image size: {img.size}, mode: {img.mode}")
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img_array = np.array(img)
            logger.info(f"Image array shape: {img_array.shape}")
            
            # Create a copy for the output
            out = img_array.copy()
            
            # Process each region
            for i, region in enumerate(regions):
                logger.info(f"Processing region {i+1}: {region}")
                
                x = int(region["left"])
                y = int(region["top"])
                width = int(region["width"])
                height = int(region["height"])
                
                # Ensure coordinates are within bounds
                h, w, _ = img_array.shape
                x = max(0, min(x, w - 1))
                y = max(0, min(y, h - 1))
                width = max(1, min(width, w - x))
                height = max(1, min(height, h - y))
                
                logger.info(f"Region bounds: x={x}, y={y}, width={width}, height={height}")
                
                # Extract region and ensure it's contiguous
                segment = img_array[y:y+height, x:x+width].copy()
                segment_bytes = segment.tobytes()
                logger.info(f"Segment size: {len(segment_bytes)} bytes")
                
                # Process region based on algorithm
                if algorithm.lower() == "aes":
                    if not password or not key_size or not mode:
                        raise ValueError("Password, key size, and mode are required for AES")
                    
                    # Generate key from password
                    key = self._derive_key(password, key_size)
                    print("key", key)
                    logger.info(f"Using AES-{key_size} in {mode} mode")
                    
                    # Handle different AES modes
                    mode = mode.lower()
                    if mode == "ctr":
                        if not nonce:
                            raise ValueError("Nonce is required for AES-CTR mode")
                        try:
                            nonce_bytes = binascii.unhexlify(nonce)
                        except:
                            nonce_bytes = nonce.encode()
                        # Ensure nonce is exactly 16 bytes (128 bits) for AES
                        if len(nonce_bytes) > 16:
                            nonce_bytes = nonce_bytes[:16]
                        elif len(nonce_bytes) < 16:
                            nonce_bytes = nonce_bytes.ljust(16, b'\0')
                        # Create counter with full 16-byte nonce
                        ctr = Counter.new(
                            128,
                            prefix=nonce_bytes[:8],   # only first 8 bytes
                            initial_value=0           # counter field will default to 8 bytes
                        )
                        cipher = AES.new(
                            key,
                            AES.MODE_CTR,
                            nonce=nonce_bytes[:8],                                  # e.g. 8 B
                            initial_value=int.from_bytes(nonce_bytes[8:], "big")    # remaining 8 B
                        )
                        proc = cipher.encrypt(segment_bytes)
                    elif mode == "cbc":
                        if not iv and not nonce:
                            raise ValueError("IV is required for AES-CBC mode")
                        try:
                            iv_bytes = binascii.unhexlify(nonce)
                        except:
                            iv_bytes = iv.encode()
                        # Ensure IV is exactly 16 bytes
                        if len(iv_bytes) > 16:
                            iv_bytes = iv_bytes[:16]
                        elif len(iv_bytes) < 16:
                            iv_bytes = iv_bytes.ljust(16, b'\0')
                        
                        cipher = AES.new(key, AES.MODE_CBC, iv_bytes)
                        if operation == "encrypt":
                            # Calculate padding needed to reach next 16-byte boundary
                            padding_needed = (16 - (len(segment_bytes) % 16)) % 16
                            padded_data = segment_bytes + bytes([padding_needed] * padding_needed)
                            proc = cipher.encrypt(padded_data)
                        else:
                            # For decryption, we need to ensure the data length is a multiple of 16
                            if len(segment_bytes) % 16 != 0:
                                # Add padding to make it a multiple of 16
                                padding_needed = 16 - (len(segment_bytes) % 16)
                                segment_bytes = segment_bytes + bytes([padding_needed] * padding_needed)
                            
                            try:
                                # Decrypt the data
                                decrypted = cipher.decrypt(segment_bytes)
                                
                                # Get padding length from last byte
                                padding_length = decrypted[-1]
                                
                                # Verify padding is valid
                                if padding_length > 16 or padding_length == 0:
                                    raise ValueError("Invalid padding length")
                                
                                # Verify all padding bytes are correct
                                padding_bytes = decrypted[-padding_length:]
                                if not all(x == padding_length for x in padding_bytes):
                                    raise ValueError("Invalid padding bytes")
                                
                                # Remove padding
                                proc = decrypted[:-padding_length]
                            except Exception as e:
                                logger.error(f"Padding error: {str(e)}")
                                # If padding verification fails, try without padding
                                proc = cipher.decrypt(segment_bytes)
                    elif mode == "gcm":
                        if not nonce:
                            raise ValueError("Nonce is required for AES-GCM mode")
                        try:
                            nonce_bytes = binascii.unhexlify(nonce)
                        except:
                            nonce_bytes = nonce.encode()
                        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce_bytes)
                        if operation == "encrypt":
                            proc = cipher.encrypt(segment_bytes)
                        else:
                            proc = cipher.decrypt(segment_bytes)
                    else:
                        raise ValueError(f"Unsupported AES mode: {mode}")
                    
                elif algorithm.lower() == "chacha20":
                    if not password:
                        raise ValueError("Password is required for ChaCha20")
                    if not nonce:
                        raise ValueError("Nonce is required for ChaCha20")
                    
                    # Generate key from password
                    key = self._derive_key(password, 256)  # ChaCha20 uses 256-bit keys
                    try:
                        nonce_bytes = binascii.unhexlify(nonce)
                    except:
                        nonce_bytes = nonce.encode()
                    
                    cipher = ChaCha20.new(key=key, nonce=nonce_bytes)
                    # For ChaCha20, encryption and decryption are the same operation
                    proc = cipher.encrypt(segment_bytes)
                    
                elif algorithm.lower() == "rc4":
                    if not rc4_key:
                        raise ValueError("RC4 key is required")
                    
                    # RC4 is symmetric, so encryption and decryption are the same operation
                    cipher = ARC4.new(rc4_key.encode())
                    proc = cipher.encrypt(segment_bytes)
                    
                elif algorithm.lower() == "logistic":
                    if logistic_initial is None or logistic_parameter is None:
                        raise ValueError("Initial value and parameter are required for Logistic XOR")
                    if not (0 < logistic_initial < 1) or logistic_initial == 0.5:
                        raise ValueError("Initial value must be between 0 and 1, excluding 0, 0.5, and 1")
                    if not (3.57 <= logistic_parameter <= 4):
                        raise ValueError("Parameter must be between 3.57 and 4")
                    
                    # Generate keystream using logistic map
                    # Use password if provided, otherwise use logistic_initial
                    if password:
                        seed_int = int.from_bytes(password.encode(), 'big')
                        x0 = seed_int / (2**128 - 1)
                    else:
                        x0 = float(logistic_initial)
                    
                    mu = float(logistic_parameter)
                    ks = bytearray(len(segment_bytes))
                    
                    # Generate keystream
                    for i in range(len(segment_bytes)):
                        x0 = mu * x0 * (1 - x0)
                        ks[i] = int((x0 % 1) * 256)
                    
                    # XOR is symmetric, so encryption and decryption are the same operation
                    proc = bytes(b ^ k for b, k in zip(segment_bytes, ks))
                    
                else:
                    raise ValueError(f"Unsupported algorithm: {algorithm}")
                
                logger.info(f"Processed region {i+1}, output size: {len(proc)} bytes")
                
                # Convert processed bytes back to numpy array
                try:
                    patch = np.frombuffer(proc[:width*height*3], dtype=np.uint8).reshape((height, width, 3))
                    # Ensure the patch has the correct shape
                    if patch.shape != (height, width, 3):
                        raise ValueError(f"Invalid patch shape: {patch.shape}, expected {(height, width, 3)}")
                    # Update the output image array
                    out[y:y+height, x:x+width] = patch
                    logger.info(f"Successfully updated region {i+1} in output image")
                except Exception as e:
                    logger.error(f"Error processing region {i+1}: {str(e)}")
                    raise ValueError(f"Failed to process region at ({x}, {y}): {str(e)}")
            
            # Convert back to image and return bytes
            processed_img = Image.fromarray(out)
            logger.info(f"Final image size: {processed_img.size}, mode: {processed_img.mode}")
            
            # Save to bytes with high quality
            output = io.BytesIO()
            processed_img.save(output, format='PNG', quality=95)
            output.seek(0)
            result_bytes = output.getvalue()
            logger.info(f"Final output size: {len(result_bytes)} bytes")
            
            return result_bytes
            
        except Exception as e:
            logger.error(f"Error in partial_process_image: {str(e)}")
            raise ValueError(f"Failed to process image: {str(e)}")

    def _derive_key(self, password: str, key_size: int) -> bytes:
        """Derive a cryptographic key from a password."""
        # Use PBKDF2 to derive a key from the password
        from Crypto.Protocol.KDF import PBKDF2
        from Crypto.Hash import SHA256
        
        # Convert key size from bits to bytes
        key_size_bytes = key_size // 8
        
        # Use a fixed salt for consistency between encryption and decryption
        salt = b'fixed_salt_for_demo'
        
        # Derive key using PBKDF2 with more iterations for better security
        key = PBKDF2(
            password.encode(),
            salt,
            dkLen=key_size_bytes,
            count=100000,
            hmac_hash_module=SHA256
        )
        
        return key 