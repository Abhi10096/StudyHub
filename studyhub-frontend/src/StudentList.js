import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';

  const fetchStudents = useCallback(() => {
    axios.get('http://127.0.0.1:8000/api/students/', {
      headers: { Authorization: `Token ${token}` }
    })
    .then(res => setStudents(res.data))
    .catch(err => console.error("Error fetching students:", err));
  }, [token]);

  useEffect(() => {
    if (!token || (!isSuperuser && !isStaff)) navigate('/dashboard');
    else fetchStudents();
  }, [navigate, token, isSuperuser, isStaff, fetchStudents]);

  // 1. Safe Search Filter Logic
  const filteredStudents = students.filter(student => {
    const safeName = student.name || '';
    const safeUsername = student.username || '';
    return safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           safeUsername.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 2. Group by Department -> Semester
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
    <div className="pb-5 bg-light min-vh-100">

      {/* Top Navigation */}
      <nav className="navbar navbar-dark bg-dark py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/dashboard">Student Directory</Link>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm fw-bold px-3">Back to Dashboard</button>
        </div>
      </nav>

      <div className="container mt-4">

        {/* Search Panel */}
        <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
          <div className="row">
            <div className="col-md-6">
              <input
                type="search"
                className="form-control"
                placeholder="Search by Student Name or Roll No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Directory Tables by Department and Semester */}
        {sortedDepartments.length > 0 ? (
          sortedDepartments.map(dept => (
            <div key={dept} className="card shadow-sm border-0 mb-5 border-top border-primary border-4">
              <div className="card-header bg-dark text-white p-3">
                <h5 className="fw-bolder mb-0 text-uppercase" style={{ letterSpacing: '1px' }}>
                  {dept}
                </h5>
              </div>

              <div className="card-body p-0">
                {Object.keys(groupedStudents[dept]).sort((a,b) => a.localeCompare(b, undefined, {numeric:true})).map(sem => (
                  <div key={sem}>
                    <div className="bg-light px-4 py-2 fw-bold text-primary border-bottom border-top">
                      {sem === 'Unassigned Semester' ? 'Pending Semester Assignment' : `Semester ${sem}`}
                    </div>

                    <table className="table mb-0 table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="px-4 py-3 text-muted w-25">Roll Number</th>
                          <th className="px-4 py-3 text-muted w-75">Student Full Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedStudents[dept][sem]
                          .sort((a, b) => (a.username || '').localeCompare(b.username || '', undefined, {numeric: true}))
                          .map(student => (
                          <tr key={student.id}>
                            <td className="px-4 py-3 fw-bolder text-secondary">{student.username}</td>
                            <td className="px-4 py-3 fw-bold text-dark">{student.name || 'Unnamed Student'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="card shadow-sm border-0 p-5 text-center">
            <h5 className="text-muted fw-bold">No students match your search criteria.</h5>
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentList;