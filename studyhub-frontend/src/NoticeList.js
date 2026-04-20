import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * NoticeList Component: An official announcement hub for students and faculty.
 * Features dynamic semester generation and role-based posting authority.
 */
function NoticeList() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [courses, setCourses] = useState([]);

  // UI Visibility and Form States
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetSemester, setTargetSemester] = useState('');
  const [targetCourse, setTargetCourse] = useState('');

  // Filtering Logic States
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);

  // Authorization Helpers
  const isAdmin = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true' || isAdmin;
  const isFaculty = isStaff && !isAdmin;

  /**
   * Data Fetching Logic for Announcements and Academic Metadata
   */
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Token ${token}` } };
    try {
      // Fetch Notices
      const nRes = await axios.get('http://127.0.0.1:8000/api/notices/', config);
      setNotices(Array.isArray(nRes.data) ? nRes.data : (nRes.data.results || []));

      // Fetch Courses for administrative mapping
      if (isStaff) {
        const cRes = await axios.get('http://127.0.0.1:8000/api/courses/', config);
        setCourses(Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []));
      }
    } catch (err) {
      console.error("Critical: NoticeBoard data sync failed", err);
    }
  }, [isStaff]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Dynamic Semester Generator: Syncs semester count based on selected course
   */
  useEffect(() => {
    let selectedCourseId = null;
    if (isAdmin && targetCourse) {
      selectedCourseId = parseInt(targetCourse);
    } else if (isFaculty) {
      const storedCourseId = localStorage.getItem('course_id');
      selectedCourseId = storedCourseId && storedCourseId !== 'null' ? parseInt(storedCourseId) : null;
    }

    if (selectedCourseId && courses.length > 0) {
      const courseObj = courses.find(c => c.id === selectedCourseId);
      if (courseObj?.total_semesters) {
        setAvailableSemesters(Array.from({ length: courseObj.total_semesters }, (_, i) => i + 1));
      } else {
        setAvailableSemesters([]);
      }
    } else {
      setAvailableSemesters([]);
      setTargetSemester('');
    }
  }, [targetCourse, courses, isAdmin, isFaculty]);

  /**
   * Action: Post a new notice to the database
   */
  const handlePostNotice = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = {
      title,
      content,
      target_semester: targetSemester ? parseInt(targetSemester) : null,
      target_course: isAdmin && targetCourse ? parseInt(targetCourse) : null
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/notices/', payload, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' }
      });
      alert("Announcement published successfully!");
      setTitle(''); setContent(''); setTargetSemester(''); setTargetCourse('');
      setShowForm(false);
      fetchData();
    } catch (error) {
      alert("Unauthorized or Invalid Data. Please check your credentials.");
    }
  };

  // Logic: Notice Filtering for the Viewport
  const displayedNotices = notices.filter(n => {
    let matchCourse = true, matchSem = true;
    if (isAdmin && filterCourse !== '') {
      matchCourse = filterCourse === 'global' ? n.target_course === null : n.target_course === parseInt(filterCourse);
    }
    if (filterSemester !== '') {
      matchSem = filterSemester === 'course_wide' ? n.target_semester === null : n.target_semester === parseInt(filterSemester);
    }
    return matchCourse && matchSem;
  });

  return (
    <div className="pb-5">
      <div className="container mt-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">Official Notice Board</h2>
            <p className="text-muted small mb-0">Stay informed with the latest campus updates</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-light btn-sm fw-bold px-3 rounded-pill border shadow-sm">
            <i className="bi bi-arrow-left me-2"></i>Exit Board
          </button>
        </div>

        {/* Administration Actions */}
        {isStaff && (
          <div className="mb-5">
            <button
              className={`btn ${showForm ? 'btn-dark' : 'btn-primary'} fw-bold px-4 rounded-pill shadow`}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "✕ Dismiss Form" : "＋ Post New Announcement"}
            </button>

            {showForm && (
              <div className="card mt-4 shadow-lg border-0 rounded-4 overflow-hidden transition-hover">
                <div className="card-header bg-primary text-white py-3">
                    <h5 className="mb-0 fw-bold small text-uppercase letter-spacing-1">Publish Notice</h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handlePostNotice}>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">NOTICE TITLE</label>
                      <input type="text" className="form-control bg-light border-0 py-2 shadow-none"
                             placeholder="e.g. End Semester Exam Schedule" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">DETAILED CONTENT</label>
                      <textarea className="form-control bg-light border-0 py-2 shadow-none"
                                rows="3" placeholder="Provide full details here..." value={content} onChange={(e) => setContent(e.target.value)} required ></textarea>
                    </div>

                    <div className="row g-3 mb-4">
                      {isAdmin && (
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted">TARGET COURSE</label>
                          <select className="form-select bg-light border-0 shadow-none" value={targetCourse} onChange={(e) => setTargetCourse(e.target.value)}>
                            <option value="">Global (All Courses)</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      )}
                      {availableSemesters.length > 0 && (
                        <div className={`col-md-${isAdmin ? '6' : '12'}`}>
                          <label className="form-label small fw-bold text-muted">TARGET SEMESTER</label>
                          <select className="form-select bg-light border-0 shadow-none" value={targetSemester} onChange={(e) => setTargetSemester(e.target.value)}>
                            <option value="">Course-wide (All Semesters)</option>
                            {availableSemesters.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="text-end">
                        <button type="submit" className="btn btn-success px-5 fw-bold rounded-pill shadow">Submit & Publish</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Filter Panel */}
        <div className="bg-white p-3 shadow-sm rounded-4 border mb-5 d-flex flex-wrap gap-3 align-items-center">
          <div className="flex-grow-1">
            <h6 className="fw-bold mb-0 text-dark ms-2"><i className="bi bi-funnel text-primary me-2"></i>Filter Board:</h6>
          </div>
          {isAdmin && (
            <select className="form-select form-select-sm w-auto border-0 bg-light rounded-pill px-3 fw-semibold text-secondary" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All Categories</option>
              <option value="global">Global Only</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {(isAdmin || isFaculty) && (
            <select className="form-select form-select-sm w-auto border-0 bg-light rounded-pill px-3 fw-semibold text-secondary" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
              <option value="">All Semesters</option>
              <option value="course_wide">Course-wide</option>
              {(availableSemesters.length > 0 ? availableSemesters : [1,2,3,4,5,6]).map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          )}
        </div>

        {/* Notices Rendering Area */}
        <div className="row">
          {displayedNotices.length > 0 ? (
            displayedNotices.map((notice) => (
              <div className="col-12 mb-4" key={notice.id}>
                <div className="card shadow-sm border-0 rounded-4 transition-hover bg-white border-start border-5 border-primary">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex flex-wrap gap-2">
                        <h5 className="fw-bold text-dark mb-0 me-2">{notice.title}</h5>
                        {/* Dynamic Categorization Badges */}
                        {notice.target_course === null ? (
                           <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 border border-danger border-opacity-25">Global</span>
                        ) : notice.target_semester ? (
                           <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 border border-primary border-opacity-25">
                             {notice.target_course_name} <i className="bi bi-dot"></i> Sem {notice.target_semester}
                           </span>
                        ) : (
                           <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 border border-info border-opacity-25">
                             {notice.target_course_name} <i className="bi bi-dot"></i> Course-wide
                           </span>
                        )}
                      </div>
                      <small className="text-muted fw-semibold bg-light px-2 py-1 rounded border">
                        <i className="bi bi-clock me-1"></i> {new Date(notice.created_at).toLocaleDateString('en-GB')}
                      </small>
                    </div>

                    <p className="text-secondary mt-3 lh-base" style={{ whiteSpace: 'pre-line' }}>{notice.content}</p>

                    <div className="mt-4 pt-3 border-top d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                            <i className="bi bi-person-fill text-primary small"></i>
                        </div>
                        <small className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                          Authority: {notice.posted_by_name || 'Administrator'}
                        </small>
                      </div>
                      <i className="bi bi-bookmark-check text-muted opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-clipboard-x fs-1 text-muted opacity-25 mb-3 d-block"></i>
              <h5 className="text-muted fw-bold">No active announcements found.</h5>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoticeList;