import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { ResumeDropzone } from './components/ResumeDropzone';
import { apiService, type ApplicationHistory } from './services/api';
import { Sparkles, Loader2, Copy, CheckCircle2, Target, AlertCircle, Download, Lightbulb, MessageCircleQuestion, ChevronDown, Clock, X, Eye } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";

const SUGGESTED_ROLES = [
  { title: "Backend Engineer", jd: "We are looking for a Backend Engineer to build scalable APIs and microservices handling millions of requests. Required: Python (FastAPI/Flask), PostgreSQL, Docker, AWS. Experience with RESTful architecture, system design, and optimizing database queries is essential." },
  { title: "Frontend Developer", jd: "Seeking a Frontend Engineer to architect responsive, high-performance web applications. Required: React, TypeScript, Tailwind CSS, and modern State Management. Strong understanding of web performance, browser rendering, and accessibility standards." },
  { title: "Full-Stack Developer", jd: "We need a Full-Stack Developer to own features end-to-end. Required: React on the frontend and Python/Node.js on the backend. Experience with CI/CD pipelines, cloud deployment, and building user-centric interfaces." },
  { title: "Mobile Developer", jd: "Looking for a Mobile Engineer to build cross-platform applications. Required: Flutter and Dart. Experience with mobile state management, REST API integration, offline storage, and publishing to the App Store and Google Play." },
  { title: "Machine Learning Engineer", jd: "Join our AI team to deploy scalable machine learning models. Required: Python, PyTorch/TensorFlow, and Scikit-learn. Experience with NLP, prompt engineering, LLM integration, and model deployment in production environments." },
  { title: "Data Engineer", jd: "Seeking a Data Engineer to build robust data pipelines. Required: SQL, Python, Apache Spark, and Snowflake/Redshift. Experience with ETL processes, data warehousing, and handling large-scale unstructured data." },
  { title: "DevOps Engineer", jd: "Looking for a DevOps/SRE to automate and scale our infrastructure. Required: Kubernetes, Docker, Terraform, and GitHub Actions. Strong background in Linux administration, monitoring (Prometheus/Grafana), and incident response." },
  { title: "Cloud Architect", jd: "We need a Cloud Architect to design secure, scalable cloud solutions. Required: Deep expertise in AWS or Azure, serverless architecture, IAM security, and cost optimization. Strong scripting skills required." },
  { title: "Security Engineer", jd: "Seeking a Security Engineer to protect our infrastructure and applications. Required: Experience with penetration testing, OWASP Top 10, cryptography, and secure code review in Python and JavaScript." },
  { title: "QA Automation Engineer", jd: "Looking for an SDET to ensure software quality through automated testing. Required: Selenium, Cypress, or Playwright. Strong programming skills in Python or Java, and experience integrating tests into CI/CD pipelines." }
];

interface AnalysisResult {
  match_score: number;
  analysis_summary: string;
  missing_keywords: string[];
  matched_skills: string[];
  suggested_rewrites: {
    original_bullet: string;
    upgraded_bullet: string;
    keyword_added: string;
  }[];
  interview_prep: {
    question: string;
    why_its_asked: string;
    how_to_answer: string;
  }[];
  cover_letter: string;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  
  const { getToken } = useAuth();

  // Phase 4 States
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [historyData, setHistoryData] = useState<ApplicationHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApplicationHistory | null>(null);

  const [isEnhancing, setIsEnhancing] = useState(false);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
       const token = await getToken();
       if (!token) return;
       const data = await apiService.fetchHistory(token);
       setHistoryData(data);
    } catch(err) {
       console.error("Failed to fetch history");
    } finally {
       setIsHistoryLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload a resume first.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication required to generate application.');
        return;
      }
      const data = await apiService.generateApplication(file, jobDescription, token);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during generation. Please check the backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!jobDescription.trim()) return;
    setIsEnhancing(true);
    try {
      const data = await apiService.enhanceJD(jobDescription);
      setJobDescription(data.enhanced_text);
    } catch(err: any) {
      setError(err.message || 'Failed to enhance job description.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.cover_letter) {
      navigator.clipboard.writeText(result.cover_letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    if (!result?.cover_letter) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    const margin = 1;
    const pdfWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pdfWidth - margin * 2;

    // Use standard serif font for professional business cover letters
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    // splitTextToSize automatically wraps based on inches (since unit is 'in')
    const textLines = doc.splitTextToSize(result.cover_letter, maxLineWidth);
    
    doc.text(textLines, margin, margin);
    doc.save('Tailored_Cover_Letter.pdf');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const circumference = 2 * Math.PI * 56; // svg circle radius 56

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-fuchsia-200 selection:text-fuchsia-900">
      {/* Premium Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-row cursor-pointer" onClick={() => { setActiveTab('NEW'); setResult(null); }}>
            <div className="bg-gradient-to-tr from-fuchsia-600 to-indigo-600 p-2 rounded-xl text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 hidden sm:block">
              ResumeToJob<span className="font-light">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Tabs are part of the logged-in workspace, so only show them once signed in */}
            <SignedIn>
              <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/60 shadow-inner">
                 <button 
                   onClick={() => { setActiveTab('NEW'); setSelectedRecord(null); }} 
                   className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'NEW' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}
                 >
                   New Analysis
                 </button>
                 <button 
                   onClick={() => { setActiveTab('HISTORY'); loadHistory(); setSelectedRecord(null); }} 
                   className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'HISTORY' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}
                 >
                   My Applications
                 </button>
              </div>
            </SignedIn>
          
            {/* If the user is NOT logged in, show a Sign In button */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            {/* If the user IS logged in, show their Profile Picture */}
            <SignedIn>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border border-gray-200" } }} />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SignedOut>
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center max-w-4xl mx-auto mt-10">
            <div className="bg-fuchsia-50 p-4 rounded-2xl mb-6">
              <Sparkles className="w-12 h-12 text-fuchsia-600" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-gray-900">Welcome to ResumeToJob AI</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed mb-8">Please sign in to securely upload your base resume, perform deep ATS analysis against roles, and automatically generate hyper-targeted cover letters.</p>
            <SignInButton mode="modal">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-xl text-md font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
        {activeTab === 'NEW' ? (
        
          !result ? (
          /* ----- INPUT MODE ----- */
          <div className="max-w-3xl mx-auto flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center">
              <h2 className="text-4xl font-bold tracking-tight mb-4 text-gray-900">Land your dream role.</h2>
              <p className="text-gray-500 text-lg">Upload your base resume and paste the job description. Our AI will extract context, score your fit, and write a targeted cover letter.</p>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">1. Upload Base Resume</label>
                <ResumeDropzone selectedFile={file} onFileSelect={setFile} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">2. Paste Job Description</label>
                </div>
                
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Or test with a sample role:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_ROLES.map((role, idx) => (
                      <button
                        key={idx}
                        onClick={() => setJobDescription(role.jd)}
                        className="px-4 py-2 bg-white hover:bg-fuchsia-50 hover:text-fuchsia-700 border border-gray-200 hover:border-fuchsia-200 text-xs font-medium text-gray-700 rounded-full shadow-sm transition-all whitespace-nowrap active:scale-95"
                      >
                        {role.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full h-56 rounded-2xl border border-gray-200 p-5 pb-16 text-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-shadow resize-none bg-white hover:bg-gray-50/50"
                    placeholder="Paste the requirements, responsibilities, and target skills here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  {jobDescription.trim() && (
                    <button
                      onClick={handleEnhance}
                      disabled={isEnhancing}
                      className="absolute bottom-4 right-4 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-indigo-200"
                    >
                      {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !file || !jobDescription.trim()}
                className="w-full relative group overflow-hidden rounded-2xl bg-gray-900 text-white font-medium h-14 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-white/70" />
                    <span>Running Deep ATS Analysis...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors" />
                    <span>Run Full ATS Analysis</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ----- RESULTS MODE ----- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* AREA A: The ATS Report */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              
              {/* Score Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
                <h3 className="text-gray-500 font-semibold uppercase tracking-wider text-xs mb-6">ATS Match Score</h3>
                <div className="relative flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90 drop-shadow-sm">
                    <circle cx="80" cy="80" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                    <circle 
                      cx="80" cy="80" r="56" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={circumference - (circumference * result.match_score) / 100} 
                      className={`${getScoreColor(result.match_score)} transition-all duration-1000 ease-out`} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-4xl font-extrabold tracking-tighter ${getScoreColor(result.match_score)}`}>
                      {result.match_score}
                    </span>
                    <span className="text-gray-400 text-sm font-medium">/ 100</span>
                  </div>
                </div>
                
                <div className="mt-8 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-left w-full">
                  <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-sm">
                    <Target className="w-4 h-4 text-indigo-500" /> Executive Summary
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed text-pretty">
                    {result.analysis_summary}
                  </p>
                </div>
              </div>

              {/* Skills Analysis */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                
                {/* Matched Skills */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                    <span>Verified Skills</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">{result.matched_skills.length} Found</span>
                  </h4>
                  {result.matched_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {result.matched_skills.map((skill, i) => (
                        <span key={`matched-${i}`} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 shadow-sm border-b-2">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No direct keyword overlaps detected.</p>
                  )}
                </div>

                <div className="h-px bg-gray-100 w-full" />

                {/* Missing Skills */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                    <span>Missing Keywords</span>
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-xs">{result.missing_keywords.length} Gaps</span>
                  </h4>
                  {result.missing_keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {result.missing_keywords.map((skill, i) => (
                        <span key={`missing-${i}`} className="px-3 py-1.5 bg-white text-rose-700 text-xs font-semibold rounded-full border border-rose-200 shadow-sm border-b-2">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Perfect match! No missing keywords detected.</p>
                  )}
                </div>

                {result.suggested_rewrites && result.suggested_rewrites.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100 w-full" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                        <span>Resume Upgrade Suggestions</span>
                        <span className="text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-md text-xs">{result.suggested_rewrites.length} Ideas</span>
                      </h4>
                      <div className="space-y-5 mt-4">
                        {result.suggested_rewrites.map((rewrite, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group hover:border-fuchsia-200 transition-colors">
                            <div className="absolute top-0 right-0 bg-fuchsia-50 text-fuchsia-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-fuchsia-100 uppercase tracking-wider">
                              + {rewrite.keyword_added}
                            </div>
                            
                            <div className="space-y-4 pt-4">
                              <div className="relative">
                                <span className="absolute -left-3 top-1.5 w-1.5 h-1.5 bg-gray-300 rounded-full ring-4 ring-white"></span>
                                <p className="text-sm text-gray-400 line-through decoration-gray-300 pl-3">
                                  {rewrite.original_bullet}
                                </p>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-3 top-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-4 ring-white shadow-sm"></span>
                                <p className="text-sm text-gray-800 font-medium pl-3 leading-relaxed">
                                  {rewrite.upgraded_bullet}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Predicted Interview Questions */}
                {result.interview_prep && result.interview_prep.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100 w-full" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                        <span>Predicted Interview Questions</span>
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs">{result.interview_prep.length} Topics</span>
                      </h4>
                      <div className="space-y-3 mt-4">
                        {result.interview_prep.map((prep, idx) => (
                          <div key={`prep-${idx}`} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
                            <button
                              onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                              className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors focus:outline-none"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-amber-100 text-amber-600 rounded-lg p-1.5 shrink-0">
                                  <MessageCircleQuestion className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-800 text-sm leading-snug">{prep.question}</span>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${expandedQ === idx ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {expandedQ === idx && (
                              <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300 text-sm space-y-4">
                                <div className="flex items-start gap-3 mt-4">
                                  <Lightbulb className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
                                  <div>
                                    <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1">Why It's Asked</h5>
                                    <p className="text-gray-600 leading-relaxed">{prep.why_its_asked}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Target className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <div>
                                    <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1">How To Answer</h5>
                                    <p className="text-gray-600 leading-relaxed">{prep.how_to_answer}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* AREA B: The Deliverable */}
            <div className="lg:col-span-7 flex flex-col sticky top-24 h-fit">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Tailored Cover Letter</h3>
                    <p className="text-sm text-gray-500 mt-1">Ready for submission.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold border border-gray-200 hover:border-indigo-200 shadow-sm"
                    >
                      <Download className="w-4 h-4" /> <span>Download PDF</span>
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className="px-4 py-2 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold border border-gray-200 hover:border-gray-300 shadow-sm"
                    >
                      {copied ? (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-600">Copied</span></>
                      ) : (
                        <><Copy className="w-4 h-4" /> <span>Copy Letter</span></>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 bg-gray-50 p-6 sm:p-8 rounded-2xl border border-gray-200 font-serif text-gray-800 leading-loose text-[15px] whitespace-pre-wrap selection:bg-indigo-100 overflow-y-auto">
                  {result.cover_letter}
                </div>
              </div>
            </div>

          </div>
        )
        ) : (
          /* ----- HISTORY MODE ----- */
          <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Application History</h2>
              <p className="text-gray-500 mt-2">Track the roles you've parsed and revisit your saved cover letters.</p>
            </div>
            
            {isHistoryLoading ? (
              <div className="flex justify-center items-center py-20">
                 <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
              </div>
            ) : historyData.length === 0 ? (
               <div className="text-center py-24 bg-white border border-gray-200 border-dashed rounded-3xl">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Applications Yet</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">Run a Deep ATS Analysis to start saving your tailored job applications here natively.</p>
                  <button onClick={() => setActiveTab('NEW')} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">Test First Role</button>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyData.map(record => (
                  <div key={record.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col h-full cursor-pointer" onClick={() => setSelectedRecord(record)}>
                    <div className="p-6 flex-1">
                       <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-full border-[4px] flex items-center justify-center text-sm font-bold bg-gray-50 ${record.match_score >= 80 ? 'border-emerald-500 text-emerald-600' : record.match_score >= 50 ? 'border-amber-500 text-amber-600' : 'border-rose-500 text-rose-600'}`}>
                             {record.match_score}
                          </div>
                          <div className="flex items-center text-xs font-semibold text-gray-400">
                             <Clock className="w-3 h-3 mr-1" />
                             {new Date(record.created_at).toLocaleDateString()}
                          </div>
                       </div>
                       <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2">{record.job_title}</h3>
                       <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed font-serif">
                          {record.cover_letter}
                       </p>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-100 p-4 px-6">
                       <span className="text-fuchsia-600 text-sm font-semibold group-hover:text-fuchsia-700 flex items-center gap-2">
                         <Eye className="w-4 h-4" /> View full letter
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </SignedIn>
      </main>

      {/* History Detail Modal */}
      {selectedRecord && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200 shadow-2xl">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-300">
               <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{selectedRecord.job_title}</h3>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedRecord.match_score >= 80 ? 'bg-emerald-100 text-emerald-700' : selectedRecord.match_score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {selectedRecord.match_score} Match Score
                      </span>
                      • Generated {new Date(selectedRecord.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-8 overflow-y-auto font-serif leading-loose text-[15px] text-gray-800 bg-white">
                  {selectedRecord.cover_letter}
               </div>
               <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <button 
                     onClick={() => {
                        navigator.clipboard.writeText(selectedRecord.cover_letter);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                     }}
                     className="px-5 py-2 hover:bg-white bg-gray-100 text-gray-700 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  >
                     {copied ? (
                       <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-600">Copied</span></>
                     ) : (
                       <><Copy className="w-4 h-4" /> <span>Copy</span></>
                     )}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
