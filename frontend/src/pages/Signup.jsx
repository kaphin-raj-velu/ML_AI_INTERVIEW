import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Mail, Lock, ArrowRight, LogIn, User } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = "http://localhost:8000/api";

export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/auth/signup`, { username, password });
            localStorage.setItem('copilot_token', res.data.access_token);
            localStorage.setItem('copilot_user', res.data.username);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Username might be taken.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#010409] flex items-center justify-center p-6 selection:bg-primary selection:text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-neon-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-6">
                        <Fingerprint className="text-white" size={32} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase">Create <span className="text-primary">Account.</span></h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[4px]">Join the Future of Interview Auditing</p>
                </div>

                <div className="glass-card p-10 bg-black/40 border-white/5 shadow-2xl backdrop-blur-3xl relative">
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Secure Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirm Identity</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                                {error}
                            </motion.div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full btn-primary py-5 rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'SYNCING DATA...' : 'REGISTER TERMINAL'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Already registered?</p>
                        <Link to="/login" className="flex items-center gap-2 text-white hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest">
                            <LogIn size={16} /> Access Existing Account
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
