import logging
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims so the frontend can route to the correct dashboard
        token['role'] = user.role
        token['username'] = user.username
        token['email'] = user.email or ''
        token['first_name'] = user.first_name or ''
        token['last_name'] = user.last_name or ''
        token['phone_number'] = getattr(user, 'phone_number', '') or ''
        token['is_activated'] = user.is_activated
        token['admission_no'] = getattr(user, 'admission_no', '') or ''

        return token

    def validate(self, attrs):
        logger.info(f"Token validation attrs: {attrs}")
        try:
            return super().validate(attrs)
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            raise


# Custom view that uses the serializer
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

