import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Login Component: Secure entry point for the StudyHub portal.
 * Handles student/faculty authentication and persistent session management.
 */
const Login = () => {
    // State management for credentials and UI feedback
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Base URL for Django REST API
    const API_BASE_URL = "http://127.0.0.1:8000";

    /**
     * handleLogin: Processes the authentication request.
     * Stores critical identity markers (Token, Username/Roll No, UserID) in localStorage.
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/login/`, {
                username: username,
                password: password
            });

            // --- PERSISTING SESSION DATA ---
            // Token for API Authorization headers
            localStorage.setItem('token', response.data.token);

            // Username/Roll No for display and flexible filtering
            localStorage.setItem('username', response.data.username);

            // Critical Numeric ID for accurate result matching
            localStorage.setItem('userId', response.data.user_id);

            // Role-based access flags
            localStorage.setItem('isStaff', response.data.is_staff);
            localStorage.setItem('isSuperuser', response.data.is_superuser);
            localStorage.setItem('courseId', response.data.course_id || '');

            // Redirecting to the secure dashboard
            navigate('/dashboard');
        } catch (err) {
            setLoading(false);
            // Error handling for incorrect credentials or server issues
            setError('Authentication failed. Please check your Roll No or Password.');
            console.error("Login fault:", err);
        }
    };

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-content-center arctic-body">
            <div className="row justify-content-center w-100 animate-in">
                <div className="col-md-5 col-lg-4">
                    {/* Brand Header */}
                    <div className="text-center mb-4">
                        <h2 className="fw-bolder brand-text text-primary">STUDY<span className="text-dark">HUB</span></h2>
                        <p className="text-muted small fw-bold">Unified Faculty-Student Gateway</p>
                    </div>

                    {/* Authentication Card */}
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden bg-white">
                        <div className="card-body p-4 p-md-5">
                            <h4 className="text-center mb-4 fw-bold text-dark">Portal Access</h4>

                            {/* Error Alert Box */}
                            {error && (
                                <div className="alert bg-soft-danger text-danger border-0 small py-2 text-center mb-4" role="alert">
                                    <i className="bi bi-shield-exclamation me-2"></i>{error}
                                </div>
                            )}

                            <form onSubmit={handleLogin}>
                                {/* Identity Field (Username/Roll No) */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Roll No / Username</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0">
                                            <i className="bi bi-person-fill text-primary"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0 shadow-none py-2"
                                            placeholder="Enter your ID"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Security Field (Password) */}
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Password</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0">
                                            <i className="bi bi-lock-fill text-primary"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className="form-control bg-light border-0 shadow-none py-2"
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Login Action */}
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 fw-bold py-3 rounded-pill shadow-sm transition-hover"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Authorizing...</>
                                    ) : "LOGIN TO SYSTEM"}
                                </button>
                            </form>

                            {/* Registration Redirect */}
                            <div className="text-center mt-4">
                                <p className="text-muted small mb-0">Unauthorized student?</p>
                                <Link to="/register" className="text-primary fw-bold text-decoration-none">Register Account</Link>
                            </div>
                        </div>
                    </div>

                    {/* Footer Attribution */}
                    <div className="text-center mt-4">
                        <small className="text-muted opacity-50">&copy; 2026 StudyHub Management System</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;