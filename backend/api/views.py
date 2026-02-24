import re
from django.db import models
from django.db.models import Sum, Q, Count, OuterRef, Exists, Value, IntegerField, BooleanField, Prefetch, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone
import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from core.models import (School, Course, Intake, Semester, CourseGroup, Unit, Lesson, Resource, 
                          Assessment, Submission, Attendance, StudentEnrollment, Module, LearningPath,
                          Question, QuestionOption, Answer, StudentAnswer, Announcement, ForumTopic, 
                          ForumMessage, Notification, StudentLessonProgress, LessonPlanActivity)
from .serializers import (
    UserSerializer, StudentRegistrationSerializer, SchoolSerializer, CourseSerializer, IntakeSerializer, 
    SemesterSerializer, CourseGroupSerializer, UnitListSerializer, UnitSerializer, LessonSerializer, 
    ResourceSerializer, AssessmentSerializer, SubmissionSerializer,
    AttendanceSerializer, StudentEnrollmentSerializer, ModuleSerializer, LearningPathSerializer,
    QuestionSerializer, QuestionOptionSerializer, AnswerSerializer, StudentAnswerSerializer,
    AnnouncementSerializer, ForumTopicSerializer, ForumMessageSerializer, NotificationSerializer,
    LessonPlanActivitySerializer
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
    queryset = CourseGroup.objects.all().select_related('course', 'intake', 'semester')
    serializer_class = CourseGroupSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsHOD()]

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UnitListSerializer
        return UnitSerializer
    
    def get_queryset(self):
        queryset = Unit.objects.all().select_related(
            'course_group__course', 
            'course_group__intake',
            'course_group__semester',
            'trainer'
        )

        user = self.request.user
        if not user or not user.is_authenticated:
            return queryset.none()
        
        # 1. Base annotations with Subqueries for stability on Postgres
        queryset = queryset.annotate(
            annotated_lessons_taught=Coalesce(
                Subquery(
                    Lesson.objects.filter(unit=OuterRef('pk'), is_taught=True)
                    .values('unit')
                    .annotate(cnt=Count('pk'))
                    .values('cnt'),
                    output_field=IntegerField()
                ),
                Value(0, output_field=IntegerField())
            ),
            annotated_notes_count=Coalesce(
                Subquery(
                    Resource.objects.filter(lesson__unit=OuterRef('pk'))
                    .values('lesson__unit')
                    .annotate(cnt=Count('pk'))
                    .values('cnt'),
                    output_field=IntegerField()
                ),
                Value(0, output_field=IntegerField())
            ),
            annotated_cats_count=Coalesce(
                Subquery(
                    Assessment.objects.filter(unit=OuterRef('pk'), assessment_type='CAT')
                    .values('unit')
                    .annotate(cnt=Count('pk'))
                    .values('cnt'),
                    output_field=IntegerField()
                ),
                Value(0, output_field=IntegerField())
            )
        )

        # 2. Enrollment Check
        enrollment_subquery = StudentEnrollment.objects.filter(
            student=user,
            course_group=OuterRef('course_group'),
            is_active=True
        )
        queryset = queryset.annotate(annotated_is_enrolled=Exists(enrollment_subquery))

        # 3. Role-specific logic
        if user.role == 'Student':
            # Students only see units in their active course groups
            queryset = queryset.filter(
                course_group__enrolled_students__student=user,
                course_group__enrolled_students__is_active=True
            )
            
            queryset = queryset.annotate(
                annotated_lessons_completed=Coalesce(
                    Subquery(
                        StudentLessonProgress.objects.filter(
                            lesson__unit=OuterRef('pk'),
                            student=user,
                            is_completed=True
                        )
                        .values('lesson__unit')
                        .annotate(cnt=Count('pk'))
                        .values('cnt'),
                        output_field=IntegerField()
                    ),
                    Value(0, output_field=IntegerField())
                )
            )
        else:
            # HODs, Trainers, and Admins see more units
            # For HODs specifically, ensure we don't accidentally filter anything
            queryset = queryset.annotate(
                annotated_lessons_completed=Value(0, output_field=IntegerField())
            )

        if self.action == 'list':
            # Prefetch for lessons and assessments which are now in UnitListSerializer
            queryset = queryset.prefetch_related(
                Prefetch('lessons', queryset=Lesson.objects.select_related('trainer', 'unit', 'module').prefetch_related('resources')),
                Prefetch('assessments', queryset=Assessment.objects.select_related('unit'))
            )
            
        if self.action == 'retrieve':
            # Add deep prefetch for detailed view
            queryset = queryset.prefetch_related(
                'modules',
                Prefetch('lessons', queryset=Lesson.objects.select_related('trainer', 'unit', 'module')),
                Prefetch('assessments', queryset=Assessment.objects.select_related('unit'))
            )
            
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
        queryset = Lesson.objects.all().select_related('unit', 'trainer', 'module')
        unit_id = self.request.query_params.get('unit', None)
        module_id = self.request.query_params.get('module', None)
        if unit_id is not None:
            queryset = queryset.filter(unit_id=unit_id)
        if module_id is not None:
            queryset = queryset.filter(module_id=module_id)
        
        if self.action == 'list':
            queryset = queryset.prefetch_related('resources')
            
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        if self.action in ['complete', 'incomplete']:
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        lesson = self.get_object()
        from core.models import StudentLessonProgress
        progress, created = StudentLessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson
        )
        progress.is_completed = True
        progress.save()
        return Response({'status': 'lesson completed'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def incomplete(self, request, pk=None):
        lesson = self.get_object()
        from core.models import StudentLessonProgress
        progress, created = StudentLessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson
        )
        progress.is_completed = False
        progress.save()
        return Response({'status': 'lesson marked incomplete'})


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
        queryset = Assessment.objects.all().select_related('unit', 'module')
        unit_id = self.request.query_params.get('unit', None)
        module_id = self.request.query_params.get('module', None)
        if unit_id is not None:
            queryset = queryset.filter(unit_id=unit_id)
        if module_id is not None:
            queryset = queryset.filter(module_id=module_id)
        
        # Students only see available (not expired) assessments
        user = self.request.user
        if user.is_authenticated and user.role == 'Student':
            from django.utils import timezone
            now = timezone.now()
            # Show only approved assessments that haven't expired
            queryset = queryset.filter(is_approved=True)
            # Exclude assessments where scheduled_end has passed and no late submission allowed
            queryset = queryset.exclude(
                scheduled_end__isnull=False,
                scheduled_end__lt=now,
                allow_late_submission=False
            )
        
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
        """Handle submission with automatic expiry check"""
        assessment = serializer.validated_data.get('assessment')
        
        # Check if assessment is available and not expired
        if assessment:
            if not assessment.can_submit():
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    'detail': 'This assessment is no longer available for submission. The deadline has passed.'
                })
            
            # Check if student already submitted
            student = self.request.user
            existing = Submission.objects.filter(
                assessment=assessment,
                student=student
            ).exists()
            
            if existing:
                raise ValidationError({
                    'detail': 'You have already submitted this assessment.'
                })
            
            # Check if expired and mark as late if allowed
            from django.utils import timezone
            now = timezone.now()
            is_late = False
            
            if assessment.scheduled_end and now > assessment.scheduled_end:
                if assessment.allow_late_submission:
                    is_late = True
                else:
                    raise ValidationError({
                        'detail': 'Submission deadline has passed. No more submissions allowed.'
                    })
            
            submission = serializer.save(student=student, is_late=is_late)
            
            # If late and not allowed, auto-grade as zero
            if is_late and not assessment.allow_late_submission:
                submission.grade = 0
                submission.is_graded = True
                submission.is_zero_graded = True
                submission.feedback = 'Automatic zero: Submission after deadline'
                submission.save()
            
            return submission
        
        return serializer.save(student=self.request.user)

    @action(detail=False, methods=['get'])
    def by_assessment(self, request):
        """Get all submissions for a specific assessment"""
        assessment_id = request.query_params.get('assessment_id')
        if not assessment_id:
            return Response({'error': 'assessment_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        submissions = Submission.objects.filter(
            assessment_id=assessment_id
        ).select_related('student', 'assessment')
        
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def grade_answers(self, request, pk=None):
        """Grade specific answers and update final score"""
        submission = self.get_object()
        graded_answers = request.data.get('graded_answers', [])
        general_feedback = request.data.get('feedback', '')
        
        for answer_data in graded_answers:
            answer_id = answer_data.get('answer_id')
            points_earned = answer_data.get('points_earned')
            feedback = answer_data.get('feedback', '')
            
            StudentAnswer.objects.filter(
                id=answer_id,
                submission=submission
            ).update(
                points_earned=points_earned,
                feedback=feedback
            )
        
        # Calculate final score (auto-graded + manual)
        total_earned = StudentAnswer.objects.filter(
            submission=submission
        ).aggregate(total=Sum('points_earned'))['total'] or 0
        
        submission.grade = total_earned
        submission.feedback = general_feedback
        submission.is_graded = True
        submission.save()
        
        return Response(self.get_serializer(submission).data)

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
        queryset = ForumTopic.objects.all().select_related('unit', 'created_by')
        unit_id = self.request.query_params.get('unit', None)
        
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        
        return queryset.order_by('-created_at')

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
        queryset = Notification.objects.filter(user=self.request.user).order_by('-created_at')
        
        # Filter by type
        notification_type = self.request.query_params.get('type', None)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter critical only
        critical_only = self.request.query_params.get('critical', None)
        if critical_only == 'true':
            queryset = queryset.filter(is_critical=True)
            
        return queryset

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def send_notification(self, request):
        """
        Send notification to users based on role
        Request body:
        - user_ids: list of user IDs (optional, if not provided sends to role)
        - role: target role (Admin, HOD, Trainer, Student) - sends to all users with this role
        - title: notification title
        - message: notification message
        - notification_type: general, critical, lesson, assessment, enrollment, approval
        - is_critical: boolean
        - link: optional link
        - active_from: datetime when notification becomes active (optional)
        - active_until: datetime when notification expires (optional)
        - is_active: boolean for manual override (default true)
        """
        user_ids = request.data.get('user_ids', [])
        target_role = request.data.get('role')
        title = request.data.get('title')
        message = request.data.get('message')
        notification_type = request.data.get('notification_type', 'general')
        is_critical = request.data.get('is_critical', False)
        link = request.data.get('link', '')
        
        # Deadline fields
        active_from = request.data.get('active_from')
        active_until = request.data.get('active_until')
        is_active = request.data.get('is_active', True)
        
        sender = request.user
        
        if not title or not message:
            return Response({'error': 'Title and message are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        notifications_created = 0
        
        # Parse datetime fields
        from django.utils.dateparse import parse_datetime
        active_from_dt = parse_datetime(active_from) if active_from else None
        active_until_dt = parse_datetime(active_until) if active_until else None
        
        # Send to specific users
        if user_ids:
            for user_id in user_ids:
                try:
                    target_user = User.objects.get(id=user_id)
                    Notification.objects.create(
                        user=target_user,
                        title=title,
                        message=message,
                        notification_type=notification_type,
                        is_critical=is_critical,
                        link=link,
                        sender_role=sender.role,
                        active_from=active_from_dt,
                        active_until=active_until_dt,
                        is_active=is_active
                    )
                    notifications_created += 1
                except User.DoesNotExist:
                    pass
        
        # Send to all users of a specific role
        elif target_role:
            target_users = User.objects.filter(role=target_role, is_activated=True)
            for target_user in target_users:
                Notification.objects.create(
                    user=target_user,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    is_critical=is_critical,
                    link=link,
                    sender_role=sender.role,
                    active_from=active_from_dt,
                    active_until=active_until_dt,
                    is_active=is_active
                )
                notifications_created += 1
        else:
            return Response({'error': 'Either user_ids or role must be provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'status': f'{notifications_created} notifications sent'})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def critical_notifications(self, request):
        """Get all critical notifications for the current user"""
        notifications = Notification.objects.filter(
            user=request.user,
            is_critical=True,
            is_read=False
        ).order_by('-created_at')
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def unread_count(self, request):
        """Get count of unread notifications"""
        total_count = Notification.objects.filter(user=request.user, is_read=False).count()
        critical_count = Notification.objects.filter(user=request.user, is_critical=True, is_read=False).count()
        return Response({
            'total': total_count,
            'critical': critical_count
        })


class LessonPlanActivityViewSet(viewsets.ModelViewSet):
    """ViewSet for Lesson Plan Activities"""
    queryset = LessonPlanActivity.objects.all()
    serializer_class = LessonPlanActivitySerializer
    
    def get_queryset(self):
        queryset = LessonPlanActivity.objects.all()
        lesson_id = self.request.query_params.get('lesson', None)
        if lesson_id is not None:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]
