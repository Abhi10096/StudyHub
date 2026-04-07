import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';
  const courseId = localStorage.getItem('courseId');

  let userRole = "Student";
  if (isSuperuser) userRole = "Administrator";
  else if (isStaff) userRole = "Faculty";

  const handleLogout = () => {
    if (window.confirm("Confirm secure logout?")) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const getCourseLink = () => {
    if (isSuperuser) return "/courses";
    return `/course/${courseId}`;
  };

  return (
    <div className="pb-5">
      {/* Navbar Section */}
      <nav className="navbar navbar-dark bg-dark py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold text-uppercase" style={{ letterSpacing: '1px' }} to="/dashboard">
            StudyHub Portal
          </Link>
          <div className="d-flex align-items-center gap-4">
            <span className="text-light fw-semibold small">Role: <span className="text-info">{userRole}</span></span>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm fw-bold px-3">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <h2 className="mb-4 fw-bold text-dark">System Dashboard</h2>

        <div className="row g-4">

          {/* 1. Academic Curriculum Card */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 border-top border-primary border-4">
              <div className="card-body p-4 d-flex flex-column">
                <h5 className="fw-bold text-dark">Academic Curriculum</h5>
                <p className="text-muted small mb-4">Access assigned courses, study materials, and assignments.</p>
                <Link to={getCourseLink()} className="btn btn-primary w-100 mt-auto fw-bold">Open Portal</Link>
              </div>
            </div>
          </div>

          {/* 2. Discussion Forum (Q&A) Card */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 border-top border-success border-4">
              <div className="card-body p-4 d-flex flex-column">
                <h5 className="fw-bold text-dark">Discussion Forum</h5>
                <p className="text-muted small mb-4">Ask subject-specific questions, clear doubts, and view faculty answers.</p>
                <Link to="/forum" className="btn btn-success w-100 mt-auto fw-bold">Enter Q&A Forum</Link>
              </div>
            </div>
          </div>

          {/* 3. NEW: Official Notice Board Card */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 border-top border-info border-4">
              <div className="card-body p-4 d-flex flex-column">
                <h5 className="fw-bold text-dark">Official Notices</h5>
                <p className="text-muted small mb-4">Stay updated with college announcements, exam schedules, and events.</p>
                <Link to="/notices" className="btn btn-info text-white w-100 mt-auto fw-bold">View Notice Board</Link>
              </div>
            </div>
          </div>

          {/* 4. Account Profile Card */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body p-4 d-flex flex-column">
                <h5 className="fw-bold text-dark">Account Profile</h5>
                <p className="text-muted small mb-4">View personal details or submit modification requests.</p>
                <Link to="/profile" className="btn btn-outline-dark w-100 mt-auto fw-bold">View Configuration</Link>
              </div>
            </div>
          </div>

          {/* 5. Student Directory (Teachers & Admin Only) */}
          {(isSuperuser || isStaff) && (
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body p-4 d-flex flex-column">
                  <h5 className="fw-bold text-dark">Student Directory</h5>
                  <p className="text-muted small mb-4">Review enrolled students mapped to your department.</p>
                  <Link to="/students" className="btn btn-secondary w-100 mt-auto fw-bold">View Roster</Link>
                </div>
              </div>
            </div>
          )}

          {/* 6. Registration Approvals (Admin Only) */}
          {isSuperuser && (
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 border-top border-warning border-4">
                <div className="card-body p-4 d-flex flex-column">
                  <h5 className="fw-bold text-dark">Registration Approvals</h5>
                  <p className="text-muted small mb-4">Authorize pending student accounts and profile changes.</p>
                  <Link to="/approvals" className="btn btn-warning text-dark w-100 mt-auto fw-bold">Manage Approvals</Link>
                </div>
              </div>
            </div>
          )}

          {/* 7. Global User Authority (Admin Only) */}
          {isSuperuser && (
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 border-top border-danger border-4">
                <div className="card-body p-4 d-flex flex-column">
                  <h5 className="fw-bold text-dark">Global User Authority</h5>
                  <p className="text-muted small mb-4">Complete directory control. Remove active accounts permanently.</p>
                  <Link to="/manage-users" className="btn btn-danger w-100 mt-auto fw-bold">Control Panel</Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;