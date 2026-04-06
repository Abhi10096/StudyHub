from rest_framework import serializers
from .models import Course, Subject, Document, StudentSubmission
from django.contrib.auth.models import User
from .models import Question, Answer
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    class Meta:
        model = Subject
        fields = ['id', 'name', 'semester', 'course', 'course_name']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

class StudentSubmissionSerializer(serializers.ModelSerializer):
    roll_no = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentSubmission
        fields = ['id', 'student', 'roll_no', 'student_name', 'assignment', 'submission_file', 'submitted_at']
        read_only_fields = ['student', 'submitted_at']

    def get_student_name(self, obj):
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name if name else "Not Provided"


# ---------------- Q&A MODULE SERIALIZERS ---------------- #

class AnswerSerializer(serializers.ModelSerializer):
    answered_by_name = serializers.CharField(source='answered_by.name', read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'content', 'answered_by_name', 'created_at']

class QuestionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    asked_by_name = serializers.CharField(source='asked_by.name', read_only=True)
    asked_by_roll = serializers.CharField(source='asked_by.username', read_only=True)
    # Include the answer directly in the question data if it exists
    answer = AnswerSerializer(read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'title', 'description', 'subject', 'subject_name',
            'asked_by', 'asked_by_name', 'asked_by_roll',
            'is_resolved', 'created_at', 'answer'
        ]
        read_only_fields = ['asked_by', 'is_resolved']