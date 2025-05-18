from pydantic import BaseModel, Field
from typing import Optional, Literal
from fastapi import UploadFile, File, Form
class EncryptionRequest(BaseModel):
    """
    Request object for encryption and decryption of files.
    """
    file: UploadFile = File(...),
    operation: str = Form(...),
    algorithm: str = Form(...),
    # Common fields
    password: Optional[str] = Form(None),
    mode: Optional[str] = Form(None),
    iv: Optional[str] = Form(None),
    # AES & Camellia use keySize
    key_size: Optional[int] = Form(None, alias="keySize"),
    # ChaCha20 uses nonce
    nonce: Optional[str] = Form(None),
    # RSA uses either publicKey or privateKey
    public_key: Optional[str] = Form(None, alias="publicKey"),
    private_key: Optional[str] = Form(None, alias="privateKey"),
    # 3DES-specific keys and options
    key_option: Optional[str] = Form(None, alias="keyOption"),
    key1: Optional[str] = Form(None),
    key2: Optional[str] = Form(None),
    key3: Optional[str] = Form(None),
    # Partial encryption flags
    partial_encryption: bool = Form(False, alias="partialEncryption"),
    selected_text_start: Optional[int] = Form(None, alias="selectedTextStart"),
    selected_text_end: Optional[int] = Form(None, alias="selectedTextEnd"),
class EncryptionResponse(BaseModel):
    """
    Response object for encryption and decryption of files.
    """
    processed_content: str = Field(..., description="Base64 encoded processed file content")
    filename: str = Field(..., description="Name of the processed file")
    mime_type: str = Field(..., description="MIME type of the processed file")

class ImageEncryptionRequest(BaseModel):
    """
    Request object for encryption and decryption of images.
    """
    image_content: str = Field(..., description="Base64 encoded image content")
    algorithm: Literal["AES-CTR", "ChaCha20", "RC4", "Logistic XOR"] = Field(..., description="Encryption algorithm to use")
    key: str = Field(..., description="Hex encoded encryption key")
    nonce: Optional[str] = Field(None, description="Hex encoded nonce (for AES-CTR and ChaCha20)")
    operation: Literal["encrypt", "decrypt"] = Field(..., description="Operation to perform")
    regions: list[dict] = Field(..., description="List of regions to process (x, y, width, height)")
    mode : Optional[str] = Field(None, description="Mode of operation for the encryption algorithm")
    iv : Optional[str] = Field(None, description="Initialization vector for the encryption algorithm")

class ImageEncryptionResponse(BaseModel):
    """
    Response object for encryption and decryption of images.
    """
    processed_image: str = Field(..., description="Base64 encoded processed image")
    filename: str = Field(..., description="Name of the processed image file")

class AutoDecryptImageRequest(BaseModel):
    """
    Request object for automatic decryption of images.
    """
    image_content: str = Field(..., description="Base64 encoded image content")
    algorithm: Literal["AES-CTR", "ChaCha20", "RC4", "Logistic XOR"] = Field(..., description="Encryption algorithm to use")
    key: str = Field(..., description="Hex encoded encryption key")
    nonce: Optional[str] = Field(None, description="Hex encoded nonce (for AES-CTR and ChaCha20)")
