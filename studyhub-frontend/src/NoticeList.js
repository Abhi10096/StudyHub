import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function NoticeList() {
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isStaff = localStorage.getItem('isStaff') === 'true' || localStorage.getItem('isSuperuser') === 'true';

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      // 🔥 FIX 1: Added Token to GET request so backend allows access
      const response = await axios.get('http://127.0.0.1:8000/api/notices/', {
        headers: { Authorization: `Token ${token}` }
      });

      // 🔥 FIX 2: Handle Pagination safely
      const data = response.data;
      const noticesArray = Array.isArray(data) ? data : (data.results || []);

      setNotices(noticesArray);
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/notices/',
        { title, content },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      alert("Notice Posted Successfully!");
      setTitle('');
      setContent('');
      setShowForm(false);
      // Fetch fresh notices immediately after posting
      fetchNotices();
    } catch (error) {
      console.error("Error posting notice:", error);
      alert("Failed to post notice. Make sure you are logged in as Faculty/Admin.");
    }
  };

  return (
    <div className="container mt-5 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Official Notice Board</h2>
        <Link to="/dashboard" className="btn btn-outline-secondary btn-sm fw-bold">Back to Dashboard</Link>
      </div>

      {isStaff && (
        <div className="mb-5">
          <button
            className={`btn ${showForm ? 'btn-danger' : 'btn-info'} text-white fw-bold shadow-sm`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "✖ Cancel" : "➕ Post New Notice"}
          </button>

          {showForm && (
            <div className="card mt-3 shadow border-0 p-4 bg-light">
              <h5 className="fw-bold mb-3">Create New Announcement</h5>
              <form onSubmit={handlePostNotice}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Notice Title</label>
                  <input
                    type="text"
                    className="form-control border-0 shadow-sm"
                    placeholder="e.g. Exam Timetable Released"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Detailed Content</label>
                  <textarea
                    className="form-control border-0 shadow-sm"
                    rows="4"
                    placeholder="Write the notice details here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-success px-4 fw-bold shadow-sm">Submit & Publish</button>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="row">
        <h4 className="fw-bold mb-3 text-secondary">Latest Announcements</h4>
        {notices.length > 0 ? (
          notices.map((notice) => (
            <div className="col-12 mb-3" key={notice.id}>
              <div className="card shadow-sm border-0 border-start border-info border-5 py-2">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <h5 className="card-title fw-bold text-dark mb-1">{notice.title}</h5>
                    <span className="badge bg-light text-muted border-0">
                      {new Date(notice.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <p className="card-text text-muted mt-2" style={{ whiteSpace: 'pre-line' }}>{notice.content}</p>
                  <div className="mt-3 pt-2 border-top d-flex align-items-center">
                    <i className="bi bi-person-circle me-2 text-info"></i>
                    <small className="fw-bold text-uppercase text-info" style={{ fontSize: '0.75rem' }}>
                      Posted By: {notice.posted_by_name || 'Admin'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 bg-white shadow-sm rounded">
            <p className="text-muted mb-0">No official notices have been posted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoticeList;