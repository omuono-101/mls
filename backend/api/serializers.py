import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import (School, Course, Intake, Semester, CourseGroup, Unit, Lesson, LessonPlanActivity, Resource, 
                          Assessment, Submission, Attendance, StudentEnrollment, Module, LearningPath,
                          Question, QuestionOption, Answer, StudentAnswer, Announcement, ForumTopic, 
                          ForumMessage, Notification)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_activated', 'is_archived', 'phone_number', 'password']
        read_only_fields = ['is_activated', 'is_archived']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    course_group = serializers.PrimaryKeyRelatedField(
        queryset=CourseGroup.objects.all(), 
        required=False, 
        write_only=True
    )

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'phone_number', 'course_group']

    def create(self, validated_data):
        course_group = validated_data.pop('course_group', None)
        password = validated_data.pop('password')
        
        user = User.objects.create(
            role=User.STUDENT,
            is_activated=False,
            **validated_data
        )
        user.set_password(password)
        user.save()

        if course_group:
            StudentEnrollment.objects.create(
                student=user,
                course_group=course_group,
                is_active=True
            )
        
        return user

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    school_name = serializers.ReadOnlyField(source='school.name')
    class Meta:
        model = Course
        fields = '__all__'

class IntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intake
        fields = '__all__'

    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("End date must be after start date")
        return data

class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = '__all__'

    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("End date must be after start date")
        return data

class CourseGroupSerializer(serializers.ModelSerializer):
    course_name = serializers.ReadOnlyField(source='course.name')
    intake_name = serializers.ReadOnlyField(source='intake.name')
    class Meta:
        model = CourseGroup
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    unit_name = serializers.ReadOnlyField(source='unit.name')
    class Meta:
        model = Module
        fields = '__all__'

class LearningPathSerializer(serializers.ModelSerializer):
    trainer_name = serializers.ReadOnlyField(source='trainer.username')
    modules = ModuleSerializer(many=True, read_only=True)
    module_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Module.objects.all(), source='modules'
    )
    class Meta:
        model = LearningPath
        fields = '__all__'
        read_only_fields = ['trainer']

class LessonPlanActivitySerializer(serializers.ModelSerializer):
    unit_name = serializers.ReadOnlyField(source='unit.name')
    lesson_title = serializers.ReadOnlyField(source='lesson.title')
    
    class Meta:
        model = LessonPlanActivity
        fields = ['id', 'lesson', 'unit', 'title', 'time', 'activity', 'content', 'resources', 'references', 'order', 'is_approved', 'created_at', 'updated_at', 'unit_name', 'lesson_title']

class ResourceSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    
    class Meta:
        model = Resource
        fields = '__all__'
    
    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class LessonSerializer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)
    plan_activities = LessonPlanActivitySerializer(many=True, read_only=True)
    trainer_name = serializers.SerializerMethodField()
    unit_name = serializers.ReadOnlyField(source='unit.name')
    unit_code = serializers.ReadOnlyField(source='unit.code')
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ['trainer']

    def get_trainer_name(self, obj):
        return obj.trainer.username if obj.trainer else "Not Assigned"

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.student_progress.filter(student=request.user, is_completed=True).exists()
        return False

class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = '__all__'
        extra_kwargs = {'question': {'required': False}}

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = '__all__'
        extra_kwargs = {'question': {'required': False}}

class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, required=False)
    correct_answers = AnswerSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = '__all__'

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        answers_data = validated_data.pop('correct_answers', [])
        
        question = Question.objects.create(**validated_data)
        
        for option in options_data:
            QuestionOption.objects.create(question=question, **option)
            
        for answer in answers_data:
            Answer.objects.create(question=question, **answer)
            
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', [])
        answers_data = validated_data.pop('correct_answers', [])
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        instance.options.all().delete()
        for option in options_data:
            QuestionOption.objects.create(question=instance, **option)
            
        instance.correct_answers.all().delete()
        for answer in answers_data:
            Answer.objects.create(question=instance, **answer)
            
        return instance

class AssessmentSerializer(serializers.ModelSerializer):
    unit_name = serializers.ReadOnlyField(source='unit.name')
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    can_submit = serializers.SerializerMethodField()
    
    class Meta:
        model = Assessment
        fields = '__all__'
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_is_available(self, obj):
        return obj.is_available()
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_can_submit(self, obj):
        return obj.can_submit()

class UnitListSerializer(serializers.ModelSerializer):
    course_group_name = serializers.ReadOnlyField(source='course_group.course.name')
    course_group_code = serializers.ReadOnlyField(source='course_group.group_display_code')
    trainer_name = serializers.SerializerMethodField()
    lessons_taught = serializers.SerializerMethodField()
    notes_count = serializers.SerializerMethodField()
    cats_count = serializers.SerializerMethodField()
    student_progress = serializers.SerializerMethodField()
    lessons_completed = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    is_current_semester = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'name', 'code', 'course_group', 'course_group_name', 'course_group_code', 'trainer', 'trainer_name',
            'total_lessons', 'cat_frequency', 'cat_total_points', 'assessment_total_points',
            'lessons_taught', 'notes_count', 'cats_count',
            'student_progress', 'lessons_completed', 'is_enrolled', 'is_current_semester',
        ]

    def get_is_current_semester(self, obj):
        try:
            if not obj.course_group or not obj.course_group.semester:
                return False
            group_sem_name = obj.course_group.semester.name
            match = re.search(r'\d+', str(group_sem_name))
            if match:
                return obj.semester_number == int(match.group())
        except Exception:
            pass
        return False

    def get_is_enrolled(self, obj):
        return getattr(obj, 'annotated_is_enrolled', False)

    def get_trainer_name(self, obj):
        return obj.trainer.username if obj.trainer else "Not Assigned"

    def get_lessons_taught(self, obj):
        return getattr(obj, 'annotated_lessons_taught', 0) or 0

    def get_notes_count(self, obj):
        return getattr(obj, 'annotated_notes_count', 0) or 0

    def get_cats_count(self, obj):
        return getattr(obj, 'annotated_cats_count', 0) or 0

    def get_student_progress(self, obj):
        completed = self.get_lessons_completed(obj)
        total = obj.total_lessons or 1
        return round((completed / total) * 100)

    def get_lessons_completed(self, obj):
        return getattr(obj, 'annotated_lessons_completed', 0) or 0

