import logging
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        try:
            token = super().get_token(user)

            # Add custom claims so the frontend can route to the correct dashboard
            # Use getattr with defaults to prevent crashes if fields are missing
            token['role'] = getattr(user, 'role', 'Student')
            token['username'] = getattr(user, 'username', '')
            token['email'] = getattr(user, 'email', '') or ''
            token['first_name'] = getattr(user, 'first_name', '') or ''
            token['last_name'] = getattr(user, 'last_name', '') or ''
            token['phone_number'] = getattr(user, 'phone_number', '') or ''
            token['is_activated'] = getattr(user, 'is_activated', True)
            token['admission_no'] = getattr(user, 'admission_no', '') or ''

            return token
        except Exception as e:
            logger.error(f"Error generating token for user {user.username}: {str(e)}")
            # Even if custom claims fail, try to return a basic token to avoid 500
            return super().get_token(user)

    def validate(self, attrs):
        import time
        start_time = time.time()
        logger.info(f"Starting token validation for user: {attrs.get('username')}")
        try:
            data = super().validate(attrs)
            duration = time.time() - start_time
            logger.info(f"Token validation completed successfully in {duration:.2f}s")
            return data
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Token validation failed after {duration:.2f}s: {e}")
            raise


# Custom view that uses the serializer
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

