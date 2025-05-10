from fastapi import APIRouter, HTTPException
from schemas.encryption import (
    EncryptionRequest,
    EncryptionResponse,
    ImageEncryptionRequest,
    ImageEncryptionResponse,
    AutoDecryptImageRequest
)
from services.encryption_service import EncryptionService
from services.image_service import ImageEncryptionService
import base64
import os
import base64, binascii


router = APIRouter()
encryption_service = EncryptionService()
image_service = ImageEncryptionService()

@router.post("/encrypt", response_model=EncryptionResponse)
async def encrypt_file(request: EncryptionRequest):
    try:
        # Decode base64 file content
        file_content = base64.b64decode(request.file_content)
        
        # Process based on algorithm
        if request.algorithm == "AES-GCM":
            if request.operation == "encrypt":
                processed_data = encryption_service.aes_gcm_encrypt(
                    file_content, request.password, request.kdf_type, **request.kdf_params
                )
            else:
                processed_data = encryption_service.aes_gcm_decrypt(
                    file_content, request.password, request.kdf_type, **request.kdf_params
                )
        elif request.algorithm == "ChaCha20Poly1305":
            if request.operation == "encrypt":
                processed_data = encryption_service.chacha20_encrypt(
                    file_content, request.password, request.kdf_type, **request.kdf_params
                )
            else:
                processed_data = encryption_service.chacha20_decrypt(
                    file_content, request.password, request.kdf_type, **request.kdf_params
                )
        elif request.algorithm == "Camellia-GCM":
            if request.operation == "encrypt":
                processed_data = encryption_service.camellia_gcm_encrypt(
                    file_content, request.password, request.kdf_type, **request.kdf_params
                )
            else:
                processed_data = encryption_service.camellia_gcm_decrypt(
                    file_content, request.password, request.kdf_type, **request.kdf_params
                )
        else:
            raise HTTPException(status_code=400, detail="Unsupported algorithm")

        # Encode processed data as base64
        processed_content = base64.b64encode(processed_data).decode('utf-8')
        
        # Determine filename and mime type
        filename = f"{request.operation}ed_file"
        mime_type = "application/octet-stream"

        return EncryptionResponse(
            processed_content=processed_content,
            filename=filename,
            mime_type=mime_type
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/image/process", response_model=ImageEncryptionResponse)
async def process_image(request: ImageEncryptionRequest):
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

    # 4️⃣ Validate regions list
    if not request.regions or not all(
        isinstance(r, dict) and
        all(k in r for k in ("left","top","width","height"))
        for r in request.regions
    ):
        raise HTTPException(
            status_code=400,
            detail="Each entry in `regions` must be an object with keys: left, top, width, height"
        )

    # ✅ All good—call your service
    try:
        processed_data = image_service.process_image(
            image_data,
            request.regions,
            request.key,
            request.nonce,
            request.algorithm,
            request.operation
        )
    except Exception as e:
        # If your service ever throws, bubble up as 400
        raise HTTPException(status_code=400, detail=str(e))

    # Encode back to Base64 for the response
    processed_image = base64.b64encode(processed_data).decode('utf-8')
    return ImageEncryptionResponse(
        processed_image=processed_image,
        filename="processed_image.png"
    )

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