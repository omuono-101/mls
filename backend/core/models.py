from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    ADMIN = 'Admin'
    COURSE_MASTER = 'CourseMaster'
    HOD = 'HOD'
    TRAINER = 'Trainer'
    STUDENT = 'Student'
    
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (COURSE_MASTER, 'Course Master'),
        (HOD, 'HOD/COD'),
        (TRAINER, 'Trainer'),
        (STUDENT, 'Student'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=STUDENT)
    is_activated = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_activated = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Badge(models.Model):
    """Model for student achievement badges"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name for display")
    color = models.CharField(max_length=20, default='#6366f1', help_text="Hex color code")
    points_required = models.IntegerField(default=0, help_text="Minimum points to earn this badge")
    
    def __str__(self):
        return self.name

class StudentBadge(models.Model):
    """Model linking students to badges they've earned"""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='earners')
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'badge']
    
    def __str__(self):
        return f"{self.student.username} earned {self.badge.name}"

class StudentRating(models.Model):
    """Model for live student ratings based on performance"""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, help_text="Rating score (0-5)")
    total_points = models.IntegerField(default=0, help_text="Total points earned")
    completed_lessons = models.IntegerField(default=0)
    completed_assessments = models.IntegerField(default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Student Ratings"
    
    def __str__(self):
        return f"{self.student.username}: {self.rating}"

class School(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Course(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, default='GEN')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='courses')
    duration = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Intake(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='intakes', null=True)
    name = models.CharField(max_length=100)
    group_code = models.CharField(max_length=50, blank=True)
    admission_numbers = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    intake_type = models.CharField(max_length=50, choices=[('Full-time', 'Full-time'), ('Part-time', 'Part-time')], default='Full-time')
    start_date = models.DateField(null=True)
    end_date = models.DateField(null=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError({'end_date': 'End date must be after start date.'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.group_code})"

class Semester(models.Model):
    intake = models.ForeignKey(Intake, on_delete=models.CASCADE, related_name='semesters', null=True)
    name = models.CharField(max_length=100, default='Semester 1')
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.intake.name} - {self.name}"

class CourseGroup(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    intake = models.ForeignKey(Intake, on_delete=models.CASCADE)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE)
    course_code = models.CharField(max_length=50)

    @property
    def group_display_code(self):
        return f"{self.course.code} {self.intake.group_code}"

    def __str__(self):
        return f"{self.group_display_code} - {self.course.name}"

class Unit(models.Model):
    course_group = models.ForeignKey(CourseGroup, on_delete=models.CASCADE, related_name='units')
    trainer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_units')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    semester_number = models.PositiveIntegerField()
    total_lessons = models.PositiveIntegerField()
    cat_frequency = models.PositiveIntegerField(default=3)
    cat_total_points = models.PositiveIntegerField(default=30)
    assessment_total_points = models.PositiveIntegerField(default=20)

    def __str__(self):
        return f"{self.code}: {self.name}"

class Module(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.unit.code} - {self.title}"

class LearningPath(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    trainer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_paths')
    modules = models.ManyToManyField(Module, related_name='learning_paths', blank=True)
    
    def __str__(self):
        return self.title

class Lesson(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='lessons')
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True, blank=True, related_name='lessons')
    trainer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_lessons')
    title = models.CharField(max_length=255)
    is_lab = models.BooleanField(default=False)
    order = models.PositiveIntegerField()
    is_approved = models.BooleanField(default=False)
    is_taught = models.BooleanField(default=False)
    has_cat = models.BooleanField(default=False)
    has_assessment = models.BooleanField(default=True)
    content = models.TextField(blank=True, help_text="Rich text content for the lesson lecture notes.")
    audit_feedback = models.TextField(blank=True)
    week = models.PositiveIntegerField(null=True, blank=True)
    session_date = models.DateField(null=True, blank=True)
    session_start = models.TimeField(null=True, blank=True)
    session_end = models.TimeField(null=True, blank=True)
    session = models.CharField(max_length=50, blank=True)
    topic = models.CharField(max_length=255, blank=True)
    subtopic = models.CharField(max_length=255, blank=True)
    learning_outcomes = models.TextField(blank=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Lesson {self.order}: {self.title}"

class LessonPlanActivity(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='plan_activities', null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='lesson_plan_activities', null=True, blank=True)
    title = models.CharField(max_length=255, blank=True, help_text="Title of the lesson plan (optional - for standalone plans)")
    time = models.CharField(max_length=50)
    activity = models.TextField()
    content = models.TextField(blank=True)
    resources = models.TextField(blank=True)
    references = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        if self.lesson:
            return f"Activity {self.order} for Lesson {self.lesson.title}"
        elif self.title:
            return f"Lesson Plan: {self.title}"
        else:
            return f"Lesson Plan Activity {self.order}"

class StudentLessonProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='student_progress')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'lesson']

