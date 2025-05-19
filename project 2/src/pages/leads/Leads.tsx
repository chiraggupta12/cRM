import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Phone, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

interface Lead {
  id: string;
  created_at: string;
  user_id: string;
  academic_councellor: string | null;
  full_name: string;
  source: string;
  status: string;
  revenue: number | null;
  notes: string | null;
  email: string;
  phone_number: string;
  name: string;
  specialization: string | null;
  batch_date: string | null;
  job_title: string | null;
}

const statuses = [
  'New Lead',
  'Junk Lead',
  'Prospecting',
  'Qualified',
  'Paid',
  'Lost Lead',
  'Postpone',
];

const Leads: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [user, filterStatus]);

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
      console.error('Error fetching forms:', error);
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
    lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new lead':
        return 'bg-blue-100 text-blue-800';
      case 'junk lead':
        return 'bg-red-100 text-red-800';
      case 'prospecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'lost lead':
        return 'bg-red-100 text-red-800';
      case 'postpone':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <button className="btn bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </button>
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="flex-shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No leads found</p>
            <Link to="/leads/new" className="text-blue-600 hover:underline block mt-2">
              Create your first lead
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Call
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Source
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Batch Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <motion.tbody
                variants={container}
                initial="hidden"
                animate="show"
                className="divide-y divide-gray-200 bg-white"
              >
                {filteredLeads.map((lead) => (
                  <motion.tr 
                    key={lead.id} 
                    className="hover:bg-gray-50 transition-colors"
                    variants={item}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                        {lead.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {lead.phone_number && (
                        <a href={`tel:${lead.phone_number}`} className="text-blue-600 hover:text-blue-900 inline-block mr-2" aria-label="Call">
                          <Phone size={18} />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       {lead.phone_number && (
                        <a href={`https://wa.me/${lead.phone_number}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900 inline-block" aria-label="WhatsApp">
                          <MessageCircle size={18} />
                        </a>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.specialization && (
                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {lead.specialization}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.revenue ? `₹${lead.revenue.toLocaleString()}` : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.batch_date ? format(new Date(lead.batch_date), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button onClick={() => toggleMenu(lead.id)} type="button" className="inline-flex justify-center items-center p-1 border border-transparent rounded-full shadow-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500" id={`menu-button-${lead.id}`} aria-expanded="true" aria-haspopup="true">
                           <span className="sr-only">Open options</span>
                           <MoreVertical size={20} aria-hidden="true" />
                        </button>

                        <AnimatePresence>
                           {openMenuId === lead.id && (
                              <motion.div
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.95 }}
                                 transition={{ duration: 0.1 }}
                                 className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                                 role="menu" aria-orientation="vertical" aria-labelledby={`menu-button-${lead.id}`}
                              >
                                 <div className="py-1" role="none">
                                   <Link to={`/leads/${lead.id}`} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" id={`menu-item-${lead.id}-edit`}>
                                     <Edit size={16} className="mr-2 inline-block" />Edit
                                   </Link>
                                   <button onClick={() => deleteLead(lead.id)} className="text-red-600 block w-full text-left px-4 py-2 text-sm hover:bg-red-100" role="menuitem" id={`menu-item-${lead.id}-delete`}>
                                     <Trash2 size={16} className="mr-2 inline-block" />Delete
                                   </button>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                      </div>
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