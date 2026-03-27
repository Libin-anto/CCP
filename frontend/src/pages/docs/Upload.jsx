import { useState, useRef } from 'react';
import axios from 'axios';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

export default function Upload() {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState({}); // { filename: "status" }
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (name) => {
        setFiles(files.filter(f => f.name !== name));
        const newStatus = { ...uploadStatus };
        delete newStatus[name];
        setUploadStatus(newStatus);
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);

        // Upload sequentially to track progress
        for (const file of files) {
            if (uploadStatus[file.name] === 'success') continue; // Skip already uploaded

            setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));

            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await axios.post("http://127.0.0.1:8000/api/v1/documents/upload", formData);
                const backendStatus = res.data.approval_status;
                setUploadStatus(prev => ({ ...prev, [file.name]: backendStatus === 'approved' ? 'approved' : 'pending_approval' }));
            } catch (err) {
                console.error(err);
                setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
            }
        }
        setIsProcessing(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/5 overflow-hidden border border-white">
                <div className="p-8 sm:p-10 lg:p-14 relative">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-50 opacity-50 blur-3xl pointer-events-none"></div>
                    <div className="text-center mb-12 relative z-10">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 mb-4 tracking-tight">Intelligence Ingestion</h1>
                        <p className="text-base sm:text-lg text-slate-500 max-w-md mx-auto font-medium">Securely upload and vector-index your documents for instant AI retrieval.</p>
                    </div>

                    {/* Drop Zone */}
                    <div
                        className="relative group border-2 border-dashed border-slate-200 rounded-3xl h-64 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-400 transition-all duration-300 cursor-pointer overflow-hidden shadow-inner"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                        />
                        <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-2xl shadow-sm mb-5 group-hover:scale-110 group-hover:shadow-md transition-all duration-300 border border-blue-100/50">
                            <CloudArrowUpIcon className="h-10 w-10 text-blue-600" />
                        </div>
                        <p className="text-xl font-extrabold text-slate-700">Drop documents here</p>
                        <p className="text-sm text-slate-400 mt-2 px-4 text-center font-medium">Supports PDF, DOCX, Images up to 100MB</p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-10 space-y-3">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Queue ({files.length})</h2>
                                <button onClick={() => setFiles([])} className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors">Clear All</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar space-y-3">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors gap-3">
                                        <div className="flex items-center min-w-0">
                                            <div className="bg-blue-50 p-2 rounded-lg mr-3 flex-shrink-0">
                                                <DocumentIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                                                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end flex-shrink-0 gap-4">
                                            <div className="flex items-center">
                                                {uploadStatus[file.name] === 'uploading' && (
                                                    <span className="flex items-center text-blue-600 text-[10px] sm:text-xs font-bold bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                                                        Uploading...
                                                    </span>
                                                )}
                                                {uploadStatus[file.name] === 'pending_approval' && (
                                                    <span className="flex items-center text-amber-600 text-[10px] sm:text-xs font-bold bg-amber-50 px-2 py-1 rounded-full">
                                                        <ClockIcon className="h-3.5 w-3.5 mr-1" /> Pending Approval
                                                    </span>
                                                )}
                                                {uploadStatus[file.name] === 'approved' && (
                                                    <span className="flex items-center text-green-600 text-[10px] sm:text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                                        <CheckCircleIcon className="h-3.5 w-3.5 mr-1" /> Auto-Approved
                                                    </span>
                                                )}
                                                {uploadStatus[file.name] === 'error' && (
                                                    <span className="flex items-center text-red-600 text-[10px] sm:text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
                                                        Error
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => removeFile(file.name)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                disabled={isProcessing}
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Area */}
                    <div className="mt-10 pt-6 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <p className="text-xs text-gray-400 italic text-center sm:text-left">By uploading, you agree to our document processing terms.</p>
                        <button
                            onClick={uploadFiles}
                            disabled={files.length === 0 || isProcessing}
                            className={`
                                relative overflow-hidden px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 text-lg
                                ${files.length === 0 || isProcessing
                                    ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40 transform hover:-translate-y-0.5'}
                            `}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing Batch...
                                    </>
                                ) : (
                                    <>Process {files.length} Document(s)</>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
