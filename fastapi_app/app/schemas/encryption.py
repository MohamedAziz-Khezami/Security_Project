from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Union
from fastapi import UploadFile, File, Form

class EncryptionRequest(BaseModel):
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
    processed_content: str = Field(..., description="Base64 encoded processed file content")
    filename: str = Field(..., description="Name of the processed file")
    mime_type: str = Field(..., description="MIME type of the processed file")

class ImageEncryptionRequest(BaseModel):
    image_content: str = Field(..., description="Base64 encoded image content")
    algorithm: Literal["AES-CTR", "ChaCha20", "RC4", "Logistic XOR"] = Field(..., description="Encryption algorithm to use")
    key: str = Field(..., description="Hex encoded encryption key")
    nonce: Optional[str] = Field(None, description="Hex encoded nonce (for AES-CTR and ChaCha20)")
    operation: Literal["encrypt", "decrypt"] = Field(..., description="Operation to perform")
    regions: list[dict] = Field(..., description="List of regions to process (x, y, width, height)")

class ImageEncryptionResponse(BaseModel):
    processed_image: str = Field(..., description="Base64 encoded processed image")
    filename: str = Field(..., description="Name of the processed image file")

class AutoDecryptImageRequest(BaseModel):
    image_content: str = Field(..., description="Base64 encoded image content")
    algorithm: Literal["AES-CTR", "ChaCha20", "RC4", "Logistic XOR"] = Field(..., description="Encryption algorithm to use")
    key: str = Field(..., description="Hex encoded encryption key")
    nonce: Optional[str] = Field(None, description="Hex encoded nonce (for AES-CTR and ChaCha20)")

class ImageRegion(BaseModel):
    x: int
    y: int
    width: int
    height: int

class PartialEncryptionParams(BaseModel):
    startByte: Optional[int] = None
    endByte: Optional[int] = None
    imageRegions: Optional[List[ImageRegion]] = None

class ProcessFileRequest(BaseModel):
    content: Optional[str] = None
    file: Optional[UploadFile] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    action: Literal["encrypt", "decrypt", "hash"]
    algorithm: str
    key: Optional[str] = None
    private_key: Optional[str] = None
    apply_to: Literal["full", "partial"] = "full"
    partial_params: Optional[PartialEncryptionParams] = None
    is_text: Optional[bool] = False

class ProcessFileResponse(BaseModel):
    success: bool
    message: str
    hash: Optional[str] = None
    processedContent: Optional[str] = None
    fileName: Optional[str] = None 