import sys
import os

# Add the project directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

# Set the Django settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'mls_backend.settings'

# Import the WSGI application
from mls_backend.wsgi import application
