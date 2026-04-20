import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Register Component: Handles user onboarding for the StudyHub portal.
 * Collects personal details, role-based academic mapping, and credentials.
 */
function Register() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', username: '', password: '', role: 'student',
    courseId: '', semester: ''
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Sync available academic departments/courses from the backend.
   */
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/courses/')
      .then(res => setCourses(res.data))
      .catch(err => console.error("Course mapping synchronization failed:", err));
  }, []);

  /**
   * Final Submission logic for account creation request.
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Context-specific validation
    if (!formData.courseId) {
      setLoading(false);
      return alert("Critical: Please assign a Department/Course.");
    }
    if (formData.role === 'student' && !formData.semester) {
      setLoading(false);
      return alert("Critical: Please select your current Semester.");
    }

    try {
      await axios.post('http://127.0.0.1:8000/api/register/', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        course_id: formData.courseId,
        semester: formData.semester
      });
      alert('Application Received! Account activation is pending Admin approval.');
      navigate('/login');
    } catch (error) {
      setLoading(false);
      alert(error.response?.data?.error || 'Registration fault. Username may already exist.');
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-5">

          {/* Brand Header */}
          <div className="text-center mb-4">
            <h2 className="fw-bolder text-primary">Join StudyHub</h2>
            <p className="text-muted small">Begin your academic collaboration today</p>
          </div>

          {/* Registration Card */}
          <div className="card shadow border-0 rounded-4 overflow-hidden">
            <div className="card-body p-4 p-md-5">
              <h4 className="fw-bold mb-4">Create Account</h4>

              <form onSubmit={handleRegister}>
                {/* Full Name Row */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">First Name</label>
                    <input type="text" className="form-control bg-light border-0 shadow-none py-2"
                           placeholder="John" required onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Last Name</label>
                    <input type="text" className="form-control bg-light border-0 shadow-none py-2"
                           placeholder="Doe" required onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                </div>

                {/* Identity & Credentials */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Username / Roll No</label>
                  <input type="text" className="form-control bg-light border-0 shadow-none py-2"
                         placeholder="e.g. 21MCA05" required onChange={(e) => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Secure Password</label>
                  <input type="password" className="form-control bg-light border-0 shadow-none py-2"
                         placeholder="••••••••" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>

                {/* Role Definition */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase">System Role</label>
                  <select className="form-select bg-light border-0 shadow-none py-2 fw-semibold"
                          onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="student">Register as Enrolled Student</option>
                    <option value="teacher">Register as Faculty Member</option>
                  </select>
                </div>

                {/* Academic Context (Role Dependent) */}
                <div className="p-4 bg-light rounded-4 mb-4 border border-dashed">
                  <div className="row g-3">
                    <div className={formData.role === 'student' ? "col-8" : "col-12"}>
                      <label className="fw-bold text-primary small text-uppercase d-block mb-1">Department</label>
                      <select className="form-select border-0 shadow-sm" required
                              onChange={(e) => setFormData({...formData, courseId: e.target.value})}>
                        <option value="">-- Choose Course --</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {formData.role === 'student' && (
                      <div className="col-4">
                        <label className="fw-bold text-primary small text-uppercase d-block mb-1">Semester</label>
                        <select className="form-select border-0 shadow-sm" required
                                onChange={(e) => setFormData({...formData, semester: e.target.value})}>
                          <option value="">-- Sem --</option>
                          {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Control */}
                <button type="submit" className="btn btn-primary w-100 fw-bold rounded-pill py-3 shadow-sm transition-hover" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Processing Application...</>
                  ) : "Submit Registration Request"}
                </button>
              </form>

              {/* Navigation Back */}
              <div className="text-center mt-4">
                <span className="text-muted small">Already a member? </span>
                <Link to="/login" className="text-primary fw-bold text-decoration-none">Return to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;