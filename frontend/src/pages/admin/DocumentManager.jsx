import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrashIcon, DocumentTextIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop with blur */}
            <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                {/* Modal Panel */}
                <div className="relative bg-white rounded-2xl shadow-2xl transform transition-all sm:max-w-md sm:w-full overflow-hidden border-t-8 border-red-500">

                    {/* Decorative Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-red-50 opacity-50 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-red-50 opacity-50 blur-xl"></div>

                    <div className="relative px-6 py-8 sm:px-10">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6 group">
                            <TrashIcon className="h-10 w-10 text-red-500 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2" id="modal-title">
                            Delete File?
                        </h3>

                        <div className="mt-2 text-center">
                            <p className="text-sm text-gray-500 mb-1">
                                You are about to permanently remove:
                            </p>
                            <p className="text-base font-semibold text-gray-800 bg-gray-50 py-1 px-3 rounded-md inline-block mb-4 border border-gray-100">
                                {itemName}
                            </p>
                            <p className="text-xs text-red-500 font-medium uppercase tracking-wide">
                                This action cannot be undone
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:space-x-3 sm:space-x-reverse justify-center gap-3">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                onClick={onConfirm}
                            >
                                <TrashIcon className="h-5 w-5 mr-2" />
                                Yes, Delete It
                            </button>
                            <button
                                type="button"
                                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors shadow-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DocumentManager = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const limit = 10;

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        fetchDocuments(currentPage, searchTerm);
    }, [currentPage]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) fetchDocuments(1, searchTerm);
            else setCurrentPage(1); // will trigger above effect
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchDocuments = async (page, query) => {
        setLoading(true);
        try {
            const skip = (page - 1) * limit;
            const url = `http://127.0.0.1:8000/api/v1/documents/?skip=${skip}&limit=${limit}${query ? `&q=${query}` : ''}`;
            const res = await axios.get(url);

            setDocuments(res.data.items);
            setTotalDocs(res.data.total);
            setTotalPages(Math.ceil(res.data.total / limit));
        } catch (err) {
            console.error("Failed to fetch docs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (doc, e) => {
        e.stopPropagation(); // Prevent row click
        setItemToDelete(doc);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteAllClick = () => {
        if (documents.length === 0) return;
        setItemToDelete('all');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleteModalOpen(false);

        try {
            const config = {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            };
            if (itemToDelete === 'all') {
                setDeletingId('all');
                await axios.delete(`http://127.0.0.1:8000/api/v1/documents/all`, config);
            } else {
                setDeletingId(itemToDelete.id);
                await axios.delete(`http://127.0.0.1:8000/api/v1/documents/${itemToDelete.id}`, config);
            }

            // Refresh current view
            fetchDocuments(currentPage, searchTerm);
            setDeletingId(null);
            setItemToDelete(null);
        } catch (err) {
            alert(`Failed to delete ${itemToDelete === 'all' ? 'all documents' : 'document'}`);
            console.error(err);
            setDeletingId(null);
        }
    };

    const handleRowClick = (url) => {
        if (url && url !== "#") {
            window.open(url, '_blank');
        } else {
            alert("Document URL not available.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">Document Repository</h1>
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                        Total Documents: <span className="font-semibold text-gray-900">{totalDocs}</span>
                    </span>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button
                            onClick={handleDeleteAllClick}
                            disabled={documents.length === 0 || deletingId === 'all'}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        >
                            {deletingId === 'all' ? 'Deleting...' : (
                                <>
                                    <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    Delete All
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl leading-5 bg-white shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-base transition-shadow"
                    placeholder="Search documents by filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white shadow-lg shadow-slate-200/40 overflow-hidden sm:rounded-2xl border border-slate-100">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {documents.map((doc) => (
                            <li key={doc.id}>
                                <div
                                    className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => handleRowClick(doc.url)}
                                >
                                    <div className="flex items-center min-w-0">
                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4 truncate">
                                            <p className="text-sm font-medium text-blue-600 truncate">{doc.original_filename}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                {new Date(doc.upload_date).toLocaleDateString()} •
                                                {doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${doc.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    doc.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {doc.approval_status || 'pending'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        {(user?.role === 'admin' || user?.role === 'manager') && (
                                            <button
                                                onClick={(e) => handleDeleteClick(doc, e)}
                                                disabled={deletingId === doc.id || deletingId === 'all'}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                            >
                                                {deletingId === doc.id ? 'Deleting...' : (
                                                    <>
                                                        <TrashIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                                                        Delete
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                        {documents.length === 0 && (
                            <li className="px-4 py-12 text-center text-gray-500">No documents found matching your criteria.</li>
                        )}
                    </ul>
                )}

                {/* Pagination Controls */}
                {!loading && documents.length > 0 && (
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalDocs)}</span> of <span className="font-medium">{totalDocs}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                        {/* Mobile Pagination */}
                        <div className="flex items-center justify-between sm:hidden w-full">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">Page {currentPage}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={itemToDelete === 'all' ? "ALL documents" : (itemToDelete?.original_filename || "this document")}
            />
        </div>
    );
};

export default DocumentManager;
