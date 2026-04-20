import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * ViewSubmissions Component: Allows Faculty members to review and download
 * assignments submitted by students for a specific task.
 */
function ViewSubmissions() {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isStaff = localStorage.getItem('isStaff') === 'true' || localStorage.getItem('isSuperuser') === 'true';

  /**
   * Fetches all student submissions linked to the current assignment ID.
   */
  const fetchSubmissions = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Token ${token}` } };
      const response = await axios.get(`http://127.0.0.1:8000/api/submissions/?assignment=${assignmentId}`, config);
      setSubmissions(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Critical: Failed to sync submissions", error);
      setLoading(false);
    }
  }, [assignmentId, token]);

  useEffect(() => {
    // Security Guard: Verify authentication and Faculty/Admin roles
    if (!token) {
      navigate('/login');
    } else if (!isStaff) {
      alert("Access Denied: Administrative privileges required.");
      navigate('/dashboard');
    } else {
      fetchSubmissions();
    }
  }, [navigate, token, isStaff, fetchSubmissions]);

  // Utility to handle absolute file paths
  const getFileUrl = (path) => {
    if (!path) return '#';
    return path.startsWith('http') ? path : `http://127.0.0.1:8000${path}`;
  };

  if (!isStaff) return null;

  return (
    <div className="pb-5">
      {/* Global Navbar is inherited from App.js */}

      <div className="container mt-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-0">Submission Repository</h2>
            <p className="text-muted small mb-0">Reviewing student uploads for Assignment ID: <span className="fw-bold">#{assignmentId}</span></p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-light btn-sm rounded-pill px-3 border shadow-sm fw-bold">
            <i className="bi bi-arrow-left me-1"></i> Return
          </button>
        </div>

        {/* Submissions Table Card */}
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
          <div className="card-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold small text-uppercase letter-spacing-1">Student Uploads</h6>
            <span className="badge bg-primary rounded-pill px-3">{submissions.length} Total</span>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5">
                 <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                 <span className="text-muted fw-bold">Loading records...</span>
              </div>
            ) : submissions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light border-0">
                    <tr>
                      <th className="px-4 py-3 small text-muted text-uppercase fw-bold">#</th>
                      <th className="py-3 small text-muted text-uppercase fw-bold">Roll Number</th>
                      <th className="py-3 small text-muted text-uppercase fw-bold">Student Identity</th>
                      <th className="py-3 small text-muted text-uppercase fw-bold">Timestamp</th>
                      <th className="px-4 py-3 text-end small text-muted text-uppercase fw-bold">File Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, index) => (
                      <tr key={sub.id} className="border-bottom">
                        <td className="px-4 py-3 fw-bold text-muted">{index + 1}</td>
                        <td className="py-3 fw-bold text-dark">{sub.roll_no}</td>
                        <td className="py-3 fw-bold text-primary d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-person-fill small"></i>
                          </div>
                          {sub.student_name}
                        </td>
                        <td className="py-3 text-muted small fw-semibold">
                          <i className="bi bi-clock-history me-1"></i> {new Date(sub.submitted_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <a
                            href={getFileUrl(sub.submission_file)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-success fw-bold rounded-pill px-4 transition-hover"
                          >
                            <i className="bi bi-file-earmark-pdf-fill me-1"></i> View Work
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted opacity-25 d-block mb-3"></i>
                <h5 className="text-muted fw-bold">No submissions found.</h5>
                <p className="text-muted small">Students haven't uploaded their work for this assignment yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewSubmissions;