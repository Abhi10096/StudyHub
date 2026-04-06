import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchUsers = useCallback(() => {
    axios.get('http://127.0.0.1:8000/api/manage-users/', { headers: { Authorization: `Token ${token}` } })
      .then(res => setUsers(res.data)).catch(err => console.error("Fetch error:", err));
  }, [token]);

  useEffect(() => {
    if (!token || localStorage.getItem('isSuperuser') !== 'true') navigate('/dashboard');
    else fetchUsers();
  }, [navigate, token, fetchUsers]);

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this user account?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/manage-users/${id}/`, { headers: { Authorization: `Token ${token}` } });
        fetchUsers();
      } catch (err) { alert("Deletion failed."); }
    }
  };

  // Safe Filter Logic (Prevents crash if name is null)
  const filteredUsers = users.filter(user => {
    const safeName = user.name || '';
    const safeUsername = user.username || '';

    const matchesSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          safeUsername.toLowerCase().includes(searchQuery.toLowerCase());

    const role = user.is_staff ? 'Faculty' : 'Students';
    const matchesRole = roleFilter === 'All' || role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Grouping Logic
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const role = user.is_staff ? 'Faculty' : 'Students';
    const dept = user.course || 'Unassigned';
    if (!acc[role]) acc[role] = {};
    if (!acc[role][dept]) acc[role][dept] = [];
    acc[role][dept].push(user); return acc;
  }, {});

  return (
    <div className="pb-5 bg-light min-vh-100">
      <nav className="navbar navbar-dark bg-danger py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/dashboard">Global User Directory</Link>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm fw-bold px-3">Back to Dashboard</button>
        </div>
      </nav>

      <div className="container mt-4">
        {/* Search and Filter Panel */}
        <div className="card shadow-sm border-0 mb-4 bg-white p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <input type="search" className="form-control" placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="col-md-4">
              <select className="form-select fw-semibold text-secondary" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">All Roles</option>
                <option value="Faculty">Faculty Only</option>
                <option value="Students">Students Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory Tables */}
        {['Faculty', 'Students'].filter(r => roleFilter === 'All' || roleFilter === r).map(role => (
          <div key={role} className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-dark text-white fw-bold">{role} Records</div>
            <div className="card-body p-0">
              {groupedUsers[role] && Object.keys(groupedUsers[role]).length > 0 ? (
                Object.keys(groupedUsers[role]).sort().map(dept => (
                  <div key={dept}>
                    <div className="bg-light px-4 py-2 fw-bold text-primary border-bottom border-top text-uppercase">
                      Department: {dept}
                    </div>
                    <table className="table mb-0 table-hover align-middle">
                      <tbody>
                        {groupedUsers[role][dept]
                          .sort((a, b) => (a.username || '').localeCompare(b.username || ''))
                          .map(user => (
                          <tr key={user.id}>
                            <td className="ps-4 w-25 text-muted fw-bold">{user.username}</td>
                            <td className="w-50 fw-semibold">
                              {user.name || 'Unnamed User'}
                              {user.sem !== '-' && user.sem != null && <span className="ms-2 badge bg-secondary">Sem {user.sem}</span>}
                            </td>
                            <td className="text-end pe-4">
                              <button className="btn btn-danger btn-sm fw-bold px-4 rounded-pill" onClick={() => handleDelete(user.id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : <div className="p-4 text-center text-muted fw-bold">No records found.</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserManagement;