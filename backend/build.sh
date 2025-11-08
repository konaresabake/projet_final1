#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput --clear

# Create default admin user if it doesn't exist (optional)
# Note: This uses the Utilisateur model, not Django's User model
python manage.py shell <<EOF
from projects.models import Utilisateur;
if not Utilisateur.objects.filter(role='ADMINISTRATEUR').exists():
    print('Creating default admin user...');
    admin = Utilisateur.objects.create(
        nom='Admin',
        email='admin@yoonu-tabax.com',
        role='ADMINISTRATEUR',
        is_active=True,
        is_approved=True
    );
    admin.mot_de_passe = 'admin123';  # Will be hashed in save()
    admin.save();
    print('Default admin created: admin@yoonu-tabax.com / admin123');
else:
    print('Admin user already exists');
EOF