class UnitSerializer(serializers.ModelSerializer):
    course_group_name = serializers.ReadOnlyField(source='course_group.course.name')
    course_group_code = serializers.ReadOnlyField(source='course_group.group_display_code')
    trainer_name = serializers.SerializerMethodField()
    lessons_taught = serializers.SerializerMethodField()
    total_lessons_count = serializers.ReadOnlyField(source='total_lessons')
    notes_count = serializers.SerializerMethodField()
    cats_count = serializers.SerializerMethodField()
    modules = ModuleSerializer(many=True, read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)
    assessments = AssessmentSerializer(many=True, read_only=True)
    
    student_progress = serializers.SerializerMethodField()
    lessons_completed = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    is_current_semester = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = '__all__'

    def get_is_current_semester(self, obj):
        try:
            if not obj.course_group or not obj.course_group.semester:
                return False
            group_sem_name = obj.course_group.semester.name
            match = re.search(r'\d+', str(group_sem_name))
            if match:
                return obj.semester_number == int(match.group())
        except Exception:
            pass
        return False

    def get_is_enrolled(self, obj):
        if hasattr(obj, 'annotated_is_enrolled'):
            return obj.annotated_is_enrolled
            
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        from core.models import StudentEnrollment
        return StudentEnrollment.objects.filter(
            student=request.user, 
            course_group=obj.course_group,
            is_active=True
        ).exists()

    def get_trainer_name(self, obj):
        return obj.trainer.username if obj.trainer else "Not Assigned"

    def get_lessons_taught(self, obj):
        return (getattr(obj, 'annotated_lessons_taught', None) or 
                obj.lessons.filter(is_taught=True).count())

    def get_notes_count(self, obj):
        if hasattr(obj, 'annotated_notes_count'):
            return obj.annotated_notes_count or 0
        from core.models import Resource
        return Resource.objects.filter(lesson__unit=obj).count()

    def get_cats_count(self, obj):
        if hasattr(obj, 'annotated_cats_count'):
            return obj.annotated_cats_count or 0
        return obj.assessments.filter(assessment_type='CAT').count()

    def get_lessons_completed(self, obj):
        if hasattr(obj, 'annotated_lessons_completed'):
            return obj.annotated_lessons_completed or 0
            
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from core.models import StudentLessonProgress
            return StudentLessonProgress.objects.filter(
                student=request.user, 
                lesson__unit=obj, 
                is_completed=True
            ).count()
        return 0

    def get_student_progress(self, obj):
        completed = self.get_lessons_completed(obj)
        total = obj.total_lessons or 1
        return round((completed / total) * 100)

class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.ReadOnlyField(source='question.question_text')
    question_type = serializers.ReadOnlyField(source='question.question_type')
    question_points = serializers.ReadOnlyField(source='question.points')
    selected_option_text = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentAnswer
        fields = '__all__'
    
    def get_selected_option_text(self, obj):
        if obj.selected_option:
            return obj.selected_option.option_text
        return None

class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    student_email = serializers.ReadOnlyField(source='student.email')
    assessment_name = serializers.SerializerMethodField()
    assessment_title = serializers.ReadOnlyField(source='assessment.title')
    assessment_type = serializers.ReadOnlyField(source='assessment.assessment_type')
    student_answers = StudentAnswerSerializer(many=True, read_only=True)
    total_points = serializers.ReadOnlyField(source='assessment.points')
    
    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['student', 'auto_graded_score']
    
    def get_assessment_name(self, obj):
        if not obj.assessment:
            return "Unknown Assessment"
        return f"{obj.assessment.assessment_type}: {obj.assessment.title}"

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    lesson_title = serializers.ReadOnlyField(source='lesson.title')
    marked_by_name = serializers.ReadOnlyField(source='marked_by.username')
    class Meta:
        model = Attendance
        fields = '__all__'

class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    student_email = serializers.ReadOnlyField(source='student.email')
    course_group_display = serializers.ReadOnlyField(source='course_group.group_display_code')
    course_name = serializers.ReadOnlyField(source='course_group.course.name')
    class Meta:
        model = StudentEnrollment
        fields = '__all__'

class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['author']

class ForumTopicSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    unit_code = serializers.ReadOnlyField(source='unit.code')
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ForumTopic
        fields = ['id', 'unit', 'unit_name', 'unit_code', 'title', 'description', 'created_at', 'created_by', 'created_by_name', 'message_count']
        read_only_fields = ['created_by']

    def get_message_count(self, obj):
        return obj.messages.count()

class ForumMessageSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = ForumMessage
        fields = '__all__'
        read_only_fields = ['user']

class NotificationSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'is_critical', 'is_read', 'created_at', 'link', 'sender_role', 'active_from', 'active_until', 'is_active', 'is_available']
    
    def get_is_available(self, obj):
        return obj.is_available()
