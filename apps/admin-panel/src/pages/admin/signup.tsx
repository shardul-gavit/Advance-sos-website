import React from 'react';
import { SignupForm } from '@/components/auth/SignupForm';

const AdminSignupPage: React.FC = () => {
  // Set document title
  React.useEffect(() => {
    document.title = 'Admin Signup - Emergency SOS System';
  }, []);

  return (
    <div className="min-h-screen bg-black font-mono text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-300 tracking-widest text-glow-cyan mb-2">
            Advance SOS Max
          </h1>
          <p className="text-gray-400 text-sm">Admin Registration Portal</p>
        </div>
        <div className="border border-cyan-400 rounded-lg p-6 shadow-[0_0_20px_#00fff7] bg-black/80 backdrop-blur-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
};

export default AdminSignupPage; 