import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Copy, Link as LinkIcon, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeadForm {
  id: string;
  title: string;
  description: string | null;
  source: string;
  created_at: string;
}

interface FormValues {
  title: string;
  description: string;
  source: string;
}

const Forms: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    fetchForms();
  }, [user]);

  const fetchForms = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const createForm = async (data: FormValues) => {
    if (!user) return;
    
    try {
      setCreating(true);
      
      const { data: newForm, error } = await supabase
        .from('lead_forms')
        .insert({
          title: data.title,
          description: data.description || null,
          source: data.source,
          user_id: user.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setForms([newForm, ...forms]);
      reset();
      setShowNewForm(false);
      toast.success('Form created successfully');
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Failed to create form');
    } finally {
      setCreating(false);
    }
  };

  const deleteForm = async (id: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this form?')) return;
    
    try {
      const { error } = await supabase
        .from('lead_forms')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setForms(forms.filter(form => form.id !== id));
      toast.success('Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    }
  };

  const copyFormLink = (id: string) => {
    const url = `${window.location.origin}/form/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Form link copied to clipboard');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Capture Forms</h1>
          <p className="text-muted-foreground">Create and manage forms to capture leads</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setShowNewForm(!showNewForm)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </button>
        </div>
      </div>
      
      {showNewForm && (
        <motion.div 
          className="bg-card rounded-lg shadow-sm border border-border mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Create New Lead Form</h2>
          </div>
          
          <form onSubmit={handleSubmit(createForm)} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Form Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="input"
                  placeholder="Contact Us Form"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Lead Source <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register('source', { required: 'Source is required' })}
                  className="input"
                  placeholder="Website Contact Form"
                />
                {errors.source && (
                  <p className="mt-1 text-xs text-destructive">{errors.source.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="input min-h-[100px]"
                  placeholder="Form description..."
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Form
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No forms created yet</p>
            <button 
              onClick={() => setShowNewForm(true)}
              className="text-primary hover:underline block mt-2 mx-auto"
            >
              Create your first form
            </button>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-border"
          >
            {forms.map((form) => (
              <motion.div
                key={form.id}
                variants={item}
                className="p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{form.title}</h3>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                    )}
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                        {form.source}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Created on {new Date(form.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => copyFormLink(form.id)}
                      className="btn btn-sm btn-outline"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Link
                    </button>
                    <button 
                      onClick={() => deleteForm(form.id)}
                      className="btn btn-sm btn-outline text-destructive hover:bg-destructive hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Forms;