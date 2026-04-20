import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/**
 * StudentList: Secure Administrative Directory.
 * Features:
 * 1. Role-based access (Faculty/Admin only).
 * 2. Delete student accounts with confirmation.
 * 3. Hierarchical grouping by Department and Semester.
 */
function StudentList() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';

  const fetchStudents = useCallback(async () => {
    const config = { headers: { Authorization: `Token ${token}` } };
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/students/', config);
      setStudents(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Critical: Student roster sync failed", err);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || (!isSuperuser && !isStaff)) {
      navigate('/dashboard');
    } else {
      fetchStudents();
    }
  }, [navigate, token, isSuperuser, isStaff, fetchStudents]);

  /**
   * Logic: Deletes a student record from the system.
   * Note: This usually requires a matching DELETE endpoint in Django views.py.
   */
  const handleDeleteStudent = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the student: ${name}?`);

    if (confirmDelete) {
      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        // API call to the User Management endpoint
        await axios.delete(`http://127.0.0.1:8000/api/user-management/${id}/`, config);

        // Refresh the list locally
        setStudents(prev => prev.filter(s => s.id !== id));
        alert("Student account removed successfully.");
      } catch (err) {
        console.error("Deletion failed:", err);
        alert("Action failed: Only Administrators can delete accounts.");
      }
    }
  };

  const filteredStudents = students.filter(student => {
    const safeName = student.name || '';
    const safeUsername = student.username || '';
    return safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           safeUsername.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const dept = student.course || 'Unassigned Department';
    const sem = student.semester && student.semester !== '-' ? student.semester : 'Unassigned Semester';
    if (!acc[dept]) acc[dept] = {};
    if (!acc[dept][sem]) acc[dept][sem] = [];
    acc[dept][sem].push(student);
    return acc;
  }, {});

  const sortedDepartments = Object.keys(groupedStudents).sort();

  return (
    <div className="pb-5 arctic-body min-vh-100 animate-in">
      {/* Professional Banner */}
      <div className="curriculum-banner mb-5 py-4 shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="text-white">
            <h2 className="fw-bold mb-0">Student Directory</h2>
            <p className="small fw-bold text-uppercase opacity-75 mt-1">
               <i className="bi bi-people-fill me-2"></i>Verified Academic Roster
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-bold">
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="container">
        {/* Search Panel */}
        <div className="card shadow-sm border-0 mb-4 p-3 rounded-4 bg-white">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group bg-light rounded-pill px-3">
                <span className="input-group-text bg-transparent border-0"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="search"
                  className="form-control border-0 bg-transparent shadow-none"
                  placeholder="Filter by Name or Roll No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-end align-self-center">
               <span className="badge bg-primary rounded-pill px-3 py-2">Total Students: {filteredStudents.length}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : sortedDepartments.length > 0 ? (
          sortedDepartments.map(dept => (
            <div key={dept} className="card shadow-sm border-0 mb-5 rounded-4 overflow-hidden bg-white animate-in">
              <div className="card-header bg-dark text-white p-3 px-4">
                <h6 className="fw-bold mb-0 text-uppercase letter-spacing-1">{dept}</h6>
              </div>

              <div className="card-body p-0">
                {Object.keys(groupedStudents[dept]).sort((a,b) => a.localeCompare(b, undefined, {numeric:true})).map(sem => (
                  <div key={sem}>
                    <div className="bg-light px-4 py-2 fw-bold text-primary border-bottom border-top small text-uppercase">
                      {sem === 'Unassigned Semester' ? 'Pending Assignment' : `Semester ${sem}`}
                    </div>

                    <div className="table-responsive">
                      <table className="table mb-0 table-hover align-middle">
                        <thead className="table-light">
                          <tr className="small text-muted text-uppercase">
                            <th className="px-4 py-3 border-0">Roll Number</th>
                            <th className="px-4 py-3 border-0">Student Full Name</th>
                            <th className="px-4 py-3 border-0 text-end">Management</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedStudents[dept][sem]
                            .sort((a, b) => (a.username || '').localeCompare(b.username || '', undefined, {numeric: true}))
                            .map(student => (
                            <tr key={student.id} className="border-bottom">
                              <td className="px-4 py-3 font-monospace fw-bold text-secondary">{student.username}</td>
                              <td className="px-4 py-3 fw-bold text-dark">{student.name || 'Unnamed Student'}</td>
                              <td className="px-4 py-3 text-end">
                                {/* Only Superusers (Admins) should ideally delete accounts */}
                                {isSuperuser && (
                                  <button
                                    className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                                    onClick={() => handleDeleteStudent(student.id, student.name)}
                                  >
                                    <i className="bi bi-person-x-fill me-1"></i> Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-search fs-1 opacity-25"></i>
            <h5 className="mt-3 fw-bold">No matching records found.</h5>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentList;