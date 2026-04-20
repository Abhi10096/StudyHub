from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from django.db.models import Q

# Model & Serializer Imports
from .models import Course, Subject, Document, StudentSubmission, UserProfile, Question, Answer, Notice
from .serializers import (
    CourseSerializer, SubjectSerializer, DocumentSerializer,
    StudentSubmissionSerializer, QuestionSerializer, NoticeSerializer
)


# ---------------- CUSTOM PERMISSIONS ---------------- #
class IsStaffUser(permissions.BasePermission):
    """
    Custom permission class to check if the requesting user is a faculty member (staff).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

class IsAdminOrFaculty(BasePermission):
    """
    Custom permission class to ensure only Administrators (superusers)
    or Faculties (staff members) have write access to notices.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.is_staff)
        )


# ---------------- AUTH & REGISTRATION ---------------- #
class CustomAuthToken(ObtainAuthToken):
    """
    Handles user login and returns an authentication token along with user profile details.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        course_id = None
        semester = None

        if hasattr(user, 'profile'):
            course_id = user.profile.course.id if user.profile.course else None
            semester = user.profile.semester

        return Response({
            'token': token.key,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'course_id': course_id,
            'semester': semester
        })


class RegisterUserAPI(APIView):
    """
    Handles new user registration. Users are created as inactive by default
    and require admin approval.
    """
    permission_classes = []

    def post(self, request):
        data = request.data
        username = data.get('username')

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username, password=data.get('password'),
            first_name=data.get('first_name'), last_name=data.get('last_name'),
            is_active=False, is_staff=(data.get('role') == 'teacher')
        )

        course_id = data.get('course_id')
        if course_id:
            try:
                course_obj = Course.objects.get(id=course_id)
                UserProfile.objects.create(
                    user=user, course=course_obj,
                    semester=data.get('semester') if data.get('role') == 'student' else None
                )
            except Course.DoesNotExist:
                pass

        return Response({"message": "Registration successful. Pending admin approval."}, status=status.HTTP_201_CREATED)


# ---------------- ACADEMIC MODULE ---------------- #
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class SubjectViewSet(viewsets.ModelViewSet):
    """
    Academic Subject Management:
    - Supports CRUD operations for Faculty/Admin.
    - Students have Read-Only access based on their Course/Semester.
    """
    serializer_class = SubjectSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Subject.objects.all()

        if hasattr(user, 'profile') and user.profile.course:
            if user.is_staff:
                # Faculty see all subjects in their department
                return Subject.objects.filter(course=user.profile.course)

            if user.profile.semester and user.profile.semester != '-':
                # Students see subjects specific to their course and semester
                return Subject.objects.filter(course=user.profile.course, semester=user.profile.semester)

            return Subject.objects.filter(course=user.profile.course)

        return Subject.objects.none()

    def get_permissions(self):
        """
        Custom permission logic:
        - Anyone authenticated can view (list/retrieve).
        - Only Admin or Faculty can modify (create/update/destroy).
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrFaculty()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        # Existing breadcrumb logic maintained
        response = super().list(request, *args, **kwargs)
        user = request.user
        path_name = "Academic Curriculum"
        if hasattr(user, 'profile') and user.profile.course:
            if not user.is_staff and user.profile.semester and user.profile.semester != '-':
                path_name = f"{user.profile.course.name} > Semester {user.profile.semester}"
            else:
                path_name = f"{user.profile.course.name} Department"
        return Response({'current_path': path_name, 'results': response.data})
