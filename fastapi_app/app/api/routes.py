from fastapi import APIRouter, HTTPException
from app.schemas.encryption import (
    EncryptionRequest,
    EncryptionResponse,
    ImageEncryptionRequest,
    ImageEncryptionResponse
)
from app.services.encryption_service import EncryptionService
from app.services.image_service import ImageEncryptionService
import base64
import os

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
    try:
        # Decode base64 image content
        image_data = base64.b64decode(request.image_content)
        
        # Process image
        processed_data = image_service.process_image(
            image_data,
            request.regions,
            request.key,
            request.nonce,
            request.algorithm,
            request.operation
        )
        
        # Encode processed image as base64
        processed_image = base64.b64encode(processed_data).decode('utf-8')
        
        return ImageEncryptionResponse(
            processed_image=processed_image,
            filename="processed_image.png"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 