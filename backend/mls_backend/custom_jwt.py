from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Custom JWT serializer to include user info in token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['user_id'] = user.id
        token['role'] = user.role
        token['username'] = user.username
        token['email'] = user.email
        return token
