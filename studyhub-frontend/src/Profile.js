import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * Profile Component: Manages user identity details and administrative requests.
 * Modified: Students can now only request Semester changes, not Course changes.
 */
function Profile() {
  const [profile, setProfile] = useState(null);
  const [reqSem, setReqSem] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';

  /**
   * Fetch current user profile details from the backend
   */
  const fetchData = useCallback(() => {
    const config = { headers: { Authorization: `Token ${token}` } };
    axios.get('http://127.0.0.1:8000/api/profile/', config)
      .then(res => {
        setProfile(res.data);
        // Default the request field to current semester for better UX
        if(res.data.semester !== '-') setReqSem(res.data.semester);
      })
      .catch(err => console.error("Profile synchronization error:", err));
  }, [token]);

  useEffect(() => {
    if (!token) navigate('/login'); else fetchData();
  }, [navigate, token, fetchData]);

  /**
   * Action: Submit a semester modification request to the Administrator
   */
  const handleRequestChange = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Token ${token}` } };
      await axios.post('http://127.0.0.1:8000/api/profile/', {
        semester: reqSem,
        // Course ID remains the same as current (No course change allowed)
        course_id: profile.course_id
      }, config);

      alert("Semester update request sent to administration.");
      fetchData(); // Refresh to show pending status
    } catch (err) {
      alert("Failed to process request. Ensure semester value is valid.");
    }
  };

  if (!profile) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status"></div>
      <span className="ms-3 fw-bold text-muted">Synchronizing Profile...</span>
    </div>
  );

  return (
    <div className="pb-5">
      {/* Global Navbar is handled in App.js */}

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">

            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
               <h4 className="fw-bold text-dark mb-0">Profile Configuration</h4>
               <button onClick={() => navigate(-1)} className="btn btn-light btn-sm rounded-pill px-3 border shadow-sm fw-bold">
                 <i className="bi bi-arrow-left me-1"></i> Back
               </button>
            </div>

            {/* IDENTITY OVERVIEW CARD */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 border-top border-primary border-4 transition-hover">
              <div className="card-body p-4">
                <div className="text-center mb-4 pt-2">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-person-badge text-primary fs-1"></i>
                    </div>
                    <h3 className="fw-bolder text-dark mb-1">{profile.name}</h3>
                    <span className="badge bg-light text-primary border border-primary-subtle rounded-pill px-3">
                        {isSuperuser ? 'System Administrator' : profile.is_staff ? 'Faculty Member' : 'Enrolled Student'}
                    </span>
                </div>

                <div className="bg-light rounded-4 p-3 border border-dashed">
                    <div className="row g-3">
                        <div className="col-12 border-bottom pb-2">
                            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{fontSize: '0.7rem'}}>Username / Roll No</small>
                            <span className="fw-bold text-dark">{profile.username}</span>
                        </div>
                        <div className="col-6 pt-2">
                            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{fontSize: '0.7rem'}}>Department</small>
                            <span className="fw-bold text-primary">{profile.course}</span>
                        </div>
                        {!profile.is_staff && !isSuperuser && (
                            <div className="col-6 pt-2 border-start ps-4">
                                <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{fontSize: '0.7rem'}}>Current Semester</small>
                                <span className="fw-bold text-dark">{profile.semester !== '-' ? `Semester ${profile.semester}` : 'Unassigned'}</span>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>

            {/* SEMESTER UPDATE REQUEST (STUDENTS ONLY) */}
            {!profile.is_staff && !isSuperuser && (
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-header bg-white py-3 border-bottom">
                  <h6 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-arrow-repeat me-2 text-primary"></i>Semester Modification
                  </h6>
                </div>
                <div className="card-body p-4">
                  {profile.change_requested ? (
                    <div className="alert alert-warning border-0 shadow-sm rounded-3 py-3 mb-0 d-flex align-items-center">
                      <i className="bi bi-clock-history fs-4 me-3"></i>
                      <div className="small">
                        <strong>Request Pending:</strong> Your request to move to Semester {profile.requested_semester || 'new'} is being reviewed by the admin.
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleRequestChange}>
                      <p className="text-muted small mb-3">
                        Need to update your current semester? Submit a request here. Note: Department changes require direct admin contact.
                      </p>
                      <div className="mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase">Target Semester</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-mortarboard"></i></span>
                            <input
                                type="number"
                                className="form-control bg-light border-0 shadow-none"
                                value={reqSem}
                                onChange={(e) => setReqSem(e.target.value)}
                                required min="1" max="10"
                                placeholder="Enter semester number"
                            />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary w-100 fw-bold py-3 rounded-pill shadow-sm transition-hover">
                        Send Modification Request
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            <div className="text-center mt-4 opacity-50">
                <small className="text-muted">Managed by StudyHub Security Protocols</small>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;