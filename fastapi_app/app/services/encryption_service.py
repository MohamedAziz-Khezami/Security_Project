import os
import base64
import hashlib
import binascii
from typing import Optional, Union, Dict, List
from Crypto.Cipher import AES, ChaCha20, ARC4
from Crypto.Util.Padding import pad, unpad
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self):
        self.supported_algorithms = {
            "AES": ["cbc", "ctr", "gcm"],
            "ChaCha20": ["stream"],
            "RC4": ["stream"],
            "SHA-256": ["hash"],
            "BLAKE3": ["hash"]
        }

    def _derive_key(self, password: str, key_size: int) -> bytes:
        """Derive a cryptographic key from a password."""
        salt = b'fixed_salt_for_demo'  # In production, use a unique salt per encryption
        return PBKDF2(
            password.encode(),
            salt,
            dkLen=key_size // 8,
            count=100000,
            hmac_hash_module=SHA256
        )

    def _process_text(self, content: str, action: str, algorithm: str, key: Optional[str] = None,
                     private_key: Optional[str] = None, start_byte: Optional[int] = None,
                     end_byte: Optional[int] = None) -> str:
        """Process text content with the specified algorithm."""
        try:
            if action == "hash":
                if algorithm == "SHA-256":
                    hash_obj = hashlib.sha256(content.encode())
                elif algorithm == "BLAKE3":
                    hash_obj = hashlib.blake2b(content.encode())
                else:
                    raise ValueError(f"Unsupported hash algorithm: {algorithm}")
                return hash_obj.hexdigest()

            if not key:
                raise ValueError("Key is required for encryption/decryption")

            if algorithm == "AES":
                key_bytes = self._derive_key(key, 256)
                if action == "encrypt":
                    cipher = AES.new(key_bytes, AES.MODE_CBC)
                    ct_bytes = cipher.encrypt(pad(content.encode(), AES.block_size))
                    return base64.b64encode(cipher.iv + ct_bytes).decode()
                else:  # decrypt
                    data = base64.b64decode(content)
                    iv = data[:16]
                    ct = data[16:]
                    cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
                    return unpad(cipher.decrypt(ct), AES.block_size).decode()

            elif algorithm == "ChaCha20":
                key_bytes = self._derive_key(key, 256)
                nonce = os.urandom(12)
                cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
                if action == "encrypt":
                    ct_bytes = cipher.encrypt(content.encode())
                    return base64.b64encode(nonce + ct_bytes).decode()
                else:  # decrypt
                    data = base64.b64decode(content)
                    nonce = data[:12]
                    ct = data[12:]
                    cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
                    return cipher.decrypt(ct).decode()

            elif algorithm == "RC4":
                key_bytes = key.encode()
                cipher = ARC4.new(key_bytes)
                if action == "encrypt":
                    ct_bytes = cipher.encrypt(content.encode())
                    return base64.b64encode(ct_bytes).decode()
                else:  # decrypt
                    data = base64.b64decode(content)
                    return cipher.decrypt(data).decode()

            else:
                raise ValueError(f"Unsupported algorithm: {algorithm}")

        except Exception as e:
            logger.error(f"Error processing text: {str(e)}")
            raise

    def _process_image_region(self, image_data: bytes, region: Dict, action: str,
                            algorithm: str, key: Optional[str] = None) -> bytes:
        """Process a specific region of an image."""
        try:
            # Convert image data to numpy array
            img = Image.open(io.BytesIO(image_data))
            img_array = np.array(img)
            
            # Extract region coordinates
            x = int(region.get("left", region.get("x", 0)))
            y = int(region.get("top", region.get("y", 0)))
            width = int(region["width"])
            height = int(region["height"])
            
            # Ensure coordinates are within bounds
            h, w, _ = img_array.shape
            x = max(0, min(x, w - 1))
            y = max(0, min(y, h - 1))
            width = max(1, min(width, w - x))
            height = max(1, min(height, h - y))
            
            # Extract region data
            region_data = img_array[y:y+height, x:x+width].tobytes()
            
            # Process region based on algorithm
            if algorithm == "AES":
                key_bytes = self._derive_key(key, 256)
                cipher = AES.new(key_bytes, AES.MODE_CBC)
                if action == "encrypt":
                    ct_bytes = cipher.encrypt(pad(region_data, AES.block_size))
                    processed = cipher.iv + ct_bytes
                else:  # decrypt
                    iv = region_data[:16]
                    ct = region_data[16:]
                    cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
                    processed = unpad(cipher.decrypt(ct), AES.block_size)
            
            elif algorithm == "ChaCha20":
                key_bytes = self._derive_key(key, 256)
                nonce = os.urandom(12)
                cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
                if action == "encrypt":
                    ct_bytes = cipher.encrypt(region_data)
                    processed = nonce + ct_bytes
                else:  # decrypt
                    nonce = region_data[:12]
                    ct = region_data[12:]
                    cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
                    processed = cipher.decrypt(ct)
            
            elif algorithm == "RC4":
                key_bytes = key.encode()
                cipher = ARC4.new(key_bytes)
                processed = cipher.encrypt(region_data)
            
            else:
                raise ValueError(f"Unsupported algorithm for image processing: {algorithm}")
            
            # Convert processed bytes back to numpy array
            processed_array = np.frombuffer(processed[:width*height*3], dtype=np.uint8).reshape((height, width, 3))
            
            # Update the original image array
            img_array[y:y+height, x:x+width] = processed_array
            
            # Convert back to image and return bytes
            processed_img = Image.fromarray(img_array)
            output = io.BytesIO()
            processed_img.save(output, format='PNG')
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error processing image region: {str(e)}")
            raise

    def process_file(self, request_data: Dict) -> Dict:
        """Process a file or text content with the specified algorithm."""
        try:
            action = request_data["action"]
            algorithm = request_data["algorithm"]
            apply_to = request_data.get("apply_to", "full")
            key = request_data.get("key")
            private_key = request_data.get("private_key")
            is_text = request_data.get("is_text", False)
            
            # Validate algorithm
            if algorithm not in self.supported_algorithms:
                raise ValueError(f"Unsupported algorithm: {algorithm}")
            
            # Process based on input type
            if is_text:
                content = request_data["content"]
                if apply_to == "partial":
                    start_byte = request_data.get("start_byte")
                    end_byte = request_data.get("end_byte")
                    if start_byte is None or end_byte is None:
                        raise ValueError("start_byte and end_byte are required for partial text processing")
                    result = self._process_text(content, action, algorithm, key, private_key,
                                             int(start_byte), int(end_byte))
                else:
                    result = self._process_text(content, action, algorithm, key, private_key)
                
                return {
                    "success": True,
                    "message": f"Text {action}ed successfully",
                    "processedContent": result,
                    "fileName": "processed_text.txt"
                }
            
            else:
                # Handle file processing
                file_content = request_data["file"]  # This is now bytes directly
                file_type = request_data.get("file_type", "")
                file_name = request_data.get("file_name", "processed_file")
                
                if apply_to == "partial" and file_type.startswith("image/"):
                    regions = request_data.get("image_regions", [])
                    if not regions:
                        raise ValueError("No image regions specified for partial processing")
                    
                    # Process each region
                    processed_data = file_content
                    for region in regions:
                        processed_data = self._process_image_region(
                            processed_data, region, action, algorithm, key
                        )
                    
                    result = base64.b64encode(processed_data).decode()
                else:
                    # Full file processing
                    if action == "hash":
                        if algorithm == "SHA-256":
                            hash_obj = hashlib.sha256(file_content)
                        elif algorithm == "BLAKE3":
                            hash_obj = hashlib.blake2b(file_content)
                        else:
                            raise ValueError(f"Unsupported hash algorithm: {algorithm}")
                        return {
                            "success": True,
                            "message": f"File hashed successfully",
                            "hash": hash_obj.hexdigest(),
                            "fileName": file_name
                        }
                    
                    # Encryption/Decryption
                    if algorithm == "AES":
                        key_bytes = self._derive_key(key, 256)
                        cipher = AES.new(key_bytes, AES.MODE_CBC)
                        if action == "encrypt":
                            ct_bytes = cipher.encrypt(pad(file_content, AES.block_size))
                            result = base64.b64encode(cipher.iv + ct_bytes).decode()
                        else:  # decrypt
                            iv = file_content[:16]
                            ct = file_content[16:]
                            cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
                            result = base64.b64encode(unpad(cipher.decrypt(ct), AES.block_size)).decode()
                    
                    elif algorithm == "ChaCha20":
                        key_bytes = self._derive_key(key, 256)
                        nonce = os.urandom(12)
                        cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
                        if action == "encrypt":
                            ct_bytes = cipher.encrypt(file_content)
                            result = base64.b64encode(nonce + ct_bytes).decode()
                        else:  # decrypt
                            nonce = file_content[:12]
                            ct = file_content[12:]
                            cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
                            result = base64.b64encode(cipher.decrypt(ct)).decode()
                    
                    elif algorithm == "RC4":
                        key_bytes = key.encode()
                        cipher = ARC4.new(key_bytes)
                        result = base64.b64encode(cipher.encrypt(file_content)).decode()
                    
                    else:
                        raise ValueError(f"Unsupported algorithm: {algorithm}")
                
                return {
                    "success": True,
                    "message": f"File {action}ed successfully",
                    "processedContent": result,
                    "fileName": f"{action}ed_{file_name}"
                }
        
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}")
            return {
                "success": False,
                "message": str(e)
            }