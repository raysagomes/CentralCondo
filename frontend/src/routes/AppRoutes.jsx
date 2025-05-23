import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Register from '../pages/RegisterForm';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AdminPanel from '../pages/AdminPanel';
import { useAuth } from '../context/AuthContext';
import Pagamentos from '../pages/Pagamentos';
import Inquilinos from '../pages/Inquilinos';
import Calendario from '../pages/Calendario';

export default function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/login" />} />
            <Route path="/inquilinos" element={<Inquilinos />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
            <Route path="/calendario" element={<Calendario />} />

        </Routes>
    );
}
