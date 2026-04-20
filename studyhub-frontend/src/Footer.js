import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer-main-clean mt-5">
            <div className="container py-5">
                <div className="row g-4">

                    {/* Brand & Mission */}
                    <div className="col-lg-4 col-md-12">
                        <a href="https://github.com/Abhi10096" target="_blank" rel="noreferrer" className="text-decoration-none">
                            <div className="footer-logo mb-3">
                                <span className="logo-icon">🎓</span>
                                <span className="logo-text">STUDY<span className="text-primary">HUB</span></span>
                            </div>
                        </a>
                        <p className="text-muted small lh-lg">
                            An advanced academic portal for SIMMC students and faculty.
                            Streamlining resource sharing and digital collaboration.
                        </p>
                        <div className="social-links d-flex gap-3 mt-4">
                            <a href="https://github.com/Abhi10096" target="_blank" rel="noreferrer" className="social-btn-circle">
                                <i className="bi bi-github"></i>
                            </a>
                            <a href="https://linkedin.com/in/your-profile" target="_blank" rel="noreferrer" className="social-btn-circle">
                                <i className="bi bi-linkedin"></i>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-lg-2 col-6 ms-auto">
                        <h6 className="fw-bold mb-4 small text-uppercase">Platform</h6>
                        <ul className="list-unstyled footer-links-list">
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/courses">Courses</Link></li>
                            <li><Link to="/notices">Notices</Link></li>
                            <li><Link to="/forum">Forum</Link></li>
                        </ul>
                    </div>

                    {/* Support Details */}
                    <div className="col-lg-4 col-md-6">
                        <h6 className="fw-bold mb-4 small text-uppercase">Contact Support</h6>
                        <div className="contact-info-list">
                            <div className="d-flex align-items-center mb-3">
                                <i className="bi bi-envelope-at text-primary me-3 fs-5"></i>
                                <a href="mailto:abhishekkharade06@gmail.com" className="text-decoration-none text-dark small">
                                    abhishekkharade06@gmail.com
                                </a>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <i className="bi bi-telephone text-primary me-3 fs-5"></i>
                                <span className="small text-dark fw-bold">+91 9607140604</span>
                            </div>
                            <div className="d-flex align-items-center">
                                <i className="bi bi-building text-primary me-3 fs-5"></i>
                                <span className="small text-muted">Dept. of MCA, SIMMC Pune.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Credit */}
                <div className="footer-bottom mt-5 pt-4 border-top text-center text-md-start">
                    <div className="row align-items-center">
                        <div className="col-md-6 small text-muted">
                            &copy; {new Date().getFullYear()} StudyHub SIMMC. All rights reserved.
                        </div>
                        <div className="col-md-6 text-md-end mt-2 mt-md-0">
                            <span className="small text-muted">Engineered by </span>
                            <span className="text-primary fw-bold">Abhishek Kharade</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;