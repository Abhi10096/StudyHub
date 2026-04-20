import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Dashboard Component: The central hub of the StudyHub portal.
 * Displays different functional modules based on user roles (Admin, Faculty, Student).
 */
function Dashboard() {
  const navigate = useNavigate();

  // Role extraction from localStorage
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';
  const courseId = localStorage.getItem('courseId');

  // Role labeling for UI display
  let userRole = "Student";
  if (isSuperuser) userRole = "Administrator";
  else if (isStaff) userRole = "Faculty";

  /**
   * Logic to determine the correct curriculum entry point.
   * Admins see all courses, while Students/Faculty go to their assigned course.
   */
  const getCourseLink = () => {
    if (isSuperuser) return "/courses";
    return `/course/${courseId}`;
  };

  return (
    <div className="pb-5 bg-light min-vh-100">

      {/* NOTE: Local Navbar removed to avoid redundancy.
          The Global Navbar from App.js handles primary navigation.
      */}

      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-0">System Dashboard</h2>
            <p className="text-muted mb-0">Welcome back! You are logged in as <span className="text-primary fw-bold">{userRole}</span></p>
          </div>
          <i className="bi bi-speedometer2 fs-1 text-secondary opacity-25"></i>
        </div>

        <div className="row g-4">

          {/* MODULE 1: ACADEMIC CURRICULUM */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 border-top border-primary border-4 transition-hover">
              <div className="card-body p-4 d-flex flex-column">
                <div className="mb-3 text-primary"><i className="bi bi-book fs-3"></i></div>
                <h5 className="fw-bold text-dark">Academic Curriculum</h5>
                <p className="text-muted small mb-4">Access assigned courses, subject materials, and uploaded assignments.</p>
                <Link to={getCourseLink()} className="btn btn-primary w-100 mt-auto fw-bold rounded-pill">Open Portal</Link>
              </div>
            </div>
          </div>

          {/* MODULE 2: DISCUSSION FORUM (Q&A) */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 border-top border-success border-4 transition-hover">
              <div className="card-body p-4 d-flex flex-column">
                <div className="mb-3 text-success"><i className="bi bi-chat-dots fs-3"></i></div>
                <h5 className="fw-bold text-dark">Discussion Forum</h5>
                <p className="text-muted small mb-4">Post subject-specific queries and interact with faculty members.</p>
                <Link to="/forum" className="btn btn-success w-100 mt-auto fw-bold rounded-pill">Enter Q&A Forum</Link>
              </div>
            </div>
          </div>

          {/* MODULE 3: OFFICIAL NOTICE BOARD */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 border-top border-info border-4 transition-hover">
              <div className="card-body p-4 d-flex flex-column">
                <div className="mb-3 text-info"><i className="bi bi-megaphone fs-3"></i></div>
                <h5 className="fw-bold text-dark">Official Notices</h5>
                <p className="text-muted small mb-4">View latest announcements, exam dates, and official college events.</p>
                <Link to="/notices" className="btn btn-info text-white w-100 mt-auto fw-bold rounded-pill">View Notices</Link>
              </div>
            </div>
          </div>

          {/* MODULE 4: ONLINE ASSESSMENTS (New Integration) */}
          {/* Note: Students and Faculty can access their specific test contexts here or via Subject Detail */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 border-top border-danger border-4 transition-hover">
              <div className="card-body p-4 d-flex flex-column">
                <div className="mb-3 text-danger"><i className="bi bi-pencil-square fs-3"></i></div>
                <h5 className="fw-bold text-dark">Online Assessments</h5>
                <p className="text-muted small mb-4">Participate in scheduled tests or manage question banks.</p>
                <Link to={getCourseLink()} className="btn btn-danger w-100 mt-auto fw-bold rounded-pill">Access Tests</Link>
              </div>
            </div>
          </div>

          {/* MODULE 5: ACCOUNT PROFILE */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 transition-hover">
              <div className="card-body p-4 d-flex flex-column">
                <div className="mb-3 text-dark"><i className="bi bi-person-gear fs-3"></i></div>
                <h5 className="fw-bold text-dark">Account Profile</h5>
                <p className="text-muted small mb-4">Manage personal identity details and track account status.</p>
                <Link to="/profile" className="btn btn-outline-dark w-100 mt-auto fw-bold rounded-pill">Manage Profile</Link>
              </div>
            </div>
          </div>

          {/* --- ADMINISTRATIVE MODULES (RESTRICTED ACCESS) --- */}

          {/* MODULE 6: STUDENT DIRECTORY (Faculty & Admin) */}
          {(isSuperuser || isStaff) && (
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 border-top border-secondary border-4 transition-hover">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="mb-3 text-secondary"><i className="bi bi-people fs-3"></i></div>
                  <h5 className="fw-bold text-dark">Student Directory</h5>
                  <p className="text-muted small mb-4">Administrative view of all enrolled students within your department.</p>
                  <Link to="/students" className="btn btn-secondary w-100 mt-auto fw-bold rounded-pill">View Roster</Link>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 7: REGISTRATION APPROVALS (Admin Only) */}
          {isSuperuser && (
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 border-top border-warning border-4 transition-hover">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="mb-3 text-warning"><i className="bi bi-shield-check fs-3"></i></div>
                  <h5 className="fw-bold text-dark">User Approvals</h5>
                  <p className="text-muted small mb-4">Authorize pending student registrations and profile update requests.</p>
                  <Link to="/approvals" className="btn btn-warning text-dark w-100 mt-auto fw-bold rounded-pill">Manage Requests</Link>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 8: GLOBAL AUTHORITY (Admin Only) */}
          {isSuperuser && (
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 border-top border-dark border-4 transition-hover">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="mb-3 text-dark"><i className="bi bi-exclamation-octagon fs-3"></i></div>
                  <h5 className="fw-bold text-dark">System Authority</h5>
                  <p className="text-muted small mb-4">Complete control over user database and system-wide account removals.</p>
                  <Link to="/manage-users" className="btn btn-dark w-100 mt-auto fw-bold rounded-pill">Control Panel</Link>
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