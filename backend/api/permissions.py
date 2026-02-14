from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Admin'

class IsCourseMaster(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role == 'CourseMaster' or request.user.role == 'Admin')

class IsHOD(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role == 'HOD' or request.user.role == 'Admin')

class IsTrainer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role == 'Trainer' or request.user.role == 'Admin')

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Student'

class IsStaff(permissions.BasePermission):
    """Allows Admin, CourseMaster, HOD, and Trainer."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['Admin', 'CourseMaster', 'HOD', 'Trainer']
