from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

# Custom JWT serializer to include user info in token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims - handle potential missing attributes gracefully
        token['user_id'] = user.id
        token['role'] = getattr(user, 'role', 'Student') or 'Student'
        token['username'] = getattr(user, 'username', '') or ''
        token['email'] = getattr(user, 'email', '') or ''
        return token
    
    def validate(self, attrs):
        # Add extra validation if needed
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            return attrs
        
        # Try to get the user for additional validation
        try:
            user = User.objects.get(username=username)
            # Store the user role for token generation
            self.user = user
        except User.DoesNotExist:
            pass
        
        return attrs
