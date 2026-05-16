import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Shield, Lock, Unlock, Save, AlertCircle, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Module, Tool } from '../types/permissions';

interface Client {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface PermissionsManagerProps {
  onClose: () => void;
}

interface ClientPermissions {
  modules: Set<string>;
  tools: Set<string>;
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

export default function PermissionsManager({ onClose }: PermissionsManagerProps) {
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<ClientPermissions>({
    modules: new Set(),
    tools: new Set(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const itemsPerPage = 10;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientPermissions(selectedClient);
    }
  }, [selectedClient]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [clientsRes, modulesRes, toolsRes] = await Promise.all([
        supabase.from('clients').select('id, email, status, created_at').order('created_at', { ascending: false }),
        supabase.from('modules').select('*').order('sort_order'),
        supabase.from('tools').select('*').order('sort_order'),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (modulesRes.error) throw modulesRes.error;
      if (toolsRes.error) throw toolsRes.error;

      setAllClients(clientsRes.data || []);
      setModules(modulesRes.data || []);
      setTools(toolsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const loadClientPermissions = async (clientId: string) => {
    try {
      const [moduleAccessRes, toolAccessRes] = await Promise.all([
        supabase
          .from('user_module_access')
          .select('module_id, is_enabled')
          .eq('client_id', clientId),
        supabase
          .from('user_tool_access')
          .select('tool_id, is_enabled')
          .eq('client_id', clientId),
      ]);

      if (moduleAccessRes.error) throw moduleAccessRes.error;
      if (toolAccessRes.error) throw toolAccessRes.error;

      const moduleSet = new Set<string>();
      const toolSet = new Set<string>();

      moduleAccessRes.data?.forEach((access) => {
        if (access.is_enabled) {
          moduleSet.add(access.module_id);
        }
      });

      toolAccessRes.data?.forEach((access) => {
        if (access.is_enabled) {
          toolSet.add(access.tool_id);
        }
      });

      setPermissions({ modules: moduleSet, tools: toolSet });
    } catch (error) {
      console.error('Error loading permissions:', error);
      setMessage({ type: 'error', text: 'Failed to load permissions' });
    }
  };

  const toggleModuleAccess = (moduleId: string) => {
    setPermissions((prev) => {
      const newModules = new Set(prev.modules);
      const newTools = new Set(prev.tools);
      const enabling = !newModules.has(moduleId);

      if (enabling) {
        newModules.add(moduleId);
        const moduleTools = getToolsForModule(moduleId);
        moduleTools.forEach((tool) => newTools.add(tool.id));
      } else {
        newModules.delete(moduleId);
        const moduleTools = getToolsForModule(moduleId);
        moduleTools.forEach((tool) => newTools.delete(tool.id));
      }

      return { modules: newModules, tools: newTools };
    });
  };

  const toggleToolAccess = (toolId: string) => {
    setPermissions((prev) => {
      const newTools = new Set(prev.tools);
      if (newTools.has(toolId)) {
        newTools.delete(toolId);
      } else {
        newTools.add(toolId);
      }
      return { ...prev, tools: newTools };
    });
  };

  const savePermissions = async () => {
    if (!selectedClient) return;

    try {
      setSaving(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      console.log('[PermissionsManager] Saving permissions for client:', selectedClient);
      console.log('[PermissionsManager] Enabled modules:', Array.from(permissions.modules));
      console.log('[PermissionsManager] Enabled tools:', Array.from(permissions.tools));

      const [moduleDelResult, toolDelResult] = await Promise.all([
        supabase.from('user_module_access').delete().eq('client_id', selectedClient),
        supabase.from('user_tool_access').delete().eq('client_id', selectedClient),
      ]);

      if (moduleDelResult.error) {
        console.error('[PermissionsManager] Module delete error:', moduleDelResult.error);
        throw moduleDelResult.error;
      }
      if (toolDelResult.error) {
        console.error('[PermissionsManager] Tool delete error:', toolDelResult.error);
        throw toolDelResult.error;
      }

      console.log('[PermissionsManager] Delete completed successfully');

      const moduleInserts = Array.from(permissions.modules).map((moduleId) => ({
        client_id: selectedClient,
        module_id: moduleId,
        is_enabled: true,
        granted_by: adminId,
      }));

      const toolInserts = Array.from(permissions.tools).map((toolId) => ({
        client_id: selectedClient,
        tool_id: toolId,
        is_enabled: true,
        granted_by: adminId,
      }));

      console.log('[PermissionsManager] Module inserts:', moduleInserts);
      console.log('[PermissionsManager] Tool inserts:', toolInserts);

      if (moduleInserts.length > 0) {
        const { error } = await supabase.from('user_module_access').insert(moduleInserts);
        if (error) {
          console.error('[PermissionsManager] Module insert error:', error);
          throw error;
        }
      }

      if (toolInserts.length > 0) {
        const { error } = await supabase.from('user_tool_access').insert(toolInserts);
        if (error) {
          console.error('[PermissionsManager] Tool insert error:', error);
          throw error;
        }
      }

      console.log('[PermissionsManager] Save completed successfully');
      setMessage({ type: 'success', text: 'Permissions saved successfully' });
    } catch (error) {
      console.error('[PermissionsManager] Error saving permissions:', error);
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  const getToolsForModule = (moduleId: string) => {
    return tools.filter((tool) => tool.module_id === moduleId);
  };

  // Debounced search function
  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim() === '') {
      setShowSearchDropdown(false);
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      const filtered = allClients
        .filter((client) => client.email.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10); // Limit to 10 search results

      setSearchResults(filtered);
      setShowSearchDropdown(true);
    }, 300);
  }, [allClients]);

  // Sort clients based on selected option
  const getSortedClients = useCallback((clients: Client[]) => {
    const sorted = [...clients];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'az':
        return sorted.sort((a, b) => a.email.localeCompare(b.email));
      case 'za':
        return sorted.sort((a, b) => b.email.localeCompare(a.email));
      default:
        return sorted;
    }
  }, [sortBy]);

  // Get paginated clients for display
  const getPaginatedClients = useCallback(() => {
    const sorted = getSortedClients(allClients);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [allClients, currentPage, getSortedClients]);

  const totalPages = Math.ceil(allClients.length / itemsPerPage);

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Access Control</h2>
                <p className="text-sm text-gray-600">Manage user permissions for modules and tools</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select User</h3>

              {/* Search Bar */}
              <div ref={searchContainerRef} className="relative mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by email…"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Search Dropdown */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleClientSelect(client.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{client.email}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            client.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showSearchDropdown && searchQuery && searchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Sort Options */}
              <div className="mb-4 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                </select>
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                {allClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600 font-medium mb-1">No users found</p>
                    <p className="text-sm text-gray-500">Please add users first</p>
                  </div>
                ) : (
                  getPaginatedClients().map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedClient === client.id
                          ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                          : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{client.email}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          client.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Pagination */}
              {allClients.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {selectedClient ? (
                <div className="flex flex-col h-full">
                  {/* Selected User Header - Sticky */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4 sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {allClients.find(c => c.id === selectedClient)?.email.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium mb-0.5">Selected User</p>
                          <p className="text-base font-semibold text-gray-900">
                            {allClients.find(c => c.id === selectedClient)?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          allClients.find(c => c.id === selectedClient)?.status === 'Active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {allClients.find(c => c.id === selectedClient)?.status}
                        </span>
                        <button
                          onClick={savePermissions}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                        message.type === 'success'
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {message.text}
                    </div>
                  )}

                  {/* Permissions Section */}
                  <div className="space-y-6 max-h-[500px] overflow-y-auto flex-1">
                    {modules.map((module) => {
                      const moduleTools = getToolsForModule(module.id);
                      const hasModuleAccess = permissions.modules.has(module.id);

                      return (
                        <div
                          key={module.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  hasModuleAccess
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {hasModuleAccess ? (
                                  <Unlock className="w-5 h-5" />
                                ) : (
                                  <Lock className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {module.display_name}
                                </h4>
                                <p className="text-sm text-gray-600">{module.description}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleModuleAccess(module.id)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                hasModuleAccess
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              }`}
                            >
                              {hasModuleAccess ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>

                          {moduleTools.length > 0 && (
                            <div className="ml-12 space-y-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">Tools:</p>
                              {moduleTools.map((tool) => {
                                const hasToolAccess = permissions.tools.has(tool.id);
                                return (
                                  <div
                                    key={tool.id}
                                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                                  >
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {tool.display_name}
                                      </div>
                                      <div className="text-sm text-gray-600">{tool.description}</div>
                                    </div>
                                    <button
                                      onClick={() => toggleToolAccess(tool.id)}
                                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                        hasToolAccess
                                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }`}
                                    >
                                      {hasToolAccess ? 'Enabled' : 'Disabled'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[500px] text-gray-500">
                  <div className="text-center">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a user to manage permissions</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
