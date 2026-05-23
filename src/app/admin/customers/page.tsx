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

// Mock Data
const mockWhitelist = [
  { id: '1', email: 'johndoe@example.com', role: 'photographer', status: 'registered', addedAt: '2026-05-20', registeredAt: '2026-05-21' },
  { id: '2', email: 'sarah.smith@gmail.com', role: 'voyageur', status: 'pending', addedAt: '2026-05-22', registeredAt: null },
  { id: '3', email: 'mike.travels@hotmail.com', role: 'photographer', status: 'pending', addedAt: '2026-05-23', registeredAt: null },
  { id: '4', email: 'alice.w@agency.com', role: 'voyageur', status: 'registered', addedAt: '2026-05-15', registeredAt: '2026-05-18' },
];

export default function CustomerWhitelistPage() {
  const [showAddModal, setShowAddModal] = useState(false);

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
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md shadow-sm hover:bg-neutral-50 transition-colors">
            <Download className="h-4 w-4" />
            Import CSV
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
          <p className="text-3xl font-light text-neutral-900">1,248</p>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase">Registered</h3>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-3xl font-light text-neutral-900">892</p>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase">Pending Login</h3>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-3xl font-light text-neutral-900">356</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search emails..." 
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
              {mockWhitelist.map((item) => (
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
                  <td className="px-6 py-4 text-neutral-500">
                    {item.addedAt}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
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
                  placeholder="customer@example.com" 
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Assign Role</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white">
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
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-sm transition-colors"
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
