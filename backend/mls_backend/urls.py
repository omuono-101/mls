import os
import mimetypes
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from mls_backend.custom_jwt import CustomTokenObtainPairView

# Ensure MIME types are properly detected for common file types
mimetypes.add_type('application/pdf', '.pdf')
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')
mimetypes.add_type('application/vnd.ms-powerpoint', '.ppt')
mimetypes.add_type('application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, serve media files using Django's static serve with proper MIME types
    # This handles PDF, Video, PPT and other media files correctly
    media_root = settings.MEDIA_ROOT
    
    # Serve media files with proper caching headers
    urlpatterns += [
        re_path(
            r'^media/(?P<path>.*)$',
            serve,
            {
                'document_root': media_root,
                'show_indexes': False
            }
        ),
    ]
