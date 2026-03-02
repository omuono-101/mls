#!/bin/bash
source /home/mvwlkagz/virtualenv/mls_portal/3.11/bin/activate
cd /home/mvwlkagz/mls_portal

echo "=== Step 1: Installing dependencies ==="
pip install -r requirements.txt

echo "=== Step 2: Running migrations ==="
python manage.py migrate

echo "=== Step 3: Collecting static files ==="
python manage.py collectstatic --noinput

echo "=== Step 4: Restarting application ==="
mkdir -p tmp && touch tmp/restart.txt

echo "=== Deployment complete ==="
