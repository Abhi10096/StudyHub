import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * Approvals Component: Specialized administrative interface for
 * vetting new user registrations and academic profile modifications.
 */
function Approvals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  /**
   * Fetches pending applications and profile update requests.
   */
  const fetchData = useCallback(async () => {
    const config = { headers: { Authorization: `Token ${token}` } };
    setLoading(true);
    try {
      const pendingRes = await axios.get('http://127.0.0.1:8000/api/pending-users/', config);
      setPendingUsers(pendingRes.data);

      const requestsRes = await axios.get('http://127.0.0.1:8000/api/profile-approvals/', config);
      setChangeRequests(requestsRes.data);

      setLoading(false);
    } catch (err) {
      console.error("Administrative Sync Error:", err);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Security Guard: Restrict access to Root Administrators only
    if (!token || localStorage.getItem('isSuperuser') !== 'true') {
      navigate('/dashboard');
    } else {
      fetchData();
    }
  }, [navigate, token, fetchData]);

  /**
   * Universal handler for administrative approval/rejection actions.
   */
  const handleAction = async (endpoint, payload) => {
    if (window.confirm("Confirm this administrative decision?")) {
      try {
        await axios.post(endpoint, payload, { headers: { Authorization: `Token ${token}` } });
        fetchData(); // Refresh lists post-action
      } catch (error) {
        alert("Execution Error: Action could not be processed.");
      }
    }
  };

  // Safe Filter Logic
  const filteredPending = pendingUsers.filter(u => (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredChanges = changeRequests.filter(req => (req.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="pb-5">
      {/* Global Navbar is handled in App.js */}

      <div className="container mt-4">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-0">Decision Center</h2>
            <p className="text-muted small mb-0">Authorize user registrations and academic profile transfers</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-light btn-sm rounded-pill px-3 border shadow-sm fw-bold">
            <i className="bi bi-arrow-left me-1"></i> Dashboard
          </button>
        </div>

        {/* Search Panel */}
        <div className="card shadow-sm border-0 mb-5 p-3 rounded-4 bg-white border-start border-primary border-5">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-0"><i className="bi bi-search"></i></span>
                <input type="search" className="form-control border-0 bg-light rounded-pill px-3 shadow-none"
                       placeholder="Search by applicant name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: PROFILE MODIFICATIONS */}
        <div className="mb-5">
          <h5 className="fw-bold mb-3 text-primary d-flex align-items-center">
            <i className="bi bi-arrow-repeat me-2"></i> Profile Modification Requests
          </h5>
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table mb-0 table-hover align-middle">
                <thead className="table-light border-0">
                  <tr>
                    <th className="px-4 py-3 small text-muted text-uppercase fw-bold">Student</th>
                    <th className="py-3 small text-muted text-uppercase fw-bold">Current Status</th>
                    <th className="py-3 small text-muted text-uppercase fw-bold">Requested Status</th>
                    <th className="px-4 py-3 text-end small text-muted text-uppercase fw-bold">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChanges.map(req => (
                    <tr key={req.user_id}>
                      <td className="px-4 py-3 fw-bold text-dark">{req.name}</td>
                      <td className="py-3 text-secondary small">{req.current_course} <br/> <span className="badge bg-light text-muted border">Sem {req.current_sem}</span></td>
                      <td className="py-3 text-primary fw-bold">
                        <i className="bi bi-chevron-double-right me-2 text-muted"></i>
                        Sem {req.req_sem}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button className="btn btn-sm btn-success fw-bold px-4 rounded-pill shadow-sm me-2"
                                onClick={() => handleAction('http://127.0.0.1:8000/api/profile-approvals/', { user_id: req.user_id, action: 'approve' })}>Approve</button>
                        <button className="btn btn-sm btn-outline-danger fw-bold px-3 rounded-pill"
                                onClick={() => handleAction('http://127.0.0.1:8000/api/profile-approvals/', { user_id: req.user_id, action: 'reject' })}>Deny</button>
                      </td>
                    </tr>
                  ))}
                  {filteredChanges.length === 0 && (
                    <tr><td colSpan="4" className="text-center text-muted p-5">No active modification requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 2: NEW REGISTRATIONS */}
        <div>
          <h5 className="fw-bold mb-3 text-dark d-flex align-items-center">
            <i className="bi bi-person-plus-fill me-2 text-success"></i> New Account Registrations
          </h5>
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table mb-0 table-hover align-middle">
                <thead className="table-light border-0">
                  <tr>
                    <th className="px-4 py-3 small text-muted text-uppercase fw-bold">Applicant Details</th>
                    <th className="py-3 small text-muted text-uppercase fw-bold">Assigned Role & Dept</th>
                    <th className="px-4 py-3 text-end small text-muted text-uppercase fw-bold">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 fw-bold text-dark">{user.name}</td>
                      <td className="py-3">
                        <span className={`badge rounded-pill me-2 ${user.is_staff ? "bg-dark" : "bg-primary bg-opacity-10 text-primary border border-primary-subtle"}`}>
                          {user.is_staff ? 'Faculty' : 'Student'}
                        </span>
                        <span className="text-secondary fw-semibold small">{user.course} {user.sem && user.sem !== '-' ? `(Sem ${user.sem})` : ''}</span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button className="btn btn-sm btn-success fw-bold px-4 rounded-pill shadow-sm me-2"
                                onClick={() => handleAction('http://127.0.0.1:8000/api/pending-users/', { user_id: user.id, action: 'approve' })}>Authorize</button>
                        <button className="btn btn-sm btn-outline-danger fw-bold px-3 rounded-pill"
                                onClick={() => handleAction('http://127.0.0.1:8000/api/pending-users/', { user_id: user.id, action: 'reject' })}>Discard</button>
                      </td>
                    </tr>
                  ))}
                  {filteredPending.length === 0 && (
                    <tr><td colSpan="3" className="text-center text-muted p-5">No pending registration requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Approvals;