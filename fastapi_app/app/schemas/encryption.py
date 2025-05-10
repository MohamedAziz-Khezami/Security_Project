from pydantic import BaseModel, Field
from typing import Optional, Literal

class EncryptionRequest(BaseModel):
    file_content: str = Field(..., description="Base64 encoded file content")
    password: str = Field(..., description="Password for encryption/decryption")
    algorithm: Literal["AES-GCM", "ChaCha20Poly1305", "Camellia-GCM", "RSA"] = Field(..., description="Encryption algorithm to use")
    kdf_type: Optional[Literal["PBKDF2", "Scrypt"]] = Field(None, description="Key derivation function type")
    kdf_params: Optional[dict] = Field(None, description="KDF parameters")
    operation: Literal["encrypt", "decrypt"] = Field(..., description="Operation to perform")
    partial: Optional[bool] = Field(False, description="Whether to perform partial encryption/decryption")
    partial_text: Optional[str] = Field(None, description="Text to encrypt/decrypt in partial mode")
    partial_scope: Optional[Literal["First Occurrence", "All Occurrences"]] = Field(None, description="Scope for partial encryption")

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