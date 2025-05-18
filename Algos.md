## Security Project: Encryption Algorithms

This project collects a suite of encryption algorithms for robust text and image protection. It offers symmetric, asymmetric, and chaotic ciphers, complete with parameter validation and error handling, suitable for Python applications and FastAPI microservices.

---

### Table of Contents

1. [Features](#features)

2. [Supported Algorithms](#supported-algorithms)

   * [AES (Advanced Encryption Standard)](#aes)
   * [ECC (Elliptic Curve Cryptography)](#ecc)
   * [RSA (Rivest–Shamir–Adleman)](#rsa)
   * [3DES (Triple DES)](#3des)
   * [RC4 (Rivest Cipher 4)](#rc4)
   * [Logistic XOR (Chaotic Cipher)](#logistic-xor)
3. [Security Considerations](#security-considerations)
4. [Error Handling](#error-handling)
5. [Dependencies](#dependencies)
6. [License](#license)

---

## Features

* **Versatile Modes**: Authenticated (GCM) and traditional (CBC, CTR, ECB).
* **Asymmetric & Symmetric**: RSA, ECC, AES, 3DES, RC4, plus custom logistic map XOR.
* **Text & Image Support**: Encrypt/decrypt raw data or image files (PNG, JPEG, BMP).
* **API Ready**: Designed for integration with FastAPI endpoints.
* **Robust Error Handling**: Pre-checks for parameters, key lengths, IV/nonce formats.

---



## Supported Algorithms

### AES (Advanced Encryption Standard)

AES is the industry standard for symmetric encryption, offering high performance and strong security.

**Use Cases**: Data-at-rest encryption, secure file storage, image privacy.

**Parameters**:

* **password** (str): Passphrase; PBKDF2-derived key by default.
* **key\_size** (int): 128, 192, or 256 bits.
* **mode** (str):

  * `gcm`: Authenticated encryption, returns (ciphertext, tag).
  * `cbc`: Classic chaining mode, requires IV.
  * `ctr`: Stream cipher mode, requires nonce.
  * `ecb`: Electronic Codebook; insecure for repetitive data.
* **iv** (hex, 16 bytes): Required for CBC.
* **nonce** (hex):

  * 12 bytes for GCM.
  * 16 bytes for CTR.

**Behavior**:

* GCM mode automatically verifies authenticity; decryption fails if tag mismatch.
* CBC/CTR modes do not provide authentication—consider HMAC if needed.

---

### ECC (Elliptic Curve Cryptography)

ECC delivers asymmetric encryption with smaller key sizes and equivalent security to RSA.

**Use Cases**: Mobile/IoT secure channels, digital signatures, key exchange.

**Parameters**:

* **curve** (str): e.g., `secp256r1`, `secp384r1`.
* **private\_key**: Generated via library; kept secret.
* **public\_key**: Shared for encrypting or verifying.
* **ephemeral\_key**: Per-message nonce for ECDH/ECDSA, ensuring forward secrecy.

**Behavior**:

* ECDH: Derives shared secret for symmetric encryption.
* ECDSA: Signs data; signature length \~ twice curve size.

---

### RSA (Rivest–Shamir–Adleman)

RSA is a foundational public-key algorithm, widely adopted for small payloads and key encapsulation.

**Use Cases**: Secure key exchange, digital signatures, certificate-based systems.

**Parameters**:

* **key\_size** (int): 2048 or 3072 bits recommended.
* **public\_key** (PEM): Used for encryption and signature verification.
* **private\_key** (PEM): Used for decryption and signing.
* **padding** (str): `OAEP` for encryption (recommended), `PSS` for signatures.

**Behavior**:

* Encryption limited by key size minus padding overhead (\~214 bytes for RSA-2048 + OAEP).
* Slower than ECC for similar security; best used for small data or hybrid schemes.

---

### 3DES (Triple DES)

Applies DES encryption three times for improved security over single DES.

**Use Cases**: Legacy systems maintenance, compatibility layers.

**Parameters**:

* **password** (str): Passphrase for key derivation.
* **key\_option** (str):

  * `one`: K1=K2=K3 (weak).
  * `two`: K1,K2,K1.
  * `three`: K1,K2,K3 (strongest).
* **mode** (str): `cbc` (requires IV) or `ecb`.
* **iv** (hex, 8 bytes): Required for CBC.

**Behavior**:

* Keying option two and three mitigate meet-in-the-middle attacks.
* Significantly slower than AES; use only for compatibility.

---

### RC4 (Rivest Cipher 4)

A legacy stream cipher known for simplicity but deprecated due to biases in output.

**Use Cases**: Historical analysis, legacy protocol support only.

**Parameters**:

* **key** (str): User-supplied passphrase or bytes.

**Behavior**:

* Avoid for new applications; known vulnerabilities (IV collisions, key biases).
* No built-in authentication or integrity checks.

---

### Logistic XOR (Chaotic Cipher)

A custom cipher leveraging the logistic map: `x_{n+1} = r * x_n * (1 - x_n)`.

**Use Cases**: Experimental research, educational demonstration of chaos-based encryption.

**Parameters**:

* **initial\_value** (float): `0 < x0 < 1`, x0 ≠ 0.5.
* **parameter** (float): `3.57 ≤ r ≤ 4.0`.
* **password** (optional str): Seed to perturb x0 via hash.

**Behavior**:

* Generates a pseudorandom keystream by iterating the logistic map.
* XORs plaintext bytes with scaled chaotic values.
* Sensitive to parameter/leakage; not recommended for production.

---

## Security Considerations

* **Key Management**: Enforce strong, unique passphrases; secure private key storage (HSM/KMS).
* **Mode Selection**: Default to `gcm`/`oaep`; avoid `ecb`; rotate IVs/nonces per message.
* **Key Sizes**: AES-256, RSA ≥2048 bits, ECC ≥256-bit curves.

---

## Error Handling

* **Validation**: Checks for missing or malformed parameters.
* **Key/IV Length**: Verifies length in bytes and hex format.
* **Authentication**: Fails on GCM tag mismatch or signature verification errors.
* **Image Errors**: Catches file I/O and format issues.

---

## Dependencies

* **cryptography**: Core cryptographic primitives.
* **pycryptodome**: Supplementary ciphers (3DES, RC4).
* **Pillow**: Image file I/O.
* **numpy**: Array and matrix operations.
* **opencv-python**: Advanced image preprocessing.
* **fastapi**: Web API framework.

---


