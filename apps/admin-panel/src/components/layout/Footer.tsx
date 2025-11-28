
import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-800 bg-black py-12">
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-bold text-xl mb-4">
            <span className="text-white">Advance</span>
            <span className="text-sos-red">SOS</span>
          </div>
          <p className="text-sos-lightgray text-sm max-w-md">
            A next-generation emergency response platform designed for the future – 
            connecting communities, responders, and technology for faster, smarter safety.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 md:gap-4">
          <div>
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <ul className="space-y-2 text-sm text-sos-lightgray">
              <li><a href="#features" className="hover:text-sos-red transition-colors">Features</a></li>
              <li><a href="#admin" className="hover:text-sos-red transition-colors">Admin Panel</a></li>
              <li><a href="#tech" className="hover:text-sos-red transition-colors">Technology</a></li>
              <li><a href="#vision" className="hover:text-sos-red transition-colors">Vision</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3">Follow Us</h3>
            <ul className="space-y-2 text-sm text-sos-lightgray">
              <li><a href="#" className="hover:text-sos-red transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-sos-red transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-sos-red transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-sos-red transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-3">Contact</h3>
          <p className="text-sos-lightgray text-sm mb-2">advancesossystem@gmail.com</p>
          <p className="text-sos-lightgray text-sm">+91 95868 68538</p>
          
          <div className="mt-6">
            <button className="bg-sos-red text-white px-4 py-2 rounded-md hover:bg-sos-red/80 transition-colors">
              Request Demo
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mt-8 pt-8 border-t border-gray-800 text-sos-lightgray text-sm flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} Advance SOS. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-sos-red transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-sos-red transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-sos-red transition-colors">Sitemap</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
