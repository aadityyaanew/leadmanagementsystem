import React, { useState } from "react";
import { USER_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("admin@comparedegree.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    
    // Find matching user
    const matchedRoleKey = Object.keys(USER_ROLES).find(
      (key) => USER_ROLES[key].email === email && USER_ROLES[key].password === password
    );

    if (matchedRoleKey) {
      onLogin(matchedRoleKey);
    } else {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="Logo" className="h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to your CRM Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
            <input 
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8B1E1E] focus:border-transparent transition-all text-sm"
              placeholder="name@comparedegree.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8B1E1E] focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full py-6 text-base font-semibold shadow-md bg-[#8B1E1E] hover:bg-[#6d1414] text-white" 
          >
            Login to Dashboard
          </Button>
        </form>

      </div>
    </div>
  );
}
