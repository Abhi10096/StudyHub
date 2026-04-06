from django.contrib import admin
from .models import Course, Subject, UserProfile, Document, StudentSubmission

admin.site.register(Course)
admin.site.register(Subject)
admin.site.register(UserProfile)
admin.site.register(Document)
admin.site.register(StudentSubmission)