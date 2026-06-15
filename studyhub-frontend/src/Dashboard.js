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
      <div className="pb-2 bg-light">
      {/* NOTE: Local Navbar removed to avoid redundancy.
          The Global Navbar from App.js handles primary navigation.
      */}

      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-0">System Dashboard</h3>
            <p className="text-muted small mb-0">Welcome back! You are logged in as <span className="text-primary fw-bold">{userRole}</span></p>
          </div>
          <i className="bi bi-speedometer2 fs-2 text-secondary opacity-25"></i>
        </div>

        <div className="row g-3">

          {/* MODULE 1: ACADEMIC CURRICULUM */}
          <div className="col-md-6 col-lg-3"> {/* येथे बदल केला: 4 कार्ड्स प्रति लाईन */}
            <div className="card h-100 shadow-sm border-0 border-top border-primary border-3 transition-hover">
              <div className="card-body p-3 d-flex flex-column">
                <div className="mb-2 text-primary"><i className="bi bi-book fs-4"></i></div>
                <h6 className="fw-bold text-dark mb-2">Academic Curriculum</h6>
                <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>Access courses, study materials, and assignments.</p>
                <Link to={getCourseLink()} className="btn btn-primary btn-sm w-100 mt-auto fw-bold rounded-pill">Open Portal</Link>
              </div>
            </div>
          </div>

          {/* MODULE 2: DISCUSSION FORUM (Q&A) */}
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 shadow-sm border-0 border-top border-success border-3 transition-hover">
              <div className="card-body p-3 d-flex flex-column">
                <div className="mb-2 text-success"><i className="bi bi-chat-dots fs-4"></i></div>
                <h6 className="fw-bold text-dark mb-2">Discussion Forum</h6>
                <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>Post queries and interact with faculty.</p>
                <Link to="/forum" className="btn btn-success btn-sm w-100 mt-auto fw-bold rounded-pill">Enter Q&A Forum</Link>
              </div>
            </div>
          </div>

          {/* MODULE 3: OFFICIAL NOTICE BOARD */}
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 shadow-sm border-0 border-top border-info border-3 transition-hover">
              <div className="card-body p-3 d-flex flex-column">
                <div className="mb-2 text-info"><i className="bi bi-megaphone fs-4"></i></div>
                <h6 className="fw-bold text-dark mb-2">Official Notices</h6>
                <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>View latest announcements and official events.</p>
                <Link to="/notices" className="btn btn-info text-white btn-sm w-100 mt-auto fw-bold rounded-pill">View Notices</Link>
              </div>
            </div>
          </div>

          {/* MODULE 4: ONLINE ASSESSMENTS (New Integration) */}
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 shadow-sm border-0 border-top border-danger border-3 transition-hover">
              <div className="card-body p-3 d-flex flex-column">
                <div className="mb-2 text-danger"><i className="bi bi-pencil-square fs-4"></i></div>
                <h6 className="fw-bold text-dark mb-2">Online Assessments</h6>
                <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>Take scheduled tests or manage question banks.</p>
                <Link to={getCourseLink()} className="btn btn-danger btn-sm w-100 mt-auto fw-bold rounded-pill">Access Tests</Link>
              </div>
            </div>
          </div>

          {/* MODULE 5: ACCOUNT PROFILE */}
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 shadow-sm border-0 border-top border-secondary border-3 transition-hover">
              <div className="card-body p-3 d-flex flex-column">
                <div className="mb-2 text-secondary"><i className="bi bi-person-gear fs-4"></i></div>
                <h6 className="fw-bold text-dark mb-2">Account Profile</h6>
                <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>Manage profile details and track account status.</p>
                <Link to="/profile" className="btn btn-outline-secondary btn-sm w-100 mt-auto fw-bold rounded-pill">Manage Profile</Link>
              </div>
            </div>
          </div>

          {/* --- ADMINISTRATIVE MODULES (RESTRICTED ACCESS) --- */}

          {/* MODULE 6: STUDENT DIRECTORY (Faculty & Admin) */}
          {(isSuperuser || isStaff) && (
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-primary border-3 transition-hover">
                <div className="card-body p-3 d-flex flex-column">
                  <div className="mb-2 text-primary"><i className="bi bi-people fs-4"></i></div>
                  <h6 className="fw-bold text-dark mb-2">Student Directory</h6>
                  <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>View enrolled students in your department.</p>
                  <Link to="/students" className="btn btn-primary btn-sm w-100 mt-auto fw-bold rounded-pill">View Roster</Link>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 7: REGISTRATION APPROVALS (Admin Only) */}
          {isSuperuser && (
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-warning border-3 transition-hover">
                <div className="card-body p-3 d-flex flex-column">
                  <div className="mb-2 text-warning"><i className="bi bi-shield-check fs-4"></i></div>
                  <h6 className="fw-bold text-dark mb-2">User Approvals</h6>
                  <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>Authorize pending registrations and requests.</p>
                  <Link to="/approvals" className="btn btn-warning text-dark btn-sm w-100 mt-auto fw-bold rounded-pill">Manage Requests</Link>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 8: GLOBAL AUTHORITY (Admin Only) */}
          {isSuperuser && (
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-dark border-3 transition-hover">
                <div className="card-body p-3 d-flex flex-column">
                  <div className="mb-2 text-dark"><i className="bi bi-exclamation-octagon fs-4"></i></div>
                  <h6 className="fw-bold text-dark mb-2">System Authority</h6>
                  <p className="text-muted small mb-3" style={{fontSize: "0.85rem"}}>Complete control over user accounts and data.</p>
                  <Link to="/manage-users" className="btn btn-dark btn-sm w-100 mt-auto fw-bold rounded-pill">Control Panel</Link>
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