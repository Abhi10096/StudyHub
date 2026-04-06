from django.db import models
from django.contrib.auth.models import User

class Course(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Subject(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)
    semester = models.IntegerField()

    def __str__(self):
        return f"{self.course.name} - Sem {self.semester} : {self.name}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    semester = models.IntegerField(null=True, blank=True)

    # Profile Change Request Fields
    change_requested = models.BooleanField(default=False)
    req_course = models.ForeignKey(Course, related_name='requested_profiles', on_delete=models.SET_NULL, null=True, blank=True)
    req_semester = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - Profile"

class Document(models.Model):
    DOC_TYPES = (
        ('note', 'Class Note'),
        ('assignment', 'Assignment Question'),
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=DOC_TYPES, default='note')
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class StudentSubmission(models.Model):
    assignment = models.ForeignKey(Document, on_delete=models.CASCADE, limit_choices_to={'document_type': 'assignment'})
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    submission_file = models.FileField(upload_to='submissions/')
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"


# ---------------- Q&A MODULE MODELS ---------------- #

class Question(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='questions')
    asked_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='asked_questions')
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"

class Answer(models.Model):
    # OneToOneField ensures only ONE answer per question
    question = models.OneToOneField(Question, on_delete=models.CASCADE, related_name='answer')
    answered_by = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to: {self.question.title}"