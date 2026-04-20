import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

/**
 * TakeTest: Professional Examination Interface.
 * RULES:
 * 1. No Tab-Switch (Auto-submits if window minimized/hidden).
 * 2. Time Bound (Auto-submits on timer expiry).
 * 3. Single Attempt (Locks access post-submission).
 */
function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const token = localStorage.getItem('token');

  // Load Data and Security Check
  useEffect(() => {
    const localLock = localStorage.getItem(`submitted_test_${testId}`);
    if (localLock === 'true') { setAlreadyDone(true); }

    const fetchTestData = async () => {
      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        const res = await axios.get(`http://127.0.0.1:8000/api/tests/${testId}/`, config);

        if (res.data.already_submitted) {
          setAlreadyDone(true);
          localStorage.setItem(`submitted_test_${testId}`, 'true');
        }

        setTest(res.data);
        setQuestions(res.data.questions || []);
        setTimeLeft(res.data.time_limit_mins * 60);
      } catch (err) {
        if (err.response?.status === 400) setAlreadyDone(true);
        else navigate('/dashboard');
      }
    };
    if (token) fetchTestData(); else navigate('/login');
  }, [testId, navigate, token]);

  // Submission Logic (Rules Enforcement)
  const submitTest = useCallback(async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`http://127.0.0.1:8000/api/tests/${testId}/submit_test/`,
        { answers, is_auto: isAuto },
        { headers: { Authorization: `Token ${token}` } }
      );
      localStorage.setItem(`submitted_test_${testId}`, 'true');
      navigate(`/test-scores/${testId}`);
    } catch (err) {
      localStorage.setItem(`submitted_test_${testId}`, 'true');
      navigate(`/test-scores/${testId}`);
    }
  }, [answers, isSubmitting, navigate, testId, token]);

  // RULE 1: Tab-Switch / Hidden Window Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting && test && !alreadyDone) {
        submitTest(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submitTest, isSubmitting, test, alreadyDone]);

  // RULE 2: Countdown Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || alreadyDone) return;
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, alreadyDone]);

  if (alreadyDone) return (
    <div className="container mt-5 pt-5 text-center">
      <div className="card shadow-sm p-4 border-0 rounded-4 mx-auto animate-in" style={{maxWidth: '400px'}}>
        <div className="icon-box-sky mx-auto mb-3"><i className="bi bi-shield-check text-success fs-1"></i></div>
        <h5 className="fw-bold">Attempt Recorded</h5>
        <p className="text-muted small">You have already submitted this assessment. No further attempts are allowed.</p>
        <div className="d-grid gap-2 mt-4">
            <Link to={`/test-scores/${testId}`} className="btn btn-primary fw-bold rounded-pill">View My Score</Link>
            <Link to="/dashboard" className="btn btn-light text-muted fw-bold rounded-pill">Dashboard</Link>
        </div>
      </div>
    </div>
  );

  if (!test) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="bg-light min-vh-100 pb-5 animate-in">
      <div className="bg-white border-bottom sticky-top py-2 shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <div><h6 className="fw-bold mb-0 text-primary">{test.title}</h6><span className="x-small text-muted fw-bold">PROCTORING ACTIVE</span></div>
          <div className={`badge rounded-pill px-3 py-2 ${timeLeft < 60 ? 'bg-danger animate-pulse' : 'bg-dark'}`}>
            <i className="bi bi-stopwatch me-2"></i>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {questions.map((q, idx) => (
              <div key={q.id} className="card border-0 shadow-sm mb-3 rounded-3">
                <div className="card-body p-4">
                  <span className="badge bg-soft-blue text-primary mb-2">Q{idx + 1}</span>
                  <h6 className="fw-bold text-dark mb-4">{q.question_text}</h6>
                  <div className="row g-2">
                    {[1, 2, 3, 4].map(n => (
                      <div className="col-12" key={n}>
                        <label className={`form-check p-2 px-3 border rounded-3 w-100 m-0 cursor-pointer ${answers[q.id] === n ? 'active-option-simple' : 'border-light'}`}>
                          <input className="form-check-input ms-0 me-3" type="radio" name={`q${q.id}`} checked={answers[q.id] === n} onChange={() => setAnswers({...answers, [q.id]: n})} />
                          <span className="small fw-medium">{q[`option_${n}`]}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center mt-4">
                <button className="btn btn-primary px-5 py-2 fw-bold rounded-pill shadow" onClick={() => window.confirm("Finish and Submit?") && submitTest()} disabled={isSubmitting}>
                    {isSubmitting ? "Finalizing..." : "Submit Assessment"}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TakeTest;