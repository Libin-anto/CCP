import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlusIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const DEPARTMENTS = ['IT', 'Civil', 'Electrical', 'Operations', 'HR', 'Finance', 'Legal'];
const ROLES = ['admin', 'manager', 'employee'];

const ROLE_BADGE = {
    admin: 'bg-red-100 text-red-700',
    manager: 'bg-amber-100 text-amber-700',
    employee: 'bg-green-100 text-green-700',
};

function CreateUserModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ email: '', password: '', role: 'employee', department: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:8000/api/v1/users/', form);
            onCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-blue-500 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {[
                        { label: 'Email', key: 'email', type: 'email', placeholder: 'user@kmrl.co.in' },
                        { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                    ].map(({ label, key, type, placeholder }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                                required placeholder={placeholder}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm outline-none">
                            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm outline-none">
                            <option value="">— Select Department —</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                        {loading ? 'Creating…' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const fetchUsers = () => {
        setLoading(true);
        axios.get('http://localhost:8000/api/v1/users/')
            .then(r => setUsers(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, []);

    const startEdit = (user) => {
        setEditingId(user.id);
        setEditForm({ role: user.role, department: user.department || '', is_active: user.is_active });
    };

    const saveEdit = async (userId) => {
        try {
            await axios.put(`http://localhost:8000/api/v1/users/${userId}`, editForm);
            setEditingId(null);
            fetchUsers();
        } catch { alert('Failed to update user'); }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/v1/users/${userId}`);
            fetchUsers();
        } catch (e) { alert(e.response?.data?.detail || 'Failed to delete user'); }
    };

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">{users.length} total users</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm">
                    <UserPlusIcon className="h-5 w-5 mr-2" /> Add User
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading…</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Email', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{user.email}</td>
                                    <td className="px-5 py-4">
                                        {editingId === user.id ? (
                                            <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                                className="px-2 py-1 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-blue-500">
                                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {editingId === user.id ? (
                                            <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                                className="px-2 py-1 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-blue-500">
                                                <option value="">—</option>
                                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        ) : (
                                            <span className="text-sm text-gray-600">{user.department || '—'}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {editingId === user.id ? (
                                            <select value={editForm.is_active ? 'active' : 'inactive'}
                                                onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                                                className="px-2 py-1 rounded-lg border border-gray-300 text-sm">
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-2">
                                            {editingId === user.id ? (
                                                <>
                                                    <button onClick={() => saveEdit(user.id)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"><CheckIcon className="h-4 w-4" /></button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"><XMarkIcon className="h-4 w-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(user)} className="p-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"><PencilIcon className="h-4 w-4" /></button>
                                                    <button onClick={() => deleteUser(user.id)} className="p-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"><TrashIcon className="h-4 w-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No users found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}
        </div>
    );
}
