import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * SubjectDetail Component: Unified Academic Repository.
 * Optimized UI with compact headers and robust test filtering.
 */
function SubjectDetail() {
  const { subjectName } = useParams();
  const [subjectId, setSubjectId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tests, setTests] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
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
      // 1. Resolve Subject Details (Case-Insensitive & Trimmed)
      const subRes = await axios.get('http://127.0.0.1:8000/api/subjects/', config);
      const subjectsData = Array.isArray(subRes.data) ? subRes.data : (subRes.data.results || []);

      const sub = subjectsData.find(s => s.name.trim().toLowerCase() === subjectName.trim().toLowerCase());
      let currentSubjectId = sub ? sub.id : null;
      setSubjectId(currentSubjectId);

      // 2. Fetch Resources
      const docRes = await axios.get('http://127.0.0.1:8000/api/documents/', config);
      setDocuments(docRes.data.filter(doc =>
        doc.title.toLowerCase().includes(subjectName.toLowerCase()) ||
        (currentSubjectId && doc.subject === currentSubjectId)
      ));

      // 3. Fetch Online Tests (Ensuring currentSubjectId is matched correctly)
      const testRes = await axios.get('http://127.0.0.1:8000/api/tests/', config);
      const allTests = Array.isArray(testRes.data) ? testRes.data : (testRes.data.results || []);

      // Filtering tests based on Resolved Subject ID
      const filteredTests = allTests.filter(t => Number(t.subject) === Number(currentSubjectId));
      setTests(filteredTests);

      // 4. Fetch personal submissions
      if (isStudent) {
        const subRes = await axios.get('http://127.0.0.1:8000/api/submissions/?my_submissions=true', config);
        setMySubmissions(subRes.data);
      }
    } catch (err) { console.error("Sync error", err); }
  }, [subjectName, token, isStudent]);

  useEffect(() => {
    if (!token) navigate('/login'); else fetchData();
  }, [navigate, token, fetchData]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('document_type', uploadType);
    formData.append('subject', subjectId);
    formData.append('file', uploadFile);
    try {
      await axios.post('http://127.0.0.1:8000/api/documents/', formData, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert("Material Uploaded Successfully");
      resetUploadForm();
      fetchData();
    } catch (err) { alert("Upload Failed"); }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadFile(null);
    setShowUploadForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this resource?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/documents/${id}/`, { headers: { Authorization: `Token ${token}` } });
        fetchData();
      } catch (err) { alert("Deletion Failed"); }
    }
  };

  const handleDeleteTest = async (id) => {
    if (window.confirm("Delete this test?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/tests/${id}/`, { headers: { Authorization: `Token ${token}` } });
        fetchData();
      } catch (err) { alert("Deletion Failed"); }
    }
  };

  const handleStudentSubmit = async (assignmentId) => {
    if (!studentFile) return alert("Select file.");
    const formData = new FormData();
    formData.append('assignment', assignmentId);
    formData.append('submission_file', studentFile);
    try {
      await axios.post('http://127.0.0.1:8000/api/submissions/', formData, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert("Assignment Submitted!");
      setStudentFile(null);
      fetchData();
    } catch (err) { alert("Submission failed."); }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (window.confirm("Remove submission?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/submissions/${submissionId}/`, { headers: { Authorization: `Token ${token}` } });
        fetchData();
      } catch (err) { alert("Error deleting submission"); }
    }
  };

  const getFileUrl = (path) => path?.startsWith('http') ? path : `http://127.0.0.1:8000${path}`;

  const searchedDocs = documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const notes = searchedDocs.filter(doc => doc.document_type === 'note');
  const assignments = searchedDocs.filter(doc => doc.document_type === 'assignment');

  return (
    <div className="pb-5 arctic-body min-vh-100 animate-in">
      {/* COMPACT BANNER (py-3 and h4 used for smaller size) */}
      <div className="curriculum-banner mb-4 py-3 shadow-sm text-white">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold mb-0 text-uppercase">{subjectName}</h4>
            <p className="x-small fw-bold opacity-75 mt-0 mb-0">Resource & Assessment Portal</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold">Back</button>
        </div>
      </div>

      <div className="container">
        {/* COMPACT SEARCH & ACTION BAR */}
        <div className="card shadow-sm border-0 mb-3 bg-white p-2 rounded-4">
          <div className="row align-items-center g-2">
            <div className="col-md-5">
              <div className="input-group bg-light rounded-pill px-3 py-1">
                <span className="input-group-text bg-transparent border-0 p-0 me-2"><i className="bi bi-search text-muted small"></i></span>
                <input type="search" className="form-control form-control-sm border-0 bg-transparent shadow-none" placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-md-7 text-end">
              {(isStaff || isSuperuser) && (
                <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden border">
                  <button className="btn btn-primary fw-bold px-3" onClick={() => setShowUploadForm(!showUploadForm)}>
                    {showUploadForm ? 'Cancel' : 'Upload'}
                  </button>
                  <Link to={`/create-test?subjectId=${subjectId}&subjectName=${subjectName}`} className="btn btn-info text-white fw-bold px-3">
                    New Test
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {showUploadForm && (
          <div className="card shadow-sm border-0 mb-4 p-3 bg-white border-top border-primary border-4 rounded-4 animate-in">
            <form onSubmit={handleUpload} className="row g-2">
              <div className="col-md-4"><input type="text" className="form-control form-control-sm bg-light border-0" placeholder="Title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required /></div>
              <div className="col-md-3">
                <select className="form-select form-select-sm bg-light border-0" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  <option value="note">Notes</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              <div className="col-md-3"><input type="file" className="form-control form-control-sm bg-light border-0" onChange={(e) => setUploadFile(e.target.files[0])} required /></div>
              <div className="col-md-2"><button type="submit" className="btn btn-sm btn-primary w-100 fw-bold">Upload</button></div>
            </form>
          </div>
        )}

        {/* --- MODULE: ONLINE ASSESSMENTS --- */}
        <div className="mb-4">
            <h6 className="fw-bold mb-2 text-danger d-flex align-items-center">
                <i className="bi bi-patch-check-fill me-2"></i> Subject Assessments
            </h6>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
                <div className="card-body p-0">
                    <table className="table table-sm mb-0 table-hover align-middle border-0">
                        <thead className="table-danger border-0">
                            <tr>
                                <th className="px-3 py-2 small fw-bold">Identification</th>
                                <th className="px-3 py-2 text-center small fw-bold">Limit</th>
                                <th className="px-3 py-2 text-end small fw-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-3 text-muted small">No assessments found.</td></tr>
                            ) : tests.map(test => {
                                const isExpired = new Date(test.deadline) < new Date();
                                const isAlreadySubmitted = localStorage.getItem(`submitted_test_${test.id}`) === 'true';

                                return (
                                    <tr key={test.id} className="border-bottom">
                                        <td className="px-3 py-2">
                                            <div className="fw-bold text-dark small">{test.title}</div>
                                            <div className="text-muted" style={{fontSize: '0.7rem'}}>
                                                Ends: {new Date(test.deadline).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="badge bg-light text-dark border small px-2 py-1 rounded-pill">
                                               {test.time_limit_mins}m
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-end">
                                            {isStudent ? (
                                                isAlreadySubmitted ? (
                                                    <Link to={`/test-scores/${test.id}`} className="btn btn-xs btn-primary fw-bold px-3 rounded-pill py-1 small" style={{fontSize: '0.75rem'}}>
                                                        Result
                                                    </Link>
                                                ) : (
                                                    <Link to={`/take-test/${test.id}`} className={`btn btn-xs fw-bold px-3 rounded-pill py-1 small ${isExpired ? 'btn-secondary disabled' : 'btn-success'}`} style={{fontSize: '0.75rem'}}>
                                                        {isExpired ? 'Closed' : 'Begin'}
                                                    </Link>
                                                )
                                            ) : (
                                                <div className="d-flex justify-content-end gap-1">
                                                    <button className="btn btn-xs btn-outline-primary fw-bold px-2 rounded-pill py-1 small" style={{fontSize: '0.7rem'}} onClick={() => navigate(`/test-scores/${test.id}`)}>Results</button>
                                                    <button className="btn btn-xs btn-outline-danger fw-bold px-2 rounded-pill py-1 small" style={{fontSize: '0.7rem'}} onClick={() => handleDeleteTest(test.id)}>Del</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- MODULE: DOCUMENTS --- */}
        <div className="row g-3">
          <div className="col-12">
            <h6 className="fw-bold mb-2 text-primary"><i className="bi bi-journal-text me-2"></i>Notes Repository</h6>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
              <table className="table table-sm mb-0 align-middle">
                <tbody>
                  {notes.length === 0 ? (
                      <tr><td className="text-center py-3 text-muted small">Empty Repository.</td></tr>
                  ) : notes.map(doc => (
                    <tr key={doc.id} className="border-bottom">
                      <td className="px-3 py-2 fw-bold w-75 text-dark small">{doc.title}</td>
                      <td className="px-3 py-2 text-end">
                        <a href={getFileUrl(doc.file)} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-dark rounded-pill px-3 py-1 small" style={{fontSize: '0.75rem'}}>View</a>
                        {(isStaff || isSuperuser) && <button className="btn btn-xs btn-danger rounded-pill px-3 py-1 ms-1 small" style={{fontSize: '0.75rem'}} onClick={() => handleDelete(doc.id)}>Del</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 mt-3">
            <h6 className="fw-bold mb-2 text-dark"><i className="bi bi-clipboard-check me-2"></i>Assignment Portal</h6>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
              <table className="table table-sm mb-0 align-middle">
                <tbody>
                  {assignments.length === 0 ? (
                      <tr><td className="text-center py-3 text-muted small">No assignments.</td></tr>
                  ) : assignments.map(doc => {
                    const existingSub = mySubmissions.find(s => s.assignment === doc.id);
                    return (
                      <tr key={doc.id} className="border-bottom">
                        <td className="px-3 py-2 fw-bold w-50 text-dark small">{doc.title}</td>
                        <td className="px-3 py-2 text-end">
                          <a href={getFileUrl(doc.file)} target="_blank" rel="noreferrer" className="btn btn-xs btn-dark rounded-pill px-3 py-1 small" style={{fontSize: '0.75rem'}}>Brief</a>
                          {(isStaff || isSuperuser) && (
                            <>
                              <Link to={`/submissions/${doc.id}`} className="btn btn-xs btn-primary rounded-pill px-3 py-1 ms-1 small" style={{fontSize: '0.75rem'}}>Review</Link>
                              <button className="btn btn-xs btn-danger rounded-pill px-3 py-1 ms-1 small" style={{fontSize: '0.75rem'}} onClick={() => handleDelete(doc.id)}>Del</button>
                            </>
                          )}
                          {isStudent && (
                            existingSub ? (
                              <div className="d-inline-flex align-items-center">
                                <span className="badge bg-soft-success text-success rounded-pill px-2 py-1 me-1 small">Submitted</span>
                                <button className="btn btn-xs btn-outline-danger rounded-pill py-0 px-2" onClick={() => handleDeleteSubmission(existingSub.id)}><i className="bi bi-trash" style={{fontSize: '0.7rem'}}></i></button>
                              </div>
                            ) : (
                              <div className="d-inline-flex gap-1 border p-1 rounded-pill bg-light">
                                <input type="file" className="form-control form-control-xs border-0 bg-transparent" style={{width: '100px', fontSize: '0.7rem'}} onChange={(e) => setStudentFile(e.target.files[0])} />
                                <button className="btn btn-xs btn-success rounded-pill px-2 py-1 small" style={{fontSize: '0.7rem'}} onClick={() => handleStudentSubmit(doc.id)}>Submit</button>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectDetail;