import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  // If no user is logged in, redirect to login
  if (!user || !user.role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If user doesn't have the required role, redirect to their default route
    const defaultRoute = user.role === 'student' ? '/exams' : '/dashboard';
    return <Navigate to={defaultRoute} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
