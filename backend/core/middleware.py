from django.http import JsonResponse
from django.urls import resolve
from core.utils.licensing import check_project_status

class LicenseMiddleware:
    """
    Middleware to enforce project licensing.
    If the project is expired and not reactivated, blocks all API requests.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Allow access to the activation endpoint and admin
        path = request.path
        if path.startswith('/api/license/activate/') or path.startswith('/admin/'):
            return self.get_response(request)
            
        # 2. Check project status
        is_functional, error_msg = check_project_status()
        
        if not is_functional:
            return JsonResponse({
                'error': 'License Expired',
                'detail': error_msg,
                'status': 'locked'
            }, status=403)
            
        return self.get_response(request)
