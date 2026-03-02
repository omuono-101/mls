from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import School, Course, Intake, Semester, CourseGroup, Unit, Module, Lesson, Assessment
from datetime import date, timedelta
from django.utils import timezone

User = get_user_model()

class TrainerAuthoringTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create Admin
        self.admin = User.objects.create_superuser('admin', 'admin@test.com', 'password')
        
        # Create Trainer
        self.trainer = User.objects.create_user('trainer', 'trainer@test.com', 'password', role='Trainer')
        self.other_trainer = User.objects.create_user('other', 'other@test.com', 'password', role='Trainer')
        
        # Setup Course Structure
        self.school = School.objects.create(name="Test School")
        self.course = Course.objects.create(name="Test Course", school=self.school)
        self.intake = Intake.objects.create(
            course=self.course, name="Test Intake", start_date=date.today(), end_date=date.today() + timedelta(days=90)
        )
        self.semester = Semester.objects.create(
            intake=self.intake, name="Sem 1", start_date=date.today(), end_date=date.today() + timedelta(days=30)
        )
        self.course_group = CourseGroup.objects.create(
            course=self.course, intake=self.intake, semester=self.semester, course_code="TC101"
        )
        
        # Create Unit assigned to Trainer
        self.unit = Unit.objects.create(
            course_group=self.course_group,
            trainer=self.trainer,
            name="Test Unit",
            code="TU101",
            semester_number=1,
            total_lessons=10
        )
        
        # Create Unit NOT assigned to Trainer
        self.other_unit = Unit.objects.create(
            course_group=self.course_group,
            trainer=self.other_trainer,
            name="Other Unit",
            code="OU101",
            semester_number=1,
            total_lessons=10
        )

    def test_create_module(self):
        self.client.force_authenticate(user=self.trainer)
        data = {
            'title': 'Module 1',
            'description': 'Intro',
            'unit': self.unit.id,
            'order': 1
        }
        response = self.client.post('/api/modules/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Module.objects.count(), 1)
        self.assertEqual(Module.objects.get().title, 'Module 1')

    def test_create_lesson_in_module(self):
        self.client.force_authenticate(user=self.trainer)
        # First create module
        module = Module.objects.create(unit=self.unit, title="Mod 1", order=1)
        
        data = {
            'title': 'Lesson 1',
            'unit': self.unit.id,
            'module': module.id,
            'order': 1,
            'is_lab': False,
            'has_cat':False,
            'has_assessment': True
        }
        response = self.client.post('/api/lessons/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lesson.objects.count(), 1)
        self.assertEqual(Lesson.objects.get().module, module)

    def test_view_modules_filtered_by_unit(self):
        self.client.force_authenticate(user=self.trainer)
        Module.objects.create(unit=self.unit, title="My Module", order=1)
        Module.objects.create(unit=self.other_unit, title="Not My Module", order=1)
        
        response = self.client.get(f'/api/modules/?unit={self.unit.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'My Module')

    def test_create_learning_path(self):
        self.client.force_authenticate(user=self.trainer)
        data = {
            'title': 'My Path',
            'description': 'A custom path',
        }
        response = self.client.post('/api/learning-paths/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['trainer'], self.trainer.id)
