from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet,
    SubjectViewSet,
    DocumentViewSet,
    StudentSubmissionViewSet,
    CustomAuthToken,
    RegisterUserAPI,
    PendingUsersAPI,
    StudentListAPI,
    UserProfileAPI,
    ProfileChangeApprovalAPI,
    UserManagementAPI,
    QuestionViewSet,
    NoticeViewSet,
    # NEW: Test Module ViewSets
    TestViewSet,
    QuizQuestionViewSet,
    TestResultViewSet
)

# Initialize the REST Framework Router
router = DefaultRouter()

# Academic & Resource Module
router.register(r'courses', CourseViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'submissions', StudentSubmissionViewSet, basename='submission')

# Q&A and Notice Board Module
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'notices', NoticeViewSet, basename='notice')

# ---------------- NEW: Online Test Module Routes ---------------- #
router.register(r'tests', TestViewSet, basename='test')
router.register(r'quiz-questions', QuizQuestionViewSet, basename='quiz-question')
router.register(r'test-results', TestResultViewSet, basename='test-result')

urlpatterns = [
    # Include all auto-generated API endpoints from the router
    path('', include(router.urls)),

    # Authentication & User Management Endpoints
    path('login/', CustomAuthToken.as_view(), name='api_login'),
    path('register/', RegisterUserAPI.as_view(), name='api_register'),
    path('pending-users/', PendingUsersAPI.as_view(), name='api_pending_users'),
    path('students/', StudentListAPI.as_view(), name='api_student_list'),
    path('profile/', UserProfileAPI.as_view(), name='api_profile'),

    # Administration & Approval Endpoints
    path('profile-approvals/', ProfileChangeApprovalAPI.as_view(), name='api_profile_approvals'),
    path('manage-users/', UserManagementAPI.as_view(), name='api_manage_users'),
    path('manage-users/<int:pk>/', UserManagementAPI.as_view(), name='api_delete_user'),
]