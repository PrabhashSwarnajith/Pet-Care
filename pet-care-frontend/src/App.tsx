import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AppLayout from './components/AppLayout';
import Navbar from './components/Navbar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PetsPage from './pages/PetsPage';
import MedicationsPage from './pages/MedicationsPage';
import ChatbotPage from './pages/ChatbotPage';
import ConsultationPage from './pages/ConsultationPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SurgicalPage from './pages/SurgicalPage';
import AdoptionPage from './pages/AdoptionPage';
import NearbyVetsPage from './pages/NearbyVetsPage';
import EducationPage from './pages/EducationPage';
import AdminUsersPage from './pages/AdminUsersPage';
import NotificationsPage from './pages/NotificationsPage';

// Wraps page in AppLayout (sidebar + topbar)
const WithLayout = ({ children }: { children: React.ReactElement }) => (
    <ProtectedRoute>
        <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
);

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes – use top Navbar */}
                    <Route path="/" element={<><Navbar /><LandingPage /></>} />
                    <Route path="/login" element={<><Navbar /><LoginPage /></>} />
                    <Route path="/register" element={<><Navbar /><RegisterPage /></>} />

                    {/* Protected routes – use sidebar AppLayout */}
                    <Route path="/dashboard" element={<WithLayout><DashboardPage /></WithLayout>} />
                    <Route path="/pets" element={<WithLayout><PetsPage /></WithLayout>} />
                    <Route path="/medications" element={<WithLayout><MedicationsPage /></WithLayout>} />
                    <Route path="/chat" element={<WithLayout><ChatbotPage /></WithLayout>} />
                    <Route path="/consultations" element={<WithLayout><ConsultationPage /></WithLayout>} />
                    <Route path="/appointments" element={<WithLayout><AppointmentsPage /></WithLayout>} />
                    <Route path="/surgeries" element={<WithLayout><SurgicalPage /></WithLayout>} />
                    <Route path="/adoption" element={<WithLayout><AdoptionPage /></WithLayout>} />
                    <Route path="/nearby-vets" element={<WithLayout><NearbyVetsPage /></WithLayout>} />
                    <Route path="/education" element={<WithLayout><EducationPage /></WithLayout>} />
                    <Route path="/admin/users" element={
                        <RoleProtectedRoute allowedRoles={['ADMIN']}>
                            <AppLayout><AdminUsersPage /></AppLayout>
                        </RoleProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                        <RoleProtectedRoute allowedRoles={['VET', 'ADMIN']}>
                            <AppLayout><NotificationsPage /></AppLayout>
                        </RoleProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
