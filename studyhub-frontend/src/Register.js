import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', username: '', password: '', role: 'student',
    courseId: '', semester: ''
  });
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  // Fetch available courses for department assignment
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/courses/')
      .then(res => setCourses(res.data))
      .catch(err => console.error("Error fetching courses:", err));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation based on selected role
    if (!formData.courseId) {
      return alert("Please select a Department/Course.");
    }
    if (formData.role === 'student' && !formData.semester) {
      return alert("Please select a Semester.");
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
      alert('Registration successful. Please wait for Admin approval.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
      <div className="card shadow-lg border-0 rounded-4" style={{ width: '500px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark">Join StudyHub</h3>
            <p className="text-muted">Create your academic account</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="row g-2 mb-3">
              <div className="col-6"><input type="text" className="form-control" placeholder="First Name" required onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></div>
              <div className="col-6"><input type="text" className="form-control" placeholder="Last Name" required onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></div>
            </div>

            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Username / Roll No" required onChange={(e) => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="mb-3">
              <input type="password" className="form-control" placeholder="Password" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>

            <div className="mb-3">
              <select className="form-select fw-bold" onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="student">Register as Student</option>
                <option value="teacher">Register as Faculty</option>
              </select>
            </div>

            {/* Department selection is mandatory for both roles */}
            <div className="row g-2 mb-4 p-3 bg-light rounded-3 border">
              <div className={formData.role === 'student' ? "col-7" : "col-12"}>
                <label className="fw-bold text-muted small">Department / Course</label>
                <select className="form-select" required onChange={(e) => setFormData({...formData, courseId: e.target.value})}>
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Semester is only visible for students */}
              {formData.role === 'student' && (
                <div className="col-5">
                  <label className="fw-bold text-muted small">Semester</label>
                  <select className="form-select" required onChange={(e) => setFormData({...formData, semester: e.target.value})}>
                    <option value="">-- Sem --</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold rounded-pill py-2 mt-2">Submit Request</button>
          </form>

          <div className="text-center mt-4">
            <span className="text-muted">Already have an account? </span>
            <Link to="/login" className="fw-bold text-decoration-none">Login Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;