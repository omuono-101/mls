from django.contrib import admin
from .models import (
    User, School, Course, Intake, Semester, CourseGroup, Unit, Lesson, Resource,
    Assessment, Submission, Attendance, StudentEnrollment, Module, LearningPath,
    Question, QuestionOption, Answer, StudentAnswer, Announcement, ForumTopic,
    ForumMessage, Notification, StudentLessonProgress, LessonPlanActivity, ProjectLicense
)

# Register your models here.
@admin.register(ProjectLicense)
class ProjectLicenseAdmin(admin.ModelAdmin):
    list_display = ('activated_at', 'is_active')
    readonly_fields = ('activated_at',)

admin.site.register(User)
admin.site.register(School)
admin.site.register(Course)
admin.site.register(Intake)
admin.site.register(Semester)
admin.site.register(CourseGroup)
admin.site.register(Unit)
admin.site.register(Lesson)
admin.site.register(Resource)
admin.site.register(Assessment)
admin.site.register(Submission)
admin.site.register(Attendance)
admin.site.register(StudentEnrollment)
admin.site.register(Module)
admin.site.register(LearningPath)
admin.site.register(Question)
admin.site.register(QuestionOption)
admin.site.register(Answer)
admin.site.register(StudentAnswer)
admin.site.register(Announcement)
admin.site.register(ForumTopic)
admin.site.register(ForumMessage)
admin.site.register(Notification)
admin.site.register(StudentLessonProgress)
admin.site.register(LessonPlanActivity)
