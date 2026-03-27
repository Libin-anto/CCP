import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, ClockIcon, CheckCircleIcon, XCircleIcon, UsersIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ stats }) {
    const statCards = [
        { label: 'Total Documents', value: stats.total_documents, icon: DocumentTextIcon, color: 'blue' },
        { label: 'Pending Approvals', value: stats.pending_approvals, icon: ClockIcon, color: 'amber' },
        { label: 'Total Users', value: stats.total_users ?? '—', icon: UsersIcon, color: 'indigo' },
        { label: 'Storage Used', value: stats.storage_usage, icon: DocumentTextIcon, color: 'green' },
    ];
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center space-x-4">
                        <div className={`bg-${color}-100 p-3 rounded-xl`}>
                            <Icon className={`h-7 w-7 text-${color}-600`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-sm text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Department Overview */}
            {stats.department_overview?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {stats.department_overview.map(d => (
                            <div key={d.department} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-xl font-bold text-gray-900">{d.count}</p>
                                <p className="text-sm text-gray-500">{d.department}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3">
                <Link to="/admin/documents" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Manage Documents</Link>
                <Link to="/admin/users" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Manage Users</Link>
            </div>

            <RecentUploads docs={stats.recent_uploads || []} />
        </div>
    );
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
function ManagerDashboard({ stats }) {
    const [docs, setDocs] = useState([]);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        axios.get(`http://localhost:8000/api/v1/documents/?status=${filter}&limit=20`)
            .then(r => setDocs(r.data.items))
            .catch(() => { });
    }, [filter]);

    const handleAction = async (docId, action) => {
        try {
            await axios.put(`http://localhost:8000/api/v1/documents/${docId}/${action}`, {});
            setDocs(prev => prev.filter(d => d.id !== docId));
        } catch (e) {
            alert(`Failed to ${action} document`);
        }
    };

    const STATUS_BADGE = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Total Documents', value: stats.total_documents, color: 'blue' },
                    { label: 'Pending Approvals', value: stats.pending_approvals, color: 'amber' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                        <p className="text-sm text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Department Documents</h2>
                    <div className="flex space-x-1">
                        {['pending', 'approved', 'rejected'].map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <ul className="divide-y divide-gray-100">
                    {docs.map(doc => (
                        <li key={doc.id} className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{doc.original_filename}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{doc.uploaded_by_email} · {new Date(doc.upload_date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[doc.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                                    {doc.approval_status}
                                </span>
                                {doc.approval_status === 'pending' && (
                                    <>
                                        <button onClick={() => handleAction(doc.id, 'approve')} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition" title="Approve">
                                            <CheckCircleIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleAction(doc.id, 'reject')} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition" title="Reject">
                                            <XCircleIcon className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                                <a href={doc.url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition">View</a>
                            </div>
                        </li>
                    ))}
                    {docs.length === 0 && <li className="px-6 py-8 text-center text-gray-400 text-sm">No {filter} documents.</li>}
                </ul>
            </div>
        </div>
    );
}

// ─── Employee Dashboard ───────────────────────────────────────────────────────
function EmployeeDashboard({ stats }) {
    const STATUS_BADGE = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
                <Link to="/upload" className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-sm">
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" /> Upload Document
                </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">My Documents</h2></div>
                <ul className="divide-y divide-gray-100">
                    {(stats.recent_uploads || []).map(doc => (
                        <li key={doc.id} className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{doc.filename}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{new Date(doc.upload_date).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[doc.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                                {doc.approval_status || 'pending'}
                            </span>
                        </li>
                    ))}
                    {(stats.recent_uploads || []).length === 0 && <li className="px-6 py-8 text-center text-gray-400 text-sm">No documents yet. Upload one!</li>}
                </ul>
            </div>
        </div>
    );
}

function RecentUploads({ docs }) {
    const STATUS_BADGE = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Recent Uploads</h2></div>
            <ul className="divide-y divide-gray-100">
                {docs.map(doc => (
                    <li key={doc.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(doc.upload_date).toLocaleDateString()} · {doc.size}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[doc.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                            {doc.approval_status || 'pending'}
                        </span>
                    </li>
                ))}
                {docs.length === 0 && <li className="px-6 py-8 text-center text-gray-400 text-sm">No recent uploads.</li>}
            </ul>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('http://localhost:8000/api/v1/analytics/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(r => r.json())
            .then(setStats)
            .catch(() => setError('Failed to load dashboard data.'));
    }, []);

    if (error) return <div className="text-center text-red-500 py-12">{error}</div>;
    if (!stats) return <div className="text-center text-gray-400 py-12">Loading dashboard…</div>;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'manager' ? 'Manager Dashboard' : 'My Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.email}</p>
            </div>
            {user?.role === 'admin' && <AdminDashboard stats={stats} />}
            {user?.role === 'manager' && <ManagerDashboard stats={stats} />}
            {user?.role === 'employee' && <EmployeeDashboard stats={stats} />}
        </div>
    );
}
