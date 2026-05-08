import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Login = () => {
  const { user, loading, loginWithGoogle } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-white">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 rounded-2xl w-full max-w-md text-center z-10"
      >
        <div className="w-16 h-16 bg-primary rounded-xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <span className="text-3xl font-bold text-white">R</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to ReachInbox</h1>
        <p className="text-gray-400 mb-8">Sign in to start automating your outreach</p>

        <button 
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center space-x-3 bg-white text-black py-3 px-4 rounded-xl font-medium hover:bg-gray-100 transition-colors"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          <span>Continue with Google</span>
        </button>
      </motion.div>
    </div>
  );
};
