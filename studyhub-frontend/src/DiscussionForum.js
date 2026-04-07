import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const DiscussionForum = () => {
    const navigate = useNavigate();

    // ---------------- STATES ---------------- //
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [userRole, setUserRole] = useState(false); // false = Student, true = Teacher/Admin
    const [currentUserId, setCurrentUserId] = useState(null);

    // UI States
    const [activeTab, setActiveTab] = useState('archive');
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');

    // Form States
    const [showAskForm, setShowAskForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ title: '', description: '', subject: '' });
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    // ---------------- FETCH DATA ---------------- //
    useEffect(() => {
        fetchData();
        const isStaff = localStorage.getItem('isStaff') === 'true';
        const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
        const username = localStorage.getItem('username');

        setUserRole(isStaff || isSuperuser);
        setCurrentUserId(username);

        if (isStaff || isSuperuser) {
            setActiveTab('pending');
        } else {
            setActiveTab('archive');
        }
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Token ${token}` } };
        try {
            // Fetch Questions (Backend returns a flat array)
            const qRes = await axios.get('http://127.0.0.1:8000/api/questions/', config);
            setQuestions(qRes.data);

            // Fetch Subjects
            const sRes = await axios.get('http://127.0.0.1:8000/api/subjects/', config);

            // FIXED: Handling the new backend object structure { current_path, results: [] }
            // If .results exists, use it. Otherwise, fallback to standard array.
            const subjectsData = sRes.data.results ? sRes.data.results : sRes.data;
            setSubjects(subjectsData);

        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    // ---------------- ACTIONS ---------------- //
    const handleAskQuestion = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://127.0.0.1:8000/api/questions/', newQuestion, {
                headers: { Authorization: `Token ${token}` }
            });
            setShowAskForm(false);
            setNewQuestion({ title: '', description: '', subject: '' });
            fetchData();
            setActiveTab('my_questions');
            alert("Question submitted successfully!");
        } catch (error) {
            console.error("Error asking question", error);
            alert("Failed to submit question. Check inputs.");
        }
    };

    const handleReply = async (questionId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`http://127.0.0.1:8000/api/questions/${questionId}/reply/`,
                { content: replyContent },
                { headers: { Authorization: `Token ${token}` } }
            );
            setReplyingTo(null);
            setReplyContent('');
            fetchData();
            setActiveTab('archive');
            alert("Answer submitted successfully!");
        } catch (error) {
            console.error("Error submitting reply", error);
            alert("Failed to submit answer.");
        }
    };

    const handleLogout = () => {
        if (window.confirm("Confirm secure logout?")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    // ---------------- FILTER LOGIC ---------------- //
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = subjectFilter ? q.subject.toString() === subjectFilter : true;

        let matchesTab = true;
        if (userRole) {
            // TEACHER TABS
            if (activeTab === 'pending') matchesTab = !q.is_resolved;
            if (activeTab === 'archive') matchesTab = q.is_resolved;
        } else {
            // STUDENT TABS
            if (activeTab === 'archive') matchesTab = q.is_resolved;
            if (activeTab === 'my_questions') {
                // Ensure safe string comparison for Roll Number
                matchesTab = String(q.asked_by_roll) === String(currentUserId);
            }
        }

        return matchesSearch && matchesSubject && matchesTab;
    });

    // ---------------- RENDER ---------------- //
    return (
        <div className="pb-5 bg-light min-vh-100">
            <nav className="navbar navbar-dark bg-dark py-3 shadow-sm mb-4">
                <div className="container">
                    <Link className="navbar-brand fw-bold text-uppercase" to="/dashboard" style={{ letterSpacing: '1px' }}>
                        StudyHub Portal
                    </Link>
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/dashboard" className="btn btn-outline-light btn-sm fw-bold px-3">Back to Dashboard</Link>
                        <button onClick={handleLogout} className="btn btn-danger btn-sm fw-bold px-3">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold text-dark">Discussion Forum (Q&A)</h2>
                    {!userRole && (
                        <button className="btn btn-primary fw-bold shadow-sm" onClick={() => setShowAskForm(!showAskForm)}>
                            {showAskForm ? "Cancel" : "+ Ask a Question"}
                        </button>
                    )}
                </div>

                {showAskForm && (
                    <div className="card p-4 mb-4 shadow border-primary border-top border-4">
                        <h5 className="fw-bold mb-3">Ask a New Doubt</h5>
                        <form onSubmit={handleAskQuestion}>
                            <select className="form-select mb-3" required
                                    value={newQuestion.subject}
                                    onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})}>
                                <option value="">Select Subject...</option>
                                {/* Safe mapping after applying the fix */}
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <input type="text" className="form-control mb-3" placeholder="Question Title (e.g. What is Polymorphism?)"
                                   required value={newQuestion.title} onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})} />
                            <textarea className="form-control mb-3" rows="3" placeholder="Describe your doubt in detail..."
                                      required value={newQuestion.description} onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}></textarea>
                            <button type="submit" className="btn btn-success fw-bold">Submit Question</button>
                        </form>
                    </div>
                )}

                <div className="row mb-4 g-3">
                    <div className="col-md-8">
                        <input type="text" className="form-control border-secondary" placeholder="Search questions by title..."
                               value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                        <select className="form-select border-secondary" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <ul className="nav nav-pills mb-4 pb-2 border-bottom">
                    {userRole ? (
                        <>
                            <li className="nav-item me-2">
                                <button className={`nav-link fw-bold ${activeTab === 'pending' ? 'active bg-warning text-dark' : 'text-dark'}`}
                                        onClick={() => setActiveTab('pending')}>Action Required (Pending)</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link fw-bold ${activeTab === 'archive' ? 'active bg-success' : 'text-dark'}`}
                                        onClick={() => setActiveTab('archive')}>Knowledge Base (Resolved)</button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="nav-item me-2">
                                <button className={`nav-link fw-bold ${activeTab === 'archive' ? 'active bg-success' : 'text-dark'}`}
                                        onClick={() => setActiveTab('archive')}>Global Q&A Archive</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link fw-bold ${activeTab === 'my_questions' ? 'active bg-primary' : 'text-dark'}`}
                                        onClick={() => setActiveTab('my_questions')}>My Questions</button>
                            </li>
                        </>
                    )}
                </ul>

                <div>
                    {filteredQuestions.length === 0 ? (
                        <div className="alert alert-secondary text-center py-4">
                            <strong>No questions found in this section.</strong>
                        </div>
                    ) : (
                        filteredQuestions.map(q => (
                            <div key={q.id} className={`card mb-3 shadow-sm ${q.is_resolved ? 'border-success' : 'border-warning'}`}>
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <strong className="text-secondary">{q.subject_name}</strong>
                                    <span className={`badge ${q.is_resolved ? 'bg-success' : 'bg-warning text-dark'}`}>
                                        {q.is_resolved ? 'Answered' : 'Pending'}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title fw-bold text-dark">{q.title}</h5>
                                    <p className="card-text text-muted" style={{ whiteSpace: 'pre-wrap' }}>{q.description}</p>
                                    <small className="text-secondary fw-semibold">Asked by {q.asked_by_name} ({q.asked_by_roll})</small>

                                    {q.is_resolved && q.answer && (
                                        <div className="alert alert-success mt-3 mb-0 border-0 bg-opacity-25">
                                            <strong className="text-success">Answered by {q.answer.answered_by_name}:</strong>
                                            <p className="mb-0 mt-2 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{q.answer.content}</p>
                                        </div>
                                    )}

                                    {userRole && !q.is_resolved && (
                                        <div className="mt-4 pt-3 border-top">
                                            {replyingTo === q.id ? (
                                                <div className="bg-light p-3 rounded border">
                                                    <label className="fw-bold mb-2">Write your official answer:</label>
                                                    <textarea className="form-control mb-3" rows="4" placeholder="Type answer here..."
                                                              value={replyContent} onChange={(e) => setReplyContent(e.target.value)}></textarea>
                                                    <button className="btn btn-success fw-bold me-2" onClick={() => handleReply(q.id)}>Submit Answer</button>
                                                    <button className="btn btn-outline-secondary fw-bold" onClick={() => setReplyingTo(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-primary fw-bold" onClick={() => setReplyingTo(q.id)}>Reply to Student</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscussionForum;