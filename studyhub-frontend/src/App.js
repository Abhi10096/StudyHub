import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Global layout components
import Navbar from './Navbar';
import Footer from './Footer';

// Page-level components
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Approvals from './Approvals';
import UserManagement from './UserManagement';
import StudentList from './StudentList';
import Courses from './Courses';
import Subjects from './Subjects';
import SubjectDetail from './SubjectDetail';
import ViewSubmissions from './ViewSubmissions';
import DiscussionForum from './DiscussionForum';
import NoticeList from './NoticeList';

// Online Test Module Components
import CreateTest from './CreateTest';
import TakeTest from './TakeTest';
import TestScores from './TestScores';

function App() {
  return (
    <Router>
      {/* Main wrapper with Flexbox to keep footer at the bottom */}
      <div className="App bg-light min-vh-100 d-flex flex-column">

        <Navbar />

        {/* Main Content Area */}
        <main className="flex-grow-1 container mt-4 mb-5">
          <Routes>
            {/* Authentication and User Profile Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            {/* Administrator and User Management Routes */}
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/manage-users" element={<UserManagement />} />
            <Route path="/students" element={<StudentList />} />

            {/* Academic Curriculum and Subject Details Routes */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:courseId" element={<Subjects />} />
            <Route path="/subject/:subjectName" element={<SubjectDetail />} />

            {/* Assignments, Discussion Forum, and Notice Board Routes */}
            <Route path="/submissions/:assignmentId" element={<ViewSubmissions />} />
            <Route path="/forum" element={<DiscussionForum />} />
            <Route path="/notices" element={<NoticeList />} />

            {/* Online Test Module Routes */}
            <Route path="/create-test" element={<CreateTest />} />
            <Route path="/take-test/:testId" element={<TakeTest />} />

            {/*  Route to view student performance/scores */}
            <Route path="/test-scores/:testId" element={<TestScores />} />

          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;