import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead {
  id: string;
  title: string;
  source: string;
  status: string;
  value: number | null;
  created_at: string;
}

const Leads: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setLeads(leads.filter(lead => lead.id !== id));
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const filteredLeads = leads.filter(lead => 
    lead.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'badge-primary';
      case 'qualified':
        return 'badge-secondary';
      case 'negotiation':
        return 'badge-warning';
      case 'closed':
        return 'badge-success';
      case 'lost':
        return 'badge-destructive';
      default:
        return 'badge-outline';
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales leads</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Link to="/leads/new">
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </button>
          </Link>
        </div>
      </div>
      
      <div className="bg-card rounded-lg shadow-sm border border-border mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          <div className="flex-shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed">Closed</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No leads found</p>
            <Link to="/leads/new" className="text-primary hover:underline block mt-2">
              Create your first lead
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                variants={container}
                initial="hidden"
                animate="show"
              >
                {filteredLeads.map((lead) => (
                  <motion.tr 
                    key={lead.id} 
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                    variants={item}
                  >
                    <td className="px-4 py-3 text-sm">
                      <Link 
                        to={`/leads/${lead.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {lead.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{lead.source}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">${lead.value?.toLocaleString() ?? 0}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right relative">
                      <button 
                        onClick={() => toggleMenu(lead.id)}
                        className="p-1 rounded-md hover:bg-muted transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      <AnimatePresence>
                        {openMenuId === lead.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-border z-10"
                          >
                            <Link 
                              to={`/leads/${lead.id}`}
                              className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                            <button 
                              onClick={() => {
                                toggleMenu(lead.id);
                                deleteLead(lead.id);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-destructive hover:bg-destructive hover:text-white transition-colors w-full text-left"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;