class Resource(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=50, choices=[('PDF', 'PDF'), ('Video', 'Video'), ('PPT', 'PowerPoint'), ('Link', 'ReferenceLink')])
    file = models.FileField(upload_to='resources/', blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)
    audit_feedback = models.TextField(blank=True)

    def __str__(self):
        return self.title

class Assessment(models.Model):
    TYPE_CHOICES = [
        ('CAT', 'Continuous Assessment Test'),
        ('Test', 'Test'),
        ('Assignment', 'Assignment'),
        ('LabTask', 'Lab Task'),
        ('LessonAssessment', 'Lesson Assessment')
    ]
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='assessments')
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True, blank=True, related_name='assessments')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True)
    assessment_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255, default='Untitled Assessment')
    instructions = models.TextField(blank=True)
    points = models.PositiveIntegerField()
    due_date = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    show_answers_after_submission = models.BooleanField(default=False)
    scheduled_start = models.DateTimeField(null=True, blank=True)
    scheduled_end = models.DateTimeField(null=True, blank=True)
    allow_late_submission = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    audit_feedback = models.TextField(blank=True)

    def __str__(self):
        return f"{self.assessment_type}: {self.title} for {self.unit.name}"
    
    def is_available(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.scheduled_start:
            return self.is_approved
        return self.is_approved and now >= self.scheduled_start
    
    def is_expired(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.scheduled_end:
            return False
        return now > self.scheduled_end
    
    def can_submit(self):
        if not self.is_approved:
            return False
        if not self.scheduled_start:
            return True
        from django.utils import timezone
        now = timezone.now()
        if now < self.scheduled_start:
            return False
        if self.scheduled_end and now > self.scheduled_end:
            return self.allow_late_submission
        return True

class Question(models.Model):
    QUESTION_TYPES = [
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
        ('SHORT', 'Short Answer'),
        ('ESSAY', 'Essay'),
        ('FILL', 'Fill in the Blank')
    ]
    
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=1)
    image = models.ImageField(upload_to='question_images/', blank=True, null=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"

class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=1)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.option_text[:30]} ({'Correct' if self.is_correct else 'Incorrect'})"

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='correct_answers')
    answer_text = models.TextField(blank=True)
    is_correct_for_tf = models.BooleanField(null=True, blank=True)
    
    def __str__(self):
        if self.is_correct_for_tf is not None:
            return f"TF Answer: {self.is_correct_for_tf}"
        return f"Answer: {self.answer_text[:50]}"

class StudentAnswer(models.Model):
    submission = models.ForeignKey('Submission', on_delete=models.CASCADE, related_name='student_answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.SET_NULL, null=True, blank=True)
    answer_text = models.TextField(blank=True)
    points_earned = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    
    def __str__(self):
        return f"Answer by {self.submission.student.username} for Q{self.question.order}"

class Submission(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='submissions/', blank=True, null=True)
    content = models.TextField(blank=True)
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    auto_graded_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_graded = models.BooleanField(default=False)
    is_late = models.BooleanField(default=False)
    is_zero_graded = models.BooleanField(default=False)

    def __str__(self):
        return f"Submission by {self.student.username} for {self.assessment}"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late')
    ]
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Absent')
    marked_at = models.DateTimeField(auto_now_add=True)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')

    class Meta:
        unique_together = ['lesson', 'student']

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title}: {self.status}"

class StudentEnrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course_group = models.ForeignKey(CourseGroup, on_delete=models.CASCADE, related_name='enrolled_students')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['student', 'course_group']

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course_group}"

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    course_group = models.ForeignKey(CourseGroup, on_delete=models.CASCADE, related_name='announcements', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.title

class ForumTopic(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='forum_topics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.unit.code} - {self.title}"

class ForumMessage(models.Model):
    topic = models.ForeignKey(ForumTopic, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message by {self.user.username} on {self.topic.title}"

class Notification(models.Model):
    TYPE_CHOICES = [
        ('general', 'General'),
        ('critical', 'Critical'),
        ('lesson', 'Lesson'),
        ('assessment', 'Assessment'),
        ('enrollment', 'Enrollment'),
        ('approval', 'Approval'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general')
    is_critical = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True, null=True)
    sender_role = models.CharField(max_length=20, blank=True, null=True)
    active_from = models.DateTimeField(null=True, blank=True)
    active_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
    
    def is_available(self):
        from django.utils import timezone
        now = timezone.now()
        
        if not self.is_active:
            return False
        
        if self.active_from and now < self.active_from:
            return False
        
        if self.active_until and now > self.active_until:
            return False
        
        return True
