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

# Configure basic logging for the application
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize router and services
router = APIRouter()
encryption_service = EncryptionService()
image_service = ImageEncryptionService()

@router.post("/encrypt")
async def encrypt_file(
    file: UploadFile = File(...),
    operation: Literal["encrypt", "decrypt"] = Form(...),
    algorithm: str = Form(...),

    # File encryption parameters
    password: Optional[str] = Form(None),
    keySize: Optional[int] = Form(None),
    mode: Optional[str] = Form(None),
    iv: Optional[str] = Form(None),
    nonce: Optional[str] = Form(None),  

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
    selectedTextStart: Optional[str] = Form(None),  # Changed to str to handle form data
    selectedTextEnd: Optional[str] = Form(None),    # Changed to str to handle form data
    selectedText: Optional[str] = Form(None),
    plaintext: Optional[str] = Form(None),

    curve : Optional[str] = Form(None)
):
    """
    Endpoint to encrypt or decrypt files using various cryptographic algorithms.
    
    Supports full file encryption/decryption as well as partial text encryption/decryption.
    Handles different algorithms including AES, RSA, ECC, and 3DES with their specific parameters.
    
    Parameters:
    - file: The file to be encrypted or decrypted
    - operation: Either "encrypt" or "decrypt"
    - algorithm: Cryptographic algorithm to use (aes, rsa, ecc, 3des)
    - Various algorithm-specific parameters (password, keys, modes, etc.)
    - Partial encryption parameters for text files
    
    Returns:
    - JSON with filename, processed data, and status message
    """
    print(partialEncryption)
    try:
        # Read file content
        file_content = await file.read()
        logger.debug(f"File read - Size: {len(file_content)} bytes")
        print(file_content)
        
        if operation == "encrypt":
            if partialEncryption:
                # Handle partial encryption for text files
                full_text = file_content.decode('utf-8')
                
                # Convert string positions to integers
                try:
                    start_pos = int(selectedTextStart) if selectedTextStart else None
                    end_pos = int(selectedTextEnd) if selectedTextEnd else None
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid text selection range")
                
                if not selectedText or start_pos is None or end_pos is None:
                    raise HTTPException(status_code=400, detail="Selected text and range are required for partial encryption")
                
                logger.debug(f"Partial encryption params: text={selectedText}, start={start_pos}, end={end_pos}")
                
                if algorithm == "aes":
                    if not password or not keySize or not mode:
                        raise HTTPException(status_code=400, detail="Password, key size, and mode are required for AES encryption")
                    result = encryption_service.partial_aes_encrypt(
                        full_text, selectedText, start_pos, end_pos,
                        password, keySize, mode, iv
                    )
                elif algorithm == "ecc":
                   
                    result = encryption_service.partial_ecc_encrypt(
                        full_text, selectedText, start_pos, end_pos,
                        publicKey, curve
                    )
                elif algorithm == "rsa":
                    if not publicKey:
                        raise HTTPException(status_code=400, detail="Public key is required for RSA encryption")
                    result = encryption_service.partial_rsa_encrypt(
                        full_text, selectedText, start_pos, end_pos,
                        publicKey
                    )
                elif algorithm == "3des":
                    result = encryption_service.partial_triple_des_encrypt(
                        full_text, selectedText, start_pos, end_pos,
                        password, keySize, mode, keyOption, key1, key2, key3, iv
                    )
                else:
                    raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")
                
                return {
                    "filename": f"encrypted_{file.filename}",
                    "data": result,
                    "message": "Success"
                }
            else:
                # Handle full file encryption
                if algorithm == "aes":
                    if not password or not keySize or not mode:
                        raise HTTPException(status_code=400, detail="Password, key size, and mode are required for AES encryption")
                    encrypted_data = encryption_service.aes_encrypt(
                        file_content,
                        password,
                        keySize,
                        mode,
                        iv
                    )
                elif algorithm == "ecc":
                
                    encrypted_data = encryption_service.ecc_encrypt(
                        file_content,
                        publicKey,
                        curve
                    )
                    print(encrypted_data)
                    # Convert to bytes
                    encrypted_data = bytes(encrypted_data, 'utf-8')
                    
                elif algorithm == "rsa":
                    if not publicKey:
                        raise HTTPException(status_code=400, detail="Public key is required for RSA encryption")
                    encrypted_data = encryption_service.rsa_encrypt(
                        file_content,
                        publicKey
                    )
                elif algorithm == "3des":
                    encrypted_data = encryption_service.triple_des_encrypt(
                        file_content,
                        password,
                        keySize,
                        mode,
                        keyOption,
                        key1,
                        key2,
                        key3,
                        iv
                    )
                else:
                    raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")
                
                encrypted_base64 = base64.b64encode(encrypted_data).decode('utf-8')
                return {
                    "filename": f"encrypted_{file.filename}",
                    "data": encrypted_base64,
                    "message": "Success"
                }
                
        else:  # decrypt
            try:
                if partialEncryption:
                    # Handle partial decryption for text files
                    full_text = file_content.decode('utf-8')
                    
                    # Convert string positions to integers
                    try:
                        start_pos = int(selectedTextStart) if selectedTextStart else None
                        end_pos = int(selectedTextEnd) if selectedTextEnd else None
                    except ValueError:
                        raise HTTPException(status_code=400, detail="Invalid text selection range")
                    
                    if start_pos is None or end_pos is None:
                        raise HTTPException(status_code=400, detail="Selected range is required for partial decryption")
                    
                    logger.debug(f"Partial decryption params: start={start_pos}, end={end_pos}")
                    
                    if algorithm == "aes":
                        if not password or not keySize or not mode:
                            raise HTTPException(status_code=400, detail="Password, key size, and mode are required for AES decryption")
                        result = encryption_service.partial_aes_decrypt(
                            full_text, start_pos, end_pos,
                            password, keySize, mode
                        )
                    elif algorithm == "ecc":
                        result = encryption_service.partial_ecc_decrypt(
                            full_text, start_pos, end_pos,
                            privateKey, curve
                        )
                    elif algorithm == "rsa":
                        if not privateKey:
                            raise HTTPException(status_code=400, detail="Private key is required for RSA decryption")
                        result = encryption_service.partial_rsa_decrypt(
                            full_text, start_pos, end_pos,
                            privateKey
                        )
                    elif algorithm == "3des":
                        result = encryption_service.partial_triple_des_decrypt(
                            full_text, start_pos, end_pos,
                            password, keySize, mode, keyOption, key1, key2, key3
                        )
                    else:
                        raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")
                    
                    return {
                        "filename": f"decrypted_{file.filename}",
                        "data": result,
                        "message": "Success"
                    }
                else:
                    # Handle full file decryption
                    encrypted_bytes = base64.b64decode(file_content)
                    
                    if algorithm == "aes":
                        if not password or not keySize or not mode:
                            raise HTTPException(status_code=400, detail="Password, key size, and mode are required for AES decryption")
                        decrypted_data = encryption_service.aes_decrypt(
                            encrypted_bytes,
                            password,
                            keySize,
                            mode
                        )
                    elif algorithm == "ecc":
                        decrypted_data = encryption_service.ecc_decrypt(
                            encrypted_bytes,
                            privateKey,
                            curve
                        )
                    elif algorithm == "rsa":
                        if not privateKey:
                            raise HTTPException(status_code=400, detail="Private key is required for RSA decryption")
                        decrypted_data = encryption_service.rsa_decrypt(
                            encrypted_bytes,
                            privateKey
                        )
                    elif algorithm == "3des":
                        decrypted_data = encryption_service.triple_des_decrypt(
                            encrypted_bytes,
                            password,
                            keySize,
                            mode,
                            keyOption,
                            key1,
                            key2,
                            key3
                        )
                    else:
                        raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")
                    
                    try:
                        # Try to decode as text first
                        decrypted_text = decrypted_data.decode('utf-8')
                        return {
                            "filename": f"decrypted_{file.filename}",
                            "data": decrypted_text,
                            "message": "Success"
                        }
                    except UnicodeDecodeError:
                        # If not text, return as base64
                        decrypted_base64 = base64.b64encode(decrypted_data).decode('utf-8')
                        return {
                            "filename": f"decrypted_{file.filename}",
                            "data": decrypted_base64,
                            "message": "Success"
                        }
            except ValueError as e:
                logger.error(f"Decryption error: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))
            
    except Exception as e:
        logger.error(f"General error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate-rsa-keys")
async def generate_rsa_keys():
    """
    Endpoint to generate a new RSA key pair.
    
    Generates a 2048-bit RSA key pair with public exponent 65537.
    Returns both the private and public keys in PEM format.
    
    Returns:
    - JSON containing private_key and public_key in PEM format
    """
    # Generate public and private keys using rsa.generate_private_key and rsa.generate_public_key
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend

    # Generate a new private key with standard parameters
    private_key = rsa.generate_private_key(
        public_exponent=65537,  # Standard value for public exponent
        key_size=2048,          # 2048-bit key size (industry standard)
        backend=default_backend()
    )
    public_key = private_key.public_key()

    # Serialize the private key to PEM format without encryption
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    # Serialize the public key to PEM format
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    return {
        "private_key": private_key_pem.decode('utf-8'),
        "public_key": public_key_pem.decode('utf-8')
    }


@router.post("/generate-ecc-keys")
async def generate_ecc_keys(
    curve: str = Form(""),  # Specify the curve type, e.g., "secp256r1"
):
    """
    Endpoint to generate a new Elliptic Curve Cryptography (ECC) key pair.
    
    Supports different curves, including secp256r1 and secp256k1.
    Returns both the private and public keys in PEM format.
    
    Parameters:
    - curve: The elliptic curve to use (e.g., "secp256r1", "secp256k1")
    
    Returns:
    - JSON containing private_key and public_key in PEM format
    """
    # Generate public and private keys using ec.generate_private_key
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend

    # Select the curve based on the input parameter
    if curve == "secp256r1":
        private_key = ec.generate_private_key(
            ec.SECP256R1(),
            default_backend()
        )
    elif curve == "secp256k1":
        private_key = ec.generate_private_key(
            ec.SECP256K1(),
            default_backend()
        )

    # Get the corresponding public key
    public_key = private_key.public_key()

    # Serialize the private key to PEM format without encryption
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )

    # Serialize the public key to PEM format
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    return {
        "private_key": private_key_pem.decode('utf-8'),
        "public_key": public_key_pem.decode('utf-8')
    }


