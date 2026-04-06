import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isStaff = localStorage.getItem('isStaff') === 'true';

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/courses/', {
        headers: { Authorization: `Token ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchCourses();
  }, [navigate, token, fetchCourses]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/courses/',
        { name: newCourseName, description: newCourseDesc },
        { headers: { Authorization: `Token ${token}` } }
      );
      alert("✅ Course Added Successfully!");
      setNewCourseName('');
      setNewCourseDesc('');
      setShowAddForm(false);
      fetchCourses();
    } catch (error) {
      alert("❌ Failed to add course.");
    }
  };

  const handleDeleteCourse = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the entire course "${name}"? This will delete all subjects and notes inside it!`)) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/courses/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        fetchCourses();
      } catch (error) {
        alert("❌ Failed to delete course.");
      }
    }
  };

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', paddingBottom: '60px' }}>

      {/* Premium Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-3">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/dashboard" style={{ gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🎓</span>
            <span className="fw-bolder fs-4 tracking-wide">StudyHub LMS</span>
          </Link>
          <div className="navbar-nav me-auto ps-4">
            <Link className="nav-link fw-semibold px-3 text-light" to="/dashboard">Dashboard</Link>
            <Link className="nav-link active fw-semibold px-3" to="/courses">All Courses</Link>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-sm px-4 fw-bold rounded-pill shadow-sm">Logout</button>
        </div>
      </nav>

      <div className="container mt-5">

        {/* Admin Controls */}
        {isStaff && (
          <div className="card shadow-sm mb-5 border-0 rounded-4 bg-white">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-primary fw-bold">⚙️ Master Course Management</h5>
                <button
                  className={`btn ${showAddForm ? 'btn-secondary' : 'btn-success'} fw-bold rounded-pill px-4`}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : '+ Add New Program / Course'}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddCourse} className="mt-4 row g-3 bg-light p-4 rounded-4 border border-2">
                  <div className="col-md-5">
                    <label className="form-label fw-bold">Course Name</label>
                    <input type="text" className="form-control form-control-lg" placeholder="e.g. Master of Computer Applications (MCA)" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-bold">Description (Optional)</label>
                    <input type="text" className="form-control form-control-lg" placeholder="e.g. 2 Year PG Program" value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold rounded-3">Save</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <h3 className="mb-4 border-bottom border-3 border-primary pb-2 text-dark fw-bolder">
          🏛️ Available Programs
        </h3>

        <div className="row g-4">
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="col-md-4">
                <div className="card shadow-sm h-100 border-0 rounded-4 border-top border-primary border-5" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
                  <div className="card-body p-4 d-flex flex-column">
                    <h3 className="fw-bold text-dark mb-2">{course.name}</h3>
                    <p className="text-muted mb-4">{course.description || "Academic Program"}</p>

                    <div className="mt-auto d-flex flex-column gap-2">
                      <Link to={`/course/${course.id}`} className="btn btn-outline-primary fw-bold rounded-pill py-2">
                        View Semesters ➡️
                      </Link>
                      {isStaff && (
                        <button className="btn btn-outline-danger fw-bold rounded-pill py-2 mt-2" onClick={() => handleDeleteCourse(course.id, course.name)}>
                          🗑️ Delete Course
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center text-muted mt-5">
              <div className="p-5 bg-white rounded-4 shadow-sm">
                <h1 className="display-4">📭</h1>
                <h4 className="fw-bold mt-3">No Courses Found</h4>
                <p>Admin needs to add a master course (like MCA, MBA) to begin.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Courses;