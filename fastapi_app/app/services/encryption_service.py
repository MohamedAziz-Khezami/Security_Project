import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class EncryptionService:
    def __init__(self):
        pass

    def aes_gcm_encrypt(self, plaintext: bytes, password: str, key_size: int) -> str:
        # 1) Derive key with PBKDF2 + random salt (16 bytes)
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=key_size // 8,
            salt=salt,
            iterations=100_000,
        )
        key = kdf.derive(password.encode("utf-8"))

        # 2) Generate a 12-byte IV
        iv = os.urandom(12)
        aesgcm = AESGCM(key)

        # 3) Encrypt plaintext → ciphertext|tag
        ciphertext = aesgcm.encrypt(iv, plaintext, None)

        # 4) Package: salt + iv + ciphertext|tag, then Base64-encode
        blob = salt + iv + ciphertext
        return blob


    def aes_gcm_decrypt(self, text: bytes, password: str, key_size: int) -> str:
        # 1) Extract salt, iv, and ciphertext|tag
        salt = text[:16]
        iv = text[16:28]
        ciphertext = text[28:]

        # 2) Derive key with PBKDF2 + extracted salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=key_size // 8,
            salt=salt,
            iterations=100_000,
        )
        key = kdf.derive(password.encode("utf-8"))

        # 3) Decrypt ciphertext|tag → plaintext
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)

        return plaintext