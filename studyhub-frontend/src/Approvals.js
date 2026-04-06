import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Approvals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    const config = { headers: { Authorization: `Token ${token}` } };
    axios.get('http://127.0.0.1:8000/api/pending-users/', config).then(res => setPendingUsers(res.data)).catch(err => console.error(err));
    axios.get('http://127.0.0.1:8000/api/profile-approvals/', config).then(res => setChangeRequests(res.data)).catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    if (!token || localStorage.getItem('isSuperuser') !== 'true') navigate('/dashboard');
    else fetchData();
  }, [navigate, token, fetchData]);

  const handleAction = async (endpoint, payload) => {
    if (window.confirm("Confirm administrative action?")) {
      try {
        await axios.post(endpoint, payload, { headers: { Authorization: `Token ${token}` } });
        fetchData();
      } catch (error) { alert("Execution failed."); }
    }
  };

  const filteredPending = pendingUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredChanges = changeRequests.filter(req => req.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="pb-5">
      <nav className="navbar navbar-dark bg-warning py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold text-dark" to="/dashboard">Registration Approvals</Link>
          <button onClick={() => navigate('/dashboard')} className="btn btn-dark btn-sm fw-bold px-3">Back to Dashboard</button>
        </div>
      </nav>

      <div className="container mt-4">
        {/* Search Panel */}
        <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
          <div className="row">
            <div className="col-md-6">
              <input type="search" className="form-control" placeholder="Search applicant by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </div>

        <h5 className="fw-bold mb-3 text-dark">Profile Modification Requests</h5>
        <div className="card shadow-sm mb-5 border-0">
          <table className="table mb-0 table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3 text-muted">Student Details</th>
                <th className="py-3 text-muted">Current Target</th>
                <th className="py-3 text-muted">Requested Target</th>
                <th className="px-4 py-3 text-end text-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredChanges.map(req => (
                <tr key={req.user_id}>
                  <td className="px-4 py-3 fw-bold">{req.name}</td>
                  <td className="py-3 text-secondary">{req.current_course} (Sem {req.current_sem})</td>
                  <td className="py-3 text-primary fw-bold">{req.req_course} (Sem {req.req_sem})</td>
                  <td className="px-4 py-3 text-end">
                    <button className="btn btn-sm btn-success fw-bold px-3 me-2" onClick={() => handleAction('http://127.0.0.1:8000/api/profile-approvals/', { user_id: req.user_id, action: 'approve' })}>Approve</button>
                    <button className="btn btn-sm btn-danger fw-bold px-3" onClick={() => handleAction('http://127.0.0.1:8000/api/profile-approvals/', { user_id: req.user_id, action: 'reject' })}>Deny</button>
                  </td>
                </tr>
              ))}
              {filteredChanges.length === 0 && <tr><td colSpan="4" className="text-center text-muted fw-bold p-4">No pending requests.</td></tr>}
            </tbody>
          </table>
        </div>

        <h5 className="fw-bold mb-3 text-dark">New Account Registrations</h5>
        <div className="card shadow-sm border-0">
          <table className="table mb-0 table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3 text-muted">Applicant Name</th>
                <th className="py-3 text-muted">Role & Department</th>
                <th className="px-4 py-3 text-end text-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-3 fw-bold">{user.name}</td>
                  <td className="py-3">
                    <span className={user.is_staff ? "badge bg-dark me-2" : "badge bg-info text-dark me-2"}>{user.is_staff ? 'Faculty' : 'Student'}</span>
                    <span className="text-secondary fw-semibold">{user.course} {user.sem && user.sem !== '-' ? `(Sem ${user.sem})` : ''}</span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button className="btn btn-sm btn-success fw-bold px-3 me-2" onClick={() => handleAction('http://127.0.0.1:8000/api/pending-users/', { user_id: user.id, action: 'approve' })}>Approve</button>
                    <button className="btn btn-sm btn-danger fw-bold px-3" onClick={() => handleAction('http://127.0.0.1:8000/api/pending-users/', { user_id: user.id, action: 'reject' })}>Reject</button>
                  </td>
                </tr>
              ))}
              {filteredPending.length === 0 && <tr><td colSpan="3" className="text-center text-muted fw-bold p-4">No pending registrations.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Approvals;