import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function Subjects() {
  const { courseId } = useParams();
  const [departmentName, setDepartmentName] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [activeSem, setActiveSem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // States for creating a new subject
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
      // 1. Fetch Department/Course Name reliably
      const courseRes = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/`, config);
      setDepartmentName(courseRes.data.name);

      // 2. Fetch Subjects for this course
      const subjectRes = await axios.get('http://127.0.0.1:8000/api/subjects/', config);
      setSubjects(subjectRes.data.filter(s => s.course === parseInt(courseId)));

      if (isStudent) setActiveSem(localStorage.getItem('semester'));
    } catch (err) {
      console.error("Data error:", err);
    }
  }, [courseId, token, isStudent]);

  useEffect(() => {
    if (!token) navigate('/login'); else fetchData();
  }, [navigate, token, fetchData]);

  // Handle new subject creation
  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/subjects/',
        { name: newSubName, semester: parseInt(newSubSem), course: parseInt(courseId) },
        { headers: { Authorization: `Token ${token}` } }
      );
      setNewSubName('');
      setNewSubSem('');
      setShowAddForm(false);
      fetchData(); // Refresh list
    } catch (error) {
      alert("Failed to create subject. Please check your inputs.");
    }
  };

  const filteredSubjects = subjects.filter(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const groupedSubjects = filteredSubjects.reduce((acc, sub) => {
    const sem = sub.semester.toString();
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(sub); return acc;
  }, {});

  const availableSemesters = Object.keys(groupedSubjects).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="pb-5 bg-light min-vh-100">

      {/* Top Navbar with Department Context */}
      <nav className="navbar navbar-dark bg-primary py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/dashboard">
            Curriculum {departmentName ? `| ${departmentName}` : ''}
          </Link>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm fw-bold px-3">Dashboard</button>
        </div>
      </nav>

      <div className="container mt-4">

        {/* Dynamic Header */}
        <div className="mb-4">
          <h3 className="fw-bolder text-dark mb-1">Academic Modules</h3>
          {departmentName && <h6 className="text-secondary fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Department of {departmentName}</h6>}
        </div>

        {/* Action Bar: Search & Add Subject Button */}
        <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
          <div className="row d-flex justify-content-between align-items-center">
            <div className="col-md-6">
              {activeSem && (
                <input type="search" className="form-control" placeholder={`Search subjects in Semester ${activeSem}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              )}
            </div>
            <div className="col-md-4 text-end">
              {(isStaff || isSuperuser) && (
                <button className={`btn fw-bold px-4 ${showAddForm ? 'btn-secondary' : 'btn-success'}`} onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Cancel Creation' : '+ Create Subject'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Create Subject Form */}
        {showAddForm && (isStaff || isSuperuser) && (
          <form onSubmit={handleAddSubject} className="mb-5 row g-3 bg-white p-4 rounded-4 shadow-sm border-top border-success border-4">
            <h5 className="fw-bold mb-3 text-dark">Add Module to {departmentName}</h5>
            <div className="col-md-6">
              <label className="form-label fw-bold text-muted small">Subject Title</label>
              <input type="text" className="form-control" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold text-muted small">Target Semester</label>
              <input type="number" className="form-control" value={newSubSem} onChange={(e) => setNewSubSem(e.target.value)} required min="1" max="10" />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-success w-100 fw-bold">Save Subject</button>
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
                    <p className="text-muted fw-bold mb-0">{groupedSubjects[sem].length} Modules Active</p>
                  </div>
                </div>
              </div>
            )) : <div className="col-12 text-center text-muted fw-bold p-5">No curriculum mapped to this department yet.</div>}
          </div>
        ) : (
          <div>
            {!isStudent && <button className="btn btn-dark btn-sm mb-4 fw-bold px-4" onClick={() => { setActiveSem(null); setSearchQuery(''); }}>&larr; View All Semesters</button>}
            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Semester {activeSem} Curriculum</h5>
            <div className="row g-4">
              {groupedSubjects[activeSem]?.map(sub => (
                <div key={sub.id} className="col-md-4">
                  <div className="card shadow-sm h-100 text-center border-0 rounded-4">
                    <div className="card-body py-5 d-flex flex-column align-items-center">
                      <h5 className="fw-bold text-dark mb-4">{sub.name}</h5>
                      <Link to={`/subject/${sub.name}`} className="btn btn-primary fw-bold px-4 w-100 mt-auto">Open Module</Link>
                    </div>
                  </div>
                </div>
              ))}
              {!groupedSubjects[activeSem] && <div className="col-12 text-muted fw-bold p-4">No subjects found matching your search.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subjects;