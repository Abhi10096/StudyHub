import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function SubjectDetail() {
  const { subjectName } = useParams();
  const [subjectId, setSubjectId] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');

  // Upload States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('note');
  const [uploadFile, setUploadFile] = useState(null);
  const [studentFile, setStudentFile] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';
  const isStudent = !isSuperuser && !isStaff;

  const fetchData = useCallback(async () => {
    const config = { headers: { Authorization: `Token ${token}` } };

    try {
      // 1. आधी Subject चा ID मिळवा
      const subRes = await axios.get('http://127.0.0.1:8000/api/subjects/', config);
      const subjectsData = Array.isArray(subRes.data) ? subRes.data : (subRes.data.results || []);

      const sub = subjectsData.find(s => s.name === subjectName);
      let currentSubjectId = null;

      if (sub) {
        setSubjectId(sub.id);
        currentSubjectId = sub.id; // Local variable वापरणे सुरक्षित आहे
      }

      // 2. त्यानंतर Documents मिळवा आणि Filter करा
      const docRes = await axios.get('http://127.0.0.1:8000/api/documents/', config);
      const filteredDocs = docRes.data.filter(doc =>
        doc.title.includes(subjectName) || (currentSubjectId && doc.subject === currentSubjectId)
      );
      setDocuments(filteredDocs);

    } catch (err) {
      console.error("Data error:", err);
    }
  }, [subjectName, token]);

  useEffect(() => {
    if (!token) navigate('/login'); else fetchData();
  }, [navigate, token, fetchData]);

  const handleFacultyUpload = async (e) => {
    e.preventDefault();
    if (!subjectId || !uploadFile) return alert("Please select a file.");

    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('document_type', uploadType);
    formData.append('subject', subjectId);
    formData.append('file', uploadFile);

    try {
      await axios.post('http://127.0.0.1:8000/api/documents/', formData, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert("Resource uploaded successfully.");
      setShowUploadForm(false);
      setUploadTitle('');
      setUploadFile(null);
      fetchData();
    } catch (err) {
      alert("Upload failed. Check file format.");
    }
  };

  const handleStudentSubmit = async (assignmentId) => {
    if (!studentFile) return alert("Please attach a file before submitting.");

    const formData = new FormData();
    formData.append('assignment', assignmentId);
    formData.append('submission_file', studentFile);

    try {
      await axios.post('http://127.0.0.1:8000/api/submissions/', formData, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert("Assignment submitted successfully.");
      setStudentFile(null);
    } catch (err) {
      alert("Submission failed.");
    }
  };

  // 1. First, filter by Search Query
  const searchedDocuments = documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // 2. Then, separate them into Notes and Assignments
  const notes = searchedDocuments.filter(doc => doc.document_type === 'note');
  const assignments = searchedDocuments.filter(doc => doc.document_type === 'assignment');

  // Helper function to handle safe download URLs
  const getFileUrl = (filePath) => {
    if (!filePath) return '#';
    return filePath.startsWith('http') ? filePath : `http://127.0.0.1:8000${filePath}`;
  };

  return (
    <div className="pb-5 bg-light min-vh-100">
      <nav className="navbar navbar-dark bg-dark py-3 shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold">{subjectName} Resources</span>
          <button onClick={() => navigate(-1)} className="btn btn-outline-light btn-sm fw-bold px-3">Back to Curriculum</button>
        </div>
      </nav>

      <div className="container mt-4">

        {/* Top Control Panel with Search AND Filter */}
        <div className="card shadow-sm border-0 mb-4 bg-white p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <input type="search" className="form-control" placeholder="Search resources by title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="col-md-4">
              <select className="form-select fw-semibold text-secondary" value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}>
                <option value="All">All Resources</option>
                <option value="note">Study Notes Only</option>
                <option value="assignment">Assignments Only</option>
              </select>
            </div>

            <div className="col-md-3 text-end">
              {(isStaff || isSuperuser) && (
                <button className={`btn fw-bold w-100 ${showUploadForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowUploadForm(!showUploadForm)}>
                  {showUploadForm ? 'Cancel Upload' : '+ Upload Resource'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload Form */}
        {showUploadForm && (isStaff || isSuperuser) && (
          <div className="card shadow-sm border-0 mb-5 border-top border-primary border-4 p-4 bg-white">
            <h5 className="fw-bold mb-3 text-dark">Upload New Resource</h5>
            <form onSubmit={handleFacultyUpload} className="row g-3">
              <div className="col-md-4">
                <label className="fw-bold text-muted small">Resource Title</label>
                <input type="text" className="form-control" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="fw-bold text-muted small">Resource Type</label>
                <select className="form-select" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  <option value="note">Study Note</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="fw-bold text-muted small">Attach File</label>
                <input type="file" className="form-control" onChange={(e) => setUploadFile(e.target.files[0])} required />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100 fw-bold">Upload</button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION 1: STUDY NOTES */}
        {(docTypeFilter === 'All' || docTypeFilter === 'note') && (
          <div className="mb-5">
            <h5 className="fw-bolder mb-3 text-primary mt-2">Study Notes & Materials</h5>
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <table className="table mb-0 table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 text-muted w-75">Document Title</th>
                      <th className="px-4 py-3 text-end text-muted w-25">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map(doc => (
                      <tr key={doc.id}>
                        <td className="px-4 py-3 fw-bold text-dark">{doc.title}</td>
                        <td className="px-4 py-3 text-end">
                          <a href={getFileUrl(doc.file)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark fw-bold px-4">
                            Download Note
                          </a>
                        </td>
                      </tr>
                    ))}
                    {notes.length === 0 && <tr><td colSpan="2" className="text-center text-muted fw-bold p-4">No study notes available.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: ASSIGNMENTS */}
        {(docTypeFilter === 'All' || docTypeFilter === 'assignment') && (
          <div className="mb-5">
            <h5 className="fw-bolder mb-3 text-warning text-darken mt-2">Assignments & Tasks</h5>
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <table className="table mb-0 table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 text-muted w-50">Assignment Title</th>
                      <th className="px-4 py-3 text-end text-muted w-50">Action / Submission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(doc => (
                      <tr key={doc.id}>
                        <td className="px-4 py-3 fw-bold text-dark">{doc.title}</td>
                        <td className="px-4 py-3 text-end">

                          <a href={getFileUrl(doc.file)} target="_blank" rel="noreferrer" className="btn btn-sm btn-dark fw-bold px-3 me-2">
                            Download Question
                          </a>

                          {(isStaff || isSuperuser) && (
                            <Link to={`/submissions/${doc.id}`} className="btn btn-sm btn-primary fw-bold px-3">
                              View Submissions
                            </Link>
                          )}

                          {isStudent && (
                            <div className="d-inline-flex align-items-center bg-light p-1 rounded-3 ms-2 border border-2">
                              <input type="file" className="form-control form-control-sm border-0 bg-transparent" style={{ width: '200px' }} onChange={(e) => setStudentFile(e.target.files[0])} />
                              <button className="btn btn-sm btn-success fw-bold ms-1 px-3" onClick={() => handleStudentSubmit(doc.id)}>Submit</button>
                            </div>
                          )}

                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && <tr><td colSpan="2" className="text-center text-muted fw-bold p-4">No assignments available.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default SubjectDetail;