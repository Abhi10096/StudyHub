from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Course, Subject, Document, StudentSubmission, UserProfile
from .serializers import CourseSerializer, SubjectSerializer, DocumentSerializer, StudentSubmissionSerializer
from rest_framework.decorators import action
from .models import Question, Answer
from .serializers import QuestionSerializer

# ---------------- CUSTOM PERMISSIONS ---------------- #
class IsStaffUser(permissions.BasePermission):
    """
    Allows access only to staff users (Teachers).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class CustomAuthToken(ObtainAuthToken):
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
    permission_classes = []

    def post(self, request):
        data = request.data
        username = data.get('username')

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            password=data.get('password'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            is_active=False,
            is_staff=(data.get('role') == 'teacher')
        )

        course_id = data.get('course_id')
        if course_id:
            try:
                course_obj = Course.objects.get(id=course_id)
                UserProfile.objects.create(
                    user=user,
                    course=course_obj,
                    semester=data.get('semester') if data.get('role') == 'student' else None
                )
            except Course.DoesNotExist:
                pass

        return Response({"message": "Registration successful. Pending admin approval."}, status=status.HTTP_201_CREATED)


class PendingUsersAPI(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        pending_users = User.objects.filter(is_active=False)
        data = []
        for u in pending_users:
            course_name = "Unassigned"
            sem = None
            if hasattr(u, 'profile') and u.profile.course:
                course_name = u.profile.course.name
                sem = u.profile.semester

            data.append({
                'id': u.id,
                'username': u.username,
                'name': f"{u.first_name} {u.last_name}",
                'is_staff': u.is_staff,
                'course': course_name,
                'sem': sem
            })
        return Response(data)

    def post(self, request):
        try:
            user = User.objects.get(id=request.data.get('user_id'), is_active=False)
            if request.data.get('action') == 'approve':
                user.is_active = True
                user.save()
            else:
                user.delete()
            return Response({"message": "Action processed successfully."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


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

        data = []
        for s in students:
            course_name = "Unassigned"
            sem = None
            if hasattr(s, 'profile') and s.profile.course:
                course_name = s.profile.course.name
                sem = s.profile.semester

            data.append({
                'id': s.id,
                'username': s.username,
                'name': f"{s.first_name} {s.last_name}",
                'course': course_name,
                'semester': sem
            })
        return Response(data)


class UserProfileAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        course_name = 'Master Administrator' if user.is_superuser else 'Unassigned'
        semester = '-'
        change_requested = False

        if hasattr(user, 'profile'):
            if user.profile.course:
                course_name = user.profile.course.name
            if user.profile.semester:
                semester = user.profile.semester
            change_requested = user.profile.change_requested

        return Response({
            'username': user.username,
            'name': f"{user.first_name} {user.last_name}",
            'is_staff': user.is_staff,
            'course': course_name,
            'semester': semester,
            'change_requested': change_requested
        })

    def post(self, request):
        user = request.user
        if user.is_staff:
            return Response({"error": "Faculty members cannot request semester changes."},
                            status=status.HTTP_400_BAD_REQUEST)

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
        data = []
        for u in users:
            course_name = "Unassigned"
            sem = '-'
            if hasattr(u, 'profile'):
                if u.profile.course:
                    course_name = u.profile.course.name
                if not u.is_staff and u.profile.semester:
                    sem = u.profile.semester

            data.append({
                'id': u.id,
                'username': u.username,
                'name': f"{u.first_name} {u.last_name}",
                'is_staff': u.is_staff,
                'course': course_name,
                'sem': sem
            })
        return Response(data)

    def delete(self, request, pk):
        try:
            User.objects.filter(id=pk, is_superuser=False).delete()
            return Response({"message": "User account permanently deleted."})
        except Exception:
            return Response({"error": "Deletion failed."}, status=status.HTTP_400_BAD_REQUEST)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]


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


# ---------------- Q&A MODULE VIEWS ---------------- #

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admin sees all questions
        if user.is_superuser:
            return Question.objects.all().order_by('-created_at')

        # Teacher and Student see questions from their assigned Course (Department)
        # BUG FIXED: Used `user.profile.course` instead of `user.course`
        if hasattr(user, 'profile') and user.profile.course:
            queryset = Question.objects.filter(subject__course=user.profile.course).order_by('-created_at')
            # If student, strictly filter by their semester too
            if not user.is_staff and user.profile.semester and user.profile.semester != '-':
                queryset = queryset.filter(subject__semester=user.profile.semester)
            return queryset
        return Question.objects.none()

    def perform_create(self, serializer):
        # Automatically set the logged-in student as the asker
        serializer.save(asked_by=self.request.user)

    # Custom API endpoint for teachers to submit an answer
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser | IsStaffUser])
    def reply(self, request, pk=None):
        question = self.get_object()

        if question.is_resolved:
            return Response({'error': 'Question is already resolved.'}, status=status.HTTP_400_BAD_REQUEST)

        content = request.data.get('content')
        if not content:
            return Response({'error': 'Answer content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the Answer and Update the Question in one go
        Answer.objects.create(
            question=question,
            answered_by=request.user,
            content=content
        )
        question.is_resolved = True
        question.save()

        return Response({'status': 'Answer submitted successfully.'}, status=status.HTTP_201_CREATED)