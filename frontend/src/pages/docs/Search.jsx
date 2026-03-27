import { useState } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Search() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const search = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/v1/search/query?q=${query}`);
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // State for Preview Modal
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewContent, setPreviewContent] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const handlePreview = async (doc) => {
        setPreviewDoc(doc);
        setPreviewLoading(true);
        setPreviewContent(null);

        // If it's a text file (based on extension or mime), fetch content
        // Simple heuristic for now: check if url ends in .txt or .md or python
        const isText = doc.url.endsWith('.txt') || doc.url.endsWith('.md') || doc.url.endsWith('.py');

        if (isText) {
            try {
                // Fetch content from the static URL
                // Note: CORS might be an issue if running on different ports, but here mostly localhost
                const res = await fetch(doc.url);
                const text = await res.text();
                setPreviewContent(text);
            } catch (err) {
                console.error("Failed to load text content:", err);
                setPreviewContent("Error loading document content.");
            }
        }
        // If PDF, we just use the URL in iframe
        setPreviewLoading(false);
    };

    const closePreview = () => {
        setPreviewDoc(null);
        setPreviewContent(null);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 mb-4 tracking-tight">Intelligence Search</h1>
                <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium">Search millions of documents by semantic meaning, not just filename.</p>
            </div>

            <form onSubmit={search} className="relative mb-14 max-w-3xl mx-auto group">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a question..."
                        className="w-full p-5 pl-14 pr-32 rounded-2xl border border-gray-200 shadow-lg shadow-blue-500/5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg sm:text-xl bg-white/90 backdrop-blur-sm"
                    />
                    <MagnifyingGlassIcon className="h-7 w-7 text-gray-400 absolute left-5 group-focus-within:text-blue-500 transition-colors" />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold disabled:opacity-50 transition-all transform hover:-translate-y-0.5 shadow-md shadow-blue-500/30 text-sm sm:text-base"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
                <p className="mt-3 text-sm text-gray-400 text-center font-medium italic">Try: "Safety guidelines for tunnel work"</p>
            </form>

            <div className="space-y-5">
                {results.map((doc) => (
                    <div key={doc.id} className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex flex-col sm:flex-row items-start">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5 rounded-xl mb-4 sm:mb-0 sm:mr-6 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors flex-shrink-0 border border-blue-100/50">
                                <DocumentTextIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors truncate">
                                    {doc.title}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] sm:text-xs font-semibold rounded-full uppercase tracking-wider">
                                        {doc.classification || 'General'}
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-[10px] sm:text-xs font-semibold rounded-full flex items-center">
                                        Score: {(doc.score * 100).toFixed(0)}%
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.match_type.includes('content') ? 'bg-green-100 text-green-800' :
                                        doc.match_type === 'filename' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {doc.match_type}
                                    </span>
                                    {doc.classification && doc.classification !== "Unclassified" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {doc.classification}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                                    {doc.summary ? doc.summary : "No summary available."}
                                </p>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-blue-200"
                                    >
                                        View Document
                                        <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </a>
                                    <a
                                        href={doc.url}
                                        download={doc.title || "document"}
                                        className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
                                    >
                                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {results.length === 0 && !loading && query && (
                    <div className="text-center text-gray-500">
                        No highly relevant documents found. Try refining your query.
                    </div>
                )}
            </div>
        </div>
    );
}
