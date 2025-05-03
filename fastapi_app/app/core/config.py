from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SecureCrypt API"
    
    # Security Settings
    SYMMETRIC_KEY_LENGTH: int = 32
    SALT_LENGTH: int = 16
    AES_IV_LENGTH: int = 12
    AES_TAG_LENGTH: int = 16
    CAMELLIA_IV_LENGTH: int = 12
    CAMELLIA_TAG_LENGTH: int = 16
    CHACHA20_NONCE_LENGTH: int = 12
    
    # KDF Settings
    DEFAULT_PBKDF2_ITERATIONS: int = 150000
    DEFAULT_SCRYPT_N: int = 2**14
    DEFAULT_SCRYPT_R: int = 8
    DEFAULT_SCRYPT_P: int = 1
    
    # RSA Settings
    RSA_KEY_SIZE: int = 2048
    RSA_PUBLIC_EXPONENT: int = 65537
    
    class Config:
        case_sensitive = True

settings = Settings() 