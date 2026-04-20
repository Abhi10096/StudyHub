import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

/**
 * TestScores Component: Personal Performance Dashboard.
 * English Comment: Displays test results with precise submission timestamps.
 */
function TestScores() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [testTitle, setTestTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        const res = await axios.get(`http://127.0.0.1:8000/api/test-results/?test=${testId}`, config);

        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setResults(data);

        if (data.length > 0) {
          setTestTitle(data[0].test_title || "Academic Assessment");
        }
        setLoading(false);
      } catch (err) {
        console.error("Score fetch failed:", err);
        setLoading(false);
      }
    };

    if (token) fetchResults(); else navigate('/login');
  }, [testId, token, navigate]);

  return (
    <div className="pb-5 arctic-body min-vh-100 animate-in">
      {/* Arctic Professional Banner */}
      <div className="curriculum-banner mb-5 py-4 shadow-sm text-white">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-0">Performance Report</h2>
            <p className="small fw-bold opacity-75 mt-1 text-uppercase">
               <i className="bi bi-patch-check-fill me-2"></i>{testTitle}
            </p>
          </div>
          <button className="btn btn-outline-light rounded-pill px-4 fw-bold shadow-sm" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i> Back
          </button>
        </div>
      </div>

      <div className="container">
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white animate-in">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr className="text-muted small fw-bold text-uppercase">
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Score Ratio</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-end">Submission Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-5 fw-bold">Syncing Ledger...</td></tr>
                ) : results.length > 0 ? (
                  results.map((res) => (
                    <tr key={res.id} className="border-bottom">
                      <td className="px-4 py-4 fw-bold text-dark">
                        <i className="bi bi-person-circle me-3 text-primary fs-5"></i>
                        {res.student_name}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="fs-5 fw-bolder text-primary">{res.score}</span>
                        <span className="text-muted fw-bold small"> / {res.total_questions}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`badge rounded-pill px-3 py-1 fw-bold x-small ${res.is_auto_submitted ? 'bg-soft-danger text-danger' : 'bg-soft-success text-success'}`}>
                          {res.is_auto_submitted ? 'AUTO' : 'VERIFIED'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-end text-muted small fw-medium">
                        {/* --- DATE & TIME FIX --- */}
                        {new Date(res.submitted_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center p-5 text-muted fw-bold">No result record found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-center mt-5">
           <Link to="/dashboard" className="btn btn-primary rounded-pill px-5 fw-bold shadow">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default TestScores;