import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

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
  'Qualified',
  'Prospecting',
  'Paid',
  'Lost Lead',
  'Junk Lead',
];

const DealsFlow: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      toast.success('Lead status updated');
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    await updateLeadStatus(leadId, status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Deals Flow</h1>
          <p className="text-muted-foreground">Manage your deals pipeline</p>
        </div>
        
        <Link to="/leads/new">
          <button className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {statuses.map(status => (
          <div
            key={status}
            className="bg-card rounded-lg shadow-sm border border-border flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="p-3 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-lg">{status}</h3>
              <p className="text-sm text-muted-foreground">
                {leads.filter(lead => lead.status === status).length} leads
              </p>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {leads
                .filter(lead => lead.status === status)
                .map(lead => (
                  <motion.div
                    key={lead.id}
                    layoutId={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-3 rounded-md shadow-md border border-border cursor-move hover:shadow-lg transition-shadow space-y-1"
                  >
                    <Link to={`/leads/${lead.id}`} className="block">
                      {lead.specialization && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium mr-2 px-1 py-0.5 rounded-full mb-0 whitespace-nowrap overflow-hidden text-ellipsis">
                          {lead.specialization}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-foreground">{lead.full_name}</h4>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {format(new Date(lead.created_at), 'MMM d, yyyy')}
                      </p>
                      
                      {lead.job_title && (
                        <p className="text-xs text-muted-foreground mt-1">{lead.job_title}</p>
                      )}

                      {lead.batch_date && (
                        <p className="text-xs text-muted-foreground mt-1">Batch: {format(new Date(lead.batch_date), 'MMM d, yyyy')}</p>
                      )}

                      {lead.revenue !== null && lead.revenue !== undefined && lead.revenue > 0 && (
                        <div className="mt-2 text-sm font-semibold text-primary">₹{lead.revenue.toLocaleString('en-IN')}</div>
                      )}
                    </Link>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsFlow;