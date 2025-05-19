import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  position: string | null;
  lead_id: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  title: string;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  lead_id: string;
}

const ContactDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    const fetchContactDetails = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch contact
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setContact(data);
        reset({
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company || '',
          position: data.position || '',
          lead_id: data.lead_id || '',
        });
      } catch (error) {
        console.error('Error fetching contact details:', error);
        toast.error('Failed to load contact details');
        navigate('/contacts');
      } finally {
        setLoading(false);
      }
    };
    
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
    
    fetchContactDetails();
    fetchLeads();
  }, [id, user, reset, navigate]);

  const onSubmit = async (data: FormValues) => {
    if (!id || !user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('contacts')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company || null,
          position: data.position || null,
          lead_id: data.lead_id || null,
        })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (contact) {
        setContact({
          ...contact,
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company || null,
          position: data.position || null,
          lead_id: data.lead_id || null,
        });
      }
      
      toast.success('Contact updated successfully');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async () => {
    if (!id || !user) return;
    
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Contact deleted successfully');
      navigate('/contacts');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <h1 className="text-2xl font-bold">Contact Details</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!contact) {
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
            <h1 className="text-2xl font-bold">Contact Not Found</h1>
            <p className="text-muted-foreground">The requested contact could not be found</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 text-center">
          <p className="mb-4">This contact might have been deleted or you don't have permission to view it.</p>
          <Link to="/contacts" className="btn btn-primary">
            Back to Contacts
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">{contact.name}</h1>
          <p className="text-muted-foreground">
            Added on {format(new Date(contact.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      
      <motion.div 
        className="bg-card rounded-lg shadow-sm border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Contact Information</h2>
        </div>
        
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
          
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={deleteContact}
              className="btn btn-outline text-destructive hover:bg-destructive hover:text-white"
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Contact
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ContactDetails;