'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  Mail,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function CustomerWhitelistPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('voyageur');
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const ITEMS_PER_PAGE = 20;

  const fetchWhitelist = async () => {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.from('customer_whitelist').select('*').order('added_at', { ascending: false });
    if (data) {
      setWhitelist(data);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchWhitelist();
  }, []);

  const handleAddEmail = async () => {
    if (!newEmail) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.from('customer_whitelist').insert([{ email: newEmail.toLowerCase(), role: newRole }]);
    setShowAddModal(false);
    setNewEmail('');
    fetchWhitelist();
  };

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('customer_whitelist').delete().eq('id', id);
    fetchWhitelist();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        
        const startIndex = rows[0].toLowerCase().includes('email') ? 1 : 0;
        const inserts = [];
        
        for (let i = startIndex; i < rows.length; i++) {
          const cols = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const email = cols[0];
          const role = cols.length > 1 && cols[1] ? cols[1].toLowerCase() : 'voyageur';
          
          if (email && email.includes('@')) {
            inserts.push({ email: email.toLowerCase(), role });
          }
        }
        
        if (inserts.length > 0) {
          // Remove duplicate emails from the inserts array
          const uniqueInserts = Object.values(
            inserts.reduce((acc, current) => {
              acc[current.email] = current;
              return acc;
            }, {} as Record<string, any>)
          );

          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.from('customer_whitelist').upsert(uniqueInserts, { onConflict: 'email' });
          if (error) throw error;
          
          alert(`Successfully imported ${inserts.length} emails!`);
          fetchWhitelist();
        } else {
          alert('No valid emails found in the CSV.');
        }
      } catch (err: any) {
        alert('Failed to import CSV: ' + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const totalWhitelisted = whitelist.length;
  const registered = whitelist.filter(w => w.status === 'registered').length;
  const pending = whitelist.filter(w => w.status === 'pending').length;

  // Filter and paginate
  const filteredWhitelist = whitelist.filter(item => 
    item.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredWhitelist.length / ITEMS_PER_PAGE) || 1;
  const paginatedWhitelist = filteredWhitelist.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Customer Whitelist</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Pre-approve emails so customers get their roles automatically when they sign in with Google.
          </p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md shadow-sm hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md shadow-sm hover:bg-neutral-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Email
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase">Total Whitelisted</h3>
            <Mail className="h-4 w-4" />
          </div>
          <p className="text-3xl font-light text-neutral-900">{totalWhitelisted}</p>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase">Registered</h3>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-3xl font-light text-neutral-900">{registered}</p>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase">Pending Login</h3>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-3xl font-light text-neutral-900">{pending}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search emails..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
            <Filter className="h-4 w-4" />
            Status
          </button>
          <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
            <ShieldAlert className="h-4 w-4" />
            Role
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50/80 text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Email</th>
                <th className="px-6 py-4 font-medium">Assigned Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Added Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">Loading...</td></tr>
              ) : paginatedWhitelist.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">No emails found.</td></tr>
              ) : paginatedWhitelist.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 font-mono text-xs">
                        {item.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-neutral-900">{item.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium uppercase tracking-wider bg-neutral-100 text-neutral-600">
                      {item.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'registered' ? (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Registered
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-0">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-500 text-xs">
                    {new Date(item.added_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && filteredWhitelist.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-neutral-200 bg-white gap-4">
            <div className="text-sm text-neutral-500 font-mono">
              Showing <span className="font-medium text-neutral-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-neutral-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredWhitelist.length)}</span> of <span className="font-medium text-neutral-900">{filteredWhitelist.length}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <div className="text-sm font-mono px-3">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Email Modal (Mock) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200">
            <div className="px-6 py-5 border-b border-neutral-100">
              <h3 className="text-lg font-semibold text-neutral-900">Add Customer Email</h3>
              <p className="text-sm text-neutral-500 mt-1">Enter the email and select their pre-approved role.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="customer@example.com" 
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Assign Role</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                >
                  <option value="voyageur">Voyageur (Customer)</option>
                  <option value="photographer">Photographer</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200/50 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddEmail}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-sm transition-colors disabled:opacity-50"
                disabled={!newEmail}
              >
                Save & Whitelist
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
