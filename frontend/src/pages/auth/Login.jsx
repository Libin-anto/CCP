import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-xl shadow-lg">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className="font-bold text-3xl tracking-tight text-white">KMRL <span className="text-blue-200">AI</span></span>
                </div>

                <div className="relative z-10 text-white max-w-lg mt-auto mb-24">
                    <h2 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Intelligent Document Processing</h2>
                    <p className="text-blue-100 text-xl leading-relaxed">
                        Streamline your workflow with AI-powered data extraction, automated categorization, and secure internal approvals.
                    </p>
                </div>

                <div className="relative z-10 text-blue-200 text-sm font-medium">
                    &copy; {new Date().getFullYear()} Kochi Metro Rail Limited. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-gray-50/50">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo (hidden on desktop since left panel has it) */}
                    <div className="lg:hidden flex justify-center items-center gap-3 mb-12">
                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-gray-900">KMRL <span className="text-blue-600">AI</span></span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Please enter your credentials to access the portal.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="name@kmrl.co.in"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {loading ? 'Authenticating...' : 'Sign In to Portal'}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-200/60">
                        <p className="text-xs font-bold text-gray-400 mb-4 tracking-wider">DEMO CREDENTIALS</p>
                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                <span className="font-bold text-gray-900 block mb-0.5">Admin</span>
                                <div>admin@kmrl.co.in</div>
                                <div className="text-gray-400 mt-1 font-mono text-[10px]">Pwd: Admin@123</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                <span className="font-bold text-gray-900 block mb-0.5">Manager</span>
                                <div>manager@kmrl.co.in</div>
                                <div className="text-gray-400 mt-1 font-mono text-[10px]">Pwd: Manager@123</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                <span className="font-bold text-gray-900 block mb-0.5">Employee</span>
                                <div>employee@kmrl.co.in</div>
                                <div className="text-gray-400 mt-1 font-mono text-[10px]">Pwd: Employee@123</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
