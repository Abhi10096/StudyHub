from django.db import models
from django.contrib.auth.models import User


# 1. Course Model
class Course(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    total_semesters = models.IntegerField(default=6)

    def __str__(self):
        return self.name


# 2. Subject Model
class Subject(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)
    semester = models.IntegerField()

    def __str__(self):
        return f"{self.course.name} - Sem {self.semester} : {self.name}"


# 3. UserProfile Model
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    semester = models.IntegerField(null=True, blank=True)
    change_requested = models.BooleanField(default=False)
    req_course = models.ForeignKey(Course, related_name='requested_profiles', on_delete=models.SET_NULL, null=True,
                                   blank=True)
    req_semester = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - Profile"


# 4. Resource Module (Notes and Assignment Questions)
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


# 5. Student Submission Module
class StudentSubmission(models.Model):
    assignment = models.ForeignKey(Document, on_delete=models.CASCADE, limit_choices_to={'document_type': 'assignment'})
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    submission_file = models.FileField(upload_to='submissions/')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"


# ---------------- ONLINE TEST MODULE ---------------- #

# 9. Test Model (To create a new quiz)
class Test(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='tests')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    # Test Constraints
    time_limit_mins = models.IntegerField(default=30, help_text="Duration in minutes")
    deadline = models.DateTimeField(help_text="Test will be closed after this date/time")
    marks_per_question = models.IntegerField(default=1)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"


# 10. Question Model (Individual MCQ Questions)
class QuizQuestion(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()

    # Options for MCQ
    option_1 = models.CharField(max_length=255)
    option_2 = models.CharField(max_length=255)
    option_3 = models.CharField(max_length=255)
    option_4 = models.CharField(max_length=255)

    # Correct Answer (Store either number 1-4 or the exact text)
    correct_option = models.IntegerField(choices=[(1, 'Option 1'), (2, 'Option 2'), (3, 'Option 3'), (4, 'Option 4')])

    def __str__(self):
        return f"Q: {self.question_text[:50]}... (Test: {self.test.title})"


# 11. Test Result Model (To store student performance)
class TestResult(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField()
    total_questions = models.IntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    # Status to check if test was auto-submitted due to exit or timeout
    is_auto_submitted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student.username} - {self.test.title} : {self.score}"


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
    question = models.OneToOneField(Question, on_delete=models.CASCADE, related_name='answer')
    answered_by = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to: {self.question.title}"


# ---------------- NOTICE BOARD MODEL ---------------- #

class Notice(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    target_course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    target_semester = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title