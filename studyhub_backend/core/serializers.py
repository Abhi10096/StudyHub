from rest_framework import serializers
from django.contrib.auth.models import User

# Cleaned up imports (removed duplicates)
from .models import (
    Course, Subject, Document, StudentSubmission,
    Question, Answer, Notice
)


# ---------------- ACADEMIC MODULE SERIALIZERS ---------------- #

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    # Fetch the actual course name instead of just the ID
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
    # FIXED: Used SerializerMethodField because Django User has no 'name' attribute natively
    answered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ['id', 'content', 'answered_by_name', 'created_at']

    def get_answered_by_name(self, obj):
        name = f"{obj.answered_by.first_name} {obj.answered_by.last_name}".strip()
        return name if name else obj.answered_by.username


class QuestionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    asked_by_roll = serializers.CharField(source='asked_by.username', read_only=True)
    # FIXED: Handled first_name and last_name properly
    asked_by_name = serializers.SerializerMethodField()

    # Include the nested answer directly in the question data if it exists
    answer = AnswerSerializer(read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'title', 'description', 'subject', 'subject_name',
            'asked_by', 'asked_by_name', 'asked_by_roll',
            'is_resolved', 'created_at', 'answer'
        ]
        read_only_fields = ['asked_by', 'is_resolved']

    def get_asked_by_name(self, obj):
        name = f"{obj.asked_by.first_name} {obj.asked_by.last_name}".strip()
        return name if name else obj.asked_by.username


# ---------------- NOTICE BOARD SERIALIZER ---------------- #

class NoticeSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = ['id', 'title', 'content', 'created_at', 'posted_by', 'posted_by_name']
        read_only_fields = ['posted_by', 'created_at']

    def get_posted_by_name(self, obj):
        # Fallback to username if first/last names are empty
        name = f"{obj.posted_by.first_name} {obj.posted_by.last_name}".strip()
        return name if name else obj.posted_by.username