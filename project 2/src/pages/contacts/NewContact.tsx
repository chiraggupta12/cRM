import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  lead_id: string;
}

interface Lead {
  id: string;
  title: string;
}

const NewContact: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  
  // Extract leadId from URL query params if present
  const searchParams = new URLSearchParams(location.search);
  const leadIdFromQuery = searchParams.get('leadId');
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      lead_id: leadIdFromQuery || '',
    }
  });

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user) return;
      
      try {
        setLoadingLeads(true);
        
        const { data, error } = await supabase
          .from('leads')
          .select('id, title')
          .eq('user_id', user.id)
          .order('title', { ascending: true });
          
        if (error) throw error;
        
        setLeads(data || []);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoadingLeads(false);
      }
    };
    
    fetchLeads();
  }, [user]);
  
  // Set the leadId from query parameter into the form
  useEffect(() => {
    if (leadIdFromQuery) {
      setValue('lead_id', leadIdFromQuery);
    }
  }, [leadIdFromQuery, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase.from('contacts').insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || null,
        position: data.position || null,
        lead_id: data.lead_id || null,
        user_id: user.id,
      });
      
      if (error) throw error;
      
      toast.success('Contact created successfully');
      
      // If coming from a lead detail page, navigate back to that lead
      if (leadIdFromQuery) {
        navigate(`/leads/${leadIdFromQuery}`);
      } else {
        navigate('/contacts');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 mr-2 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">New Contact</h1>
          <p className="text-muted-foreground">Add a new contact to your database</p>
        </div>
      </div>
      
      <motion.div 
        className="bg-card rounded-lg shadow-sm border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="input"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    }
                  })}
                  className="input"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone', { required: 'Phone number is required' })}
                  className="input"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Company
                </label>
                <input
                  type="text"
                  {...register('company')}
                  className="input"
                  placeholder="Acme Inc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Position
                </label>
                <input
                  type="text"
                  {...register('position')}
                  className="input"
                  placeholder="Marketing Manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Associated Lead
                </label>
                <select
                  {...register('lead_id')}
                  className="input"
                  disabled={loadingLeads}
                >
                  <option value="">None</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.title}</option>
                  ))}
                </select>
                {loadingLeads && (
                  <p className="mt-1 text-xs text-muted-foreground">Loading leads...</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => leadIdFromQuery ? navigate(`/leads/${leadIdFromQuery}`) : navigate('/contacts')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Contact
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NewContact;