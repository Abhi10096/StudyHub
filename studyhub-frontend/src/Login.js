import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const API_URL = "http://65.2.141.239:8000";
        try {
            const response = await axios.post('http://65.2.141.239:8000/api/login/',  {
                username,
                password
            });

            // 🚨 MOST IMPORTANT: Saving all data to localStorage properly
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username); // <--- ही लाईन प्रॉब्लेम सॉल्व्ह करेल
            localStorage.setItem('isStaff', response.data.is_staff);
            localStorage.setItem('isSuperuser', response.data.is_superuser);
            localStorage.setItem('courseId', response.data.course_id || '');

            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow-sm border-0 border-top border-primary border-4">
                        <div className="card-body p-5">
                            <h3 className="text-center mb-4 fw-bold">StudyHub Login</h3>
                            {error && <div className="alert alert-danger">{error}</div>}

                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Username / Roll No</label>
                                    <input type="text" className="form-control" required
                                           value={username} onChange={(e) => setUsername(e.target.value)} />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Password</label>
                                    <input type="password" className="form-control" required
                                           value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-bold mb-3">Login</button>
                            </form>

                            <div className="text-center mt-3">
                                <span className="text-muted">Don't have an account? </span>
                                <Link to="/register" className="text-primary fw-bold text-decoration-none">Register Here</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;