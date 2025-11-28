import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, Zap, Shield, Clock } from 'lucide-react';

const AdminHeader = () => {
  const currentDate = new Date();
  const time = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = currentDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <motion.header
      className="w-full h-full flex items-center justify-between p-4 bg-black/30 border border-hud-border text-hud-text-primary"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-hud-red rounded-full animate-pulse"></div>
        <h1 className="text-xl font-bold uppercase tracking-widest text-hud-cyan">
          Advance SOS Max
        </h1>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-hud-cyan" />
          <span>STATUS: <span className="text-green-400 font-bold">OPERATIONAL</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-hud-cyan" />
          <span>POWER: <span className="text-green-400 font-bold">STABLE</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-hud-cyan" />
          <span>SECURITY: <span className="text-green-400 font-bold">SECURE</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-hud-cyan" />
          <div>
            <div>{time}</div>
            <div className="text-xs text-hud-text-secondary">{date}</div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default AdminHeader;
