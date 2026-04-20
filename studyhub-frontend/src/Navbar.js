import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/**
 * Enhanced Modern Navbar: Fully responsive with global Notice access for Students.
 */
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Session and Role Extraction
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const isStaff = localStorage.getItem('isStaff') === 'true';
    const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
    const courseId = localStorage.getItem('courseId');

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const getAcademicLink = () => {
        if (isSuperuser) return "/courses";
        return `/course/${courseId}`;
    };

    // Helper for active link styling
    const isActive = (path) => location.pathname === path ? 'active-link' : '';

    if (!token) return null;

    return (
        <nav className="navbar navbar-expand-lg sticky-top custom-nav py-2">
            <div className="container">
                {/* Brand Identity */}
                <Link className="navbar-brand d-flex align-items-center" to="/dashboard">
                    <div className="logo-icon me-2">🎓</div>
                    <span className="brand-text">STUDY<span className="text-primary">HUB</span></span>
                </Link>

                {/* Mobile Menu Toggler */}
                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#studyhubNav">
                    <i className="bi bi-list text-white fs-1"></i>
                </button>

                <div className="collapse navbar-collapse" id="studyhubNav">
                    {/* --- CENTRAL MODULES --- */}
                    <ul className="navbar-nav mx-auto nav-links-container text-center py-3 py-lg-0">
                        <li className="nav-item">
                            <Link className={`nav-link px-3 ${isActive('/dashboard')}`} to="/dashboard">HOME</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-3 ${isActive(getAcademicLink())}`} to={getAcademicLink()}>CURRICULUM</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-3 ${isActive('/forum')}`} to="/forum">FORUM</Link>
                        </li>

                        {/* ✅ NOTICES TAB (Visible to Students, Teachers & Admin) */}
                        <li className="nav-item">
                            <Link className={`nav-link px-3 ${isActive('/notices')}`} to="/notices">NOTICES</Link>
                        </li>
                    </ul>

                    {/* --- RIGHT SIDE: PROFILE & SESSION --- */}
                    <div className="d-flex flex-column flex-lg-row align-items-center gap-3">

                        {/* Admin/Faculty Exclusive Tools */}
                        {(isStaff || isSuperuser) && (
                            <div className="admin-tools d-flex gap-4 border-bottom border-lg-0 border-secondary border-opacity-25 pb-3 pb-lg-0 me-lg-3 pe-lg-3 border-lg-end">
                                {isSuperuser && (
                                    <Link to="/approvals" title="Approvals" className="admin-icon text-warning">
                                        <i className="bi bi-shield-check"></i>
                                    </Link>
                                )}
                                <Link to="/manage-users" title="User Authority" className="admin-icon text-danger">
                                    <i className="bi bi-people"></i>
                                </Link>
                            </div>
                        )}

                        {/* User Identity Link */}
                        <Link to="/profile" className="profile-shortcut d-flex align-items-center text-decoration-none">
                            <div className="user-avatar">
                                {username ? username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="username-text ms-2">{username}</span>
                        </Link>

                        {/* Direct Logout Action */}
                        <button onClick={handleLogout} className="btn-logout shadow-sm w-100 w-lg-auto mt-2 mt-lg-0">
                            <i className="bi bi-box-arrow-right me-2"></i>LOGOUT
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;