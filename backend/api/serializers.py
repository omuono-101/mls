from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import (School, Course, Intake, Semester, CourseGroup, Unit, Lesson, Resource, 
                          Assessment, Submission, Attendance, StudentEnrollment, Module, LearningPath,
                          Question, QuestionOption, Answer, StudentAnswer)

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

class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = '__all__'

class CourseGroupSerializer(serializers.ModelSerializer):
    course_name = serializers.ReadOnlyField(source='course.name')
    intake_name = serializers.ReadOnlyField(source='intake.name')
    class Meta:
        model = CourseGroup
        fields = '__all__'

class UnitSerializer(serializers.ModelSerializer):
    course_group_name = serializers.ReadOnlyField(source='course_group.course.name')
    trainer_name = serializers.ReadOnlyField(source='trainer.username')
    lessons_taught = serializers.SerializerMethodField()
    total_lessons_count = serializers.ReadOnlyField(source='total_lessons')
    notes_count = serializers.SerializerMethodField()
    cats_count = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = '__all__'

    def get_lessons_taught(self, obj):
        return obj.lessons.filter(is_taught=True).count()

    def get_notes_count(self, obj):
        from core.models import Resource
        return Resource.objects.filter(lesson__unit=obj).count()

    def get_cats_count(self, obj):
        return obj.assessments.filter(assessment_type='CAT').count()

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

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

class LessonSerializer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)
    trainer_name = serializers.ReadOnlyField(source='trainer.username')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    unit_code = serializers.ReadOnlyField(source='unit.code')
    class Meta:
        model = Lesson
        fields = '__all__'

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
        
        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Simple implementation: delete and recreate options/answers
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
    
    class Meta:
        model = Assessment
        fields = '__all__'
    
    def get_question_count(self, obj):
        return obj.questions.count()

class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.ReadOnlyField(source='question.question_text')
    question_type = serializers.ReadOnlyField(source='question.question_type')
    
    class Meta:
        model = StudentAnswer
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    assessment_name = serializers.SerializerMethodField()
    student_answers = StudentAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Submission
        fields = '__all__'
    
    def get_assessment_name(self, obj):
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
