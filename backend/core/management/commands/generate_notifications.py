from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Assessment, StudentEnrollment, Notification
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate notifications for upcoming CATs and course deadlines'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-before',
            type=int,
            default=3,
            help='Number of days before deadline to send notification'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what notifications would be created without creating them'
        )

    def handle(self, *args, **options):
        days_before = options['days_before']
        dry_run = options['dry_run']
        
        notifications_created = 0
        
        # Get all approved CATs that are not yet expired
        now = timezone.now()
        cat_deadline = now + timedelta(days=days_before)
        
        # Find CATs due within the specified days
        upcoming_cats = Assessment.objects.filter(
            assessment_type='CAT',
            is_approved=True,
            due_date__gte=now.date(),
            due_date__lte=cat_deadline.date()
        ).select_related('unit', 'unit__course_group')
        
        self.stdout.write(f'\n=== Processing Upcoming CATs (within {days_before} days) ===')
        
        for cat in upcoming_cats:
            # Find enrolled students for this CAT's unit
            enrollments = StudentEnrollment.objects.filter(
                course_group=cat.unit.course_group,
                is_active=True
            ).select_related('student')
            
            for enrollment in enrollments:
                student = enrollment.student
                
                # Check if notification already exists for this CAT and student
                days_until_due = (cat.due_date - now.date()).days
                
                # Create notification title and message
                title = f"CAT Coming Up: {cat.unit.code}"
                message = f"Your {cat.unit.name} CAT ({cat.title}) is due in {days_until_due} day(s) - {cat.due_date.strftime('%B %d, %Y')}"
                
                # Check if we already sent a notification for this CAT
                existing_notification = Notification.objects.filter(
                    user=student,
                    title__contains=cat.title,
                    notification_type='assessment',
                    created_at__date=now.date()
                ).exists()
                
                if existing_notification:
                    self.stdout.write(f'  Skipping {student.username} - notification already sent for {cat.title}')
                    continue
                
                if dry_run:
                    self.stdout.write(f'  [DRY RUN] Would create: {title} for {student.username}')
                    continue
                
                Notification.objects.create(
                    user=student,
                    title=title,
                    message=message,
                    notification_type='assessment',
                    is_critical=False,
                    link=f'/assessments/{cat.id}',
                    sender_role='System'
                )
                notifications_created += 1
                self.stdout.write(f'  Created notification for {student.username}: {cat.title}')
        
        # Generate notifications for course enrollment deadlines (if Intake has end_date)
        self.stdout.write(f'\n=== Processing Course Enrollment Deadlines ===')
        
        from core.models import Intake
        
        upcoming_intakes = Intake.objects.filter(
            end_date__gte=now.date(),
            end_date__lte=cat_deadline.date()
        )
        
        for intake in upcoming_intakes:
            days_until_enrollment_close = (intake.end_date - now.date()).days
            
            if days_until_enrollment_close <= 0:
                continue
                
            title = f"Enrollment Closing Soon: {intake.name}"
            message = f"Enrollment for {intake.name} closes in {days_until_enrollment_close} day(s) - {intake.end_date.strftime('%B %d, %Y')}"
            
            # Get all students who are not enrolled in this intake
            potential_students = User.objects.filter(role='Student', is_activated=True)
            
            for student in potential_students:
                # Check if already enrolled
                already_enrolled = StudentEnrollment.objects.filter(
                    student=student,
                    course_group__intake=intake,
                    is_active=True
                ).exists()
                
                if already_enrolled:
                    continue
                
                # Check if notification already exists
                existing_notification = Notification.objects.filter(
                    user=student,
                    title=title,
                    created_at__date=now.date()
                ).exists()
                
                if existing_notification:
                    continue
                
                if dry_run:
                    self.stdout.write(f'  [DRY RUN] Would create: {title} for {student.username}')
                    continue
                
                Notification.objects.create(
                    user=student,
                    title=title,
                    message=message,
                    notification_type='enrollment',
                    is_critical=False,
                    link=f'/intakes/{intake.id}',
                    sender_role='System'
                )
                notifications_created += 1
                self.stdout.write(f'  Created enrollment deadline notification for {student.username}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f'\n[DRY RUN] Would have created {notifications_created} notifications'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {notifications_created} notifications'))
        
        return f'{notifications_created} notifications created'
