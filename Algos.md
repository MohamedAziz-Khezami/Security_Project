# Security Project - Encryption Algorithms Documentation

This project implements various encryption algorithms for both text and image encryption. Below is a detailed explanation of each algorithm and its parameters.

## Supported Algorithms

### 1. AES (Advanced Encryption Standard)
AES is a symmetric encryption algorithm that supports multiple modes of operation.

#### Parameters:
- **Password**: String used to derive the encryption key
- **Key Size**: 
  - 128 bits
  - 192 bits
  - 256 bits
- **Mode**: 
  - `gcm` (Galois/Counter Mode) - Authenticated encryption
  - `cbc` (Cipher Block Chaining) - Requires IV
  - `ctr` (Counter) - Requires nonce
  - `ecb` (Electronic Codebook) - Not recommended for secure applications

#### Additional Parameters:
- **IV** (Initialization Vector): Required for CBC mode
  - Must be 16 bytes (32 hex characters)
- **Nonce**: Required for GCM and CTR modes
  - GCM: 12 bytes (24 hex characters)
  - CTR: 16 bytes (32 hex characters)

### 2. ECC (Elliptic Curve Cryptography)  
A public-key cryptographic system that offers high security with smaller key sizes, making it efficient for mobile and embedded devices.

#### Parameters:
- **Private Key**: A randomly generated number used to generate the public key and decrypt messages.
- **Public Key**: Derived from the private key and shared openly to encrypt messages or verify signatures.
- **Curve**: Specifies the mathematical curve used (e.g., `secp256k1`, `secp256r1`)
- **Nonce / Ephemeral Key** (used in ECDH/ECDSA): Random value used per operation to ensure forward secrecy and prevent replay attacks.


### 3. RSA (Rivest-Shamir-Adleman)
An asymmetric encryption algorithm that uses public and private key pairs.

#### Parameters:
- **Public Key**: Required for encryption
  - PEM format
  - 2048-bit key size
- **Private Key**: Required for decryption
  - PEM format
  - 2048-bit key size

### 4. Triple DES (3DES)
A symmetric encryption algorithm that applies DES three times.

#### Parameters:
- **Password**: String used to derive the encryption key
- **Key Option**:
  - `one`: Single key used three times
  - `two`: Two different keys (K1, K2, K1)
  - `three`: Three different keys (K1, K2, K3)
- **Mode**:
  - `cbc`: Requires IV
  - `ecb`: Not recommended for secure applications
- **IV**: Required for CBC mode
  - 8 bytes (16 hex characters)

### 5. RC4
A stream cipher known for its simplicity and speed.

#### Parameters:
- **RC4 Key**: String used as the encryption key

### 6. Logistic XOR
A custom encryption method based on the logistic map chaotic system.

#### Parameters:
- **Initial Value**: Between 0 and 1 (excluding 0, 0.5, and 1)
- **Parameter**: Between 3.57 and 4
- **Password**: Optional, used to seed the chaotic system

## Image Encryption Features

The project supports both full and partial image encryption:

### Full Image Encryption
- Encrypts the entire image using any of the supported algorithms
- Maintains image format and quality
- Supports PNG format output

### Partial Image Encryption
- Encrypts specific regions of the image
- Supports multiple regions
- Region format: `x,y,width,height`
- Maintains image quality in non-encrypted regions

### Auto-Decryption
- Automatically detects encrypted regions in images
- Uses statistical analysis to identify encrypted areas
- Supports decryption of detected regions

## Security Considerations

1. **Key Management**:
   - Always use strong passwords
   - Keep private keys secure
   - Use unique IVs/nonces for each encryption

2. **Mode Selection**:
   - Prefer authenticated modes (GCM, ChaCha20-Poly1305)
   - Avoid ECB mode for sensitive data
   - Use CBC or CTR with proper IV/nonce management

3. **Key Sizes**:
   - AES: Use 256-bit keys for maximum security
   - RSA: 2048-bit keys provide good security
   - ChaCha20: Always uses 256-bit keys

## Usage Examples

### Text Encryption
```python
# AES Encryption
encrypted = encryption_service.aes_encrypt(
    plaintext,
    password="strong_password",
    key_size=256,
    mode="gcm",
    nonce="random_nonce_here"
)

# RSA Encryption
encrypted = encryption_service.rsa_encrypt(
    plaintext,
    public_key="-----BEGIN PUBLIC KEY-----\n..."
)
```

### Image Encryption
```python
# Partial Image Encryption
processed_image = image_service.partial_process_image(
    image_data,
    regions=[{"left": 0, "top": 0, "width": 100, "height": 100}],
    operation="encrypt",
    algorithm="aes",
    password="strong_password",
    key_size=256,
    mode="gcm",
    nonce="random_nonce_here"
)
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid parameters
- Incorrect key sizes
- Missing required parameters
- Invalid IV/nonce formats
- Decryption failures
- Image processing errors

## Dependencies

- cryptography
- pycryptodome
- Pillow (PIL)
- numpy
- opencv-python (cv2)
- fastapi 