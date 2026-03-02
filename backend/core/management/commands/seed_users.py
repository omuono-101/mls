from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates initial users for different roles'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        users_to_create = [
            ('admin', 'admin123', User.ADMIN),
            ('coursemaster', 'cm123', User.COURSE_MASTER),
            ('hod', 'hod123', User.HOD),
            ('trainer', 'trainer123', User.TRAINER),
            ('student', 'student123', User.STUDENT),
        ]

        for username, password, role in users_to_create:
            if not User.objects.filter(username=username).exists():
                # Note: is_activated logic is handled in models.py save() for superusers,
                # but we'll set it here for all these seeded users.
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    role=role
                )
                user.is_activated = True
                
                if role == User.ADMIN:
                    user.is_staff = True
                    user.is_superuser = True
                
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {username}'))
