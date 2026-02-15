from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import School, Course, Intake, Semester, CourseGroup, Unit, Lesson, StudentLessonProgress, StudentEnrollment

User = get_user_model()

class StudentProgressTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.student = User.objects.create_user(username='student', password='password', role='Student', is_activated=True)
        self.trainer = User.objects.create_user(username='trainer', password='password', role='Trainer', is_activated=True)
        
        # Create School
        self.school = School.objects.create(name='Test School')

        # Setup course structure
        self.course = Course.objects.create(name='Test Course', code='TC', school=self.school, duration='1 year')
        self.intake = Intake.objects.create(name='Intake 1', course=self.course)
        self.semester = Semester.objects.create(name='Sem 1', start_date='2024-01-01', end_date='2024-06-01')
        self.course_group = CourseGroup.objects.create(course=self.course, intake=self.intake, semester=self.semester, course_code='TC-01')
        
        # Create Unit
        self.unit = Unit.objects.create(
            name='Test Unit', 
            code='TU-101', 
            course_group=self.course_group,
            semester_number=1,
            total_lessons=10
        )
        
        # Create Lessons
        self.lesson1 = Lesson.objects.create(unit=self.unit, title='Lesson 1', order=1, is_taught=True)
        self.lesson2 = Lesson.objects.create(unit=self.unit, title='Lesson 2', order=2, is_taught=True)
        
        # Enroll student
        StudentEnrollment.objects.create(student=self.student, course_group=self.course_group)
        
        self.client.force_authenticate(user=self.student)

    def test_mark_lesson_complete(self):
        url = f'/api/lessons/{self.lesson1.id}/complete/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check DB
        progress = StudentLessonProgress.objects.get(student=self.student, lesson=self.lesson1)
        self.assertTrue(progress.is_completed)

    def test_mark_lesson_incomplete(self):
        # Mark complete first
        StudentLessonProgress.objects.create(student=self.student, lesson=self.lesson1, is_completed=True)
        
        url = f'/api/lessons/{self.lesson1.id}/incomplete/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        progress = StudentLessonProgress.objects.get(student=self.student, lesson=self.lesson1)
        self.assertFalse(progress.is_completed)

    def test_unit_progress_calculation(self):
        # Complete one lesson out of 10 total (from unit definition)
        StudentLessonProgress.objects.create(student=self.student, lesson=self.lesson1, is_completed=True)
        
        url = f'/api/units/{self.unit.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 1 completed / 10 total = 10%
        self.assertEqual(response.data['student_progress'], 10)
        self.assertEqual(response.data['lessons_completed'], 1)

    def test_lesson_list_serializer_is_completed(self):
        StudentLessonProgress.objects.create(student=self.student, lesson=self.lesson1, is_completed=True)
        
        url = f'/api/lessons/?unit={self.unit.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        lesson1_data = next(l for l in response.data if l['id'] == self.lesson1.id)
        lesson2_data = next(l for l in response.data if l['id'] == self.lesson2.id)
        
        self.assertTrue(lesson1_data['is_completed'])
        self.assertFalse(lesson2_data['is_completed'])
