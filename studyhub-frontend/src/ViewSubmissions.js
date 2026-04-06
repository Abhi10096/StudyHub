import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function ViewSubmissions() {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const isStaff = localStorage.getItem('isStaff') === 'true';

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/submissions/?assignment=${assignmentId}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  }, [assignmentId, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (!isStaff) {
      alert("❌ Access Denied: Only Teachers can view submissions.");
      navigate('/dashboard');
    } else {
      fetchSubmissions();
    }
  }, [navigate, token, isStaff, fetchSubmissions]);

  if (!isStaff) return null;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', paddingBottom: '60px' }}>

      {/* 🌟 Premium Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-3">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/dashboard" style={{ gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🎓</span>
            <span className="fw-bolder fs-4 tracking-wide">StudyHub Admin</span>
          </Link>
          <div className="navbar-nav me-auto ps-4">
            <button className="btn btn-outline-light btn-sm fw-bold rounded-pill px-4" onClick={() => navigate(-1)}>
              ⬅ Back to Subject
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-4 px-4 border-0">
            <h4 className="mb-0 fw-bold">📥 Assignment Submissions</h4>
            <span className="badge bg-primary fs-6 rounded-pill px-3 py-2 shadow-sm">Total: {submissions.length}</span>
          </div>

          <div className="card-body p-0">
            {submissions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 text-uppercase text-muted fs-7">Sr No.</th>
                      <th className="py-3 text-uppercase text-muted fs-7">Roll No</th>
                      <th className="py-3 text-uppercase text-muted fs-7">Student Name</th>
                      <th className="py-3 text-uppercase text-muted fs-7">Submitted At</th>
                      <th className="px-4 py-3 text-end text-uppercase text-muted fs-7">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, index) => (
                      <tr key={sub.id}>
                        <td className="px-4 py-3 fw-bold">{index + 1}</td>
                        <td className="py-3 fw-bold text-danger">{sub.roll_no}</td>
                        <td className="py-3 fw-bold text-primary fs-5">👨‍🎓 {sub.student_name}</td>
                        <td className="py-3 text-muted fw-semibold">
                          📅 {new Date(sub.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <a
                            href={sub.submission_file}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-success fw-bold rounded-pill px-4 shadow-sm"
                          >
                            ⬇ Download PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-5 text-muted">
                <h1 className="display-4">📭</h1>
                <h4 className="fw-bold mt-3">No submissions yet.</h4>
                <p>Students have not uploaded any answers for this assignment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewSubmissions;