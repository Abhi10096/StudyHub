import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function StudentList() {
  // State to hold the list of students fetched from the API
  const [students, setStudents] = useState([]);
  // State to hold the current search input value
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  // Retrieve authentication and role details from local storage
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';

  // Function to fetch students from the backend API
  // Wrapped in useCallback to prevent unnecessary re-renders
  const fetchStudents = useCallback(() => {
    axios.get('http://127.0.0.1:8000/api/students/', {
      headers: { Authorization: `Token ${token}` }
    })
    .then(res => setStudents(res.data))
    .catch(err => console.error("Error fetching students:", err));
  }, [token]);

  // Lifecycle hook that runs on component mount
  useEffect(() => {
    // Access Control: Redirect to dashboard if not logged in OR if the user is just a student
    if (!token || (!isSuperuser && !isStaff)) {
      navigate('/dashboard');
    } else {
      // Fetch data if the user is authorized (Admin or Faculty)
      fetchStudents();
    }
  }, [navigate, token, isSuperuser, isStaff, fetchStudents]);

  // 1. Safe Search Filter Logic
  // Filters the student array based on the search query matching either the name or username (Roll No)
  const filteredStudents = students.filter(student => {
    // Fallbacks to empty string to prevent crashes if name or username is null
    const safeName = student.name || '';
    const safeUsername = student.username || '';

    return safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           safeUsername.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 2. Grouping Logic: Group by Department -> Semester
  // Transforms the flat array into a nested object: { "MCA": { "1": [student1, student2] } }
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const dept = student.course || 'Unassigned Department';
    const sem = student.semester && student.semester !== '-' ? student.semester : 'Unassigned Semester';

    // Initialize the department object if it doesn't exist
    if (!acc[dept]) acc[dept] = {};
    // Initialize the semester array if it doesn't exist within the department
    if (!acc[dept][sem]) acc[dept][sem] = [];

    // Push the current student into the appropriate department and semester array
    acc[dept][sem].push(student);
    return acc;
  }, {});

  // Extract and sort the department names alphabetically for rendering
  const sortedDepartments = Object.keys(groupedStudents).sort();

  return (
    <div className="pb-5 bg-light min-vh-100">

      {/* Top Navigation Bar */}
      <nav className="navbar navbar-dark bg-dark py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/dashboard">Student Directory</Link>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm fw-bold px-3">
            Back to Dashboard
          </button>
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

        {/* Directory Tables rendered dynamically based on grouped data */}
        {sortedDepartments.length > 0 ? (
          sortedDepartments.map(dept => (
            <div key={dept} className="card shadow-sm border-0 mb-5 border-top border-primary border-4">

              {/* Department Header */}
              <div className="card-header bg-dark text-white p-3">
                <h5 className="fw-bolder mb-0 text-uppercase" style={{ letterSpacing: '1px' }}>
                  {dept}
                </h5>
              </div>

              <div className="card-body p-0">
                {/* Iterate through semesters within the current department and sort them numerically */}
                {Object.keys(groupedStudents[dept]).sort((a,b) => a.localeCompare(b, undefined, {numeric:true})).map(sem => (
                  <div key={sem}>

                    {/* Semester Sub-header */}
                    <div className="bg-light px-4 py-2 fw-bold text-primary border-bottom border-top">
                      {sem === 'Unassigned Semester' ? 'Pending Semester Assignment' : `Semester ${sem}`}
                    </div>

                    {/* Students Table for the specific Semester */}
                    <table className="table mb-0 table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="px-4 py-3 text-muted w-25">Roll Number</th>
                          <th className="px-4 py-3 text-muted w-75">Student Full Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Sort students by their Roll Number (username) before rendering rows */}
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
          // Displayed if the search query yields no results
          <div className="card shadow-sm border-0 p-5 text-center">
            <h5 className="text-muted fw-bold">No students match your search criteria.</h5>
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentList;