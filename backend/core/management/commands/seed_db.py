from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import School, Course, Intake

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with test data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create Users
        users = [
            ('admin', 'admin123', User.ADMIN),
            ('coursemaster', 'cm123', User.COURSE_MASTER),
            ('hod', 'hod123', User.HOD),
            ('trainer', 'trainer123', User.TRAINER),
            ('student', 'student123', User.STUDENT),
        ]

        for username, password, role in users:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    role=role,
                    is_activated=True
                )
                self.stdout.write(f'Created user: {username} ({role})')
            else:
                self.stdout.write(f'User {username} already exists')

        # Create initial data
        school, _ = School.objects.get_or_create(name='School of Computing', description='Department of Computer Science and IT')
        course, _ = Course.objects.get_or_create(name='Bachelor of Computer Science', school=school, duration='4 Years')
        intake, _ = Intake.objects.get_or_create(name='JAN-2026', description='January 2026 Intake', intake_type='Full-time')

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
