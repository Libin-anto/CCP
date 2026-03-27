import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { AuthProvider, useAuth } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import Upload from './pages/docs/Upload';
import Search from './pages/docs/Search';
import DocumentManager from './pages/admin/DocumentManager';
import UserManager from './pages/admin/UserManager';
import Login from './pages/auth/Login';

// Redirect to login if not authenticated
function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading…</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
}

function NavLinks({ mobile, onClick }) {
    const location = useLocation();
    const { user } = useAuth();

    const links = [
        { name: 'Dashboard', path: '/dashboard', roles: ['admin', 'manager', 'employee'] },
        { name: 'Search', path: '/', roles: ['admin', 'manager', 'employee'] },
        { name: 'Upload', path: '/upload', roles: ['admin', 'employee'] },
        { name: 'Documents', path: '/admin/documents', roles: ['admin', 'manager'] },
        { name: 'Users', path: '/admin/users', roles: ['admin'] },
    ].filter(l => !user || l.roles.includes(user.role));

    const base = mobile ? "block px-4 py-3 rounded-xl text-base font-semibold transition-all" : "inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-200";
    const active = mobile ? "bg-blue-50 text-blue-700" : "bg-blue-50 text-blue-700 shadow-sm border border-blue-100";
    const inactive = mobile ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent";

    return (
        <div className="flex items-center space-x-2">
            {links.map(link => (
                <Link key={link.path} to={link.path} onClick={onClick}
                    className={`${base} ${location.pathname === link.path ? active : inactive}`}>
                    {link.name}
                </Link>
            ))}
        </div>
    );
}

function AppShell() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const ROLE_BADGE = { admin: 'bg-red-100 text-red-700', manager: 'bg-amber-100 text-amber-700', employee: 'bg-green-100 text-green-700' };

    if (location.pathname === '/login') {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            <nav className="bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center gap-3 pr-4 group cursor-pointer transition-transform hover:scale-105 duration-300">
                                <div className="bg-gradient-to-tr from-blue-700 to-indigo-500 p-2 rounded-xl shadow-md border border-blue-500/20">
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                                    KMRL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">AI</span>
                                </span>
                            </div>
                            <div className="hidden sm:ml-8 sm:flex sm:space-x-6 sm:items-center">
                                <NavLinks />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {user && (
                                <div className="hidden sm:flex items-center space-x-3">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                                    <span className="text-sm text-gray-600">{user.email}</span>
                                    <button onClick={logout} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Logout">
                                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center sm:hidden">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
                                    {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="sm:hidden bg-white border-b border-gray-200">
                        <div className="pt-2 pb-3 space-y-1 px-4">
                            <NavLinks mobile onClick={() => setIsMenuOpen(false)} />
                            {user && <button onClick={logout} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md">Sign Out</button>}
                        </div>
                    </div>
                )}
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute roles={['admin', 'employee']}><Upload /></ProtectedRoute>} />
                    <Route path="/admin/documents" element={<ProtectedRoute roles={['admin', 'manager']}><DocumentManager /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManager /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <AppShell />
            </AuthProvider>
        </Router>
    );
}
