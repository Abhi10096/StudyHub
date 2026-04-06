import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/manage-users/', {
        headers: { Authorization: `Token ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to retrieve user directory", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !isSuperuser) {
      navigate('/dashboard');
    } else {
      fetchUsers();
    }
  }, [navigate, token, isSuperuser, fetchUsers]);

  const handleDeleteUser = async (userId, userName) => {
    if(window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete user "${userName}" and all associated data?`)) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/manage-users/${userId}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        fetchUsers();
      } catch (error) {
        alert("Deletion operation failed.");
      }
    }
  };

  const groupedUsers = users.reduce((acc, user) => {
    const roleCategory = user.is_staff ? 'Faculty Members' : 'Enrolled Students';
    if (!acc[roleCategory]) acc[roleCategory] = [];
    acc[roleCategory].push(user);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', paddingBottom: '60px' }}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-danger shadow-sm py-3">
        <div className="container">
          <Link className="navbar-brand fw-bolder fs-4" to="/dashboard">System Administration Center</Link>
          <div className="navbar-nav me-auto ps-4">
            <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm fw-bold rounded-pill">Return</button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <h3 className="fw-bolder text-dark mb-4">Global User Directory (Authority Mode)</h3>

        {['Faculty Members', 'Enrolled Students'].map(category => (
          <div key={category} className="card shadow-sm border-0 rounded-4 mb-5">
            <div className="card-header bg-dark text-white py-3 border-0">
              <h5 className="mb-0 fw-bold">{category}</h5>
            </div>
            <div className="card-body p-0">
              {groupedUsers[category] && groupedUsers[category].length > 0 ? (
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 text-muted">System ID</th>
                      <th className="py-3 text-muted">Full Name</th>
                      <th className="py-3 text-muted">Department Context</th>
                      <th className="px-4 py-3 text-end text-muted">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedUsers[category].map(user => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 fw-bold">{user.username}</td>
                        <td className="py-3 text-dark fw-semibold">{user.name}</td>
                        <td className="py-3">
                          <span className="badge bg-secondary text-white px-3 py-2 rounded-pill">
                            {user.course} {user.semester !== '-' ? `| Sem ${user.semester}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <button className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-4" onClick={() => handleDeleteUser(user.id, user.name)}>
                            Delete Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-muted fw-bold">No active users in this category.</div>
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

export default UserManagement;