class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('-uploaded_at')
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StudentSubmission.objects.all().order_by('-submitted_at')
        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        if self.request.query_params.get('my_submissions') == 'true':
            queryset = queryset.filter(student=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


# ---------------- ONLINE TEST MODULE VIEWS ---------------- #
from .models import Test, QuizQuestion, TestResult
from .serializers import TestSerializer, QuizQuestionSerializer, TestResultSerializer
from django.utils import timezone


class TestViewSet(viewsets.ModelViewSet):
    """
    Teachers can create tests. Students can view available tests
    for their subject and submit their attempts.
    """
    serializer_class = TestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        # Admin and Staff see all tests
        if user.is_superuser or user.is_staff:
            return Test.objects.all().order_by('-created_at')

        # Students see tests for their course and only those which haven't passed the deadline
        if hasattr(user, 'profile') and user.profile.course:
            return Test.objects.filter(
                subject__course=user.profile.course,
                deadline__gte=now  # Filter out expired tests
            ).order_by('-created_at')

        return Test.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit_test(self, request, pk=None):
        """
        Logic to calculate score and save the result.
        Expects data in format: { "answers": { "question_id": selected_option_number }, "is_auto": false }
        """
        test = self.get_object()
        user = request.user

        # Prevent multiple attempts if needed (Optional)
        if TestResult.objects.filter(test=test, student=user).exists():
            return Response({'error': 'You have already attempted this test.'}, status=status.HTTP_400_BAD_REQUEST)

        answers_data = request.data.get('answers', {})
        is_auto = request.data.get('is_auto', False)

        questions = test.questions.all()
        score = 0
        total_q = questions.count()

        for q in questions:
            selected_option = answers_data.get(str(q.id))
            if selected_option and int(selected_option) == q.correct_option:
                score += test.marks_per_question

        # Save Result
        result = TestResult.objects.create(
            test=test,
            student=user,
            score=score,
            total_questions=total_q,
            is_auto_submitted=is_auto
        )

        return Response({
            'message': 'Test submitted successfully',
            'score': score,
            'total_questions': total_q
        }, status=status.HTTP_201_CREATED)


class QuizQuestionViewSet(viewsets.ModelViewSet):
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSerializer
    permission_classes = [IsAdminOrFaculty]  # Only staff can add questions


class TestResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API to view scores.
    - Faculty/Admin: Can view all results for a specific test.
    - Students: Can ONLY view their personal result for a specific test.
    """
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Look for 'test' or 'test_id' in the URL parameters (Fixes frontend mismatch)
        test_id = self.request.query_params.get('test') or self.request.query_params.get('test_id')

        # 1. Logic for Administrators and Staff Members
        if user.is_superuser or user.is_staff:
            if test_id:
                return TestResult.objects.filter(test_id=test_id).order_by('-score')
            return TestResult.objects.all().order_by('-submitted_at')

        # 2. Logic for Students (Strict Privacy)
        # Returns only the results belonging to the logged-in student for a specific test
        if test_id:
            return TestResult.objects.filter(student=user, test_id=test_id).order_by('-submitted_at')

        # Default: Return all personal results if no specific test is requested
        return TestResult.objects.filter(student=user).order_by('-submitted_at')

# ---------------- Q&A MODULE ---------------- #
class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Question.objects.all().order_by('-created_at')
        if hasattr(user, 'profile') and user.profile.course:
            return Question.objects.filter(subject__course=user.profile.course).order_by('-created_at')
        return Question.objects.none()

    def perform_create(self, serializer):
        serializer.save(asked_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser | IsStaffUser])
    def reply(self, request, pk=None):
        question = self.get_object()
        if question.is_resolved:
            return Response({'error': 'Already resolved.'}, status=status.HTTP_400_BAD_REQUEST)
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content required.'}, status=status.HTTP_400_BAD_REQUEST)
        Answer.objects.create(question=question, answered_by=request.user, content=content)
        question.is_resolved = True
        question.save()
        return Response({'status': 'Answered successfully.'}, status=status.HTTP_201_CREATED)


# ---------------- NOTICE BOARD ---------------- #
class NoticeViewSet(viewsets.ModelViewSet):
    """
    Manages system-wide, course-wide, or semester-specific notices.
    """
    serializer_class = NoticeSerializer

    def get_queryset(self):
        """
        Filtering Logic: Students only see notices meant for their specific course and semester,
        or global notices. Admins and Faculties see all notices.
        """
        user = self.request.user

        if user.is_superuser or user.is_staff:
            return Notice.objects.all().order_by('-created_at')

        try:
            profile = UserProfile.objects.get(user=user)
            student_course = profile.course
            student_semester = profile.semester

            # Students see: Global Notices OR Course-wide Notices OR Semester-specific Notices
            return Notice.objects.filter(
                Q(target_course__isnull=True) |
                Q(target_course=student_course, target_semester__isnull=True) |
                Q(target_course=student_course, target_semester=student_semester)
            ).order_by('-created_at')

        except UserProfile.DoesNotExist:
            return Notice.objects.none()

    def perform_create(self, serializer):
        """
        Fixed perform_create to dynamically handle Admin course selection.
        """
        user = self.request.user

        # Retrieve data from frontend request
        req_semester = self.request.data.get('target_semester', None)
        req_course = self.request.data.get('target_course', None)

        target_sem = int(req_semester) if req_semester and str(req_semester).isdigit() else None

        if user.is_superuser:
            # If Admin, dynamically map the selected course
            target_course_obj = None
            if req_course:
                try:
                    target_course_obj = Course.objects.get(id=int(req_course))
                except (Course.DoesNotExist, ValueError):
                    target_course_obj = None

            serializer.save(
                posted_by=user,
                target_course=target_course_obj,
                target_semester=target_sem
            )
        else:
            try:
                # Faculties automatically broadcast to their mapped course
                faculty_profile = UserProfile.objects.get(user=user)
                serializer.save(
                    posted_by=user,
                    target_course=faculty_profile.course,
                    target_semester=target_sem
                )
            except UserProfile.DoesNotExist:
                serializer.save(posted_by=user, target_semester=target_sem)

    def get_permissions(self):
        """
        Strictly applies the custom IsAdminOrFaculty permission for modifications.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrFaculty()]
        return [permissions.IsAuthenticated()]

