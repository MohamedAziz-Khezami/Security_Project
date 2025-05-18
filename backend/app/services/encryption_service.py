import os
import base64
import logging
import binascii
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, ec, x25519, padding
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.padding import PKCS7

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class EncryptionService:
    """Service for encrypting and decrypting data using various algorithms."""

    def __init__(self):
        pass

    def _derive_key(self, password: str, salt: bytes, key_size: int) -> bytes:
        """Derive a key from a password using PBKDF2."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=key_size // 8,
            salt=salt,
            iterations=100_000,
        )
        return kdf.derive(password.encode("utf-8"))

    def _pad_data(self, data: bytes, block_size: int = 16) -> bytes:
        """Apply PKCS7 padding to the data."""
        padder = PKCS7(block_size * 8).padder()
        return padder.update(data) + padder.finalize()

    def _unpad_data(self, data: bytes, block_size: int = 16) -> bytes:
        """Remove PKCS7 padding from the data."""
        unpadder = PKCS7(block_size * 8).unpadder()
        return unpadder.update(data) + unpadder.finalize()

    def aes_encrypt(self, plaintext: bytes, password: str, key_size: int, mode: str, iv: str = None) -> bytes:
        """
        Encrypt data using AES with the specified mode.

        :param plaintext: The data to encrypt.
        :param password: Password for key derivation.
        :param key_size: Size of the key in bits.
        :param mode: AES mode to use (e.g., 'gcm', 'cbc', 'ctr', 'ecb').
        :param iv: Optional initialization vector.
        :return: Encrypted data.
        """
        try:
            # Derive key with PBKDF2 + random salt
            salt = os.urandom(16)
            key = self._derive_key(password, salt, key_size)

            # Handle IV based on mode
            if mode == "gcm":
                iv_bytes = self._get_iv(iv, 12)
                cipher = AESGCM(key)
                ciphertext = cipher.encrypt(iv_bytes, plaintext, None)
                return salt + iv_bytes + ciphertext

            elif mode in ["cbc", "ctr"]:
                iv_bytes = self._get_iv(iv, 16)
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

    def _get_iv(self, iv: str, expected_length: int) -> bytes:
        """Get or generate an IV of the expected length."""
        if iv:
            try:
                iv_bytes = binascii.unhexlify(iv)
                if len(iv_bytes) != expected_length:
                    raise ValueError(f"IV must be {expected_length} bytes ({expected_length * 2} hex characters)")
            except Exception as e:
                raise ValueError(f"Invalid IV format: {str(e)}")
        else:
            iv_bytes = os.urandom(expected_length)
        return iv_bytes

    def aes_decrypt(self, encrypted_data: bytes, password: str, key_size: int, mode: str) -> bytes:
        """
        Decrypt data using AES with the specified mode.

        :param encrypted_data: The encrypted data.
        :param password: Password for key derivation.
        :param key_size: Size of the key in bits.
        :param mode: AES mode to use (e.g., 'gcm', 'cbc', 'ctr', 'ecb').
        :return: Decrypted plaintext.
        """
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

    # ===== ECC (ECIES-style) =====
    def ecc_encrypt(self, plaintext: bytes, public_key_pem: str, curve_name: str) -> str:
        """
        Encrypt plaintext using ECIES (EC Diffie-Hellman with Integrated Encryption Scheme) based on the specified curve.

        :param plaintext: The plaintext to encrypt.
        :param public_key_pem: The PEM representation of the public key.
        :param curve_name: The name of the elliptic curve (e.g., "secp256r1").
        :return: The encrypted ciphertext as a base64 string.
        """
        if curve_name.lower()=='secp256r1': curve=ec.SECP256R1()
        elif curve_name.lower()=='secp256k1': curve=ec.SECP256K1()
        else: raise ValueError(f'Unsupported curve: {curve_name}')
        pub = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))
        eph_priv = ec.generate_private_key(curve)
        shared = eph_priv.exchange(ec.ECDH(), pub)
        key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'ecies').derive(shared)
        nonce=os.urandom(12)
        cipher=AESGCM(key)
        ct=cipher.encrypt(nonce, plaintext, None)
        eph_pub = eph_priv.public_key().public_bytes(serialization.Encoding.PEM,serialization.PublicFormat.SubjectPublicKeyInfo)
        return base64.b64encode(eph_pub+nonce+ct).decode('utf-8')

    def ecc_decrypt(self, payload_b64: str, private_key_pem: str, curve_name: str) -> bytes:
        """
        Decrypt ciphertext using ECIES (EC Diffie-Hellman with Integrated Encryption Scheme) based on the specified curve.

        :param payload_b64: The base64 representation of the ciphertext.
        :param private_key_pem: The PEM representation of the private key.
        :param curve_name: The name of the elliptic curve (e.g., "secp256r1").
        :return: The decrypted plaintext.
        """
        data=base64.b64decode(payload_b64)
        pem_end=b'-----END PUBLIC KEY-----\n'
        idx=data.find(pem_end)+len(pem_end)
        eph_pub=data[:idx]; rest=data[idx:]
        eph_key=serialization.load_pem_public_key(eph_pub)
        priv=serialization.load_pem_private_key(private_key_pem.encode('utf-8'),password=None)
        shared=priv.exchange(ec.ECDH(), eph_key)
        key=HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'ecies').derive(shared)
        nonce,ct=rest[:12],rest[12:]
        return AESGCM(key).decrypt(nonce, ct, None)
    
    
    def rsa_encrypt(self, plaintext: bytes, public_key: str) -> bytes:
        """
        Encrypts plaintext with the given RSA public key.

        :param plaintext: The plaintext to encrypt.
        :param public_key: The PEM representation of the public key.
        :return: The encrypted ciphertext.
        """
        try:
            # Load public key
            public_key_bytes = public_key.encode('utf-8')
            public_key_obj = serialization.load_pem_public_key(public_key_bytes)
            
            # Encrypt using OAEP padding
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
        """
        Decrypts ciphertext with the given RSA private key.

        :param ciphertext: The ciphertext to decrypt.
        :param private_key: The PEM representation of the private key.
        :return: The decrypted plaintext.
        """
        try:
            # Load private key
            private_key_bytes = private_key.encode('utf-8')
            private_key_obj = serialization.load_pem_private_key(
                private_key_bytes,
                password=None
            )
            
            # Decrypt using OAEP padding
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
    """
    Encrypts plaintext with the given password and 3DES settings.

    :param plaintext: The plaintext to encrypt.
    :param password: The password to use for key derivation.
    :param key_size: The size of the key in bits.
    :param mode: The mode to use for encryption. Currently only supports CBC.
    :param key_option: The option to use for generating the 3DES keys. Can be "one", "two", or "three".
    :param key1: The first key to use. Required for all key options.
    :param key2: The second key to use. Required for 2-key mode.
    :param key3: The third key to use. Required for 3-key mode.
    :param iv: The initialization vector to use. Will be randomly generated if not provided.
    :return: The encrypted ciphertext.
    """
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

    """
    Decrypts ciphertext with the given password and 3DES settings.

    :param encrypted_data: The ciphertext to decrypt.
    :param password: The password to use for key derivation.
    :param key_size: The size of the key in bits.
    :param mode: The mode to use for decryption. Currently only supports CBC.
    :param key_option: The option to use for generating the 3DES keys. Can be "one", "two", or "three".
    :param key1: The first key to use. Required for all key options.
    :param key2: The second key to use. Required for 2-key mode.
    :param key3: The third key to use. Required for 3-key mode.
    :return: The decrypted plaintext.
    """
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
        """Helper method to handle partial encryption of text.
        
        Combines the unencrypted parts of the text with the encrypted selected text.

        :param full_text: The complete text to be partially encrypted.
        :param selected_text: The portion of text to be encrypted.
        :param start: Start index of the selected portion in the full text.
        :param end: End index of the selected portion in the full text.
        :param encrypt_func: The encryption function to use.
        :return: The text with the selected portion encrypted.
        """
        try:
            # Encrypt the selected portion
            selected_bytes = selected_text.encode('utf-8')
            encrypted_bytes = encrypt_func(selected_bytes, *args, **kwargs)
            # If the result is a string (as with ecc_encrypt), don't re-encode
            if isinstance(encrypted_bytes, str):
                encrypted_text = encrypted_bytes
            else:
                encrypted_text = base64.b64encode(encrypted_bytes).decode('utf-8')
            
            # Combine the parts
            result = full_text[:start] + encrypted_text + full_text[end:]
            return result
        except Exception as e:
            logger.error(f"Partial encryption error: {str(e)}")
            raise


    def _handle_partial_decryption(self, full_text: str, start: int, end: int,
                                decrypt_func, *args, **kwargs) -> str:
        """Helper method to handle partial decryption of text.
        
        Decodes the selected encrypted portion and combines it with the unencrypted parts.

        :param full_text: The complete text to be partially decrypted.
        :param start: Start index of the encrypted portion in the full text.
        :param end: End index of the encrypted portion in the full text.
        :param decrypt_func: The decryption function to use.
        :return: The text with the selected portion decrypted.
        """
        try:
            # Extract the encrypted portion
            encrypted_text = full_text[start:end]
            
            # Log the encrypted text for debugging
            logger.debug(f"Encrypted text to decrypt: {encrypted_text[:30]}... (length: {len(encrypted_text)})")
            
            # For ECC decrypt, which expects a base64 string directly
            if decrypt_func == self.ecc_decrypt:
                # Ensure we're passing a proper base64 string
                # Some web frameworks might URL-encode the plus signs or other chars
                cleaned_text = encrypted_text.replace(' ', '+')
                decrypted_bytes = decrypt_func(cleaned_text, *args, **kwargs)
            else:
                # For other algorithms, decode from base64 first
                try:
                    encrypted_bytes = base64.b64decode(encrypted_text)
                    logger.debug(f"Base64 decoded length: {len(encrypted_bytes)}")
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
        """Partially encrypt text using AES.
        
        :param full_text: The complete text to be partially encrypted.
        :param selected_text: The portion of text to be encrypted.
        :param start: Start index of the selected portion in the full text.
        :param end: End index of the selected portion in the full text.
        :return: The text with the selected portion encrypted using AES.
        """
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.aes_encrypt, password, key_size, mode, iv
        )

    def partial_aes_decrypt(self, full_text: str, start: int, end: int,
                            password: str, key_size: int, mode: str) -> str:
        """Partially decrypt text using AES.
        
        :param full_text: The complete text to be partially decrypted.
        :param start: Start index of the encrypted portion in the full text.
        :param end: End index of the encrypted portion in the full text.
        :return: The text with the selected portion decrypted using AES.
        """
        return self._handle_partial_decryption(
            full_text, start, end,
            self.aes_decrypt, password, key_size, mode
        )

    def partial_ecc_encrypt(self, full_text: str, selected_text: str, start: int, end: int,
                            public_key_pem: str, curve_name: str) -> str:
        """Partially encrypt text using ECC.
        
        :param full_text: The complete text to be partially encrypted.
        :param selected_text: The portion of text to be encrypted.
        :param start: Start index of the selected portion in the full text.
        :param end: End index of the selected portion in the full text.
        :param public_key_pem: The PEM representation of the public key.
        :param curve_name: The name of the elliptic curve (e.g., "secp256r1").
        :return: The text with the selected portion encrypted using ECC.
        """
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.ecc_encrypt, public_key_pem, curve_name
        )

    def partial_ecc_decrypt(self, full_text: str, start: int, end: int,
                            private_key_pem: str, curve_name: str) -> str:
        """Partially decrypt text using ECC.
        
        :param full_text: The complete text to be partially decrypted.
        :param start: Start index of the encrypted portion in the full text.
        :param end: End index of the encrypted portion in the full text.
        :param private_key_pem: The PEM representation of the private key.
        :param curve_name: The name of the elliptic curve (e.g., "secp256r1").
        :return: The text with the selected portion decrypted using ECC.
        """
        return self._handle_partial_decryption(
            full_text, start, end,
            self.ecc_decrypt, private_key_pem, curve_name
        )

    def partial_rsa_encrypt(self, full_text: str, selected_text: str, start: int, end: int,
                            public_key: str) -> str:
        """Partially encrypt text using RSA.
        
        :param full_text: The complete text to be partially encrypted.
        :param selected_text: The portion of text to be encrypted.
        :param start: Start index of the selected portion in the full text.
        :param end: End index of the selected portion in the full text.
        :return: The text with the selected portion encrypted using RSA.
        """
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.rsa_encrypt, public_key
        )

    def partial_rsa_decrypt(self, full_text: str, start: int, end: int,
                            private_key: str) -> str:
        """Partially decrypt text using RSA.
        
        :param full_text: The complete text to be partially decrypted.
        :param start: Start index of the encrypted portion in the full text.
        :param end: End index of the encrypted portion in the full text.
        :return: The text with the selected portion decrypted using RSA.
        """
        return self._handle_partial_decryption(
            full_text, start, end,
            self.rsa_decrypt, private_key
        )

    def partial_triple_des_encrypt(self, full_text: str, selected_text: str, start: int, end: int,
                                   password: str, key_size: int, mode: str, key_option: str,
                                   key1: str, key2: str = None, key3: str = None,
                                   iv: str = None) -> str:
        """Partially encrypt text using Triple DES.
        
        :param full_text: The complete text to be partially encrypted.
        :param selected_text: The portion of text to be encrypted.
        :param start: Start index of the selected portion in the full text.
        :param end: End index of the selected portion in the full text.
        :return: The text with the selected portion encrypted using Triple DES.
        """
        return self._handle_partial_encryption(
            full_text, selected_text, start, end,
            self.triple_des_encrypt, password, key_size, mode, key_option,
            key1, key2, key3, iv
        )

    def partial_triple_des_decrypt(self, full_text: str, start: int, end: int,
                                   password: str, key_size: int, mode: str, key_option: str,
                                   key1: str, key2: str = None, key3: str = None) -> str:
        """Partially decrypt text using Triple DES.
        
        :param full_text: The complete text to be partially decrypted.
        :param start: Start index of the encrypted portion in the full text.
        :param end: End index of the encrypted portion in the full text.
        :return: The text with the selected portion decrypted using Triple DES.
        """
        return self._handle_partial_decryption(
            full_text, start, end,
            self.triple_des_decrypt, password, key_size, mode, key_option,
            key1, key2, key3
        )
