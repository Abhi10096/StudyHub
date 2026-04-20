import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * SubjectDetail Component: Unified Academic Repository.
 * Includes: Notes, Assignments, and Online Assessments.
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
      // 1. Resolve Subject Details
      const subRes = await axios.get('http://127.0.0.1:8000/api/subjects/', config);
      const subjectsData = Array.isArray(subRes.data) ? subRes.data : (subRes.data.results || []);
      const sub = subjectsData.find(s => s.name === subjectName);
      let currentSubjectId = sub ? sub.id : null;
      setSubjectId(currentSubjectId);

      // 2. Fetch Resources (Notes/Assignments)
      const docRes = await axios.get('http://127.0.0.1:8000/api/documents/', config);
      setDocuments(docRes.data.filter(doc => doc.title.includes(subjectName) || (currentSubjectId && doc.subject === currentSubjectId)));

      // 3. Fetch Online Tests linked to this subject
      const testRes = await axios.get('http://127.0.0.1:8000/api/tests/', config);
      const allTests = Array.isArray(testRes.data) ? testRes.data : (testRes.data.results || []);
      setTests(allTests.filter(t => t.subject === currentSubjectId));

      // 4. Fetch personal submissions for students
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
    if (window.confirm("Warning: This will permanently delete the test and all student results. Proceed?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/tests/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        alert("Assessment Removed.");
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
    if (window.confirm("Remove submission and re-upload?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/submissions/${submissionId}/`, {
          headers: { Authorization: `Token ${token}` }
        });
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

      {/* Banner */}
      <div className="curriculum-banner mb-5 py-4 shadow-sm text-white">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-0 text-uppercase">{subjectName}</h2>
            <p className="small fw-bold opacity-75 mt-1">Resource & Assessment Portal</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-bold">Back</button>
        </div>
      </div>

      <div className="container">
        {/* Actions Panel */}
        <div className="card shadow-sm border-0 mb-4 bg-white p-3 rounded-4">
          <div className="row align-items-center g-3">
            <div className="col-md-5">
              <div className="input-group bg-light rounded-pill px-3">
                <span className="input-group-text bg-transparent border-0"><i className="bi bi-search text-muted"></i></span>
                <input type="search" className="form-control border-0 bg-transparent shadow-none" placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-md-7 text-end">
              {(isStaff || isSuperuser) && (
                <div className="btn-group shadow-sm rounded-pill overflow-hidden border">
                  <button className="btn btn-primary fw-bold px-4" onClick={() => setShowUploadForm(!showUploadForm)}>
                    {showUploadForm ? 'Cancel Upload' : 'Upload Material'}
                  </button>
                  <Link to={`/create-test?subjectId=${subjectId}&subjectName=${subjectName}`} className="btn btn-info text-white fw-bold px-4">
                    Create Test
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Form (Faculty) */}
        {showUploadForm && (
          <div className="card shadow-sm border-0 mb-5 p-4 bg-white border-top border-primary border-5 rounded-4 animate-in">
            <form onSubmit={handleUpload} className="row g-3">
              <div className="col-md-4"><input type="text" className="form-control bg-light border-0" placeholder="Title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required /></div>
              <div className="col-md-3">
                <select className="form-select bg-light border-0" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  <option value="note">Study Notes</option>
                  <option value="assignment">Assignment Brief</option>
                </select>
              </div>
              <div className="col-md-3"><input type="file" className="form-control bg-light border-0" onChange={(e) => setUploadFile(e.target.files[0])} required /></div>
              <div className="col-md-2"><button type="submit" className="btn btn-primary w-100 fw-bold">Execute</button></div>
            </form>
          </div>
        )}

        {/* --- MODULE: ONLINE ASSESSMENTS --- */}
        <div className="mb-5">
            <h5 className="fw-bold mb-3 text-danger d-flex align-items-center">
                <i className="bi bi-patch-check-fill me-2 fs-4"></i> Subject Assessments
            </h5>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
                <div className="card-body p-0">
                    <table className="table mb-0 table-hover align-middle border-0">
                        <thead className="table-danger border-0">
                            <tr>
                                <th className="px-4 py-3 small fw-bold">Test Identification</th>
                                <th className="px-4 py-3 text-center small fw-bold">Time Limit</th>
                                <th className="px-4 py-3 text-end small fw-bold">Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.map(test => {
                                const isExpired = new Date(test.deadline) < new Date();
                                return (
                                    <tr key={test.id} className="border-bottom">
                                        <td className="px-4 py-3">
                                            <div className="fw-bold text-dark fs-6">{test.title}</div>
                                            <div className="d-flex align-items-center mt-1 text-muted small">
                                                <span className={`badge ${isExpired ? 'bg-secondary' : 'bg-success'} rounded-pill me-2 px-2`}>
                                                    {isExpired ? 'CLOSED' : 'ACTIVE'}
                                                </span>
                                                <i className="bi bi-clock-history me-1"></i> Ends: {new Date(test.deadline).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="badge bg-light text-dark border fw-bold px-3 py-2 rounded-pill shadow-sm">
                                               {test.time_limit_mins}m
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            {isStudent ? (
                                                <Link
                                                    to={`/take-test/${test.id}`}
                                                    className={`btn btn-sm fw-bold px-4 rounded-pill shadow-sm ${isExpired ? 'btn-secondary disabled' : 'btn-success'}`}
                                                >
                                                    {isExpired ? 'Closed' : 'Begin Exam'}
                                                </Link>
                                            ) : (
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button className="btn btn-sm btn-outline-primary fw-bold px-3 rounded-pill" onClick={() => navigate(`/test-scores/${test.id}`)}>
                                                        Results
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger fw-bold px-3 rounded-pill" onClick={() => handleDeleteTest(test.id)}>
                                                        Delete
                                                    </button>
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
        <div className="row g-4">
          <div className="col-12">
            <h5 className="fw-bold mb-3 text-primary"><i className="bi bi-journal-text me-2"></i>Notes Repository</h5>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
              <table className="table mb-0 align-middle">
                <tbody>
                  {notes.map(doc => (
                    <tr key={doc.id} className="border-bottom">
                      <td className="px-4 py-3 fw-bold w-75 text-dark">{doc.title}</td>
                      <td className="px-4 py-3 text-end">
                        <a href={getFileUrl(doc.file)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark rounded-pill me-2 px-3">View</a>
                        {(isStaff || isSuperuser) && <button className="btn btn-sm btn-danger rounded-pill px-3" onClick={() => handleDelete(doc.id)}>Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 mt-4">
            <h5 className="fw-bold mb-3 text-dark"><i className="bi bi-clipboard-check me-2"></i>Assignment Portal</h5>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
              <table className="table mb-0 align-middle">
                <tbody>
                  {assignments.map(doc => {
                    const existingSub = mySubmissions.find(s => s.assignment === doc.id);
                    return (
                      <tr key={doc.id} className="border-bottom">
                        <td className="px-4 py-3 fw-bold w-50 text-dark">{doc.title}</td>
                        <td className="px-4 py-3 text-end">
                          <a href={getFileUrl(doc.file)} target="_blank" rel="noreferrer" className="btn btn-sm btn-dark rounded-pill me-2 px-3 shadow-sm">Brief</a>
                          {(isStaff || isSuperuser) && (
                            <>
                              <Link to={`/submissions/${doc.id}`} className="btn btn-sm btn-primary rounded-pill me-2 px-3 shadow-sm">Review</Link>
                              <button className="btn btn-sm btn-danger rounded-pill px-3" onClick={() => handleDelete(doc.id)}>Delete</button>
                            </>
                          )}
                          {isStudent && (
                            existingSub ? (
                              <div className="d-inline-flex align-items-center">
                                <span className="badge bg-soft-success text-success rounded-pill px-3 py-2 me-2">Submitted</span>
                                <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDeleteSubmission(existingSub.id)}><i className="bi bi-trash"></i></button>
                              </div>
                            ) : (
                              <div className="d-inline-flex gap-1 border p-1 rounded-pill bg-light">
                                <input type="file" className="form-control form-control-sm border-0 bg-transparent" style={{width: '130px'}} onChange={(e) => setStudentFile(e.target.files[0])} />
                                <button className="btn btn-sm btn-success rounded-pill px-3" onClick={() => handleStudentSubmit(doc.id)}>Submit</button>
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