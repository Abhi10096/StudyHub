import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * Courses Component: The core Academic Directory of StudyHub.
 * Managed by Administrators (Superusers) to define Departments/Programs.
 * Theme: Arctic Sky Light.
 */
function Courses() {
  const [courses, setCourses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';

  /**
   * Syncs academic program data from the backend API.
   */
  const fetchCourses = useCallback(async () => {
    const config = { headers: { Authorization: `Token ${token}` } };
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/courses/', config);
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Critical: Course synchronization failed", error);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) navigate('/login'); else fetchCourses();
  }, [navigate, token, fetchCourses]);

  /**
   * Handle Submission of a new Academic Program.
   */
  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/courses/',
        { name: newCourseName, description: newCourseDesc },
        { headers: { Authorization: `Token ${token}` } }
      );
      setNewCourseName(''); setNewCourseDesc('');
      setShowAddForm(false);
      fetchCourses();
    } catch (error) {
      alert("Execution Error: Failed to add the program.");
    }
  };

  /**
   * Secure deletion of an existing Program.
   */
  const handleDeleteCourse = async (id, name) => {
    if (window.confirm(`DANGER: Delete "${name}"? All associated subjects and data will be permanently wiped!`)) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/courses/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        fetchCourses();
      } catch (error) {
        alert("Error: Course removal failed.");
      }
    }
  };

  return (
    <div className="pb-5 min-vh-100 arctic-body">
      {/* Global Header Context */}
      <div className="container mt-4">
        <div className="mb-4 d-flex justify-content-between align-items-center animate-in">
          <div>
            <h2 className="fw-bold brand-name mb-0">Academic Directory</h2>
            <p className="text-muted small fw-semibold text-uppercase mb-0">
               <i className="bi bi-mortarboard-fill me-1 text-primary"></i> Program Management
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-logout border-primary text-primary px-3 fw-bold">
            <i className="bi bi-arrow-left me-1"></i> Back
          </button>
        </div>

        {/* Admin Configuration Panel (Only for Superusers) */}
        {isSuperuser && (
          <div className="card shadow-sm border-0 mb-5 rounded-4 bg-white border-start border-primary border-5 animate-in">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h5 className="mb-1 text-dark fw-bold">System Configuration</h5>
                  <p className="text-muted small mb-0">Initialize new academic departments for SIMMC</p>
                </div>
                <button
                  className={`btn ${showAddForm ? 'btn-dark' : 'btn-primary'} fw-bold rounded-pill px-4 shadow-sm`}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? '✕ Close' : '＋ Add New Department'}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddCourse} className="mt-4 row g-3 bg-light p-4 rounded-4 border border-dashed animate-in">
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted text-uppercase">Program Name</label>
                    <input type="text" className="form-control border-0 py-2 shadow-none" placeholder="e.g. Master of Computer Applications" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted text-uppercase">Description</label>
                    <input type="text" className="form-control border-0 py-2 shadow-none" placeholder="e.g. 2-Year PG Course" value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button type="submit" className="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow">Publish</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Courses Listing Grid */}
        <div className="row g-4 animate-in">
          {loading ? (
             <div className="text-center py-5 w-100">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted fw-bold mt-2 small">Syncing SIMMC Academic Data...</p>
             </div>
          ) : courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm h-100 border-0 rounded-4 transition-hover bg-white border-bottom border-primary border-4">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex align-items-start justify-content-between mb-3">
                        <div className="icon-box-sky p-3">
                            <i className="bi bi-building fs-3"></i>
                        </div>
                        <span className="badge bg-light text-muted border px-3 rounded-pill">ID: {course.id}</span>
                    </div>

                    <h4 className="fw-bold text-dark mb-2">{course.name}</h4>
                    <p className="text-muted small mb-4 lh-base" style={{ minHeight: '40px' }}>
                        {course.description || "Active Academic Program / Department at SIMMC"}
                    </p>

                    <div className="mt-auto pt-3 d-flex flex-column gap-2 border-top">
                      <Link to={`/course/${course.id}`} className="btn btn-primary fw-bold rounded-pill py-2">
                        Access Curriculum <i className="bi bi-arrow-right-short ms-1"></i>
                      </Link>

                      {isSuperuser && (
                        <button className="btn btn-link text-danger text-decoration-none small fw-bold mt-1 btn-logout-hover"
                                onClick={() => handleDeleteCourse(course.id, course.name)}>
                          <i className="bi bi-trash3 me-1"></i> Terminate Program
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <div className="p-5 bg-white rounded-4 shadow-sm">
                <i className="bi bi-folder-x fs-1 text-muted opacity-25"></i>
                <h4 className="fw-bold mt-3 text-muted">No Academic Programs Found</h4>
                <p className="text-muted">Administrator must define a department to begin.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Courses;