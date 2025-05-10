from fastapi import APIRouter, HTTPException
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from typing import Optional, Literal
from fastapi.responses import StreamingResponse
from io import BytesIO


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

@router.post("/encrypt")
async def encrypt_file(    
    file: UploadFile = File(...),
    operation: Literal["encrypt", "decrypt"] = Form(...),
    algorithm: str = Form(...),

    # Common AES/Camellia/ChaCha fields
    password: Optional[str] = Form(None),
    keySize: Optional[int] = Form(None),
    mode: Optional[str] = Form(None),
    iv: Optional[str] = Form(None),
    nonce: Optional[str] = Form(None),  # for ChaCha20

    # RSA keys
    publicKey: Optional[str] = Form(None),
    privateKey: Optional[str] = Form(None),

    # 3DES-specific
    keyOption: Optional[str] = Form(None),
    key1: Optional[str] = Form(None),
    key2: Optional[str] = Form(None),
    key3: Optional[str] = Form(None),

    # Partial encryption
    partialEncryption: Optional[bool] = Form(False),
    selectedTextStart: Optional[int] = Form(None)):
    
    text = await file.read()
    if operation == "encrypt":
    
        output = encryption_service.aes_gcm_encrypt(
            text,
            password,
            keySize,
        )
            
        import base64

        return {
            "filename": f"encrypted_{file.filename}",
            "data": base64.b64encode(output).decode(),
            "message": "Success"
        }
                
            
    else :
        print(type(text))
        print(text)

        #from bytes to base664
        b64  = base64.b64encode(text)
        b64_string = b64.decode('utf-8')
        print(b64)
        print(b64_string)
        
        
        
        
        
        
        
        
    
"""    try:
        # from base64 to bytes
            raw = base64.b64decode(request.fileContentsBase64)
        
    
            alg = request.algorithm.lower()
            if request.operation == "encrypt":
                if alg == "aes" : 
                    if request.mode == "gcm":
                        out = encryption_service.aes_gcm_encrypt(raw, request.password, request.keySize, request.iv)
                    elif request.mode == "ctr":
                        out = encryption_service.aes_ctr_encrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "cbc":
                        out = encryption_service.aes_cbc_encrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ecb":
                        out = encryption_service.aes_ecb_encrypt(request.fileContentsBase64, request.password, request.keySize)
                elif alg == "chacha20":
                    if request.mode == "chacha20":
                        out = encryption_service.chacha20_encrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "chacha20-poly1305":
                        out = encryption_service.chacha20_poly1305_encrypt(request.fileContentsBase64, request.password, request.keySize)
                elif alg == "camellia":
                    if request.mode == "cbc":
                        out = encryption_service.camellia_cbc_encrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ecb":
                        out = encryption_service.camellia_ecb_encrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ctr":
                        out = encryption_service.camellia_ctr_encrypt(request.fileContentsBase64, request.password, request.keySize)
                elif alg == "rsa":
                    if request.publicKey:
                        out = encryption_service.rsa_encrypt(request.fileContentsBase64, request.publicKey)
                    else:
                        raise ValueError("Public key is required for RSA encryption")
                elif alg == "3des":
                    if request.mode == "cbc":
                        out = encryption_service.triple_des_cbc_encrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ecb":
                        out = encryption_service.triple_des_ecb_encrypt(request.fileContentsBase64, request.password, request.keySize)
                        
                        
                        
                        
            elif request.operation == "decrypt":
                if alg == "aes":
                    if request.mode == "gcm":
                        out = encryption_service.aes_gcm_decrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ctr":
                        out = encryption_service.aes_ctr_decrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "cbc":
                        out = encryption_service.aes_cbc_decrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ecb":
                        out = encryption_service.aes_ecb_decrypt(request.fileContentsBase64, request.password, request.keySize)
                elif alg == "chacha20":
                    if request.mode == "chacha20":
                        out = encryption_service.chacha20_decrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "chacha20-poly1305":
                        out = encryption_service.chacha20_poly1305_decrypt(request.fileContentsBase64, request.password, request.keySize)
                elif alg == "camellia":
                    if request.mode == "cbc":
                        out = encryption_service.camellia_cbc_decrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ecb":
                        out = encryption_service.camellia_ecb_decrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ctr":
                        out = encryption_service.camellia_ctr_decrypt(request.fileContentsBase64, request.password, request.keySize)
                elif alg == "rsa":
                    if request.privateKey:
                        out = encryption_service.rsa_decrypt(request.fileContentsBase64, request.privateKey)
                    else:
                        raise ValueError("Private key is required for RSA decryption")
                elif alg == "3des":
                    if request.mode == "cbc":
                        out = encryption_service.triple_des_cbc_decrypt(request.fileContentsBase64, request.password, request.keySize)
                    elif request.mode == "ecb":
                        out = encryption_service.triple_des_ecb_decrypt(request.fileContentsBase64, request.password, request.keySize)
                
                
            else:
                raise ValueError("Unsupported algorithm or missing keys")
            
            return {"success": True, "message": "Encrypted successfully", "processedSelection": out}
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
    )"""