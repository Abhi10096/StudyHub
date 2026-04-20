import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * Subjects Component: Dynamic Academic Curriculum Board.
 * Logic: Triple-check system to ensure Course Name is always displayed.
 */
function Subjects() {
  const { courseId } = useParams();
  const [courseName, setCourseName] = useState('Academic Board');
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

  /**
   * Enhanced Data Sync with Multi-level Name Detection
   */
  const fetchData = useCallback(async () => {
    const config = { headers: { Authorization: `Token ${token}` } };
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/subjects/', config);
      const data = response.data;

      // 1. Handling Paginated vs Simple List
      let subjectsArray = Array.isArray(data) ? data : (data.results || []);
      setSubjects(subjectsArray);

      // 2. NAME DETECTION LOGIC (The Fix)
      if (data.current_path && data.current_path !== "Academic Curriculum") {
        // Option A: Get from backend breadcrumb
        setDepartmentPath(data.current_path);
        setCourseName(data.current_path.split(' ')[0]);
      }
      else if (subjectsArray.length > 0 && subjectsArray[0].course_name) {
        // Option B: Get from Subject Serializer
        const nameFromSub = subjectsArray[0].course_name;
        setCourseName(nameFromSub);
        setDepartmentPath(`${nameFromSub} Department`);
      }
      else {
        // Option C: Fallback to LocalStorage or generic info
        const storedCourse = localStorage.getItem('userCourseName'); // If you saved it during login
        if (storedCourse) setCourseName(storedCourse);
      }

      if (isStudent) {
        const studentSem = localStorage.getItem('semester');
        if (studentSem && studentSem !== '-') setActiveSem(studentSem);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [token, isStudent]);

  useEffect(() => {
    if (!token) navigate('/login'); else fetchData();
  }, [navigate, token, fetchData]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/subjects/',
        { name: newSubName, semester: newSubSem, course: courseId ? parseInt(courseId) : 1 },
        { headers: { Authorization: `Token ${token}` } }
      );
      setNewSubName(''); setNewSubSem(''); setShowAddForm(false);
      fetchData();
    } catch (error) { alert("Failed to add subject."); }
  };

  const handleDeleteSubject = async (id, name) => {
    if (window.confirm(`Delete ${name}?`)) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/subjects/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        fetchData();
      } catch (err) { alert("Unauthorized"); }
    }
  };

  const filteredSubjects = subjects.filter(sub =>
    (sub.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSubjects = filteredSubjects.reduce((acc, sub) => {
    const sem = sub.semester ? sub.semester.toString() : 'N/A';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(sub);
    return acc;
  }, {});

  const availableSemesters = Object.keys(groupedSubjects).sort((a, b) => parseInt(a) - parseInt(b));
  const subjectsToDisplay = isStudent ? filteredSubjects : groupedSubjects[activeSem];

  return (
    <div className="pb-5 arctic-body min-vh-100 animate-in">

      {/* Arctic Header: Dynamic Title */}
      <div className="curriculum-banner mb-5 py-4 shadow-sm text-white">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            {/* Displaying the detected courseName state */}
            <h2 className="fw-bold mb-0 text-uppercase">{courseName} CURRICULUM</h2>
            <p className="small fw-bold opacity-75 mt-1">
                <i className="bi bi-mortarboard-fill me-2"></i>{departmentPath || "Department Records"}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light rounded-pill px-4 fw-bold">
            Dashboard
          </button>
        </div>
      </div>

      <div className="container">
        {/* Search & Actions */}
        <div className="card shadow-sm border-0 mb-4 p-3 rounded-4 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group bg-light rounded-pill px-3">
                <span className="input-group-text bg-transparent border-0"><i className="bi bi-search text-muted"></i></span>
                <input type="search" className="form-control border-0 bg-transparent shadow-none" placeholder="Filter subjects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-md-6 text-end">
              {(isStaff || isSuperuser) && (
                <button className={`btn fw-bold px-4 rounded-pill ${showAddForm ? 'btn-secondary' : 'btn-success shadow-sm'}`} onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Cancel' : '+ New Module'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubject} className="mb-5 row g-3 bg-white p-4 rounded-4 shadow-sm border-top border-success border-5 animate-in">
            <div className="col-md-6"><input type="text" className="form-control bg-light border-0" placeholder="Module Name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required /></div>
            <div className="col-md-4"><input type="text" className="form-control bg-light border-0" placeholder="Sem Number" value={newSubSem} onChange={(e) => setNewSubSem(e.target.value)} required /></div>
            <div className="col-md-2"><button type="submit" className="btn btn-success w-100 fw-bold">Save</button></div>
          </form>
        )}

        {!activeSem && !isStudent ? (
          <div className="row g-4 mt-2">
            {availableSemesters.map(sem => (
              <div key={sem} className="col-md-4" onClick={() => setActiveSem(sem)} style={{ cursor: 'pointer' }}>
                <div className="card shadow-sm border-0 rounded-4 bg-white text-center transition-hover border-bottom border-primary border-5">
                  <div className="card-body py-5">
                    <h4 className="fw-bolder">Semester {sem}</h4>
                    <p className="text-muted fw-bold mb-0">{groupedSubjects[sem].length} Subjects Listed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-in">
            {!isStudent && (
              <button className="btn btn-dark btn-sm mb-4 fw-bold px-4 rounded-pill shadow-sm" onClick={() => setActiveSem(null)}>&larr; All Semesters</button>
            )}
            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">
               {isStudent ? 'Allocated Modules' : `Semester ${activeSem} Modules`}
            </h5>
            <div className="row g-4">
              {subjectsToDisplay?.map(sub => (
                <div key={sub.id} className="col-md-4">
                  <div className="card shadow-sm h-100 border-0 rounded-4 bg-white transition-hover">
                    <div className="card-body p-4 text-center d-flex flex-column">
                      <div className="d-flex justify-content-end mb-2">
                         {(isStaff || isSuperuser) && (
                            <button onClick={() => handleDeleteSubject(sub.id, sub.name)} className="btn btn-sm btn-outline-danger border-0 rounded-circle" title="Delete Subject"><i className="bi bi-trash3-fill"></i></button>
                         )}
                      </div>
                      <div className="icon-box-sky mx-auto mb-3"><i className="bi bi-journal-text fs-3 text-primary"></i></div>
                      <h5 className="fw-bold text-dark mb-4">{sub.name}</h5>
                      <Link to={`/subject/${sub.name}`} className="btn btn-primary fw-bold rounded-pill w-100 mt-auto shadow-sm">Explore Content</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subjects;