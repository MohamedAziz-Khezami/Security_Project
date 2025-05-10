import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.padding import PKCS7
import logging
import binascii

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self):
        pass

    def _derive_key(self, password: str, salt: bytes, key_size: int) -> bytes:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=key_size // 8,
            salt=salt,
            iterations=100_000,
        )
        return kdf.derive(password.encode("utf-8"))

    def _pad_data(self, data: bytes, block_size: int = 16) -> bytes:
        padder = PKCS7(block_size * 8).padder()
        return padder.update(data) + padder.finalize()

    def _unpad_data(self, data: bytes, block_size: int = 16) -> bytes:
        unpadder = PKCS7(block_size * 8).unpadder()
        return unpadder.update(data) + unpadder.finalize()

    def aes_encrypt(self, plaintext: bytes, password: str, key_size: int, mode: str, iv: str = None) -> bytes:
        try:
            # 1) Derive key with PBKDF2 + random salt (16 bytes)
            salt = os.urandom(16)
            key = self._derive_key(password, salt, key_size)

            # 2) Handle IV based on mode
            if mode == "gcm":
                if iv:
                    try:
                        iv_bytes = binascii.unhexlify(iv)
                        if len(iv_bytes) != 12:
                            raise ValueError("IV must be 12 bytes (24 hex characters)")
                    except Exception as e:
                        raise ValueError(f"Invalid IV format: {str(e)}")
                else:
                    iv_bytes = os.urandom(12)
                cipher = AESGCM(key)
                ciphertext = cipher.encrypt(iv_bytes, plaintext, None)
                return salt + iv_bytes + ciphertext

            elif mode in ["cbc", "ctr"]:
                if iv:
                    try:
                        iv_bytes = binascii.unhexlify(iv)
                        if len(iv_bytes) != 16:
                            raise ValueError("IV must be 16 bytes (32 hex characters)")
                    except Exception as e:
                        raise ValueError(f"Invalid IV format: {str(e)}")
                else:
                    iv_bytes = os.urandom(16)
                
                if mode == "cbc":
                    # Add PKCS7 padding for CBC mode
                    padded_data = self._pad_data(plaintext)
                    cipher = Cipher(algorithms.AES(key), modes.CBC(iv_bytes))
                else:  # ctr
                    cipher = Cipher(algorithms.AES(key), modes.CTR(iv_bytes))
                    padded_data = plaintext  # CTR mode doesn't need padding
                
                encryptor = cipher.encryptor()
                ciphertext = encryptor.update(padded_data) + encryptor.finalize()
                return salt + iv_bytes + ciphertext

            elif mode == "ecb":
                # Add PKCS7 padding for ECB mode
                padded_data = self._pad_data(plaintext)
                cipher = Cipher(algorithms.AES(key), modes.ECB())
                encryptor = cipher.encryptor()
                ciphertext = encryptor.update(padded_data) + encryptor.finalize()
                return salt + ciphertext

            else:
                raise ValueError(f"Unsupported AES mode: {mode}")

        except Exception as e:
            logger.error(f"AES encryption error: {str(e)}")
            raise

    def aes_decrypt(self, encrypted_data: bytes, password: str, key_size: int, mode: str) -> bytes:
        try:
            if mode == "gcm":
                if len(encrypted_data) < 28:  # 16 (salt) + 12 (iv)
                    raise ValueError("Encrypted data is too short")
                salt = encrypted_data[:16]
                iv = encrypted_data[16:28]
                ciphertext = encrypted_data[28:]
                
                key = self._derive_key(password, salt, key_size)
                cipher = AESGCM(key)
                return cipher.decrypt(iv, ciphertext, None)

            elif mode in ["cbc", "ctr"]:
                if len(encrypted_data) < 32:  # 16 (salt) + 16 (iv)
                    raise ValueError("Encrypted data is too short")
                salt = encrypted_data[:16]
                iv = encrypted_data[16:32]
                ciphertext = encrypted_data[32:]
                
                key = self._derive_key(password, salt, key_size)
                if mode == "cbc":
                    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
                    decryptor = cipher.decryptor()
                    padded_data = decryptor.update(ciphertext) + decryptor.finalize()
                    return self._unpad_data(padded_data)
                else:  # ctr
                    cipher = Cipher(algorithms.AES(key), modes.CTR(iv))
                    decryptor = cipher.decryptor()
                    return decryptor.update(ciphertext) + decryptor.finalize()

            elif mode == "ecb":
                if len(encrypted_data) < 16:  # 16 (salt)
                    raise ValueError("Encrypted data is too short")
                salt = encrypted_data[:16]
                ciphertext = encrypted_data[16:]
                
                key = self._derive_key(password, salt, key_size)
                cipher = Cipher(algorithms.AES(key), modes.ECB())
                decryptor = cipher.decryptor()
                padded_data = decryptor.update(ciphertext) + decryptor.finalize()
                return self._unpad_data(padded_data)

            else:
                raise ValueError(f"Unsupported AES mode: {mode}")

        except Exception as e:
            logger.error(f"AES decryption error: {str(e)}")
            raise ValueError(f"Decryption failed: {str(e)}")

    def chacha20_encrypt(self, plaintext: bytes, password: str, key_size: int, mode: str, nonce: str = None) -> bytes:
        try:
            # ChaCha20 always uses 256-bit keys
            salt = os.urandom(16)
            key = self._derive_key(password, salt, 256)  # Force 256-bit key for ChaCha20

            if mode == "chacha20-poly1305":
                if nonce:
                    try:
                        nonce_bytes = binascii.unhexlify(nonce)
                        if len(nonce_bytes) != 12:
                            raise ValueError("Nonce must be 12 bytes (24 hex characters) for ChaCha20-Poly1305")
                    except Exception as e:
                        raise ValueError(f"Invalid nonce format: {str(e)}")
                else:
                    nonce_bytes = os.urandom(12)
                
                # Use ChaCha20Poly1305 for authenticated encryption
                cipher = ChaCha20Poly1305(key)
                ciphertext = cipher.encrypt(nonce_bytes, plaintext, None)
                return salt + nonce_bytes + ciphertext

            elif mode == "chacha20":
                if nonce:
                    try:
                        nonce_bytes = binascii.unhexlify(nonce)
                        if len(nonce_bytes) != 16:
                            raise ValueError("Nonce must be 16 bytes (32 hex characters) for ChaCha20")
                    except Exception as e:
                        raise ValueError(f"Invalid nonce format: {str(e)}")
                else:
                    nonce_bytes = os.urandom(16)
                
                # Use ChaCha20 for stream encryption
                cipher = Cipher(algorithms.ChaCha20(key, nonce_bytes), None)
                encryptor = cipher.encryptor()
                ciphertext = encryptor.update(plaintext) + encryptor.finalize()
                return salt + nonce_bytes + ciphertext
            else:
                raise ValueError(f"Unsupported ChaCha20 mode: {mode}")

        except Exception as e:
            logger.error(f"ChaCha20 encryption error: {str(e)}")
            raise

    def chacha20_decrypt(self, encrypted_data: bytes, password: str, key_size: int, mode: str) -> bytes:
        try:
            # ChaCha20 always uses 256-bit keys
            if mode == "chacha20-poly1305":
                if len(encrypted_data) < 28:  # 16 (salt) + 12 (nonce)
                    raise ValueError("Encrypted data is too short")
                salt = encrypted_data[:16]
                nonce = encrypted_data[16:28]
                ciphertext = encrypted_data[28:]
                
                key = self._derive_key(password, salt, 256)  # Force 256-bit key for ChaCha20
                cipher = ChaCha20Poly1305(key)
                return cipher.decrypt(nonce, ciphertext, None)

            elif mode == "chacha20":
                if len(encrypted_data) < 32:  # 16 (salt) + 16 (nonce)
                    raise ValueError("Encrypted data is too short")
                salt = encrypted_data[:16]
                nonce = encrypted_data[16:32]
                ciphertext = encrypted_data[32:]
                
                key = self._derive_key(password, salt, 256)  # Force 256-bit key for ChaCha20
                cipher = Cipher(algorithms.ChaCha20(key, nonce), None)
                decryptor = cipher.decryptor()
                return decryptor.update(ciphertext) + decryptor.finalize()
            else:
                raise ValueError(f"Unsupported ChaCha20 mode: {mode}")

        except Exception as e:
            logger.error(f"ChaCha20 decryption error: {str(e)}")
            raise ValueError(f"Decryption failed: {str(e)}")

    def rsa_encrypt(self, plaintext: bytes, public_key: str) -> bytes:
        try:
            # Load public key
            public_key_bytes = public_key.encode('utf-8')
            public_key_obj = serialization.load_pem_public_key(public_key_bytes)
            
            # Encrypt
            ciphertext = public_key_obj.encrypt(
                plaintext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return ciphertext

        except Exception as e:
            logger.error(f"RSA encryption error: {str(e)}")
            raise

    def rsa_decrypt(self, ciphertext: bytes, private_key: str) -> bytes:
        try:
            # Load private key
            private_key_bytes = private_key.encode('utf-8')
            private_key_obj = serialization.load_pem_private_key(
                private_key_bytes,
                password=None
            )
            
            # Decrypt
            plaintext = private_key_obj.decrypt(
                ciphertext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return plaintext

        except Exception as e:
            logger.error(f"RSA decryption error: {str(e)}")
            raise ValueError(f"Decryption failed: {str(e)}")

    def triple_des_encrypt(self, plaintext: bytes, password: str, key_size: int, mode: str, 
                          key_option: str, key1: str, key2: str = None, key3: str = None, 
                          iv: str = None) -> bytes:
        try:


            salt = os.urandom(16)
            
            # Derive keys based on key option
            if key_option == "one":
                key = self._derive_key(password, salt, 64)  # 56-bit effective key size
                keys = [key] * 3
            elif key_option == "two":
                if not key2:
                    raise ValueError("Second key required for 2-key mode")
                try:
                    key1_bytes = binascii.unhexlify(key1)
                    key2_bytes = binascii.unhexlify(key2)
                    if len(key1_bytes) != 8 or len(key2_bytes) != 8:
                        raise ValueError("Keys must be 8 bytes (64 bits) each")
                    keys = [key1_bytes, key2_bytes, key1_bytes]
                except Exception as e:
                    raise ValueError(f"Invalid key format: {str(e)}")
            else:  # three keys
                if not key2 or not key3:
                    raise ValueError("All three keys required for 3-key mode")
                try:
                    key1_bytes = binascii.unhexlify(key1)
                    key2_bytes = binascii.unhexlify(key2)
                    key3_bytes = binascii.unhexlify(key3)
                    if len(key1_bytes) != 8 or len(key2_bytes) != 8 or len(key3_bytes) != 8:
                        raise ValueError("Keys must be 8 bytes (64 bits) each")
                    keys = [key1_bytes, key2_bytes, key3_bytes]
                except Exception as e:
                    raise ValueError(f"Invalid key format: {str(e)}")

            # Handle IV
            if mode == "cbc":
                if iv:
                    try:
                        iv_bytes = binascii.unhexlify(iv)
                        if len(iv_bytes) != 8:
                            raise ValueError("IV must be 8 bytes (16 hex characters)")
                    except Exception as e:
                        raise ValueError(f"Invalid IV format: {str(e)}")
                else:
                    iv_bytes = os.urandom(8)
                
                # Add PKCS7 padding for CBC mode
                padded_data = self._pad_data(plaintext, block_size=8)
                cipher = Cipher(algorithms.TripleDES(b''.join(keys)), modes.CBC(iv_bytes))
                encryptor = cipher.encryptor()
                ciphertext = encryptor.update(padded_data) + encryptor.finalize()
                return salt + iv_bytes + ciphertext

            else:  # ECB mode
                # Add PKCS7 padding for ECB mode
                padded_data = self._pad_data(plaintext, block_size=8)
                cipher = Cipher(algorithms.TripleDES(b''.join(keys)), modes.ECB())
                encryptor = cipher.encryptor()
                ciphertext = encryptor.update(padded_data) + encryptor.finalize()
                return salt + ciphertext

        except Exception as e:
            logger.error(f"Triple DES encryption error: {str(e)}")
            raise

    def triple_des_decrypt(self, encrypted_data: bytes, password: str, key_size: int, mode: str,
                          key_option: str, key1: str, key2: str = None, key3: str = None) -> bytes:
        try:
            if not encrypted_data:
                raise ValueError("Encrypted data cannot be empty")
            if not password:
                raise ValueError("Password is required")
            if not key1:
                raise ValueError("Key1 is required")

            if mode == "cbc":
                if len(encrypted_data) < 24:  # 16 (salt) + 8 (iv)
                    raise ValueError("Encrypted data is too short")
                salt = encrypted_data[:16]
                iv = encrypted_data[16:24]
                ciphertext = encrypted_data[24:]
                
                # Derive keys based on key option
                if key_option == "one":
                    key = self._derive_key(password, salt, 64)
                    keys = [key] * 3
                elif key_option == "two":
                    if not key2:
                        raise ValueError("Second key required for 2-key mode")
                    try:
                        key1_bytes = binascii.unhexlify(key1)
                        key2_bytes = binascii.unhexlify(key2)
                        if len(key1_bytes) != 8 or len(key2_bytes) != 8:
                            raise ValueError("Keys must be 8 bytes (64 bits) each")
                        keys = [key1_bytes, key2_bytes, key1_bytes]
                    except Exception as e:
                        raise ValueError(f"Invalid key format: {str(e)}")
                else:  # three keys
                    if not key2 or not key3:
                        raise ValueError("All three keys required for 3-key mode")
                    try:
                        key1_bytes = binascii.unhexlify(key1)
                        key2_bytes = binascii.unhexlify(key2)
                        key3_bytes = binascii.unhexlify(key3)
                        if len(key1_bytes) != 8 or len(key2_bytes) != 8 or len(key3_bytes) != 8:
                            raise ValueError("Keys must be 8 bytes (64 bits) each")
                        keys = [key1_bytes, key2_bytes, key3_bytes]
                    except Exception as e:
                        raise ValueError(f"Invalid key format: {str(e)}")
                
                cipher = Cipher(algorithms.TripleDES(b''.join(keys)), modes.CBC(iv))
                decryptor = cipher.decryptor()
                padded_data = decryptor.update(ciphertext) + decryptor.finalize()
                return self._unpad_data(padded_data, block_size=8)

            else:  # ECB mode
                if len(encrypted_data) < 16:  # 16 (salt)
                    raise ValueError("Encrypted data is too short")
                salt = encrypted_data[:16]
                ciphertext = encrypted_data[16:]
                
                # Derive keys based on key option
                if key_option == "one":
                    key = self._derive_key(password, salt, 64)
                    keys = [key] * 3
                elif key_option == "two":
                    if not key2:
                        raise ValueError("Second key required for 2-key mode")
                    try:
                        key1_bytes = binascii.unhexlify(key1)
                        key2_bytes = binascii.unhexlify(key2)
                        if len(key1_bytes) != 8 or len(key2_bytes) != 8:
                            raise ValueError("Keys must be 8 bytes (64 bits) each")
                        keys = [key1_bytes, key2_bytes, key1_bytes]
                    except Exception as e:
                        raise ValueError(f"Invalid key format: {str(e)}")
                else:  # three keys
                    if not key2 or not key3:
                        raise ValueError("All three keys required for 3-key mode")
                    try:
                        key1_bytes = binascii.unhexlify(key1)
                        key2_bytes = binascii.unhexlify(key2)
                        key3_bytes = binascii.unhexlify(key3)
                        if len(key1_bytes) != 8 or len(key2_bytes) != 8 or len(key3_bytes) != 8:
                            raise ValueError("Keys must be 8 bytes (64 bits) each")
                        keys = [key1_bytes, key2_bytes, key3_bytes]
                    except Exception as e:
                        raise ValueError(f"Invalid key format: {str(e)}")
                
                cipher = Cipher(algorithms.TripleDES(b''.join(keys)), modes.ECB())
                decryptor = cipher.decryptor()
                padded_data = decryptor.update(ciphertext) + decryptor.finalize()
                return self._unpad_data(padded_data, block_size=8)

        except Exception as e:
            logger.error(f"Triple DES decryption error: {str(e)}")
            raise ValueError(f"Decryption failed: {str(e)}")

    def _handle_partial_encryption(self, full_text: str, selected_text: str, start: int, end: int, 
                                 encrypt_func, *args, **kwargs) -> str:
        """Helper method to handle partial encryption of text"""
        try:
            # Encrypt the selected portion
            selected_bytes = selected_text.encode('utf-8')
            encrypted_bytes = encrypt_func(selected_bytes, *args, **kwargs)
            encrypted_text = base64.b64encode(encrypted_bytes).decode('utf-8')
            
            # Combine the parts
            result = full_text[:start] + encrypted_text + full_text[end:]
            return result
        except Exception as e:
            logger.error(f"Partial encryption error: {str(e)}")
            raise

    def _handle_partial_decryption(self, full_text: str, start: int, end: int,
                                 decrypt_func, *args, **kwargs) -> str:
        """Helper method to handle partial decryption of text"""
        try:
            # Extract and decode the encrypted portion
            encrypted_text = full_text[start:end]
            try:
                encrypted_bytes = base64.b64decode(encrypted_text)
            except Exception as e:
                logger.error(f"Failed to decode base64: {str(e)}")
                raise ValueError("Invalid encrypted text format")
            
            # Decrypt the portion
            decrypted_bytes = decrypt_func(encrypted_bytes, *args, **kwargs)
            try:
                decrypted_text = decrypted_bytes.decode('utf-8')
            except UnicodeDecodeError:
                logger.error("Failed to decode decrypted bytes as UTF-8")
                raise ValueError("Decrypted data is not valid text")
            
            # Combine the parts
            result = full_text[:start] + decrypted_text + full_text[end:]
            return result
        except Exception as e:
            logger.error(f"Partial decryption error: {str(e)}")
            raise ValueError(f"Decryption failed: {str(e)}")

    def partial_aes_encrypt(self, full_text: str, selected_text: str, start: int, end: int,
                          password: str, key_size: int, mode: str, iv: str = None) -> str:
        """Partially encrypt text using AES"""
        print(full_text, selected_text, start, end, password, key_size, mode, iv)
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.aes_encrypt, password, key_size, mode, iv
        )

    def partial_aes_decrypt(self, full_text: str, start: int, end: int,
                          password: str, key_size: int, mode: str) -> str:
        """Partially decrypt text using AES"""
        return self._handle_partial_decryption(
            full_text, start, end,
            self.aes_decrypt, password, key_size, mode
        )

    def partial_chacha20_encrypt(self, full_text: str, selected_text: str, start: int, end: int,
                               password: str, key_size: int, mode: str, nonce: str = None) -> str:
        """Partially encrypt text using ChaCha20"""
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.chacha20_encrypt, password, key_size, mode, nonce
        )

    def partial_chacha20_decrypt(self, full_text: str, start: int, end: int,
                               password: str, key_size: int, mode: str) -> str:
        """Partially decrypt text using ChaCha20"""
        return self._handle_partial_decryption(
            full_text, start, end,
            self.chacha20_decrypt, password, key_size, mode
        )

    def partial_rsa_encrypt(self, full_text: str, selected_text: str, start: int, end: int,
                          public_key: str) -> str:
        """Partially encrypt text using RSA"""
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.rsa_encrypt, public_key
        )

    def partial_rsa_decrypt(self, full_text: str, start: int, end: int,
                          private_key: str) -> str:
        """Partially decrypt text using RSA"""
        return self._handle_partial_decryption(
            full_text, start, end,
            self.rsa_decrypt, private_key
        )

    def partial_triple_des_encrypt(self, full_text: str, selected_text: str, start: int, end: int,
                                 password: str, key_size: int, mode: str, key_option: str,
                                 key1: str, key2: str = None, key3: str = None,
                                 iv: str = None) -> str:
        """Partially encrypt text using Triple DES"""
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.triple_des_encrypt, password, key_size, mode, key_option,
            key1, key2, key3, iv
        )

    def partial_triple_des_decrypt(self, full_text: str, start: int, end: int,
                                 password: str, key_size: int, mode: str, key_option: str,
                                 key1: str, key2: str = None, key3: str = None) -> str:
        """Partially decrypt text using Triple DES"""
        return self._handle_partial_decryption(
            full_text, start, end,
            self.triple_des_decrypt, password, key_size, mode, key_option,
            key1, key2, key3
        )