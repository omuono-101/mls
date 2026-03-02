import hmac
import hashlib
import base64
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone

# Secret key specifically for licensing - should be kept private by the developer
LICENSE_SECRET = "MLS-PROTECT-2026-X9Y2-Z8W1"

def generate_signed_license(expiry_date_str):
    """
    Generates a signed license key for a given expiry date (YYYY-MM-DD).
    This is what the developer (you) would use to create activation codes.
    """
    signature = hmac.new(
        LICENSE_SECRET.encode(),
        expiry_date_str.encode(),
        hashlib.sha256
    ).hexdigest()
    
    payload = f"{expiry_date_str}:{signature}"
    return base64.b64encode(payload.encode()).decode()

def verify_license_key(key):
    """
    Verifies if a license key is valid and not expired.
    Returns (is_valid, expiry_date, error_message)
    """
    try:
        decoded = base64.b64decode(key.encode()).decode()
        if ":" not in decoded:
            return False, None, "Invalid key format"
            
        expiry_date_str, provided_signature = decoded.split(":")
        
        # Verify signature
        expected_signature = hmac.new(
            LICENSE_SECRET.encode(),
            expiry_date_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(provided_signature, expected_signature):
            return False, None, "Tamper detected"
            
        # Verify expiry
        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
        if expiry_date < timezone.now().date():
            return False, expiry_date, f"License expired on {expiry_date}"
            
        return True, expiry_date, None
        
    except Exception as e:
        return False, None, str(e)

def check_project_status():
    """
    Checks if the project should still be functional.
    Enforces a default 3-month limit from the initial build if no license is active.
    """
    from core.models import ProjectLicense
    
    # 1. Check for an active license in the DB
    active_license = ProjectLicense.objects.filter(is_active=True).last()
    if active_license:
        is_valid, expiry, error = verify_license_key(active_license.license_key)
        if is_valid:
            return True, None
        return False, f"License Error: {error}"
    
    # 2. No license found - enforce the initial 3-month grace period
    # Hardcoded build date: 2026-02-28
    BUILD_DATE = datetime(2026, 2, 28).date()
    GRACE_PERIOD_MONTHS = 3
    EXPIRY_DATE = BUILD_DATE + timedelta(days=90) # approx 3 months
    
    if timezone.now().date() > EXPIRY_DATE:
        return False, f"Initial 3-month trial period ended on {EXPIRY_DATE}. Please reactivate the system."
        
    return True, None
