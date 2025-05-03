# SecureCrypt API

A FastAPI-based backend for file and image encryption/decryption.

## Features

- File encryption/decryption using multiple algorithms:
  - AES-GCM
  - ChaCha20Poly1305
  - Camellia-GCM
  - RSA (hybrid encryption)
- Image encryption/decryption with region selection
- Support for multiple key derivation functions (KDF):
  - PBKDF2
  - Scrypt
- Partial encryption/decryption for text-based files

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### File Encryption/Decryption

- **POST** `/api/encrypt`
  - Request body: `EncryptionRequest`
  - Response: `EncryptionResponse`

### Image Processing

- **POST** `/api/image/process`
  - Request body: `ImageEncryptionRequest`
  - Response: `ImageEncryptionResponse`

## Example Usage

### File Encryption

```python
import requests
import base64

# Read file content
with open("example.txt", "rb") as f:
    file_content = base64.b64encode(f.read()).decode()

# Prepare request
request_data = {
    "file_content": file_content,
    "password": "your_password",
    "algorithm": "AES-GCM",
    "kdf_type": "PBKDF2",
    "operation": "encrypt",
    "kdf_params": {"iterations": 150000}
}

# Send request
response = requests.post("http://localhost:8000/api/encrypt", json=request_data)
result = response.json()

# Save encrypted file
with open("encrypted_file", "wb") as f:
    f.write(base64.b64decode(result["processed_content"]))
```

### Image Processing

```python
import requests
import base64

# Read image content
with open("example.png", "rb") as f:
    image_content = base64.b64encode(f.read()).decode()

# Prepare request
request_data = {
    "image_content": image_content,
    "algorithm": "AES-CTR",
    "key": "your_key_in_hex",
    "nonce": "your_nonce_in_hex",
    "operation": "encrypt",
    "regions": [
        {
            "left": 100,
            "top": 100,
            "width": 200,
            "height": 200
        }
    ]
}

# Send request
response = requests.post("http://localhost:8000/api/image/process", json=request_data)
result = response.json()

# Save processed image
with open("processed_image.png", "wb") as f:
    f.write(base64.b64decode(result["processed_image"]))
```

## Security Notes

- Always use strong passwords and keys
- Keep your private keys secure
- Use HTTPS in production
- Consider implementing rate limiting and other security measures 