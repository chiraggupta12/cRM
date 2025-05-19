import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Lead {
  id: string;
  title: string;
  source: string;
  status: string;
  value: number;
  description: string | null;
  created_at: string;
}

const statuses = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Closed', 'Lost'];

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statuses.map(status => (
          <div
            key={status}
            className="bg-card rounded-lg shadow-sm border border-border"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="p-3 border-b border-border bg-muted/30">
              <h3 className="font-semibold">{status}</h3>
              <p className="text-sm text-muted-foreground">
                {leads.filter(lead => lead.status === status).length} leads
              </p>
            </div>
            
            <div className="p-2">
              {leads
                .filter(lead => lead.status === status)
                .map(lead => (
                  <motion.div
                    key={lead.id}
                    layoutId={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-3 rounded-md shadow-sm border border-border mb-2 cursor-move hover:shadow-md transition-shadow"
                  >
                    <Link to={`/leads/${lead.id}`}>
                      <h4 className="font-medium mb-1">{lead.title}</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{lead.source}</span>
                        <span className="font-medium">₹{lead.value.toLocaleString()}</span>
                      </div>
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