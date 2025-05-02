# File Encryption/Decryption App

A Streamlit application that allows users to encrypt and decrypt files using various encryption algorithms. The app supports both full file encryption and selective encryption of specific parts of files or images.

## Features

- Multiple encryption algorithms support (AES, Fernet)
- File encryption and decryption
- Selective encryption of file/image regions
- Image preview and region selection
- Secure key management

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Streamlit app:
```bash
streamlit run app.py
```

## Usage

1. Upload a file or image
2. Choose encryption algorithm
3. For selective encryption:
   - Use the region selector to choose the area to encrypt
   - The rest of the file/image remains visible
4. Enter encryption key
5. Download the encrypted/decrypted file

## Security Note

Always keep your encryption keys safe. The app does not store any keys or encrypted data. 