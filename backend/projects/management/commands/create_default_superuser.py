from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
	help = "Create a default Django superuser from environment variables if it doesn't exist"

	def handle(self, *args, **options):
		User = get_user_model()
		username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
		email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
		password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

		try:
			user_qs = User.objects.filter(username=username)
			if user_qs.exists():
				self.stdout.write(self.style.WARNING(f"Superuser '{username}' already exists."))
				return

			User.objects.create_superuser(username=username, email=email, password=password)
			self.stdout.write(self.style.SUCCESS(
				f"Superuser created: username='{username}', email='{email}'"
			))
		except Exception as e:
			self.stderr.write(self.style.ERROR(f"Failed to create superuser: {str(e)}"))





