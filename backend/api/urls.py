from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, SchoolViewSet, CourseViewSet, IntakeViewSet,
    SemesterViewSet, CourseGroupViewSet, UnitViewSet, LessonViewSet,
    ResourceViewSet, AssessmentViewSet, SubmissionViewSet,
    AttendanceViewSet, StudentEnrollmentViewSet, ModuleViewSet, LearningPathViewSet
)
from .question_views import (
    QuestionViewSet, QuestionOptionViewSet, AnswerViewSet, StudentAnswerViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'schools', SchoolViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'intakes', IntakeViewSet)
router.register(r'semesters', SemesterViewSet)
router.register(r'course-groups', CourseGroupViewSet)
router.register(r'units', UnitViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'resources', ResourceViewSet)
router.register(r'assessments', AssessmentViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'student-enrollments', StudentEnrollmentViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'learning-paths', LearningPathViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'question-options', QuestionOptionViewSet)
router.register(r'answers', AnswerViewSet)
router.register(r'student-answers', StudentAnswerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