@router.post("/image/process", response_model=ImageEncryptionResponse)
async def process_image(request: ImageEncryptionRequest):
    """
    Endpoint to process (encrypt or decrypt) regions of an image.
    
    Takes a Base64-encoded image, processes specific regions using the specified 
    cryptographic algorithm, and returns the processed image.
    
    Parameters:
    - request: Contains image content, encryption key, regions, algorithm, operation
    
    Returns:
    - Processed image in Base64 format with filename
    """
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


import hashlib
import blake3

@router.post("/hash")
async def hash_file(
    file: UploadFile = File(...),
    algorithm: str = Form(...),
):
    """
    Endpoint to compute a hash of a file using various hash algorithms.
    
    Currently supports SHA-256 and BLAKE3 algorithms.
    
    Parameters:
    - file: The file to be hashed
    - algorithm: Hash algorithm to use (sha256 or blake3)
    
    Returns:
    - JSON with filename, computed hash value, and status message
    """
    try:
        # Read file content
        file_content = await file.read()
        logger.debug(f"File read - Size: {len(file_content)} bytes")

        # Choose hash algorithm based on request
        if algorithm == "sha256":
            hasher = hashlib.sha256()
            hasher.update(file_content)
            hash_value = hasher.hexdigest()
            
        elif algorithm == "blake3":
            hasher = blake3.blake3()
            hasher.update(file_content)
            hash_value = hasher.hexdigest()
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")
        
        return {
            "filename": f"hashed_{file.filename}",
            "hash": hash_value,
            "message": "Success"
        }
    except Exception as e:
        logger.error(f"Hashing error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/image/auto-decrypt", response_model=ImageEncryptionResponse)
async def auto_decrypt_image(request: AutoDecryptImageRequest):
    """
    Endpoint to automatically detect and decrypt encrypted regions in an image.
    
    Takes a Base64-encoded image, automatically detects encrypted regions,
    and decrypts them using the specified cryptographic algorithm and key.
    
    Parameters:
    - request: Contains image content, decryption key, algorithm details
    
    Returns:
    - Decrypted image in Base64 format with filename
    """
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
    """
    Endpoint to encrypt or decrypt specific regions of an image.
    
    Takes a Base64-encoded image and processes specified regions using the
    selected cryptographic algorithm. Supports AES, RC4, and Logistic XOR algorithms.
    
    Parameters:
    - image_content: Base64 encoded image data
    - operation: Either "encrypt" or "decrypt"
    - algorithm: Cryptographic algorithm to use
    - regions: String specifying regions to process in format "x,y,width,height;x,y,width,height"
    - Various algorithm-specific parameters
    
    Returns:
    - Processed image in Base64 format with filename and success message
    """
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
        elif algorithm == "ecc":
            # ECC parameter validation would go here
            pass
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