import hashlib
import base64

# Function to encode the string
def encode_string(string_i_want_encode: str, encryption_password: str) -> str:
    # Generate a key from the password using SHA-256
    key = hashlib.sha256(encryption_password.encode()).digest()
    # Combine the original string and key, then encode it using base64
    combined = f"{string_i_want_encode}{key.hex()}"
    encoded = base64.b64encode(combined.encode()).decode()
    return encoded

# Function to decode the string
def decode_string(string_i_want_to_decode: str, decryption_password: str) -> str:
    # Generate a key from the password using SHA-256
    key = hashlib.sha256(decryption_password.encode()).digest()
    # Decode the base64 encoded string
    decoded = base64.b64decode(string_i_want_to_decode.encode()).decode()
    # Remove the key from the end of the string to get the original
    original_string = decoded.replace(key.hex(), "")
    return original_string

if __name__ == "__main__":
    # Example usage
    password = "my_password"
    string_to_encode = "Hello, World!"

    # Encode the string
    encoded_string = encode_string(string_to_encode, password)
    print(f"Encoded string: {encoded_string}")

    # Decode the string
    decoded_string = decode_string(encoded_string, password)
    print(f"Decoded string: {decoded_string}")
