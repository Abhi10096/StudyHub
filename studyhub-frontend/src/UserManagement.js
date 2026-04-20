import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * UserManagement Component: The master directory for System Administrators.
 * Features: Centralized user deletion, role filtering, and department-wise grouping.
 */
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  /**
   * Fetches the complete list of registered users from the administrative API.
   */
  const fetchUsers = useCallback(() => {
    const config = { headers: { Authorization: `Token ${token}` } };
    axios.get('http://127.0.0.1:8000/api/manage-users/', config)
      .then(res => setUsers(res.data))
      .catch(err => console.error("Administrative Sync Error:", err));
  }, [token]);

  useEffect(() => {
    // Security Guard: Only allow Superusers to access this directory
    if (!token || localStorage.getItem('isSuperuser') !== 'true') {
      navigate('/dashboard');
    } else {
      fetchUsers();
    }
  }, [navigate, token, fetchUsers]);

  /**
   * Action: Permanently removes a user account from the system database.
   */
  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL ACTION: Permanently remove this account and all associated data?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/manage-users/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        fetchUsers(); // Refresh directory post-deletion
      } catch (err) {
        alert("Execution Error: Deletion failed.");
      }
    }
  };

  // Logic: Multi-criteria filtering (Search + Role)
  const filteredUsers = users.filter(user => {
    const safeName = user.name || '';
    const safeUsername = user.username || '';
    const matchesSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          safeUsername.toLowerCase().includes(searchQuery.toLowerCase());

    const role = user.is_staff ? 'Faculty' : 'Students';
    const matchesRole = roleFilter === 'All' || role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Logic: Grouping users by Role and Department for organized view
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const role = user.is_staff ? 'Faculty' : 'Students';
    const dept = user.course || 'Global / Unassigned';
    if (!acc[role]) acc[role] = {};
    if (!acc[role][dept]) acc[role][dept] = [];
    acc[role][dept].push(user);
    return acc;
  }, {});

  return (
    <div className="pb-5 bg-light min-vh-100">
      {/* Global Navbar is handled in App.js */}

      <div className="container mt-4">
        {/* Page Header */}
        <div className="mb-4 d-flex justify-content-between align-items-end">
          <div>
            <h2 className="fw-bold text-dark mb-0">Global User Authority</h2>
            <p className="text-danger small fw-bold text-uppercase mb-0">
               <i className="bi bi-shield-lock-fill me-1"></i> Root Access Directory
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-light btn-sm rounded-pill px-3 border shadow-sm fw-bold">
            <i className="bi bi-arrow-left me-1"></i> Dashboard
          </button>
        </div>

        {/* Global Search & Filter Module */}
        <div className="card shadow-sm border-0 mb-4 bg-white p-3 rounded-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-0"><i className="bi bi-search text-muted"></i></span>
                <input type="search" className="form-control border-0 bg-light rounded-pill px-3 shadow-none"
                       placeholder="Scan by User ID or Official Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-md-5">
              <div className="d-flex align-items-center">
                <i className="bi bi-filter me-2 text-muted"></i>
                <select className="form-select border-0 bg-light rounded-pill px-3 shadow-none fw-semibold" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Directory Records</option>
                  <option value="Faculty">Faculty Only</option>
                  <option value="Students">Students Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Directory Tables */}
        {['Faculty', 'Students'].filter(r => roleFilter === 'All' || roleFilter === r).map(role => (
          <div key={role} className="card shadow-sm border-0 mb-5 rounded-4 overflow-hidden">
            <div className={`card-header py-3 px-4 fw-bold text-white border-0 ${role === 'Faculty' ? 'bg-dark' : 'bg-primary'}`}>
              <i className={`bi ${role === 'Faculty' ? 'bi-briefcase' : 'bi-mortarboard'} me-2`}></i>
              {role} Records
            </div>
            <div className="card-body p-0">
              {groupedUsers[role] && Object.keys(groupedUsers[role]).length > 0 ? (
                Object.keys(groupedUsers[role]).sort().map(dept => (
                  <div key={dept} className="border-bottom">
                    <div className="bg-light px-4 py-2 fw-bold text-secondary border-bottom border-top small text-uppercase letter-spacing-1">
                      Department: <span className="text-dark">{dept}</span>
                    </div>
                    <table className="table mb-0 table-hover align-middle">
                      <tbody>
                        {groupedUsers[role][dept]
                          .sort((a, b) => (a.username || '').localeCompare(b.username || ''))
                          .map(user => (
                          <tr key={user.id}>
                            <td className="ps-4 w-25">
                               <span className="badge bg-light text-dark border fw-bold font-monospace">{user.username}</span>
                            </td>
                            <td className="w-50 fw-semibold text-dark">
                              {user.name || 'Unnamed Identity'}
                              {user.sem !== '-' && user.sem != null &&
                                <span className="ms-2 badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill">Sem {user.sem}</span>
                              }
                            </td>
                            <td className="text-end pe-4">
                              <button className="btn btn-outline-danger btn-sm fw-bold px-4 rounded-pill transition-hover"
                                      onClick={() => handleDelete(user.id)}>
                                <i className="bi bi-trash-fill me-1"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <div className="p-5 text-center text-muted">
                  <i className="bi bi-folder-x fs-1 opacity-25 d-block mb-2"></i>
                  <span className="fw-bold">No registered {role.toLowerCase()} found.</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserManagement;