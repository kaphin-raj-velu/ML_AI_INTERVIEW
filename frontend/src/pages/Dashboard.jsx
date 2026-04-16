import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutDashboard, BarChart3, Gamepad2, ShieldCheck, Settings, LogOut,
    Mic, Send, AlertCircle, CheckCircle2, ArrowRight, Trophy, RefreshCw,
    Scale, ShieldAlert, Cpu, Volume2, Code2, Globe, Zap, Fingerprint,
    Info, MicOff, PieChart as PieIcon, BarChart as BarIcon, Video,
    History, Download, Camera, PlayCircle, StopCircle, Eye, FileText
} from 'lucide-react';
import axios from 'axios';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, 
    YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:8000/api";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('analyzer');
    const [domain, setDomain] = useState('Software Engineering');
    const [question, setQuestion] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [stats, setStats] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [threshold, setThreshold] = useState(70);
    const [voiceError, setVoiceError] = useState(null);
    const [autoAudit, setAutoAudit] = useState(false);
    const [history, setHistory] = useState([]);
    const [currentUser, setCurrentUser] = useState(localStorage.getItem('copilot_user') || 'Anonymous');
    const navigate = useNavigate();
    
    const handleLogout = () => {
        localStorage.removeItem('copilot_token');
        localStorage.removeItem('copilot_user');
        navigate('/login');
    };
    
    // REFS to fix stale closures in speech handler
    const autoAuditRef = useRef(autoAudit);
    const domainRef = useRef(domain);
    const videoRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    
    const recognitionRef = useRef(null);
    const lastAnalyzedRef = useRef(''); // To prevent duplicate auto-audits

    // Sync refs with state
    useEffect(() => { autoAuditRef.current = autoAudit; }, [autoAudit]);
    useEffect(() => { domainRef.current = domain; }, [domain]);

    useEffect(() => {
        fetchAnalytics();
        fetchHistory();
        initSpeechRecognition();
        return () => stopCamera();
    }, []);

    const initSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript = event.results[i][0].transcript.trim();
                    } else {
                        currentTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript && finalTranscript !== lastAnalyzedRef.current) {
                    lastAnalyzedRef.current = finalTranscript;
                    // For Auto-Audit, we send ONLY the last final fragment to ensure single-instance logging
                    if (autoAuditRef.current) {
                        handleAnalyzeDirect(finalTranscript);
                    } else {
                        setQuestion(prev => (prev.trim() + ' ' + finalTranscript).trim());
                    }
                }
                
                setInterimTranscript(currentTranscript);
            };

            recognitionRef.current.onerror = (e) => {
                console.error("Speech Error:", e.error);
                setVoiceError(e.error);
            };
            
            recognitionRef.current.onend = () => {
                // Restart if still active to simulate continuous meeting listening
                if (cameraActive || isRecording) {
                    try { recognitionRef.current.start(); } catch(e) {}
                } else {
                    setIsRecording(false);
                }
            };
        }
    };

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('copilot_token');
            const res = await axios.get(`${API_BASE}/analytics/default`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('copilot_token');
            const res = await axios.get(`${API_BASE}/history/default`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAnalyze = async () => {
        if (!question.trim()) return;
        handleAnalyzeDirect(question);
    };

    const handleAnalyzeDirect = async (qText) => {
        setLoading(true);
        setScanning(true);
        try {
            const token = localStorage.getItem('copilot_token');
            const res = await axios.post(`${API_BASE}/analyze`, { 
                question: qText, 
                domain: domainRef.current, 
                session_id: 'default' 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResult(res.data);
            fetchAnalytics();
            fetchHistory();
            if (autoAuditRef.current) setQuestion(''); // Clear buffer after auto-audit
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setScanning(false);
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setQuestion('');
            setVoiceError(null);
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) { console.error(e); }
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
                // Prompt for mic too if auto-audit is intended
                if (!isRecording) toggleRecording();
            }
        } catch (e) {
            console.error("Camera access denied", e);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => {
                track.stop();
                track.enabled = false;
            });
            videoRef.current.srcObject = null;
            videoRef.current.load(); // Reset video element
        }
        
        setCameraActive(false);
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const exportPDF = () => {
        try {
            const doc = new jsPDF();
            
            // Branded Header
            doc.setFillColor(2, 6, 23); // Dark theme color
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("INTERVIEW COPILOT AI", 15, 20);
            doc.setFontSize(10);
            doc.text("Official Bias Audit Report", 15, 30);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 30);

            // Summary Stats
            doc.setTextColor(0,0,0);
            doc.setFontSize(14);
            doc.text("Executive Summary", 15, 55);
            doc.setFontSize(10);
            doc.text(`Total Questions Audited: ${stats?.total_questions || 0}`, 15, 65);
            doc.text(`Biased Patterns Found: ${stats?.bias_count || 0}`, 15, 72);
            doc.text(`Session Integrity Score: ${stats?.total_questions ? (((stats.total_questions - stats.bias_count) / stats.total_questions) * 100).toFixed(0) : 100}%`, 15, 79);

            // Comprehensive Audit Table: Joining original and new requested columns
            const tableData = history.map((h, i) => [
                i + 1,
                h.original_question,
                h.classification || (h.is_biased ? 'Biased' : 'Safe'),
                h.bias_type || 'None',
                h.suggested_question || 'N/A'
            ]);

            autoTable(doc, {
                startY: 90,
                head: [['#', 'Input Question', 'Classification', 'Bias Type', 'Suggested Question']],
                body: tableData,
                headStyles: { fillColor: [79, 70, 229] },
                alternateRowStyles: { fillColor: [245, 245, 250] },
                margin: { left: 10, right: 10 },
                styles: { fontSize: 7, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 60 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 60 }
                }
            });

            doc.save(`Copilot_Audit_${Date.now()}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to generate PDF. Please check console for details.");
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary selection:text-white">
            {/* Premium Sidebar */}
            <aside className="w-80 border-r border-white/5 bg-black/20 backdrop-blur-3xl flex flex-col p-8 relative">
                <div className="absolute inset-0 bg-primary/2 opacity-[0.02] -z-10" />
                
                <div className="flex items-center gap-4 mb-12 px-2">
                    <div className="w-12 h-12 bg-neon-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Fingerprint className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="font-black text-2xl tracking-tighter">COPILOT <span className="text-primary font-light">AI</span></h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[4px]">{currentUser}</p>
                    </div>
                </div>
                
                <nav className="flex-1 space-y-2">
                    <NavItem icon={<Zap size={20} />} label="Live Meeting" active={activeTab === 'analyzer'} onClick={() => setActiveTab('analyzer')} />
                    <NavItem icon={<History size={20} />} label="Audit Archive" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                    <NavItem icon={<BarChart3 size={20} />} label="Intelligence" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <NavItem icon={<Gamepad2 size={20} />} label="Training Sim" active={activeTab === 'mock'} onClick={() => setActiveTab('mock')} />
                    <NavItem icon={<Settings size={20} />} label="Core Engine" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    <NavItem icon={<LogOut size={20} />} label="Sign Out" active={false} onClick={handleLogout} />
                </nav>

                <div className="mt-auto space-y-4">
                    <div className="glass-card p-5 bg-primary/5 border-primary/10">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Live Link</h4>
                            <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold">{cameraActive ? 'Streaming Active' : 'Waiting for Device...'}</p>
                    </div>
                </div>
            </aside>

            {/* Main Surface */}
            <main className="flex-1 overflow-y-auto p-12 relative bg-[#010409]">
                <div className="max-w-7xl mx-auto space-y-12 pb-20 mt-12">
                    <AnimatePresence mode="wait">
                        {activeTab === 'analyzer' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                        <h2 className="text-5xl font-black tracking-tighter text-white">Live Meeting <br/><span className="text-primary">Companion.</span></h2>
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px]"><Video size={14} /> Video Mesh</span>
                                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                                            <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] ${autoAudit ? 'text-primary' : ''}`}><Zap size={14} /> Auto-Audit: {autoAudit ? 'ENABLED' : 'MANUAL'}</span>
                                        </div>
                                    </div>
                                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                                        <button onClick={() => setAutoAudit(!autoAudit)} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${autoAudit ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:text-white'}`}>AUTO-AUDIT</button>
                                        <button onClick={cameraActive ? stopCamera : startCamera} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${cameraActive ? 'bg-red-500/10 text-red-500' : 'text-slate-500 hover:text-white'}`}>{cameraActive ? 'CLOSE MEETING' : 'JOIN MEETING'}</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="glass-card p-0 aspect-video relative overflow-hidden group shadow-2xl bg-black border-white/5">
                                            <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraActive ? 'opacity-100' : 'opacity-20'}`} />
                                            {!cameraActive && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <Camera size={64} className="text-white/5 mb-4 animate-pulse" />
                                                    <p className="text-[10px] font-black tracking-[5px] text-slate-700 uppercase">Camera Module Offline</p>
                                                </div>
                                            )}
                                            {scanning && <div className="animate-scan-laser" />}
                                            {isRecording && (
                                                <div className="absolute top-8 left-8 flex items-center gap-3 bg-red-500 px-5 py-2.5 rounded-2xl shadow-2xl shadow-red-500/40 animate-pulse">
                                                    <div className="flex gap-1">
                                                        {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-white/50 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
                                                    </div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Listening...</span>
                                                </div>
                                            )}
                                        </div>

                                        <section className={`glass-card p-8 bg-black/40 border-white/5 transition-all duration-500 ${isRecording ? 'border-primary shadow-xl shadow-primary/5' : ''}`}>
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-600">Speech-to-Text Buffer</span>
                                                {voiceError && <span className="text-[10px] font-black text-red-500 uppercase">{voiceError}</span>}
                                            </div>
                                            <textarea 
                                                className="w-full bg-transparent border-none outline-none text-2xl font-bold min-h-[140px] resize-none text-white placeholder:text-slate-900 leading-relaxed"
                                                placeholder="Auditor initialized... speak or type to begin validation."
                                                value={question + (interimTranscript ? ` ${interimTranscript}` : '')}
                                                onChange={(e) => setQuestion(e.target.value)}
                                            />
                                            <div className="flex justify-between items-center mt-6">
                                                <button onClick={toggleRecording} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-2xl shadow-red-500/50 scale-110 active:scale-95' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}>
                                                    <Mic size={28} />
                                                </button>
                                                <button onClick={handleAnalyze} disabled={loading || !question.trim()} className="btn-primary py-5 px-12 group">
                                                    AUDIT MANUAL <Send size={16} className="ml-3 group-hover:translate-x-2 transition-transform" />
                                                </button>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="space-y-8">
                                        <AnimatePresence mode="wait">
                                            {result ? <ResultCard result={result} threshold={threshold} /> : (
                                                <div className="glass-card h-full flex flex-col items-center justify-center text-center p-20 border-dashed border-white/10">
                                                    <ShieldCheck size={80} className="text-slate-900 mb-8" />
                                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Secure Core Active</h3>
                                                    <p className="text-slate-500 max-w-xs mt-4 font-bold text-xs leading-loose">Automated Session Analysis will appear here in real-time as bias patterns are identified.</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-5xl font-black tracking-tighter text-white uppercase">Audit Log</h2>
                                    <div className="flex gap-4">
                                        <button onClick={() => {}} className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-xl text-[10px] font-black border border-white/10 hover:bg-white/10 transition-all text-slate-400"><Download size={16} /> JSON</button>
                                        <button onClick={exportPDF} className="flex items-center gap-3 bg-primary px-8 py-4 rounded-xl text-[10px] font-black shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-white"><FileText size={16} /> DOWNLOAD PDF REPORT</button>
                                    </div>
                                </div>
                                <div className="grid gap-6">
                                    {history.slice().reverse().map((h, i) => (
                                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={i} className="glass-card flex items-center justify-between p-10 hover:bg-white/5 transition-all group border-white/5">
                                            <div className="flex items-center gap-10">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${h.is_biased ? 'bg-red-500/20 text-red-500 shadow-lg shadow-red-500/10' : 'bg-green-500/20 text-green-500 shadow-lg shadow-green-500/10'}`}>
                                                    {h.is_biased ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-black text-white text-xl leading-tight max-w-2xl">"{h.original_question}"</h4>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[2px]">{h.is_biased ? 'Bias Detected' : 'Safety Verified'}</span>
                                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                        <span className="text-[10px] text-primary font-black uppercase tracking-[2px]">{h.insights[0]?.category || 'Standard'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-white">{(h.overall_confidence * 100).toFixed(0)}%</div>
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">Audit Score</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'analytics' && <IntelligenceSection stats={stats} />}
                        {activeTab === 'mock' && <MockSessionSection />}
                        {activeTab === 'settings' && <SettingsSection threshold={threshold} setThreshold={setThreshold} />}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (
        <div onClick={onClick} className={`flex items-center gap-5 px-8 py-5 rounded-2xl cursor-pointer transition-all duration-500 ${active ? 'bg-primary text-white shadow-2xl shadow-primary/40 scale-105 translate-x-1' : 'text-slate-500 hover:bg-white/5 hover:text-white hover:translate-x-1'}`}>
            {icon}
            <span className="font-black text-sm tracking-tight uppercase tracking-widest">{label}</span>
        </div>
    );
}

function IntelligenceSection({ stats }) {
    const [modelStats, setModelStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const token = localStorage.getItem('copilot_token');
                const res = await axios.get(`${API_BASE}/model_metrics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setModelStats(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchMetrics();
    }, [stats]);

    const performanceData = [
        { name: 'Accuracy', value: modelStats?.accuracy || 0 },
        { name: 'Precision', value: modelStats?.precision || 0 },
        { name: 'Recall', value: modelStats?.recall || 0 },
        { name: 'F1 Score', value: modelStats?.f1_score || 0 },
    ];

    const isCalibrating = loading || !modelStats || modelStats.total_samples === 0;

    const barData = (stats && stats.bias_distribution) ? Object.entries(stats.bias_distribution).map(([name, value]) => ({ name, value })) : [];
    const pieData = stats && stats.total_questions > 0 ? [
        { name: 'Safe', value: stats.total_questions - stats.bias_count },
        { name: 'Biased', value: stats.bias_count }
    ] : [{ name: 'Awaiting Data', value: 1 }];
    const COLORS = ['#10b981', '#ef4444', '#1e293b'];

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-6xl font-black tracking-tighter uppercase text-white">System Performance</h2>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                        {isCalibrating
                            ? <><span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" /> Warming Neural Engine...</>
                            : <><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Engine Online — {modelStats?.total_samples} samples</>}
                    </p>
                </div>
                <div className="glass-card px-8 py-5 flex items-center gap-6 border-white/5 bg-black/40">
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Total Audits</p>
                        <div className="text-3xl font-black text-white">{stats?.total_questions || 0}</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Precision</p>
                        <div className="text-3xl font-black text-primary">{modelStats?.precision?.toFixed(1) || '—'}%</div>
                    </div>
                </div>
            </div>

            {/* Real-time Metrics Chart */}
            <div className="grid grid-cols-1 gap-10">
                <div className="glass-card p-12 space-y-12 border-white/5 bg-black/40 shadow-2xl relative overflow-hidden">
                    {isCalibrating && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4 rounded-3xl">
                            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black tracking-[4px] text-primary uppercase">Computing Baseline Metrics...</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-[10px] uppercase tracking-[6px] text-slate-600">Metric Calibration (Safe-Centric)</h3>
                        <span className="text-[10px] font-black text-primary px-4 py-1 bg-primary/10 rounded-full border border-primary/20">LIVE UNIT: {modelStats?.total_samples || 0}</span>
                    </div>
                    <div className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" tick={{fill:'#475569', fontSize:12, fontWeight:900}} stroke="transparent" />
                                <YAxis domain={[0, 100]} tick={{fill:'#475569', fontSize:10}} stroke="transparent" />
                                <Tooltip 
                                    contentStyle={{backgroundColor:'#000', border:'1px solid #ffffff10', borderRadius:'20px', padding:'15px'}}
                                    itemStyle={{color:'#818cf8', fontWeight:'bold'}}
                                />
                                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                        {performanceData.map((d, i) => (
                            <div key={i} className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
                                <div className="text-2xl font-black text-white">{d.value}%</div>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">{d.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bias Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="glass-card p-12 space-y-12 border-white/5 bg-black/40 shadow-2xl">
                    <h3 className="font-black text-[10px] uppercase tracking-[6px] text-slate-600">Bias Breakdown</h3>
                    <div className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <XAxis dataKey="name" tick={{fill:'#475569', fontSize:10, fontWeight:900}} stroke="transparent" />
                                <Tooltip contentStyle={{backgroundColor:'#000', border:'none', borderRadius:'20px'}} />
                                <Bar dataKey="value" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="glass-card p-12 space-y-12 border-white/5 bg-black/40 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-[10px] uppercase tracking-[6px] text-slate-600">Question Integrity</h3>
                        <div className="flex gap-4">
                            <span className="text-[10px] font-black text-emerald-500">SAFE: {stats?.total_questions - stats?.bias_count}</span>
                            <span className="text-[10px] font-black text-red-500">BIASED: {stats?.bias_count}</span>
                        </div>
                    </div>
                    <div className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value" cornerRadius={6}>
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor:'#000', border:'none', borderRadius:'20px'}} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{paddingTop:'20px', fontSize:'10px', textTransform:'uppercase', fontWeight:900}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResultCard({ result }) {
    const isDomainRejection = result.classification === "Non-Software Question";
    const statusColor = result.is_biased ? 'from-red-600 to-red-400' : isDomainRejection ? 'from-orange-500 to-amber-400' : 'from-emerald-500 to-green-400';
    
    return (
        <div className="space-y-6">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="p-[2px] rounded-[32px] bg-white/5 overflow-hidden">
                <div className={`glass-card bg-black/90 p-10 flex items-center justify-between border-white/5 relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${statusColor} opacity-[0.05] blur-3xl`} />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className={`w-22 h-22 rounded-3xl flex items-center justify-center bg-gradient-to-br ${statusColor} text-white shadow-2xl animate-neon-pulse`}>
                            {result.is_biased ? <AlertCircle size={44} /> : isDomainRejection ? <ShieldAlert size={44} /> : <CheckCircle2 size={44} />}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] bg-gradient-to-r ${statusColor} text-white`}>
                                    {result.is_biased ? 'BIASED DETECTED' : isDomainRejection ? 'DOMAIN REJECTION' : 'SAFETY VERIFIED'}
                                </span>
                            </div>
                            <h3 className="text-4xl font-black tracking-tighter text-white uppercase">{result.classification}</h3>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="space-y-4">
                <motion.div initial={{x:20, opacity:0}} animate={{x:0, opacity:1}} className="glass-card bg-black/40 border-l-4 border-l-primary p-10 shadow-xl space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[5px] text-slate-600">Input Question</label>
                        <p className="text-xl font-bold text-white italic">"{result.original_question}"</p>
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[5px] text-primary">Suggested Question</label>
                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                            <p className="text-2xl font-black text-primary leading-tight">{result.suggested_question}</p>
                        </div>
                    </div>

                    {result.insights?.length > 0 && (
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[5px] text-red-500">Bias Breakdown</label>
                            {result.insights.map((insight, idx) => (
                                <div key={idx} className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    {insight.explanation}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

function MockSessionSection() {
    const [step, setStep] = useState(0); 
    const [score, setScore] = useState(0);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Manual training state
    const [trainQ, setTrainQ] = useState('');
    const [trainType, setTrainType] = useState('B');
    const [trainCat, setTrainCat] = useState('Gender & Family');
    const [isTraining, setIsTraining] = useState(false);
    const [trainStatus, setTrainStatus] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('copilot_token');
        axios.get(`${API_BASE}/mock_data`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if (Array.isArray(res.data) && res.data.length > 0) {
                // Shuffle and pick 10 diverse questions
                const shuffled = [...res.data].sort(() => Math.random() - 0.5);
                setChallenges(shuffled.slice(0, 10));
            } else {
                console.warn("Mock data is not an array or empty:", res.data);
                setChallenges([]);
            }
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const handleAnswer = (isBias) => {
        const correct = (isBias && challenges[step].type === 'B') || (!isBias && challenges[step].type === 'S');
        if (correct) setScore(score + 1);
        setStep(step + 1);
    };

    const handleTrainModel = async () => {
        if (!trainQ.trim()) return;
        setIsTraining(true);
        setTrainStatus('');
        try {
            const token = localStorage.getItem('copilot_token');
            await axios.post(`${API_BASE}/train`, {
                question: trainQ,
                type: trainType,
                category: trainType === 'B' ? trainCat : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrainStatus('Intelligence calibrated successfully!');
            setTrainQ('');
            // Refresh mock data with auth token
            const token2 = localStorage.getItem('copilot_token');
            const res = await axios.get(`${API_BASE}/mock_data`, { headers: { Authorization: `Bearer ${token2}` } });
            const shuffled2 = [...res.data].sort(() => Math.random() - 0.5);
            setChallenges(shuffled2.slice(0, 10));
            setStep(0);
            setScore(0);
        } catch (err) {
            setTrainStatus('Calibration failed. Check neural link.');
        } finally {
            setIsTraining(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-black tracking-[6px] text-slate-500 uppercase">Syncing Dataset...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-12 space-y-20 text-center text-white">
            <div className="space-y-12">
                <h2 className="text-6xl font-black tracking-tighter uppercase mb-4">Elite Trainer</h2>
                {challenges.length === 0 ? (
                    <div className="glass-card py-24 border-white/5 bg-black/40">
                        <ShieldAlert size={80} className="mx-auto text-slate-800 mb-8" />
                        <h3 className="text-2xl font-black text-slate-600 uppercase tracking-tighter">No Challenges Loaded</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-4 font-bold text-xs leading-loose">The neural training database is currently offline or empty. Update dat.json to begin.</p>
                    </div>
                ) : step < challenges.length ? (
                    <div className="glass-card py-28 px-16 space-y-20 animate-neon bg-black/60 shadow-2xl relative">
                        <div className="absolute top-8 left-8 text-[10px] font-black text-slate-700 uppercase tracking-widest">Challenge {step+1}/10</div>
                        <p className="text-4xl font-black leading-snug">"{challenges[step]?.q}"</p>
                        <div className="flex gap-10 justify-center">
                            <button onClick={() => handleAnswer(true)} className="px-16 py-7 bg-red-600 hover:bg-red-700 rounded-3xl font-black text-xs tracking-[4px] uppercase transition-all shadow-2xl shadow-red-500/20 active:scale-95">FLAG RISK</button>
                            <button onClick={() => handleAnswer(false)} className="px-16 py-7 bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-black text-xs tracking-[4px] uppercase transition-all shadow-2xl shadow-emerald-500/20 active:scale-95">MARK SECURE</button>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card py-24 border-green-500/20 bg-black/80">
                        <Trophy size={110} className="mx-auto text-yellow-500 animate-bounce mb-10 shadow-2xl shadow-yellow-500/20" />
                        <h3 className="text-6xl font-black tracking-tighter mb-6 uppercase">Level: {((score/10)*100).toFixed(0)}%</h3>
                        <p className="text-slate-500 font-bold mb-10 uppercase tracking-[5px] text-xs">Skill Certified for Enterprise Hiring</p>
                        <button onClick={() => {setStep(0); setScore(0);}} className="btn-primary py-5 px-16 uppercase text-xs tracking-widest">Restart Training Session</button>
                    </div>
                )}
            </div>

            <div className="space-y-12 border-t border-white/5 pt-20">
                <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black tracking-tighter uppercase">Calibrate <span className="text-primary">Intelligence</span></h3>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[5px]">Manually train the core model with custom patterns</p>
                </div>

                <div className="glass-card p-12 bg-black/40 text-left space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signal Type</label>
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                <button onClick={() => setTrainType('B')} className={`flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${trainType === 'B' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 opacity-50'}`}>BIASED</button>
                                <button onClick={() => setTrainType('S')} className={`flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${trainType === 'S' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 opacity-50'}`}>SECURE</button>
                            </div>
                        </div>
                        {trainType === 'B' && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bias Category</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-xs font-black uppercase tracking-widest outline-none focus:border-primary"
                                    value={trainCat}
                                    onChange={(e) => setTrainCat(e.target.value)}
                                >
                                    <option className="bg-slate-900">Gender & Family</option>
                                    <option className="bg-slate-900">Age</option>
                                    <option className="bg-slate-900">Cultural & Origin</option>
                                    <option className="bg-slate-900">Religion & Belief</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question Pattern</label>
                        <input 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-xl font-bold text-white placeholder:text-slate-800 outline-none focus:border-primary transition-all shadow-inner"
                            placeholder="Enter the phrase to train the model..."
                            value={trainQ}
                            onChange={(e) => setTrainQ(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${trainStatus.includes('failed') ? 'text-red-500' : 'text-primary animate-pulse'}`}>{trainStatus}</p>
                        <button 
                            onClick={handleTrainModel} 
                            disabled={isTraining || !trainQ.trim()}
                            className="btn-primary py-5 px-12 uppercase text-[10px] tracking-[3px] font-black flex items-center gap-3 disabled:opacity-30"
                        >
                            {isTraining ? 'UPLOADING NEURAL WEIGHTS...' : 'COMMIT TO CORE'}
                            {!isTraining && <Cpu size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsSection({ threshold, setThreshold }) {
    return (
        <div className="space-y-12 py-10 max-w-2xl text-white">
            <h2 className="text-6xl font-black tracking-tighter uppercase">Engine Core</h2>
            <div className="glass-card p-12 space-y-14 bg-black/40 shadow-2xl">
                <div className="space-y-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[6px] text-slate-600 mb-4 block">Bias Sensitivity Limit</label>
                            <h4 className="text-5xl font-black tracking-tight">AI Resolution.</h4>
                        </div>
                        <span className="text-7xl font-black text-primary font-mono">{threshold}%</span>
                    </div>
                    <input type="range" className="w-full h-4 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" min="50" max="95" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
                    <div className="flex justify-between text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        <span>High Tolerance</span>
                        <span>Hyper-Sensitive</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
