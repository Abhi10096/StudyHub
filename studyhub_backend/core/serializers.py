from rest_framework import serializers
from django.contrib.auth.models import User

# Updated imports to include Test models
from .models import (
    Course, Subject, Document, StudentSubmission,
    Question, Answer, Notice, Test, QuizQuestion, TestResult
)


# ---------------- ACADEMIC MODULE SERIALIZERS ---------------- #

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'total_semesters']


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


# ---------------- ONLINE TEST MODULE SERIALIZERS ---------------- #

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        # ✅ FIXED: 'test' field added so React can send the Test ID when creating questions
        fields = ['id', 'test', 'question_text', 'option_1', 'option_2', 'option_3', 'option_4', 'correct_option']


class TestSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    # Include questions inside the test object for viewing
    questions = QuizQuestionSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'subject', 'subject_name',
            'time_limit_mins', 'deadline', 'marks_per_question',
            'question_count', 'questions', 'created_at'
        ]


class TestResultSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestResult
        fields = [
            'id', 'test', 'test_title', 'student', 'student_name',
            'score', 'total_questions', 'submitted_at', 'is_auto_submitted'
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username


# ---------------- Q&A MODULE SERIALIZERS ---------------- #

class AnswerSerializer(serializers.ModelSerializer):
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
    asked_by_name = serializers.SerializerMethodField()
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
    target_course_name = serializers.CharField(source='target_course.name', read_only=True)

    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'target_course', 'target_course_name',
            'target_semester', 'created_at', 'posted_by', 'posted_by_name'
        ]
        read_only_fields = ['posted_by', 'created_at']

    def get_posted_by_name(self, obj):
        name = f"{obj.posted_by.first_name} {obj.posted_by.last_name}".strip()
        return name if name else obj.posted_by.username