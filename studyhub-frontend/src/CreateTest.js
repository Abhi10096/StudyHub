import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function CreateTest() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extracting subject details from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const autoSubjectId = queryParams.get('subjectId');
  const autoSubjectName = queryParams.get('subjectName');

  // Test metadata state
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    subject: autoSubjectId || '', // Automatically assigned from URL
    time_limit_mins: 30,
    deadline: '',
    marks_per_question: 1
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

    if (!testData.subject) {
        alert("Error: Subject context is missing. Please initiate test creation from the Subject Details page.");
        return;
    }

    try {
      const token = localStorage.getItem('token');

      // Step 1: Create the Test object
      const testRes = await axios.post('http://127.0.0.1:8000/api/tests/', testData, {
        headers: { Authorization: `Token ${token}` }
      });

      const testId = testRes.data.id;

      // Step 2: Bulk create questions linked to the new Test ID
      const questionPromises = questions.map(q =>
        axios.post('http://127.0.0.1:8000/api/quiz-questions/', { ...q, test: testId }, {
          headers: { Authorization: `Token ${token}` }
        })
      );

      await Promise.all(questionPromises);

      alert("Online Test published successfully!");
      navigate(`/subject/${autoSubjectName}`); // Redirect back to the originating subject page
    } catch (err) {
      console.error("Test Creation Error:", err);
      alert("Failed to publish test. Please verify all required fields.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm border-0 p-4 bg-white rounded-4">
        <h2 className="fw-bold text-primary mb-1">Create New Online Test</h2>
        <p className="text-muted mb-4">Configuring test for: <span className="badge bg-info text-dark">{autoSubjectName}</span></p>

        <form onSubmit={handleSubmit}>
          {/* Section: Test Configuration */}
          <div className="row g-3 mb-4">
            <div className="col-md-12">
              <label className="form-label fw-bold small text-uppercase text-muted">Test Title</label>
              <input type="text" className="form-control" placeholder="e.g. Monthly Assessment - April" required
                onChange={(e) => setTestData({...testData, title: e.target.value})} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-uppercase text-muted">Duration (Minutes)</label>
              <input type="number" className="form-control" value={testData.time_limit_mins}
                onChange={(e) => setTestData({...testData, time_limit_mins: e.target.value})} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-uppercase text-muted">Submission Deadline</label>
              <input type="datetime-local" className="form-control" required
                onChange={(e) => setTestData({...testData, deadline: e.target.value})} />
            </div>
          </div>

          <hr className="my-4" />

          {/* Section: Question Builder */}
          <h5 className="fw-bold mb-3"><i className="bi bi-patch-question me-2"></i>Question Bank</h5>

          {questions.map((q, index) => (
            <div key={index} className="card border-0 bg-light mb-3 p-3 shadow-sm rounded-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-primary">Question {index + 1}</span>
              </div>

              <textarea className="form-control mb-3 border-0 shadow-sm" rows="2" placeholder="Enter the question statement..." required
                onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)} />

              <div className="row g-2">
                {[1, 2, 3, 4].map(num => (
                  <div className="col-md-6" key={num}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white border-0 fw-bold">{num}</span>
                        <input type="text" className="form-control border-0 shadow-sm" placeholder={`Option ${num}`} required
                          onChange={(e) => handleQuestionChange(index, `option_${num}`, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 d-flex align-items-center">
                <label className="me-3 fw-bold small text-success">Correct Answer:</label>
                <select className="form-select form-select-sm w-auto border-success shadow-sm"
                  onChange={(e) => handleQuestionChange(index, 'correct_option', e.target.value)}>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                  <option value="4">Option 4</option>
                </select>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-outline-primary btn-sm mb-4 fw-bold rounded-pill px-3" onClick={addQuestionField}>
            + Add Another Question
          </button>
o//
          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2 border-top pt-4">
            <button type="button" className="btn btn-light px-4 fw-bold rounded-pill" onClick={() => navigate(-1)}>Discard</button>
            <button type="submit" className="btn btn-success px-5 fw-bold shadow rounded-pill">Publish Assessment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTest;