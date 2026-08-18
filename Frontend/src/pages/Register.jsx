import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, UserPlus, User, MessageSquareCode } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstname || !lastname || !email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    const result = await register(firstname, lastname, email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(result.error || 'Registration failed. Try again.');
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-background-glow"></div>

      <div className="auth-card glass-panel animate-scale-up">
        <div className="auth-header">
          <div className="auth-logo">
            <MessageSquareCode size={40} className="logo-icon animate-pulse" />
          </div>
          <h1 className="gradient-text">ChatGPT Clone</h1>
          <p className="auth-subtitle">Create a free account to start conversing</p>
        </div>

        {errorMessage && (
          <div className="auth-error-box animate-slide-up">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="firstname">First Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="firstname"
                  type="text"
                  className="form-input"
                  placeholder="John"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group flex-1">
              <label className="form-label" htmlFor="lastname">Last Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="lastname"
                  type="text"
                  className="form-input"
                  placeholder="Doe"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="primary-btn auth-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>Sign Up</span>
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/Login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
