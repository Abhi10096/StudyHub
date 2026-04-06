import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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

function App() {
  return (
    <Router>
      <div className="App bg-light min-vh-100">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/manage-users" element={<UserManagement />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/course/:courseId" element={<Subjects />} />
          <Route path="/subject/:subjectName" element={<SubjectDetail />} />
          <Route path="/submissions/:assignmentId" element={<ViewSubmissions />} />
          <Route path="/forum" element={<DiscussionForum />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;