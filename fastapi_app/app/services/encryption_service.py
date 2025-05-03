import os
import base64
import io
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding as asym_padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives.ciphers.algorithms import Camellia
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidTag, InvalidSignature
from app.core.config import settings
from typing import Optional, Tuple

class EncryptionService:
    def __init__(self):
        self.backend = default_backend()

    def derive_key(self, password: str, salt: bytes, kdf_type: str, **kdf_params) -> bytes:
        password_bytes = password.encode()

        if kdf_type == 'PBKDF2':
            iterations = kdf_params.get('iterations', settings.DEFAULT_PBKDF2_ITERATIONS)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=settings.SYMMETRIC_KEY_LENGTH,
                salt=salt,
                iterations=iterations,
                backend=self.backend
            )
            return kdf.derive(password_bytes)
        elif kdf_type == 'Scrypt':
            n = kdf_params.get('n', settings.DEFAULT_SCRYPT_N)
            r = kdf_params.get('r', settings.DEFAULT_SCRYPT_R)
            p = kdf_params.get('p', settings.DEFAULT_SCRYPT_P)
            kdf = Scrypt(
                salt=salt,
                length=settings.SYMMETRIC_KEY_LENGTH,
                n=n,
                r=r,
                p=p,
                backend=self.backend
            )
            return kdf.derive(password_bytes)
        else:
            raise ValueError("Unsupported KDF type specified.")

    def aes_gcm_encrypt(self, data: bytes, password: str, kdf_type: str, **kdf_params) -> bytes:
        salt = os.urandom(settings.SALT_LENGTH)
        key = self.derive_key(password, salt, kdf_type, **kdf_params)
        iv = os.urandom(settings.AES_IV_LENGTH)
        aesgcm = AESGCM(key)
        encrypted = aesgcm.encrypt(iv, data, None)
        return salt + iv + encrypted

    def aes_gcm_decrypt(self, encrypted_data: bytes, password: str, kdf_type: str, **kdf_params) -> bytes:
        try:
            salt = encrypted_data[:settings.SALT_LENGTH]
            iv = encrypted_data[settings.SALT_LENGTH : settings.SALT_LENGTH + settings.AES_IV_LENGTH]
            ciphertext_with_tag = encrypted_data[settings.SALT_LENGTH + settings.AES_IV_LENGTH:]
            key = self.derive_key(password, salt, kdf_type, **kdf_params)
            aesgcm = AESGCM(key)
            return aesgcm.decrypt(iv, ciphertext_with_tag, None)
        except InvalidTag:
            raise ValueError("AES Decryption Failed: Invalid Tag. Password may be incorrect or data corrupted.")
        except Exception as e:
            raise ValueError(f"AES Decryption Failed: {e}")

    def chacha20_encrypt(self, data: bytes, password: str, kdf_type: str, **kdf_params) -> bytes:
        salt = os.urandom(settings.SALT_LENGTH)
        key = self.derive_key(password, salt, kdf_type, **kdf_params)
        nonce = os.urandom(settings.CHACHA20_NONCE_LENGTH)
        chacha = ChaCha20Poly1305(key)
        encrypted = chacha.encrypt(nonce, data, None)
        return salt + nonce + encrypted

    def chacha20_decrypt(self, encrypted_data: bytes, password: str, kdf_type: str, **kdf_params) -> bytes:
        try:
            salt = encrypted_data[:settings.SALT_LENGTH]
            nonce = encrypted_data[settings.SALT_LENGTH : settings.SALT_LENGTH + settings.CHACHA20_NONCE_LENGTH]
            ciphertext_with_tag = encrypted_data[settings.SALT_LENGTH + settings.CHACHA20_NONCE_LENGTH:]
            key = self.derive_key(password, salt, kdf_type, **kdf_params)
            chacha = ChaCha20Poly1305(key)
            return chacha.decrypt(nonce, ciphertext_with_tag, None)
        except InvalidTag:
            raise ValueError("ChaCha20 Decryption Failed: Invalid Tag. Password may be incorrect or data corrupted.")
        except Exception as e:
            raise ValueError(f"ChaCha20 Decryption Failed: {e}")

    def camellia_gcm_encrypt(self, data: bytes, password: str, kdf_type: str, **kdf_params) -> bytes:
        salt = os.urandom(settings.SALT_LENGTH)
        key = self.derive_key(password, salt, kdf_type, **kdf_params)
        iv = os.urandom(settings.CAMELLIA_IV_LENGTH)
        cipher = Cipher(Camellia(key), modes.GCM(iv), backend=self.backend)
        encryptor = cipher.encryptor()
        encrypted = encryptor.update(data) + encryptor.finalize()
        return salt + iv + encrypted + encryptor.tag

    def camellia_gcm_decrypt(self, encrypted_data: bytes, password: str, kdf_type: str, **kdf_params) -> bytes:
        try:
            salt = encrypted_data[:settings.SALT_LENGTH]
            iv = encrypted_data[settings.SALT_LENGTH : settings.SALT_LENGTH + settings.CAMELLIA_IV_LENGTH]
            tag = encrypted_data[-settings.CAMELLIA_TAG_LENGTH:]
            ciphertext = encrypted_data[settings.SALT_LENGTH + settings.CAMELLIA_IV_LENGTH : -settings.CAMELLIA_TAG_LENGTH]
            key = self.derive_key(password, salt, kdf_type, **kdf_params)
            cipher = Cipher(Camellia(key), modes.GCM(iv, tag), backend=self.backend)
            decryptor = cipher.decryptor()
            return decryptor.update(ciphertext) + decryptor.finalize()
        except InvalidTag:
            raise ValueError("Camellia Decryption Failed: Invalid Tag. Password may be incorrect or data corrupted.")
        except Exception as e:
            raise ValueError(f"Camellia Decryption Failed: {e}")

    def generate_rsa_keys(self) -> Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
        private_key = rsa.generate_private_key(
            public_exponent=settings.RSA_PUBLIC_EXPONENT,
            key_size=settings.RSA_KEY_SIZE,
            backend=self.backend
        )
        public_key = private_key.public_key()
        return private_key, public_key

    def rsa_hybrid_encrypt(self, data: bytes, public_key: rsa.RSAPublicKey) -> bytes:
        symmetric_key = AESGCM.generate_key(bit_length=256)
        aesgcm = AESGCM(symmetric_key)
        iv = os.urandom(settings.AES_IV_LENGTH)
        encrypted_data = aesgcm.encrypt(iv, data, None)
        encrypted_symmetric_key = public_key.encrypt(symmetric_key, asym_padding.OAEP(
            mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        ))
        encrypted_key_len = len(encrypted_symmetric_key).to_bytes(2, 'big')
        return encrypted_key_len + encrypted_symmetric_key + iv + encrypted_data

    def rsa_hybrid_decrypt(self, encrypted_payload: bytes, private_key: rsa.RSAPrivateKey) -> bytes:
        try:
            encrypted_key_len = int.from_bytes(encrypted_payload[:2], 'big')
            offset = 2
            encrypted_symmetric_key = encrypted_payload[offset : offset + encrypted_key_len]
            offset += encrypted_key_len
            iv = encrypted_payload[offset : offset + settings.AES_IV_LENGTH]
            offset += settings.AES_IV_LENGTH
            encrypted_data = encrypted_payload[offset:]
            symmetric_key = private_key.decrypt(encrypted_symmetric_key, asym_padding.OAEP(
                mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            ))
            aesgcm = AESGCM(symmetric_key)
            return aesgcm.decrypt(iv, encrypted_data, None)
        except InvalidTag:
            raise ValueError("RSA Hybrid Decryption Failed: AES-GCM integrity check failed (Invalid Tag). Data may be corrupted.")
        except (InvalidSignature, ValueError) as e:
            raise ValueError(f"RSA Hybrid Decryption Failed: RSA key decryption failed. Incorrect private key? {e}")
        except Exception as e:
            raise ValueError(f"RSA Hybrid Decryption Failed: {e}") 