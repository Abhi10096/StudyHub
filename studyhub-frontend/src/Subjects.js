import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function Subjects() {
  const { courseId } = useParams();
  const [departmentPath, setDepartmentPath] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [activeSem, setActiveSem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubSem, setNewSubSem] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';
  const isStudent = !isStaff && !isSuperuser;

  const fetchData = useCallback(async () => {
    const config = { headers: { Authorization: `Token ${token}` } };

    try {
      const response = await axios.get('http://127.0.0.1:8000/api/subjects/', config);
      const data = response.data;

      // Extract Data Safely
      let subjectsArray = [];
      if (Array.isArray(data)) {
        subjectsArray = data;
      } else if (data && data.results) {
        if (Array.isArray(data.results)) {
          subjectsArray = data.results;
        } else if (data.results.results && Array.isArray(data.results.results)) {
          subjectsArray = data.results.results;
        }
      }

      setSubjects(subjectsArray);

      if (data && data.current_path) {
        setDepartmentPath(data.current_path);
      } else {
        setDepartmentPath('All Modules');
      }

      // Automatically set active semester for Students (Though no longer strictly needed for rendering)
      if (isStudent) {
        const studentSem = localStorage.getItem('semester');
        if (studentSem && studentSem !== '-') {
          setActiveSem(studentSem);
        }
      }
    } catch (err) {
      console.error("Data fetching error:", err);
    }
  }, [token, isStudent]);

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchData();
  }, [navigate, token, fetchData]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/subjects/',
        { name: newSubName, semester: newSubSem, course: courseId ? parseInt(courseId) : 1 },
        { headers: { Authorization: `Token ${token}` } }
      );
      setNewSubName('');
      setNewSubSem('');
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert("Failed to create subject. Ensure all fields are correct.");
    }
  };

  const filteredSubjects = subjects.filter(sub =>
    (sub.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSubjects = filteredSubjects.reduce((acc, sub) => {
    const sem = sub.semester ? sub.semester.toString() : 'Unknown';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(sub);
    return acc;
  }, {});

  const availableSemesters = Object.keys(groupedSubjects).sort((a, b) => parseInt(a) - parseInt(b));

  // Determine what subjects to display:
  // If student: Display ALL subjects sent by backend (since backend already filtered them)
  // If teacher/admin: Display subjects corresponding to the clicked semester folder
  const subjectsToDisplay = isStudent ? filteredSubjects : groupedSubjects[activeSem];

  return (
    <div className="pb-5 bg-light min-vh-100">
      <nav className="navbar navbar-dark bg-primary py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/dashboard">STUDYHUB | Curriculum</Link>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm fw-bold px-3">Dashboard</button>
        </div>
      </nav>

      <div className="container mt-4">

        <div className="mb-4">
          <h3 className="fw-bolder text-dark mb-1">Academic Modules</h3>
          <h6 className="text-primary fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>{departmentPath}</h6>
        </div>

        <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
          <div className="row d-flex justify-content-between align-items-center">
            <div className="col-md-6">
              <input type="search" className="form-control" placeholder="Search subjects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="col-md-4 text-end">
              {(isStaff || isSuperuser) && (
                <button className={`btn fw-bold px-4 ${showAddForm ? 'btn-secondary' : 'btn-success'}`} onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Cancel' : '+ New Subject'}
                </button>
              )}
            </div>
          </div>
        </div>

        {showAddForm && (isStaff || isSuperuser) && (
          <form onSubmit={handleAddSubject} className="mb-5 row g-3 bg-white p-4 rounded-4 shadow-sm border-top border-success border-4">
            <h5 className="fw-bold mb-3">Add New Subject</h5>
            <div className="col-md-6">
              <label className="form-label fw-bold small">Subject Name</label>
              <input type="text" className="form-control" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold small">Semester</label>
              <input type="text" className="form-control" value={newSubSem} onChange={(e) => setNewSubSem(e.target.value)} required />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-success w-100 fw-bold">Save</button>
            </div>
          </form>
        )}

        {/* View Logic */}
        {!activeSem && !isStudent ? (
          <div className="row g-4 mt-2">
            {availableSemesters.length > 0 ? availableSemesters.map(sem => (
              <div key={sem} className="col-md-4">
                <div className="card shadow-sm h-100 text-center border-0 rounded-4" onClick={() => setActiveSem(sem)} style={{ cursor: 'pointer' }}>
                  <div className="card-body py-5 bg-white rounded-4 border-bottom border-primary border-4">
                    <h4 className="fw-bolder text-dark">Semester {sem}</h4>
                    <p className="text-muted fw-bold mb-0">{groupedSubjects[sem].length} Subjects</p>
                  </div>
                </div>
              </div>
            )) : <div className="col-12 text-center text-muted p-5">No subjects found.</div>}
          </div>
        ) : (
          <div>
            {!isStudent && (
              <button className="btn btn-dark btn-sm mb-4 fw-bold px-4" onClick={() => setActiveSem(null)}>&larr; All Semesters</button>
            )}
            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">
              {isStudent ? 'Your Enrolled Modules' : `Modules for Semester ${activeSem}`}
            </h5>
            <div className="row g-4">
              {subjectsToDisplay?.map(sub => (
                <div key={sub.id} className="col-md-4">
                  <div className="card shadow-sm h-100 text-center border-0 rounded-4">
                    <div className="card-body py-5 d-flex flex-column align-items-center">
                      <h5 className="fw-bold text-dark mb-4 text-uppercase">{sub.name}</h5>
                      <Link to={`/subject/${sub.name}`} className="btn btn-primary fw-bold px-4 w-100 mt-auto">View Resources</Link>
                    </div>
                  </div>
                </div>
              ))}

              {(!subjectsToDisplay || subjectsToDisplay.length === 0) && (
                <div className="col-12 text-muted fw-bold p-4 text-center">No subjects available at the moment.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subjects;