from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from core.models import (School, Course, Intake, Semester, CourseGroup, Unit, Lesson, Resource, 
                          Assessment, Submission, Attendance, StudentEnrollment, Module, LearningPath,
                          Question, QuestionOption, Answer, StudentAnswer, Announcement, ForumTopic, 
                          ForumMessage, Notification)
from .serializers import (
    UserSerializer, StudentRegistrationSerializer, SchoolSerializer, CourseSerializer, IntakeSerializer, 
    SemesterSerializer, CourseGroupSerializer, UnitSerializer, LessonSerializer, 
    ResourceSerializer, AssessmentSerializer, SubmissionSerializer,
    AttendanceSerializer, StudentEnrollmentSerializer, ModuleSerializer, LearningPathSerializer,
    QuestionSerializer, QuestionOptionSerializer, AnswerSerializer, StudentAnswerSerializer,
    AnnouncementSerializer, ForumTopicSerializer, ForumMessageSerializer, NotificationSerializer
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
        if self.action == 'register_student':
            return [permissions.AllowAny()]
        if self.request.method in permissions.SAFE_METHODS:
            return [IsStaff()]
        return super().get_permissions()

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register_student(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'status': 'registration pending',
                'detail': 'Account created successfully. Please wait for admin activation.'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({'detail': 'Wrong old password.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({'status': 'password changed successfully'})

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsCourseMaster()]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsCourseMaster()]

class IntakeViewSet(viewsets.ModelViewSet):
    queryset = Intake.objects.all()
    serializer_class = IntakeSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsCourseMaster()]

class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsCourseMaster()]

class CourseGroupViewSet(viewsets.ModelViewSet):
    queryset = CourseGroup.objects.all()
    serializer_class = CourseGroupSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsHOD()]

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    
    def get_queryset(self):
        queryset = Unit.objects.all()
        if self.request.user.role == 'Student':
            from core.models import StudentEnrollment
            enrollment = StudentEnrollment.objects.filter(student=self.request.user, is_active=True).first()
            if enrollment:
                queryset = queryset.filter(course_group=enrollment.course_group)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        unit = self.get_object()
        user = request.user
        
        if user.role != 'Student':
            return Response({'error': 'Only students can enroll'}, status=status.HTTP_403_FORBIDDEN)
            
        from core.models import StudentEnrollment
        # Check if already enrolled in this course group
        if StudentEnrollment.objects.filter(student=user, course_group=unit.course_group, is_active=True).exists():
            return Response({'message': 'Already enrolled'}, status=status.HTTP_200_OK)
            
        # Optional: Deactivate other enrollments if you want only one active at a time
        # StudentEnrollment.objects.filter(student=user, is_active=True).update(is_active=False)
        
        StudentEnrollment.objects.create(
            student=user,
            course_group=unit.course_group,
            is_active=True
        )
        return Response({'message': 'Enrollment successful'}, status=status.HTTP_201_CREATED)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        if self.action == 'enroll':
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

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        queryset = Announcement.objects.all()
        # Filter for the student's group if applicable
        if self.request.user.role == 'Student':
            from core.models import StudentEnrollment
            enrollment = StudentEnrollment.objects.filter(student=self.request.user, is_active=True).first()
            if enrollment:
                queryset = queryset.filter(models.Q(course_group=enrollment.course_group) | models.Q(course_group__isnull=True))
            else:
                queryset = queryset.filter(course_group__isnull=True)
        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsStaff()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ForumTopicViewSet(viewsets.ModelViewSet):
    queryset = ForumTopic.objects.all()
    serializer_class = ForumTopicSerializer

    def get_queryset(self):
        queryset = ForumTopic.objects.all()
        unit_id = self.request.query_params.get('unit', None)
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        return queryset

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ForumMessageViewSet(viewsets.ModelViewSet):
    queryset = ForumMessage.objects.all()
    serializer_class = ForumMessageSerializer

    def get_queryset(self):
        queryset = ForumMessage.objects.all()
        topic_id = self.request.query_params.get('topic', None)
        if topic_id:
            queryset = queryset.filter(topic_id=topic_id)
        return queryset

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})
