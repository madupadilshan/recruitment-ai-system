// recruitment-ai-system/frontend/src/components/Navbar.js

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserCircle2 } from "lucide-react";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide user navigation on login/signup pages
  const isAuthPage = location.pathname === "/" || location.pathname === "/signup";

  const isActive = (path) =>
    location.pathname === path
      ? "bg-blue-100 text-blue-700 font-semibold"
      : "hover:bg-blue-50 text-gray-700";

  return (
    <nav className="flex items-center justify-between px-6 py-3 text-white shadow-md bg-gradient-to-r from-blue-600 to-indigo-700">
      <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-xl font-bold tracking-wide">
        <span className="px-2 py-1 text-blue-900 bg-yellow-400 rounded-lg">AI</span>
        Recruiter
      </Link>

      <div className="items-center hidden gap-4 md:flex">
        {(user && !isAuthPage) ? (
          <>
            <Link to="/messages" className="hover:text-yellow-300">
              💬 Messages
            </Link>
            
            <Link to="/interviews" className="hover:text-yellow-300">
              📅 Interviews
            </Link>
            
            <Link to="/cv-analysis" className="hover:text-yellow-300">
              🤖 AI CV Analysis
            </Link>
            
            {user.role === "recruiter" && (
              <Link to="/post-job" className="hover:text-yellow-300">
                📝 Post Job
              </Link>
            )}
            
            {/* ✅ Updated Profile Icon Link to point to /account */}
            <Link
              to="/account"
              title="Account Settings"
              className="hover:text-yellow-300"
            >
              <UserCircle2 size={24} />
            </Link>

            <button onClick={() => { logout(); navigate("/"); }} className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg shadow-md">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-yellow-300">🔐 Login</Link>
            <Link to="/signup" className="hover:text-yellow-300">📝 Signup</Link>
          </>
        )}
      </div>

      <button className="text-2xl md:hidden" onClick={() => setMenuOpen(true)}>☰</button>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMenuOpen(false)}></div>
          <div className="absolute top-0 right-0 w-64 h-full transition-transform duration-300 transform bg-white shadow-lg animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-700">Menu</h3>
              <button className="text-2xl text-gray-600" onClick={() => setMenuOpen(false)}>✖</button>
            </div>
            <div className="flex flex-col p-4 space-y-3">
              {(user && !isAuthPage) ? (
                <>
                  <Link to="/messages" className={`${isActive("/messages")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>💬 Messages</Link>
                  <Link to="/interviews" className={`${isActive("/interviews")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>📅 Interviews</Link>
                  <Link to="/cv-analysis" className={`${isActive("/cv-analysis")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>🤖 AI CV Analysis</Link>
                  <Link to="/account" className={`${isActive("/account")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>👤 My Account</Link>
                  {user.role === 'candidate' && <Link to="/profile" className={`${isActive("/profile")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>📄 Professional Profile</Link>}
                  {user.role === "recruiter" && <Link to="/post-job" className={`${isActive("/post-job")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>📝 Post Job</Link>}
                  <button onClick={() => { logout(); navigate("/"); setMenuOpen(false); }} className="w-full px-3 py-2 text-left text-white bg-red-500 rounded-lg hover:bg-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/" className={`${isActive("/")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>🔐 Login</Link>
                  <Link to="/signup" className={`${isActive("/signup")} block px-3 py-2 rounded-lg`} onClick={() => setMenuOpen(false)}>📝 Signup</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;