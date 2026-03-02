from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomAuthBackend(ModelBackend):
    """
    Custom authentication backend that allows login 
    regardless of is_activated status.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Run the default password hasher once to reduce timing attacks
            User().set_password(password)
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
    
    def user_can_authenticate(self, user):
        """
        Allow all active users to authenticate.
        Override to remove is_activated check.
        """
        is_active = getattr(user, 'is_active', None)
        is_archived = getattr(user, 'is_archived', False)
        
        # Only block archived users
        if is_active is False:
            return False
        if is_archived:
            return False
        
        return True
