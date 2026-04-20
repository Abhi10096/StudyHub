import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * DiscussionForum Component: A Q&A platform where students post doubts
 * and faculty members provides official solutions.
 */
const DiscussionForum = () => {
    const navigate = useNavigate();

    // ---------------- STATE MANAGEMENT ---------------- //
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [userRole, setUserRole] = useState(false); // false = Student, true = Teacher/Admin
    const [currentUserId, setCurrentUserId] = useState(null);

    // UI & Filtering States
    const [activeTab, setActiveTab] = useState('archive');
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');

    // Form Handling States
    const [showAskForm, setShowAskForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ title: '', description: '', subject: '' });
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    /**
     * Fetches questions and subject categories from the backend.
     */
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Token ${token}` } };
        try {
            // Fetch all questions
            const qRes = await axios.get('http://127.0.0.1:8000/api/questions/', config);
            setQuestions(qRes.data);

            // Fetch subject list for dropdowns
            const sRes = await axios.get('http://127.0.0.1:8000/api/subjects/', config);
            const subjectsData = sRes.data.results ? sRes.data.results : sRes.data;
            setSubjects(subjectsData);
        } catch (error) {
            console.error("Critical: Discussion Forum fetch failed", error);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const isStaff = localStorage.getItem('isStaff') === 'true';
        const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
        const username = localStorage.getItem('username');

        setUserRole(isStaff || isSuperuser);
        setCurrentUserId(username);

        // Faculty starts with pending items, Students start with the global archive
        setActiveTab(isStaff || isSuperuser ? 'pending' : 'archive');
        fetchData();
    }, [navigate, fetchData]);

    /**
     * Submits a new doubt to the forum.
     */
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
            alert("Question posted to the forum.");
        } catch (error) {
            alert("Submission failed. Ensure all fields are valid.");
        }
    };

    /**
     * Posts an official faculty answer to a specific question.
     */
    const handleReply = async (questionId) => {
        const token = localStorage.getItem('token');
        if (!replyContent.trim()) return alert("Answer cannot be empty.");
        try {
            await axios.post(`http://127.0.0.1:8000/api/questions/${questionId}/reply/`,
                { content: replyContent },
                { headers: { Authorization: `Token ${token}` } }
            );
            setReplyingTo(null);
            setReplyContent('');
            fetchData();
            setActiveTab('archive');
            alert("Answer successfully recorded.");
        } catch (error) {
            alert("Failed to submit reply.");
        }
    };

    // ---------------- SEARCH & FILTER LOGIC ---------------- //
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = subjectFilter ? q.subject.toString() === subjectFilter : true;

        let matchesTab = true;
        if (userRole) {
            // Faculty View Logic
            if (activeTab === 'pending') matchesTab = !q.is_resolved;
            if (activeTab === 'archive') matchesTab = q.is_resolved;
        } else {
            // Student View Logic
            if (activeTab === 'archive') matchesTab = q.is_resolved;
            if (activeTab === 'my_questions') {
                matchesTab = String(q.asked_by_roll) === String(currentUserId);
            }
        }
        return matchesSearch && matchesSubject && matchesTab;
    });

    return (
        <div className="pb-5">
            {/* Global Navbar is handled in App.js */}

            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-0">Discussion Forum</h2>
                        <p className="text-muted small">Collaborative Q&A space for academic doubts</p>
                    </div>
                    {!userRole && (
                        <button className="btn btn-primary fw-bold shadow-sm rounded-pill px-4"
                                onClick={() => setShowAskForm(!showAskForm)}>
                            {showAskForm ? "Close Form" : "+ Raise a Doubt"}
                        </button>
                    )}
                </div>

                {/* Form: Ask Question */}
                {showAskForm && (
                    <div className="card p-4 mb-4 shadow-sm border-primary border-top border-4 rounded-4 bg-white">
                        <h5 className="fw-bold mb-3"><i className="bi bi-question-circle me-2"></i>What is your doubt?</h5>
                        <form onSubmit={handleAskQuestion}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <select className="form-select border-secondary shadow-sm" required
                                            value={newQuestion.subject}
                                            onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})}>
                                        <option value="">Choose Subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-8">
                                    <input type="text" className="form-control border-secondary shadow-sm" placeholder="Subject Title (e.g., Recursion in C++)"
                                           required value={newQuestion.title} onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})} />
                                </div>
                                <div className="col-12">
                                    <textarea className="form-control border-secondary shadow-sm" rows="3" placeholder="Elaborate your question here..."
                                              required value={newQuestion.description} onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}></textarea>
                                </div>
                                <div className="col-12 text-end">
                                    <button type="submit" className="btn btn-success fw-bold px-5 rounded-pill shadow">Post Question</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search & Global Filter Row */}
                <div className="row mb-4 g-3 bg-white p-3 rounded-4 shadow-sm border mx-0">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text bg-transparent border-end-0 text-muted"><i className="bi bi-search"></i></span>
                            <input type="text" className="form-control border-start-0 ps-0" placeholder="Filter questions by title keywords..."
                                   value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <select className="form-select fw-semibold text-secondary" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                            <option value="">All Academic Subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tab Navigation */}
                <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
                    {userRole ? (
                        <>
                            <li className="nav-item">
                                <button className={`nav-link fw-bold rounded-pill px-4 ${activeTab === 'pending' ? 'active bg-warning text-dark shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveTab('pending')}>Action Required</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link fw-bold rounded-pill px-4 ${activeTab === 'archive' ? 'active bg-success shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveTab('archive')}>Resolved Archive</button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="nav-item">
                                <button className={`nav-link fw-bold rounded-pill px-4 ${activeTab === 'archive' ? 'active bg-success shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveTab('archive')}>Knowledge Archive</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link fw-bold rounded-pill px-4 ${activeTab === 'my_questions' ? 'active bg-primary shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveTab('my_questions')}>My Activity</button>
                            </li>
                        </>
                    )}
                </ul>

                {/* Question List Rendering */}
                <div className="row">
                    {filteredQuestions.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <i className="bi bi-chat-square-dots fs-1 text-muted opacity-25 d-block mb-3"></i>
                            <h5 className="text-muted fw-bold">No discussions found in this category.</h5>
                        </div>
                    ) : (
                        filteredQuestions.map(q => (
                            <div key={q.id} className="col-12 mb-3">
                                <div className={`card shadow-sm border-0 rounded-4 overflow-hidden ${q.is_resolved ? 'border-start border-success border-5' : 'border-start border-warning border-5'}`}>
                                    <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                                        <span className="badge bg-light text-dark border fw-bold text-uppercase" style={{ fontSize: '10px' }}>{q.subject_name}</span>
                                        <span className={`badge rounded-pill ${q.is_resolved ? 'bg-success' : 'bg-warning text-dark'}`}>
                                            {q.is_resolved ? 'SOLVED' : 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="card-body px-4 pb-4">
                                        <h5 className="card-title fw-bold text-dark">{q.title}</h5>
                                        <p className="card-text text-muted mb-3" style={{ whiteSpace: 'pre-wrap' }}>{q.description}</p>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="bi bi-person text-primary small"></i>
                                            </div>
                                            <small className="text-secondary fw-semibold">Asked by {q.asked_by_name} <span className="mx-1 text-muted opacity-50">|</span> Roll: {q.asked_by_roll}</small>
                                        </div>

                                        {/* Display official answer if resolved */}
                                        {q.is_resolved && q.answer && (
                                            <div className="mt-4 p-3 bg-success bg-opacity-10 border-start border-success border-3 rounded-end">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <i className="bi bi-check2-circle text-success fw-bold fs-5"></i>
                                                    <strong className="text-success small text-uppercase">Faculty Solution:</strong>
                                                </div>
                                                <p className="mb-0 text-dark ps-4" style={{ whiteSpace: 'pre-wrap' }}>{q.answer.content}</p>
                                                <div className="text-end mt-2">
                                                    <small className="text-muted small">— {q.answer.answered_by_name}</small>
                                                </div>
                                            </div>
                                        )}

                                        {/* Faculty Reply Action */}
                                        {userRole && !q.is_resolved && (
                                            <div className="mt-4 pt-3 border-top">
                                                {replyingTo === q.id ? (
                                                    <div className="bg-light p-3 rounded-4 border">
                                                        <label className="fw-bold mb-2 small text-uppercase text-muted">Official Response:</label>
                                                        <textarea className="form-control mb-3 shadow-sm" rows="3" placeholder="Provide a detailed explanation for the student..."
                                                                  value={replyContent} onChange={(e) => setReplyContent(e.target.value)}></textarea>
                                                        <div className="text-end">
                                                            <button className="btn btn-outline-secondary btn-sm fw-bold me-2 px-3 rounded-pill" onClick={() => setReplyingTo(null)}>Dismiss</button>
                                                            <button className="btn btn-success btn-sm fw-bold px-4 rounded-pill shadow" onClick={() => handleReply(q.id)}>Submit Answer</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="btn btn-primary btn-sm fw-bold px-4 rounded-pill shadow-sm" onClick={() => setReplyingTo(q.id)}>
                                                        <i className="bi bi-reply me-1"></i> Resolve Doubt
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
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