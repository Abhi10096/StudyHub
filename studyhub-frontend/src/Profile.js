import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reqCourse, setReqCourse] = useState('');
  const [reqSem, setReqSem] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';

  const fetchData = useCallback(() => {
    const config = { headers: { Authorization: `Token ${token}` } };

    // Fetch User Profile Data
    axios.get('http://127.0.0.1:8000/api/profile/', config)
      .then(res => setProfile(res.data))
      .catch(err => console.error("Profile fetch error:", err));

    // Fetch Available Courses for the Request Form
    axios.get('http://127.0.0.1:8000/api/courses/', config)
      .then(res => {
        setCourses(res.data);
        if (res.data.length > 0) setReqCourse(res.data[0].id);
      })
      .catch(err => console.error("Course fetch error:", err));
  }, [token]);

  useEffect(() => {
    if (!token) navigate('/login'); else fetchData();
  }, [navigate, token, fetchData]);

  const handleRequestChange = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/profile/', {
        course_id: reqCourse,
        semester: reqSem
      }, { headers: { Authorization: `Token ${token}` } });
      alert("Modification request submitted to administration.");
      fetchData(); // Refresh to show pending status
    } catch (err) {
      alert("Failed to submit request. Please verify inputs.");
    }
  };

  if (!profile) return <div className="text-center mt-5 fw-bold text-muted">Loading System Profile...</div>;

  return (
    <div className="pb-5 bg-light min-vh-100">

      {/* Top Navigation */}
      <nav className="navbar navbar-dark bg-dark py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/dashboard">Account Configuration</Link>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm fw-bold px-3">Return to Dashboard</button>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">

          {/* Main Account Overview Card */}
          <div className="col-md-6">
            <h4 className="fw-bolder text-dark mb-4">System Identity Overview</h4>
            <div className="card shadow-sm border-0 rounded-4 mb-4 border-top border-primary border-4">
              <div className="card-body p-5">

                <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
                  <div>
                    <h3 className="fw-bolder text-dark mb-1">{profile.name}</h3>
                    <p className="text-muted fw-bold mb-0">System ID: {profile.username}</p>
                  </div>
                  <span className={`badge px-3 py-2 rounded-pill fs-6 ${isSuperuser ? 'bg-danger' : profile.is_staff ? 'bg-dark' : 'bg-info text-dark'}`}>
                    {isSuperuser ? 'Master Admin' : profile.is_staff ? 'Faculty Member' : 'Enrolled Student'}
                  </span>
                </div>

                <div className="row g-4">
                  <div className="col-6">
                    <span className="text-muted small fw-bold text-uppercase d-block mb-1">Assigned Department</span>
                    <span className="fs-5 fw-bold text-primary">{profile.course}</span>
                  </div>

                  {/* Semester is only shown if the user is a Student */}
                  {!profile.is_staff && !isSuperuser && (
                    <div className="col-6">
                      <span className="text-muted small fw-bold text-uppercase d-block mb-1">Current Semester</span>
                      <span className="fs-5 fw-bold text-dark">{profile.semester !== '-' ? `Semester ${profile.semester}` : 'Unassigned'}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Department Modification Request Form (ONLY FOR STUDENTS) */}
            {!profile.is_staff && !isSuperuser && (
              <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-bottom p-4">
                  <h5 className="fw-bold mb-0 text-dark">Request Department/Semester Transfer</h5>
                </div>
                <div className="card-body p-4">
                  {profile.change_requested ? (
                    <div className="alert alert-warning fw-bold mb-0 text-center">
                      Your transfer request is currently pending administrative review.
                    </div>
                  ) : (
                    <form onSubmit={handleRequestChange}>
                      <div className="mb-3">
                        <label className="form-label fw-bold text-muted small">Target Department (Course)</label>
                        <select className="form-select" value={reqCourse} onChange={(e) => setReqCourse(e.target.value)} required>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-bold text-muted small">Target Semester</label>
                        <input type="number" className="form-control" value={reqSem} onChange={(e) => setReqSem(e.target.value)} required min="1" max="10" placeholder="e.g. 2" />
                      </div>
                      <button type="submit" className="btn btn-primary w-100 fw-bold py-2">Submit Transfer Request</button>
                    </form>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;