import hmac
import hashlib
import base64
from datetime import datetime

# IMPORTANT: This secret MUST match the one in core/utils/licensing.py
LICENSE_SECRET = "MLS-PROTECT-2026-X9Y2-Z8W1"

def generate_code(expiry_date_str):
    """
    expiry_date_str: format 'YYYY-MM-DD'
    """
    try:
        # Validate date format
        datetime.strptime(expiry_date_str, "%Y-%m-%d")
        
        signature = hmac.new(
            LICENSE_SECRET.encode(),
            expiry_date_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        payload = f"{expiry_date_str}:{signature}"
        encoded = base64.b64encode(payload.encode()).decode()
        
        print("\n" + "="*50)
        print(f"REACTIVATION CODE FOR {expiry_date_str}")
        print("="*50)
        print(encoded)
        print("="*50)
        print("\nInstructions:")
        print("1. Send a POST request to /api/license/activate/")
        print("2. JSON Body: {\"license_key\": \"<COPY_CODE_ABOVE>\"}")
        print("="*50 + "\n")
        
    except ValueError:
        print("Error: Invalid date format. Please use YYYY-MM-DD.")

if __name__ == "__main__":
    print("MLS PROJECT REACTIVATION TOOL")
    date_input = input("Enter new expiry date (YYYY-MM-DD): ")
    generate_code(date_input)
