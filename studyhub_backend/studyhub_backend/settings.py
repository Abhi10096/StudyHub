"""
Django settings for studyhub_backend project.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-eu#6ahfxi)c@-)bjn1x5i@rpr0yd02*m7+_f6gb*sa!u)8x0%u'

DEBUG = True

ALLOWED_HOSTS = ['65.2.141.239', 'studyhubfrontend.vercel.app', 'localhost', '127.0.0.1']
# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'dj_rest_auth.registration',
]

SITE_ID = 1

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # ADDED THIS: Required for allauth to function
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'studyhub_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'studyhub_backend.wsgi.application'

# New AWS RDS PostgreSQL Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',  # This is the default database name created by AWS RDS
        'USER': 'postgres',  # The Master username you set in AWS
        'PASSWORD': 'Abhi1840',  # password you created
        'HOST': 'studyhub-db.cp6k22yce23w.ap-south-1.rds.amazonaws.com',  # Paste your RDS Endpoint string here
        'PORT': '5432',  # Default port for PostgreSQL
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = False
# He CORS sathi aahe (Backend la sangte ki ya frontend la allow kar)
CORS_ALLOWED_ORIGINS = [
    "https://studyhubfrontend.vercel.app",
]
# Media Settings
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Authentication Backend Settings
# Required to allow login using username or email
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Simple Auth settings
ACCOUNT_EMAIL_VERIFICATION = 'none' # Skip email confirmation for now
ACCOUNT_AUTHENTICATION_METHOD = 'username'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
ACCOUNT_LOGIN_METHODS = {'username'}