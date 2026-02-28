from django.http import JsonResponse
from django.urls import resolve

class LicenseMiddleware:
    """
    Middleware to enforce project licensing.
    If the project is expired and not reactivated, blocks all API requests.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Allow all OPTIONS requests to pass (crucial for CORS preflight)
        if request.method == 'OPTIONS':
            return self.get_response(request)

        # 2. Allow access to activation, admin, and token endpoints
        path = request.path
        exempt_paths = [
            '/api/license/activate/',
            '/admin/',
            '/api/token/',
            '/api/token/refresh/',
        ]
        
        if any(path.startswith(p) for p in exempt_paths):
            return self.get_response(request)
            
        # 3. Check project status (lazy import to avoid circular dependency)
        from core.utils.licensing import check_project_status
        is_functional, error_msg = check_project_status()
        
        if not is_functional:
            return JsonResponse({
                'error': 'License Expired',
                'detail': error_msg,
                'status': 'locked'
            }, status=403)
            
        return self.get_response(request)