# ---------------- ADMIN & PROFILE APIS ---------------- #
class PendingUsersAPI(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        pending = User.objects.filter(is_active=False)
        data = [{'id': u.id, 'username': u.username, 'name': f"{u.first_name} {u.last_name}", 'is_staff': u.is_staff, 'course': u.profile.course.name if hasattr(u, 'profile') and u.profile.course else "None"} for u in pending]
        return Response(data)
    def post(self, request):
        user = User.objects.get(id=request.data.get('user_id'), is_active=False)
        if request.data.get('action') == 'approve':
            user.is_active = True
            user.save()
        else:
            user.delete()
        return Response({"message": "User action processed."})

class StudentListAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        students = User.objects.filter(is_active=True, is_staff=False)
        if not user.is_superuser:
            if hasattr(user, 'profile') and user.profile.course:
                students = students.filter(profile__course=user.profile.course)
            else:
                students = User.objects.none()
        data = [{'id': s.id, 'username': s.username, 'name': f"{s.first_name} {s.last_name}", 'course': s.profile.course.name if hasattr(s, 'profile') and s.profile.course else "Unassigned", 'semester': s.profile.semester if hasattr(s, 'profile') else None} for s in students]
        return Response(data)

class UserProfileAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        course_name = 'Master Administrator' if user.is_superuser else 'Unassigned'
        semester = '-'
        change_requested = False
        if hasattr(user, 'profile'):
            course_name = user.profile.course.name if user.profile.course else course_name
            semester = user.profile.semester if user.profile.semester else semester
            change_requested = user.profile.change_requested
        return Response({'username': user.username, 'name': f"{user.first_name} {user.last_name}", 'is_staff': user.is_staff, 'course': course_name, 'semester': semester, 'change_requested': change_requested})
    def post(self, request):
        user = request.user
        if user.is_staff:
            return Response({"error": "Faculty members cannot request semester changes."}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(user, 'profile'):
            try:
                course_obj = Course.objects.get(id=request.data.get('course_id'))
                user.profile.change_requested = True
                user.profile.req_course = course_obj
                user.profile.req_semester = request.data.get('semester')
                user.profile.save()
                return Response({"message": "Profile change request submitted."})
            except Course.DoesNotExist:
                return Response({"error": "Invalid course selection."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

class ProfileChangeApprovalAPI(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        profiles = UserProfile.objects.filter(change_requested=True)
        data = [{'user_id': p.user.id, 'username': p.user.username, 'name': f"{p.user.first_name} {p.user.last_name}", 'current_course': p.course.name if p.course else 'None', 'current_sem': p.semester, 'req_course': p.req_course.name if p.req_course else 'None', 'req_sem': p.req_semester} for p in profiles]
        return Response(data)
    def post(self, request):
        try:
            profile = UserProfile.objects.get(user__id=request.data.get('user_id'), change_requested=True)
            if request.data.get('action') == 'approve':
                profile.course = profile.req_course
                profile.semester = profile.req_semester
            profile.change_requested = False
            profile.req_course = None
            profile.req_semester = None
            profile.save()
            return Response({"message": "Change request processed successfully."})
        except UserProfile.DoesNotExist:
            return Response({"error": "Pending request not found."}, status=status.HTTP_404_NOT_FOUND)

class UserManagementAPI(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        users = User.objects.filter(is_active=True, is_superuser=False)
        data = [{'id': u.id, 'username': u.username, 'name': f"{u.first_name} {u.last_name}", 'is_staff': u.is_staff, 'course': u.profile.course.name if hasattr(u, 'profile') and u.profile.course else "Unassigned", 'sem': u.profile.semester if hasattr(u, 'profile') and not u.is_staff else '-'} for u in users]
        return Response(data)
    def delete(self, request, pk):
        try:
            User.objects.filter(id=pk, is_superuser=False).delete()
            return Response({"message": "User account permanently deleted."})
        except Exception:
            return Response({"error": "Deletion failed."}, status=status.HTTP_400_BAD_REQUEST)