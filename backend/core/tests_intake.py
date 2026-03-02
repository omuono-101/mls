from django.test import TestCase
from django.core.exceptions import ValidationError
from core.models import Intake, Course, School
from datetime import date, timedelta

class IntakeModelTest(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Test School")
        self.course = Course.objects.create(name="Test Course", school=self.school)

    def test_create_valid_intake(self):
        """Test creating an intake with valid dates (end_date > start_date)"""
        start_date = date.today()
        end_date = start_date + timedelta(days=90)
        intake = Intake.objects.create(
            course=self.course,
            name="Valid Intake",
            start_date=start_date,
            end_date=end_date
        )
        self.assertEqual(intake.name, "Valid Intake")

    def test_create_invalid_intake_end_before_start(self):
        """Test creating an intake with end_date < start_date raises ValidationError"""
        start_date = date.today()
        end_date = start_date - timedelta(days=1)
        
        with self.assertRaises(ValidationError):
            intake = Intake(
                course=self.course,
                name="Invalid Intake",
                start_date=start_date,
                end_date=end_date
            )
            intake.save() # clean() is called in save()

    def test_create_invalid_intake_end_equals_start(self):
        """Test creating an intake with end_date == start_date raises ValidationError"""
        start_date = date.today()
        end_date = start_date
        
        with self.assertRaises(ValidationError):
            intake = Intake(
                course=self.course,
                name="Equal Dates Intake",
                start_date=start_date,
                end_date=end_date
            )
            intake.save()
