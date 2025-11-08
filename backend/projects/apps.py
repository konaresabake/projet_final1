from django.apps import AppConfig
import os

class ProjectsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'projects'

    def ready(self):
        # Créer automatiquement un superutilisateur si DEBUG = False (prod)
        from django.conf import settings
        if not settings.DEBUG:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "bissouma")
            email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "bissouma@gmail.com")
            password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "bissouma8")
            
            if not User.objects.filter(username=username).exists():
                User.objects.create_superuser(username=username, email=email, password=password)
