from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from rest_framework.decorators import action

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

        # Safely extract profile details if they exist
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

        # Create user instance
        user = User.objects.create_user(
            username=username, password=data.get('password'),
            first_name=data.get('first_name'), last_name=data.get('last_name'),
            is_active=False, is_staff=(data.get('role') == 'teacher')
        )

        course_id = data.get('course_id')
        if course_id:
            try:
                course_obj = Course.objects.get(id=course_id)
                # Assign semester only if the user is a student
                UserProfile.objects.create(
                    user=user, course=course_obj,
                    semester=data.get('semester') if data.get('role') == 'student' else None
                )
            except Course.DoesNotExist:
                pass

        return Response({"message": "Registration successful. Pending admin approval."}, status=status.HTTP_201_CREATED)


# ---------------- ACADEMIC MODULE ---------------- #
class CourseViewSet(viewsets.ModelViewSet):
    """
    Manages Course data. Open to authenticated users for reading.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class SubjectViewSet(viewsets.ModelViewSet):
    """
    Manages Subject data dynamically based on the requesting user's role and profile.
    """
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 1. Master Admins see all subjects in the database
        if user.is_superuser:
            return Subject.objects.all()

        if hasattr(user, 'profile') and user.profile.course:
            # 2. Faculty (Teachers) see ALL subjects related to their assigned course
            if user.is_staff:
                return Subject.objects.filter(course=user.profile.course)

            # 3. Students see ONLY subjects explicitly matching their course and semester
            if user.profile.semester and user.profile.semester != '-':
                return Subject.objects.filter(
                    course=user.profile.course,
                    semester=user.profile.semester
                )

            # Fallback: If a student has no valid semester assigned, show their course subjects
            return Subject.objects.filter(course=user.profile.course)

        # Default fallback for users with incomplete profiles
        return Subject.objects.none()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        user = request.user
        path_name = "Academic Curriculum"

        if hasattr(user, 'profile') and user.profile.course:
            # Generate a dynamic breadcrumb path based on the user's role
            if not user.is_staff and user.profile.semester and user.profile.semester != '-':
                path_name = f"{user.profile.course.name} > Semester {user.profile.semester}"
            else:
                path_name = f"{user.profile.course.name} Department"

        return Response({
            'current_path': path_name,
            'results': response.data
        })


class DocumentViewSet(viewsets.ModelViewSet):
    """
    Manages study materials and assignments.
    """
    queryset = Document.objects.all().order_by('-uploaded_at')
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentSubmissionViewSet(viewsets.ModelViewSet):
    """
    Manages student assignment submissions. Includes filtering for specific assignments.
    """
    serializer_class = StudentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StudentSubmission.objects.all().order_by('-submitted_at')
        assignment_id = self.request.query_params.get('assignment', None)

        # Filter by a specific assignment if requested
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)

        # Filter to show only the logged-in student's submissions
        if self.request.query_params.get('my_submissions') == 'true':
            queryset = queryset.filter(student=self.request.user)

        return queryset

    def perform_create(self, serializer):
        # Automatically attach the requesting user as the submitter
        serializer.save(student=self.request.user)


# ---------------- Q&A MODULE ---------------- #
class QuestionViewSet(viewsets.ModelViewSet):
    """
    Manages the discussion forum questions.
    """
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Question.objects.all().order_by('-created_at')

        # Restrict visibility to questions within the user's assigned course
        if hasattr(user, 'profile') and user.profile.course:
            return Question.objects.filter(subject__course=user.profile.course).order_by('-created_at')

        return Question.objects.none()

    def perform_create(self, serializer):
        # Automatically set the author of the question
        serializer.save(asked_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser | IsStaffUser])
    def reply(self, request, pk=None):
        """
        Custom endpoint allowing faculty/admins to reply to a specific question.
        """
        question = self.get_object()
        if question.is_resolved:
            return Response({'error': 'Already resolved.'}, status=status.HTTP_400_BAD_REQUEST)

        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the answer and mark the parent question as resolved
        Answer.objects.create(question=question, answered_by=request.user, content=content)
        question.is_resolved = True
        question.save()
        return Response({'status': 'Answered successfully.'}, status=status.HTTP_201_CREATED)


# ---------------- NOTICE BOARD ---------------- #
class NoticeViewSet(viewsets.ModelViewSet):
    """
    Manages system-wide or course-wide notices.
    """
    queryset = Notice.objects.all().order_by('-created_at')
    serializer_class = NoticeSerializer

    def perform_create(self, serializer):
        # Automatically set the poster as the current authenticated user
        serializer.save(posted_by=self.request.user)

    def get_permissions(self):
        # 🔥 THE FIX: Combine the classes first, THEN instantiate the combined result
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Combine IsAdminUser OR IsStaffUser into a single permission object
            AdminOrStaffPermission = permissions.IsAdminUser | IsStaffUser
            return [permissions.IsAuthenticated(), AdminOrStaffPermission()]

        # Anyone authenticated can view notices
        return [permissions.IsAuthenticated()]
# ---------------- ADMIN & PROFILE APIS ---------------- #
class PendingUsersAPI(APIView):
    """
    Retrieves and processes user accounts that are awaiting admin approval.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        pending = User.objects.filter(is_active=False)
        data = [{
            'id': u.id,
            'username': u.username,
            'name': f"{u.first_name} {u.last_name}",
            'is_staff': u.is_staff,
            'course': u.profile.course.name if hasattr(u, 'profile') and u.profile.course else "None"
        } for u in pending]
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
    """
    Retrieves a directory of active students, filtered by the requesting user's course.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        students = User.objects.filter(is_active=True, is_staff=False)

        # Filter students by the requesting user's course unless they are a superuser
        if not user.is_superuser:
            if hasattr(user, 'profile') and user.profile.course:
                students = students.filter(profile__course=user.profile.course)
            else:
                students = User.objects.none()

        data = [{
            'id': s.id,
            'username': s.username,
            'name': f"{s.first_name} {s.last_name}",
            'course': s.profile.course.name if hasattr(s, 'profile') and s.profile.course else "Unassigned",
            'semester': s.profile.semester if hasattr(s, 'profile') else None
        } for s in students]
        return Response(data)


class UserProfileAPI(APIView):
    """
    Retrieves logged-in user details and handles semester/course change requests.
    """
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

        return Response({
            'username': user.username, 'name': f"{user.first_name} {user.last_name}",
            'is_staff': user.is_staff, 'course': course_name,
            'semester': semester, 'change_requested': change_requested
        })

    def post(self, request):
        user = request.user

        # Faculty cannot request semester changes
        if user.is_staff:
            return Response({"error": "Faculty members cannot request semester changes."},
                            status=status.HTTP_400_BAD_REQUEST)

        if hasattr(user, 'profile'):
            try:
                course_obj = Course.objects.get(id=request.data.get('course_id'))
                # Flag the user profile as pending an update
                user.profile.change_requested = True
                user.profile.req_course = course_obj
                user.profile.req_semester = request.data.get('semester')
                user.profile.save()
                return Response({"message": "Profile change request submitted."})
            except Course.DoesNotExist:
                return Response({"error": "Invalid course selection."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)


class ProfileChangeApprovalAPI(APIView):
    """
    Allows admins to review and approve/deny student requests to change their course or semester.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        profiles = UserProfile.objects.filter(change_requested=True)
        data = []
        for p in profiles:
            data.append({
                'user_id': p.user.id,
                'username': p.user.username,
                'name': f"{p.user.first_name} {p.user.last_name}",
                'current_course': p.course.name if p.course else 'None',
                'current_sem': p.semester,
                'req_course': p.req_course.name if p.req_course else 'None',
                'req_sem': p.req_semester
            })
        return Response(data)

    def post(self, request):
        try:
            profile = UserProfile.objects.get(user__id=request.data.get('user_id'), change_requested=True)

            # Apply changes if approved
            if request.data.get('action') == 'approve':
                profile.course = profile.req_course
                profile.semester = profile.req_semester

            # Clear the request flags regardless of approval or denial
            profile.change_requested = False
            profile.req_course = None
            profile.req_semester = None
            profile.save()
            return Response({"message": "Change request processed successfully."})
        except UserProfile.DoesNotExist:
            return Response({"error": "Pending request not found."}, status=status.HTTP_404_NOT_FOUND)


class UserManagementAPI(APIView):
    """
    Allows admins to view all active users and delete accounts if necessary.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.filter(is_active=True, is_superuser=False)
        data = [{
            'id': u.id,
            'username': u.username,
            'name': f"{u.first_name} {u.last_name}",
            'is_staff': u.is_staff,
            'course': u.profile.course.name if hasattr(u, 'profile') and u.profile.course else "Unassigned",
            'sem': u.profile.semester if hasattr(u, 'profile') and not u.is_staff else '-'
        } for u in users]
        return Response(data)

    def delete(self, request, pk):
        try:
            # Delete the specified user, ensuring superusers cannot be deleted via this endpoint
            User.objects.filter(id=pk, is_superuser=False).delete()
            return Response({"message": "User account permanently deleted."})
        except Exception:
            return Response({"error": "Deletion failed."}, status=status.HTTP_400_BAD_REQUEST)