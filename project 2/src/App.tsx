import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Leads from './pages/leads/Leads';
import LeadDetails from './pages/leads/LeadDetails';
import NewLead from './pages/leads/NewLead';
import Contacts from './pages/contacts/Contacts';
import NewContact from './pages/contacts/NewContact';
import ContactDetails from './pages/contacts/ContactDetails';
import Forms from './pages/forms/Forms';
import DealsFlow from './pages/deals/DealsFlow';
import Layout from './components/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/new" element={<NewLead />} />
        <Route path="leads/:id" element={<LeadDetails />} />
        <Route path="deals" element={<DealsFlow />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/new" element={<NewContact />} />
        <Route path="contacts/:id" element={<ContactDetails />} />
        <Route path="forms" element={<Forms />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;