TUDYHUB: A Unified Faculty-Student Portal 🎓
STUDYHUB is a modern educational platform developed to streamline communication and resource sharing between faculty members and students at SIMMC, Pune.

🚀 Key Features
Role-Based Access Control: Dedicated dashboards for Admin, Faculty, and Students.

Resource Management: Faculty can upload study materials (PDFs/Docs), and students can view/download them.

Assignment System: Online assignment submission and grading functionality.

Notice Board: Real-time updates for important college announcements.

Discussion Forum: A centralized platform for subject-specific queries and academic discussions.

🛠️ Tech Stack
Backend: Django, Django REST Framework (Python)

Frontend: React.js, Bootstrap 5

Database: SQLite (Development) / PostgreSQL (Production)

Authentication: JWT (JSON Web Tokens) using dj-rest-auth and django-allauth.

📂 Project Structure
studyhub_backend/: Contains the Django logic, models, and API endpoints.

studyhub-frontend/: Contains the React.js user interface and state management.

⚙️ Setup Instructions
1. Clone the Repository
Bash
git clone https://github.com/Abhi10096/StudyHub.git
cd StudyHub
2. Backend Setup
Bash
# Activate your virtual environment
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and start server
python manage.py migrate
python manage.py runserver
3. Frontend Setup
Bash
cd studyhub-frontend
npm install
npm start
Developed by: Abhishek

Course: Master of Computer Applications (MCA)

Institute: SIMMC, Pune

How to update this on GitHub:
After saving the file, run these commands in your terminal:

git add README.md

git commit -m "Added professional English README"

git push