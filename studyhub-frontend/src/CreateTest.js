import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function CreateTest() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extracting subject details from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const autoSubjectId = queryParams.get('subjectId');
  const autoSubjectName = queryParams.get('subjectName');

  // Test metadata state (Including Deadline)
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    subject: autoSubjectId || '', // Automatically assigned from URL
    time_limit_mins: 30,
    deadline: ''
  });

  // Dynamic questions state
  const [questions, setQuestions] = useState([
    { question_text: '', option_1: '', option_2: '', option_3: '', option_4: '', correct_option: 1 }
  ]);

  /**
   * Appends a new question object to the state
   */
  const addQuestionField = () => {
    setQuestions([...questions, { question_text: '', option_1: '', option_2: '', option_3: '', option_4: '', correct_option: 1 }]);
  };

  /**
   * Updates specific fields within a question block
   */
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  /**
   * Handles the multi-step submission: 1. Create Test, 2. Create Questions
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛑 STRICT VALIDATION: Check if Subject ID is a valid number
    const finalSubjectId = parseInt(testData.subject);
    if (isNaN(finalSubjectId)) {
        alert("Critical Error: Subject ID is missing or invalid. Please go back to the Subject page and click 'Create Test' again so the ID is passed correctly.");
        return; // Stop execution here
    }

    try {
      const token = localStorage.getItem('token');

      // 🛑 Payload Preparation for Backend
      const payload = {
        title: testData.title,
        description: testData.description || "No description provided",
        time_limit_mins: parseInt(testData.time_limit_mins),
        subject: finalSubjectId, // Safe Integer
        deadline: testData.deadline
      };

      // Step 1: Create the Test object
      const testRes = await axios.post('http://127.0.0.1:8000/api/tests/', payload, {
        headers: { Authorization: `Token ${token}` }
      });

      const testId = testRes.data.id;

      // Step 2: Bulk create questions linked to the new Test ID
      const questionPromises = questions.map(q => {
        return axios.post('http://127.0.0.1:8000/api/quiz-questions/', {
            ...q,
            test: testId,
            correct_option: parseInt(q.correct_option)
        }, {
            headers: { Authorization: `Token ${token}` }
        });
      });

      await Promise.all(questionPromises);

      alert("Online Test published successfully!");
      navigate(`/subject/${autoSubjectName}`); // Redirect back to subject page
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data);
      alert(`Failed to publish test. Backend Error: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  };

  return (
    <div className="container mt-5 pb-5">
      <div className="card shadow-sm border-0 p-4 bg-white rounded-4 animate-in">
        <h2 className="fw-bold text-primary mb-1">Create New Online Test</h2>
        <p className="text-muted mb-4">Configuring test for: <span className="badge bg-info text-dark">{autoSubjectName || "Selected Subject"}</span></p>

        <form onSubmit={handleSubmit}>
          {/* Section: Test Configuration */}
          <div className="row g-3 mb-4">
            <div className="col-md-12">
              <label className="form-label fw-bold small text-uppercase text-muted">Test Title</label>
              <input type="text" className="form-control bg-light border-0" placeholder="e.g. Monthly Assessment - April" required
                onChange={(e) => setTestData({...testData, title: e.target.value})} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-uppercase text-muted">Duration (Minutes)</label>
              <input type="number" className="form-control bg-light border-0" value={testData.time_limit_mins} required
                onChange={(e) => setTestData({...testData, time_limit_mins: e.target.value})} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-uppercase text-muted">Submission Deadline</label>
              <input type="datetime-local" className="form-control bg-light border-0" required
                onChange={(e) => setTestData({...testData, deadline: e.target.value})} />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold small text-uppercase text-muted">Description / Instructions</label>
              <input type="text" className="form-control bg-light border-0" placeholder="Brief instructions for students..."
                onChange={(e) => setTestData({...testData, description: e.target.value})} />
            </div>
          </div>

          <hr className="my-4 text-muted" />

          {/* Section: Question Builder */}
          <h5 className="fw-bold mb-3"><i className="bi bi-patch-question me-2 text-primary"></i>Question Bank</h5>

          {questions.map((q, index) => (
            <div key={index} className="card border-0 bg-light mb-4 p-4 shadow-sm rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-primary rounded-pill px-3 py-2">Question {index + 1}</span>
              </div>

              <textarea className="form-control mb-3 border-0 shadow-sm" rows="2" placeholder="Enter the question statement..." required
                onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)} />

              <div className="row g-3">
                {[1, 2, 3, 4].map(num => (
                  <div className="col-md-6" key={num}>
                    <div className="input-group">
                        <span className="input-group-text bg-white border-0 fw-bold text-muted">{num}</span>
                        <input type="text" className="form-control border-0 shadow-sm py-2" placeholder={`Option ${num}`} required
                          onChange={(e) => handleQuestionChange(index, `option_${num}`, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 d-flex align-items-center bg-white p-2 rounded-3 shadow-sm d-inline-block w-auto">
                <label className="me-3 ms-2 fw-bold small text-success">Correct Answer:</label>
                <select className="form-select form-select-sm w-auto border-0 text-success fw-bold bg-transparent"
                  onChange={(e) => handleQuestionChange(index, 'correct_option', e.target.value)}>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                  <option value="4">Option 4</option>
                </select>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-outline-primary btn-sm mb-4 fw-bold rounded-pill px-4 py-2" onClick={addQuestionField}>
            <i className="bi bi-plus-lg me-1"></i> Add Another Question
          </button>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-3 border-top pt-4">
            <button type="button" className="btn btn-light px-4 fw-bold rounded-pill text-muted" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-success px-5 fw-bold shadow rounded-pill">Publish Assessment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTest;