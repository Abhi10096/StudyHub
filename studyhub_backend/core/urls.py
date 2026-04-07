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
    NoticeViewSet
)

# Initialize the REST Framework Router
router = DefaultRouter()

# ViewSets with a static 'queryset' attribute do not require a basename
router.register(r'courses', CourseViewSet)
router.register(r'documents', DocumentViewSet)

# ViewSets that use a custom 'get_queryset()' method MUST have a manually defined 'basename'
router.register(r'subjects', SubjectViewSet, basename='subject') # <-- FIXED: Added basename here to prevent the AssertionError
router.register(r'submissions', StudentSubmissionViewSet, basename='submission')
router.register(r'questions', QuestionViewSet, basename='question')

# NoticeViewSet has a static queryset, so defining a basename is optional but safe to keep
router.register(r'notices', NoticeViewSet, basename='notice')

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