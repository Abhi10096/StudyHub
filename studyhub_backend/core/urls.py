from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, SubjectViewSet, DocumentViewSet, StudentSubmissionViewSet,
    CustomAuthToken, RegisterUserAPI, PendingUsersAPI, StudentListAPI,
    UserProfileAPI, ProfileChangeApprovalAPI, UserManagementAPI,
    QuestionViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'submissions', StudentSubmissionViewSet, basename='submissions')
router.register(r'questions', QuestionViewSet, basename='question')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomAuthToken.as_view(), name='api_login'),
    path('register/', RegisterUserAPI.as_view(), name='api_register'),
    path('pending-users/', PendingUsersAPI.as_view(), name='api_pending_users'),
    path('students/', StudentListAPI.as_view(), name='api_student_list'),
    path('profile/', UserProfileAPI.as_view(), name='api_profile'),
    path('profile-approvals/', ProfileChangeApprovalAPI.as_view(), name='api_profile_approvals'),
    path('manage-users/', UserManagementAPI.as_view(), name='api_manage_users'),
    path('manage-users/<int:pk>/', UserManagementAPI.as_view(), name='api_delete_user'),
]