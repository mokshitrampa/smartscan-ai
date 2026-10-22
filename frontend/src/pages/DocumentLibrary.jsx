import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileText, Trash2, Edit, Search, ArrowUpDown, Grid, List,
  Download, ExternalLink, Clock, FolderOpen, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'words' | 'name'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [loading, setLoading] = useState(true);

  const fetchDocuments = () => {
    setLoading(true);
    api.getDocuments()
      .then(res => {
        setDocuments(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id, filename) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"? This removes all associated records and files.`)) {
      try {
        await api.deleteDocument(id);
        fetchDocuments();
      } catch (err) {
        console.error(err);
        alert('Failed to delete document.');
      }
    }
  };

  // Filter & sort documents
  const filteredDocs = documents
    .filter(doc => {
      const q = searchQuery.toLowerCase();
      return (
        doc.filename.toLowerCase().includes(q) ||
        (doc.edited_text && doc.edited_text.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.upload_timestamp) - new Date(a.upload_timestamp);
      if (sortBy === 'oldest') return new Date(a.upload_timestamp) - new Date(b.upload_timestamp);
      if (sortBy === 'words') return (b.word_count || 0) - (a.word_count || 0);
      if (sortBy === 'name') return a.filename.localeCompare(b.filename);
      return 0;
    });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Documents Library</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Organize, search, inspect, and export your digitized academic texts and study guides.
          </p>
        </div>
        <Link
          to="/scan"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
        >
          <FileText size={16} /> Scan New Document
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort & View Mode */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest Uploads</option>
              <option value="oldest">Oldest Uploads</option>
              <option value="words">Word Count (High)</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl p-1 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Grid Cards View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading library...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 space-y-3">
          <FolderOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
          <h3 className="text-base font-bold text-gray-800 dark:text-white">
            {searchQuery ? 'No matching documents found' : 'No documents in your library yet'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search keywords.' : 'Scan an academic handout or textbook page to start building your digital study library.'}
          </p>
          {!searchQuery && (
            <Link
              to="/scan"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Scan Document
            </Link>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Words</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Reading Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredDocs.map((doc) => {
                  const words = doc.word_count || 0;
                  const readMins = Math.max(1, Math.ceil(words / 200));
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/document/${doc.id}`} className="flex items-center gap-3 group">
                          <div className="p-2 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-gray-600 transition-colors">
                            <FileText size={18} />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                              {doc.filename}
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider font-mono">
                              {doc.file_type || 'IMG'}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(doc.upload_timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-semibold text-xs">
                        {words.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400" /> ~{readMins} min read
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={api.getDocPdfExportUrl(doc.id)}
                            download
                            title="Download formatted PDF"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Download size={16} />
                          </a>
                          <Link
                            to={`/document/${doc.id}`}
                            title="Open in Text Editor & Voice Assistant"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <ExternalLink size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(doc.id, doc.filename)}
                            title="Delete document"
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const words = doc.word_count || 0;
            const readMins = Math.max(1, Math.ceil(words / 200));
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                      {doc.file_type || 'DOC'}
                    </span>
                  </div>

                  <Link
                    to={`/document/${doc.id}`}
                    className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm line-clamp-1"
                  >
                    {doc.filename}
                  </Link>

                  <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                    {doc.edited_text || doc.original_ocr_text || 'No extracted text preview.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                  <span>{words} words • ~{readMins} min</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={api.getDocPdfExportUrl(doc.id)}
                      download
                      title="Download PDF"
                      className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Download size={15} />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id, doc.filename)}
                      title="Delete document"
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
