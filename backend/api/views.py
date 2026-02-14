from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from core.models import (School, Course, Intake, Semester, CourseGroup, Unit, Lesson, Resource, 
                          Assessment, Submission, Attendance, StudentEnrollment, Module, LearningPath,
                          Question, QuestionOption, Answer, StudentAnswer)
from .serializers import (
    UserSerializer, SchoolSerializer, CourseSerializer, IntakeSerializer, 
    SemesterSerializer, CourseGroupSerializer, UnitSerializer, LessonSerializer, 
    ResourceSerializer, AssessmentSerializer, SubmissionSerializer,
    AttendanceSerializer, StudentEnrollmentSerializer, ModuleSerializer, LearningPathSerializer,
    QuestionSerializer, QuestionOptionSerializer, AnswerSerializer, StudentAnswerSerializer
)
from .permissions import IsAdmin, IsCourseMaster, IsHOD, IsTrainer, IsStudent, IsStaff

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_permissions(self):
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        if self.request.method in permissions.SAFE_METHODS:
            return [IsStaff()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_activated = True
        user.save()
        return Response({'status': 'user activated'})

    @action(detail=True, methods=['patch'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_activated = False
        user.save()
        return Response({'status': 'user deactivated'})

    @action(detail=True, methods=['patch'])
    def archive(self, request, pk=None):
        user = self.get_object()
        user.is_archived = True
        user.is_activated = False  # Archived users are also deactivated
        user.save()
        return Response({'status': 'user archived'})

    @action(detail=True, methods=['patch'])
    def unarchive(self, request, pk=None):
        user = self.get_object()
        user.is_archived = False
        user.save()
        return Response({'status': 'user unarchived'})

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsCourseMaster()]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsCourseMaster()]

class IntakeViewSet(viewsets.ModelViewSet):
    queryset = Intake.objects.all()
    serializer_class = IntakeSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsCourseMaster()]

class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsCourseMaster()]

class CourseGroupViewSet(viewsets.ModelViewSet):
    queryset = CourseGroup.objects.all()
    serializer_class = CourseGroupSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsHOD()]

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsHOD()]

    @action(detail=True, methods=['post'])
    def generate_cats(self, request, pk=None):
        unit = self.get_object()
        cat_frequency = unit.cat_frequency
        total_lessons = unit.total_lessons
        
        # Delete existing CATs to regenerate? Or just add new ones?
        # Let's assume we regenerate for simplicity, or just check if they exist.
        assessments_created = 0
        from django.utils import timezone
        import datetime

        for i in range(cat_frequency, total_lessons + 1, cat_frequency):
            # Check if an assessment already exists for this "lesson number"
            # Assessment model doesn't have a direct link to a "lesson number" yet, 
            # but it has a link to a Lesson object.
            # We first need to make sure lessons exist.
            
            # For now, let's just create generic CATs if they don't exist
            # Or perhaps we should link them to the specific lesson object later.
            Assessment.objects.create(
                unit=unit,
                assessment_type='CAT',
                points=20, # Default points
                due_date=timezone.now() + datetime.timedelta(days=7 * (i // cat_frequency))
            )
            assessments_created += 1
            
        return Response({'status': f'{assessments_created} CATs generated for unit {unit.name}'})

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    def get_queryset(self):
        queryset = Module.objects.all()
        unit_id = self.request.query_params.get('unit', None)
        if unit_id is not None:
            queryset = queryset.filter(unit_id=unit_id)
        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class LearningPathViewSet(viewsets.ModelViewSet):
    queryset = LearningPath.objects.all()
    serializer_class = LearningPathSerializer

    def perform_create(self, serializer):
        serializer.save(trainer=self.request.user)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    
    def get_queryset(self):
        queryset = Lesson.objects.all()
        unit_id = self.request.query_params.get('unit', None)
        module_id = self.request.query_params.get('module', None)
        if unit_id is not None:
            queryset = queryset.filter(unit_id=unit_id)
        if module_id is not None:
            queryset = queryset.filter(module_id=module_id)
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        # Allow HODs to approve (PATCH/PUT) but maybe not create? 
        # Actually, HODs should definitely be able to edit lessons for verification.
        return [(IsTrainer | IsHOD)()]
    
    def perform_create(self, serializer):
        # Validate lesson count against unit's total_lessons limit
        unit_id = self.request.data.get('unit')
        if unit_id:
            from core.models import Unit
            try:
                unit = Unit.objects.get(id=unit_id)
                current_lesson_count = Lesson.objects.filter(unit=unit).count()
                
                # Check if lesson limit reached
                if current_lesson_count >= unit.total_lessons:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({
                        'detail': f'Lesson limit reached. This unit allows maximum {unit.total_lessons} lessons.'
                    })
                
                # Check if required CATs exist before allowing new lessons
                # CATs should be created at intervals of cat_frequency
                cat_frequency = unit.cat_frequency
                if cat_frequency and cat_frequency > 0:
                    # Calculate how many CATs should exist based on current lesson count
                    required_cats = current_lesson_count // cat_frequency
                    
                    # Count existing CATs for this unit
                    existing_cats = Assessment.objects.filter(
                        unit=unit,
                        assessment_type='CAT'
                    ).count()
                    
                    if existing_cats < required_cats:
                        from rest_framework.exceptions import ValidationError
                        raise ValidationError({
                            'detail': f'Cannot create lesson. Required CAT missing. Please create CAT {existing_cats + 1} first (due at lesson {(existing_cats + 1) * cat_frequency}).'
                        })
                        
            except Unit.DoesNotExist:
                pass
        
        serializer.save()

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    
    def get_queryset(self):
        queryset = Assessment.objects.all()
        unit_id = self.request.query_params.get('unit', None)
        module_id = self.request.query_params.get('module', None)
        if unit_id is not None:
            queryset = queryset.filter(unit_id=unit_id)
        if module_id is not None:
            queryset = queryset.filter(module_id=module_id)
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    
    def get_permissions(self):
        if self.request.method == 'PATCH': # For grading
            return [IsTrainer()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.role == 'Student':
            return Submission.objects.filter(student=self.request.user)
        return Submission.objects.all()

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentEnrollment.objects.all()
    serializer_class = StudentEnrollmentSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsHOD()]
