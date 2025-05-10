import streamlit as st
from PIL import Image, UnidentifiedImageError
import numpy as np
import os
import binascii
import io

# Crypto imports
from Crypto.Cipher import AES, ChaCha20, ARC4
from Crypto.Util import Counter

# Canvas import
from streamlit_drawable_canvas import st_canvas

# -----------------------------------------------------------------------------
# Streamlit App: Multi-Page Layout with Enhanced UI and Canvas-based Multi-ROI Encryption
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Multicrypto Tool",
    page_icon="🔒",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Sidebar: Navigation & Settings
st.sidebar.title("🔑 Crypto Toolbox")
nav = st.sidebar.radio("Navigate to", ["Image ROI Encryption", "PDF Page Encryption", "File Segment Encryption"])
st.sidebar.markdown("---")

with st.sidebar.expander("Algorithm & Mode", expanded=True):
    alg = st.selectbox("Algorithm", ["AES-CTR", "ChaCha20", "RC4", "Logistic XOR"], key="alg_select")
    mode = st.radio("Mode", ["Encrypt", "Decrypt"], index=0, key="mode_radio")

with st.sidebar.expander("Key / Nonce / Seed (hex)", expanded=False):
    if alg == "AES-CTR":
        k_hex = st.text_area("AES Key (hex)", st.session_state.get('aes_key', os.urandom(32)).hex(), height=68)
        n_hex = st.text_area("AES Nonce (hex)", st.session_state.get('aes_nonce', os.urandom(8)).hex(), height=68)
    elif alg == "ChaCha20":
        k_hex = st.text_area("ChaCha20 Key (hex)", st.session_state.get('cha_key', os.urandom(32)).hex(), height=68)
        n_hex = st.text_area("ChaCha20 Nonce (hex)", st.session_state.get('cha_nonce', os.urandom(12)).hex(), height=68)
    elif alg == "RC4":
        k_hex = st.text_area("RC4 Key (hex)", st.session_state.get('rc4_key', os.urandom(16)).hex(), height=68)
    else:
        k_hex = st.text_area("Logistic Seed (hex)", st.session_state.get('logistic_key', os.urandom(16)).hex(), height=68)
    if st.button("🔄 Regenerate Key/Nonce"): st.experimental_rerun()

# Layout: Main Area
st.header(f"🔐 {nav}")

if nav == "Image ROI Encryption":
    col1, col2 = st.columns([2, 1])
    with col1:
        uploaded = st.file_uploader("Upload Image", type=["png", "jpg", "jpeg"], help="Select an image to process.")
        if uploaded:
            try:
                img = Image.open(uploaded).convert('RGB')
             
            except UnidentifiedImageError:
                st.error("⚠️ Invalid image file.")
                st.stop()
            # Canvas for ROI selection
            canvas_result = st_canvas(
                fill_color="rgba(255, 165, 0, 0.3)",  # translucent orange fill
                stroke_width=2,
                stroke_color="#ff0000",
                background_image=img,
                drawing_mode="rect",
                key="canvas",
                update_streamlit=True,
                height=img.height,
                width=img.width
            )
    with col2:
        st.markdown("**Action**")
        action = st.button(f"▶️ {mode}")

    if uploaded and action:
        objs = canvas_result.json_data.get("objects", []) if canvas_result.json_data else []
        if not objs:
            st.warning("Please draw one or more rectangles on the image to select ROIs.")
            st.stop()

        orig = np.array(img)
        out = orig.copy()
        key = binascii.unhexlify(k_hex)
        nonce = binascii.unhexlify(n_hex) if 'n_hex' in locals() else None

        for obj in objs:
            x = int(obj["left"])
            y = int(obj["top"])
            bw = int(obj["width"] * obj.get("scaleX", 1))
            bh = int(obj["height"] * obj.get("scaleY", 1))

            h, w, _ = orig.shape
            x = max(0, min(x, w - 1)); y = max(0, min(y, h - 1))
            bw = max(1, min(bw, w - x)); bh = max(1, min(bh, h - y))
            segment = orig[y:y+bh, x:x+bw].tobytes()

            # Initialize cipher per ROI
            if alg == "AES-CTR":
                ctr = Counter.new(64, prefix=nonce, initial_value=0)
                cipher = AES.new(key, AES.MODE_CTR, counter=ctr)
                proc = cipher.encrypt(segment) if mode == "Encrypt" else cipher.decrypt(segment)
            elif alg == "ChaCha20":
                cipher = ChaCha20.new(key=key, nonce=nonce)
                proc = cipher.encrypt(segment) if mode == "Encrypt" else cipher.decrypt(segment)
            elif alg == "RC4":
                cipher = ARC4.new(key)
                proc = cipher.encrypt(segment)
            else:
                seed_int = int.from_bytes(key, 'big')
                x0 = seed_int / (2**128 - 1)
                mu = 3.99
                ks = bytearray(len(segment))
                for i in range(len(segment)):
                    x0 = mu * x0 * (1 - x0)
                    ks[i] = int((x0 % 1) * 256)
                proc = bytes(b ^ k for b, k in zip(segment, ks))

            # Patch each ROI
            patch = np.frombuffer(proc[:bw*bh*3], dtype=np.uint8).reshape((bh, bw, 3))
            out[y:y+bh, x:x+bw] = patch

        # Display combined result
        st.image(out, caption="Processed Image", use_column_width=True)
        buf = io.BytesIO()
        Image.fromarray(out).save(buf, format='PNG'); buf.seek(0)
        st.download_button("⬇️ Download", buf, file_name="processed.png", mime="image/png")

# Placeholders for other pages
else:
    st.info(f"{nav} is under construction. Stay tuned! 😊")
