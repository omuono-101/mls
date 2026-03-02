"""Helper script to install requirements. Run via cPanel Python App Execute Script."""
import subprocess
import sys
import os

app_dir = os.path.dirname(os.path.abspath(__file__))
requirements_file = os.path.join(app_dir, 'requirements.txt')

print(f"Installing from: {requirements_file}")
result = subprocess.run(
    [sys.executable, '-m', 'pip', 'install', '-r', requirements_file],
    capture_output=True, text=True
)
print(result.stdout)
if result.returncode != 0:
    print("ERRORS:", result.stderr)
else:
    print("All packages installed successfully!")
