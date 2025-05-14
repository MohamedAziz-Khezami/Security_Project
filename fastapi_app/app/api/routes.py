import logging
from fastapi import APIRouter, HTTPException
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from typing import Optional, Literal
from fastapi.responses import StreamingResponse
from io import BytesIO
import base64

from app.schemas.encryption import (
    EncryptionRequest,
    EncryptionResponse,
    ImageEncryptionRequest,
    ImageEncryptionResponse,
    AutoDecryptImageRequest
)
from app.services.encryption_service import EncryptionService
from app.services.image_service import ImageEncryptionService
import os
import binascii


from fastapi import FastAPI, Form, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import hashlib
import os
from typing import Optional
import base64



logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()
encryption_service = EncryptionService()
image_service = ImageEncryptionService()
from fastapi import Request

# Helper function to encrypt a file (AES encryption example)
def encrypt_file(file_data: bytes, key: bytes) -> bytes:
    # Generate a random initialization vector (IV)
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted_data = encryptor.update(file_data) + encryptor.finalize()

    # Return IV + encrypted data for later decryption
    return iv + encrypted_data

# Helper function to decrypt a file
def decrypt_file(file_data: bytes, key: bytes) -> bytes:
    iv = file_data[:16]  # Extract IV
    encrypted_data = file_data[16:]  # Extract encrypted content
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()
    return decrypted_data

# Helper function to hash data (using SHA-256)
def hash_data(data: bytes) -> str:
    sha256_hash = hashlib.sha256()
    sha256_hash.update(data)
    return sha256_hash.hexdigest()

# Pydantic model to handle the request data
class FileInfo(BaseModel):
    name: str
    type: Optional[str]
    content: Optional[str]
    file: Optional[UploadFile]

# Endpoint to process the file (encrypt, decrypt, or hash)
@router.post("/encrypt")
async def process_file(
    request: Request
):
    form_data = await request.form()
    print(form_data)
    return None

@router.post("/image/auto-decrypt", response_model=ImageEncryptionResponse)
async def auto_decrypt_image(request: AutoDecryptImageRequest):
    # 1️⃣ Validate Base64 image blob
    try:
        image_data = base64.b64decode(request.image_content, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="`image_content` is not valid Base64")

    # 2️⃣ Validate hex key
    if len(request.key) % 2 != 0:
        raise HTTPException(status_code=400, detail=f"`key` must be an even‑length hex string; got {len(request.key)} chars")
    try:
        _ = binascii.unhexlify(request.key)
    except (binascii.Error, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"`key` is not valid hex: {e}")

    # 3️⃣ If you require a nonce—validate it too
    if request.nonce is not None:
        if len(request.nonce) % 2 != 0:
            raise HTTPException(status_code=400, detail=f"`nonce` must be an even‑length hex string; got {len(request.nonce)} chars")
        try:
            _ = binascii.unhexlify(request.nonce)
        except (binascii.Error, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"`nonce` is not valid hex: {e}")

    # ✅ All good—call your service
    try:
        processed_data = image_service.auto_decrypt_image(
            image_data,
            request.key,
            request.nonce,
            request.algorithm
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Encode back to Base64 for the response
    processed_image = base64.b64encode(processed_data).decode('utf-8')
    return ImageEncryptionResponse(
        processed_image=processed_image,
        filename="decrypted_image.png"
    )

@router.post("/image/partial-encrypt", response_model=ImageEncryptionResponse)
async def partial_encrypt_image(
    image_content: str = Form(...),  # Base64 encoded image
    operation: Literal["encrypt", "decrypt"] = Form(...),
    algorithm: str = Form(...),
    regions: str = Form(...),  # String of regions in format "x,y,width,height;x,y,width,height"
    password: Optional[str] = Form(None),
    key_size: Optional[int] = Form(None),
    mode: Optional[str] = Form(None),
    iv: Optional[str] = Form(None),
    nonce: Optional[str] = Form(None),
    rc4_key: Optional[str] = Form(None),
    logistic_initial: Optional[float] = Form(None),
    logistic_parameter: Optional[float] = Form(None)
):
    try:
        # Validate Base64 image
        try:
            image_data = base64.b64decode(image_content, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(status_code=400, detail="Invalid Base64 image data")

        # Parse regions string
        try:
            regions_list = []
            for region_str in regions.split(';'):
                if not region_str.strip():
                    continue
                try:
                    x, y, width, height = map(int, region_str.split(','))
                    regions_list.append({
                        "left": x,
                        "top": y,
                        "width": width,
                        "height": height
                    })
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid region format: {region_str}. Expected format: x,y,width,height"
                    )
            
            if not regions_list:
                raise HTTPException(status_code=400, detail="No valid regions provided")
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid regions format: {str(e)}")

        # Validate algorithm-specific parameters
        if algorithm == "aes":
            if not password:
                raise HTTPException(status_code=400, detail="Password is required for AES")
            if not key_size:
                raise HTTPException(status_code=400, detail="Key size is required for AES")
            if not mode:
                raise HTTPException(status_code=400, detail="Mode is required for AES")
            if mode != "ecb" and not nonce and not iv:
                raise HTTPException(status_code=400, detail=f"{'Nonce' if mode in ['ctr', 'gcm'] else 'IV'} is required for AES-{mode.upper()}")
        elif algorithm == "chacha20":
            if not password:
                raise HTTPException(status_code=400, detail="Password is required for ChaCha20")
            if not nonce:
                raise HTTPException(status_code=400, detail="Nonce is required for ChaCha20")
        elif algorithm == "rc4":
            if not rc4_key:
                raise HTTPException(status_code=400, detail="RC4 key is required")
        elif algorithm == "logistic":
            if logistic_initial is None:
                raise HTTPException(status_code=400, detail="Initial value is required for Logistic XOR")
            if logistic_parameter is None:
                raise HTTPException(status_code=400, detail="Parameter is required for Logistic XOR")
            if not (0 < logistic_initial < 1) or logistic_initial == 0.5:
                raise HTTPException(status_code=400, detail="Initial value must be between 0 and 1, excluding 0, 0.5, and 1")
            if not (3.57 <= logistic_parameter <= 4):
                raise HTTPException(status_code=400, detail="Parameter must be between 3.57 and 4")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")

        # Process the image
        try:
            processed_data = image_service.partial_process_image(
                image_data=image_data,
                regions=regions_list,
                operation=operation,
                algorithm=algorithm,
                password=password,
                key_size=key_size,
                mode=mode,
                iv=iv,
                nonce=nonce,
                rc4_key=rc4_key,
                logistic_initial=logistic_initial,
                logistic_parameter=logistic_parameter
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Image processing error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to process image")

        # Encode result back to Base64
        processed_base64 = base64.b64encode(processed_data).decode('utf-8')
        
        # Return the response with the processed image
        return {
            "processed_image": processed_base64,
            "filename": f"{operation}ed_image.png",
            "success": "Success"
        }

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))