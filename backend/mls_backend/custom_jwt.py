import logging
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

# Default JWT serializer - no custom modifications
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
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
