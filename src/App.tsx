/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  BarChart3, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Target, 
  Globe,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Zap,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileUp,
  FileText,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Clock,
  History,
  Trash2,
  X,
  PieChart,
  Activity,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as XLSX from "xlsx";
import * as pdfjs from "pdfjs-dist";
import { analyzeListing, generateOptimizedListing, generateCompetitorResearch, generateVisualAudit, chatWithAnalysis, type ListingData, type OptimizedListing, type CompetitorResearch, type VisualAudit } from "./services/aiService";
import { cn } from "./lib/utils";
import HomePage from "./components/HomePage";
import AuthPage from "./components/AuthPage";
import { auth, db } from "./services/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, getDocFromServer } from "firebase/firestore";
import { useEffect, useRef, useMemo } from "react";
import { 
  saveAnalysis, 
  getAnalyses, 
  deleteAnalysis, 
  updateAnalysis, 
  type AnalysisRecord 
} from "./services/analysisService";


// Market Intelligence Component
const MarketPulse = () => {
  const trends = useMemo(() => [
    { label: "Category CPC Shift", value: "+12.4%", status: "up", desc: "Average CPC in Home & Kitchen seeing high volatility due to seasonal transitions." },
    { label: "Review Sentiment Avg", value: "4.2", status: "neutral", desc: "Customer expectations for 'Sustainability' mentions in listings up by 34% since Q1." },
    { label: "BSR Velocity Threshold", value: "Low", status: "down", desc: "Top 100 ranking in Bedding now requires 22% fewer daily sales compared to last month." },
    { label: "Visual Asset Impact", value: "Extreme", status: "up", desc: "Listings with lifestyle-first hero images showing 18% higher CTR in mobile search." }
  ], []);

  const insights = [
    "Amazon's A10 algorithm is increasingly prioritizing 'External Traffic' signals for keyword ranking.",
    "Brand Story (A+ Content) adoption has hit 82% among top-tier sellers in your niche.",
    "Video Infographics are outperforming static comparison charts in conversion tests for mid-range electronics.",
    "Prime Day early-bird strategy should focus on 'Defensive Targeting' of your own brand terms."
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Global Market Pulse</h3>
        </div>
        <span className="text-[8px] font-bold text-blue-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Live Indices
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {trends.map((trend, i) => (
          <div key={`market-trend-${trend.label}-${i}`} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 group hover:bg-white hover:border-blue-300 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500">{trend.label}</span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                trend.status === "up" ? "bg-green-100 text-green-700" : trend.status === "down" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
              )}>
                {trend.value}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">{trend.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-5 bg-blue-900 text-white rounded-3xl space-y-4 shadow-xl shadow-blue-900/20">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-400" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Strategic Intel</h4>
        </div>
        <div className="space-y-3">
          {insights.map((text, i) => (
            <div key={`market-intel-${text.substring(0, 15).replace(/\s+/g, '-')}-${i}`} className="flex gap-3 items-start group">
              <div className="mt-1 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0 group-hover:scale-150 transition-transform" />
              <p className="text-[10px] font-medium leading-relaxed text-blue-100">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// Set worker for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export type ToolType = 
  | "listing_optimization" 
  | "new_listing" 
  | "comp_analysis" 
  | "industry_analysis" 
  | "brand_story" 
  | "keyword_research"
  | "visual_brief";

export default function App() {
  // Hooks must be defined before any conditional returns
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const [view, setView] = useState<"home" | "tool">("home");
  const [showSelection, setShowSelection] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType>("listing_optimization");
  
  // My Listing State
  const [myUrl, setMyUrl] = useState("");
  const [myTitle, setMyTitle] = useState("");
  const [myCopy, setMyCopy] = useState("");
  const [myPrice, setMyPrice] = useState("");
  const [myDiscount, setMyDiscount] = useState("");
  const [myReviews, setMyReviews] = useState("");
  const [myFocusedFeatures, setMyFocusedFeatures] = useState("");

  // Competitor Listing State
  const [competitors, setCompetitors] = useState<ListingData[]>([
    { url: "", title: "", copy: "", price: "", discountedPrice: "", reviews: "" }
  ]);

  const addCompetitor = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, { url: "", title: "", copy: "", price: "", discountedPrice: "", reviews: "" }]);
    }
  };

  const removeCompetitor = (index: number) => {
    const newComps = competitors.filter((_, i) => i !== index);
    setCompetitors(newComps.length > 0 ? newComps : [{ url: "", title: "", copy: "", price: "", discountedPrice: "", reviews: "" }]);
  };

  const updateCompetitor = (index: number, field: keyof ListingData, value: string) => {
    const newComps = [...competitors];
    newComps[index] = { ...newComps[index], [field]: value };
    setCompetitors(newComps);
  };

  const [currentKeywords, setCurrentKeywords] = useState("");
  const [context, setContext] = useState("");
  const [brandAesthetic, setBrandAesthetic] = useState("");
  const [emotionalHook, setEmotionalHook] = useState("");
  const [visualBriefDirectPrompt, setVisualBriefDirectPrompt] = useState("");
  const [isVisualBriefDirect, setIsVisualBriefDirect] = useState(false);
  const [uploadedKeywords, setUploadedKeywords] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [optimizedListing, setOptimizedListing] = useState<OptimizedListing | null>(null);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);
  const [competitorResearch, setCompetitorResearch] = useState<CompetitorResearch | null>(null);
  const [visualAudit, setVisualAudit] = useState<VisualAudit | null>(null);
  const [myImages, setMyImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [compImages, setCompImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [isGeneratingListing, setIsGeneratingListing] = useState(false);
  const [isGeneratingResearch, setIsGeneratingResearch] = useState(false);
  const [isGeneratingVisualAudit, setIsGeneratingVisualAudit] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "comp">("my");

  const [copied, setCopied] = useState(false);

  // History State
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
      // Also update/create user profile in Firestore
      const userRef = doc(db, "users", user.uid);
      const syncProfile = async () => {
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            await updateDoc(userRef, {
              displayName: user.displayName,
              photoURL: user.photoURL,
              updatedAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Profile sync failed", err);
        }
      };
      syncProfile();
    }
  }, [user]);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await getAnalyses();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSelectHistory = (record: AnalysisRecord) => {
    setSelectedAnalysisId(record.id);
    setSelectedTool(record.toolType as ToolType);
    setMyUrl(record.inputData.myListing.url || "");
    setMyTitle(record.inputData.myListing.title || "");
    setMyCopy(record.inputData.myListing.copy || "");
    setMyPrice(record.inputData.myListing.price || "");
    setMyDiscount(record.inputData.myListing.discountedPrice || "");
    setMyReviews(record.inputData.myListing.reviews || "");
    setMyFocusedFeatures(record.inputData.myListing.focusedFeatures || "");
    setCompetitors(record.inputData.competitors);
    setCurrentKeywords(record.inputData.currentKeywords || "");
    setContext(record.inputData.additionalGoals || "");
    setUploadedKeywords(record.inputData.uploadedKeywords || "");
    setResult(record.resultMarkdown);
    setOptimizedListing(record.optimizedListing || null);
    setCompetitorResearch(record.competitorResearch || null);
    setVisualAudit(record.visualAudit || null);
    setChatMessages(record.chatHistory || []);
    setView("tool");
    setIsHistoryOpen(false);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;
    try {
      await deleteAnalysis(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (selectedAnalysisId === id) {
        setResult(null);
        setSelectedAnalysisId(null);
      }
    } catch (err) {
      console.error("Failed to delete analysis", err);
    }
  };

  // Conditional returns MUST come after ALL hook declarations
  if (loading) return null;
  if (!user) return <AuthPage />;

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting || !result) return;

    const userMessage = chatInput.trim();
    const prevHistory = chatMessages.length === 0 
      ? [{ role: "model" as const, text: result }]
      : chatMessages;

    setChatMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setChatInput("");
    setIsChatting(true);

    try {
      const response = await chatWithAnalysis(prevHistory, userMessage);
      setChatMessages(prev => [...prev, { role: "model" as const, text: response }]);
      
      // Update in Firestore if analysis exists
      if (selectedAnalysisId) {
        updateAnalysis(selectedAnalysisId, { 
          chatHistory: [...chatMessages, { role: "user" as const, text: userMessage }, { role: "model" as const, text: response }] 
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to get chat response.");
    } finally {
      setIsChatting(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSampleData = () => {
    setMyUrl("https://www.amazon.com/dp/B08N5KWB9H");
    setMyTitle("Organic Bamboo Bed Sheets - 100% Pure Cooling Bamboo Viscose, 4-Piece Sheet Set, Deep Pocket up to 16\", Breathable & Silky Soft, Hypoallergenic (Queen, Cloud Grey)");
    setMyCopy("🌿 100% PURE BAMBOO VISCOSE: Crafted from sustainably sourced bamboo, our sheets offer a luxury feel that is significantly softer and more breathable than even the highest thread count Egyptian cotton.\n❄️ NATURAL COOLING TECHNOLOGY: Bamboo's moisture-wicking properties keep you cool in the summer and warm in the winter. Perfect for hot sleepers who struggle with night sweats.\n☁️ BUTTERY SOFT & SILKY: Experience the 'cloud-like' comfort. Our sateen weave provides a silky smooth finish that gets softer with every wash while remaining durable and pilling-resistant.\n✅ PERFECT FIT: Queen set includes 1 flat sheet (90\"x102\"), 1 fitted sheet (60\"x80\"), and 2 pillowcases (20\"x30\"). The fitted sheet features deep pockets and a strong elastic fit for mattresses up to 16 inches.");
    setMyPrice("$89.99");
    setMyDiscount("$67.50");
    setMyReviews("Customers love the softness and cooling effect, but some mention they wrinkle easily if not taken out of the dryer immediately. Rating: 4.6/5 stars with 12,450 reviews.");
    setMyFocusedFeatures("Eco-friendly material, OEKO-TEX certified, deep-pocket design, thermal regulation for hot sleepers.");
    
    setCompetitors([
      {
        url: "https://www.amazon.com/dp/B07N8Z7X5W",
        title: "Bedsure 100% Bamboo Sheets Set - Queen Size Grey Bamboo Viscose Sheets, Cooling Bed Sheets for Hot Sleepers, 16 Inch Deep Pocket 4 Piece Sheet Sets",
        copy: "Bedsure bamboo sheets queen size are made of 100% bamboo viscose, providing a cooling and breathable sleeping experience. The fabric is smooth and skin-friendly. Includes deep pocket fitted sheet with 360-degree elastic.",
        price: "$59.99",
        discountedPrice: "$45.99",
        reviews: "High volume seller. Reviews note it's thin compared to premium brands but good for the price. 4.4/5 stars."
      },
      {
        url: "https://www.amazon.com/dp/B0C7S7Y8C9",
        title: "Luxome Luxury Sheet Set - 100% Organic Bamboo Viscose, 400 Thread Count, Cooling & Moisture Wicking, Deep Pockets (Queen, Charcoal)",
        copy: "The highest rated bamboo sheets on the market. Precision crafted for ultimate luxury. 400 thread count ensures weight and durability without sacrificing the cooling benefits of bamboo viscose.",
        price: "$150.00",
        discountedPrice: "$135.00",
        reviews: "Premium positioning. Customers rave about the weight and 'expensive feel'. Very few complaints except for price. 4.8/5 stars."
      }
    ]);

    setCurrentKeywords("bamboo sheets, cooling bed sheets, organic bedding, viscose from bamboo, queen sheet set");
    setContext("I want to position our brand as 'Quiet Luxury'—better than Bedsure but more accessible than Luxome. Our main USP is the OEKO-TEX certification and the specific Cloud Grey aesthetic.");
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset chat when running new analysis
    setChatMessages([]);
    
    // Relaxed validation for new_listing, industry_analysis, keyword_research, and visual_brief
    if (selectedTool !== "new_listing" && selectedTool !== "industry_analysis" && selectedTool !== "keyword_research" && selectedTool !== "visual_brief") {
      if (!myTitle || !myCopy || !myPrice) {
        setError("Please fill in all required fields for your listing.");
        return;
      }
    } else if (selectedTool === "new_listing" || selectedTool === "visual_brief") {
      if (selectedTool === "visual_brief") {
        if (isVisualBriefDirect && !visualBriefDirectPrompt) {
          setError("Please provide a direct creative prompt.");
          return;
        }
        if (!isVisualBriefDirect && !myTitle) {
          setError("Please provide a 'Product Name' for your analysis.");
          return;
        }
      } else {
        if (!myFocusedFeatures && !context && !myTitle) {
          setError("Please provide at least some 'Focused Features', 'Context', or 'Product Name' for your analysis.");
          return;
        }
      }
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setVisualAudit(null);
    setOptimizedListing(null);
    setCompetitorResearch(null);

    const myListing: ListingData = {
      url: myUrl,
      title: myTitle,
      copy: myCopy,
      price: myPrice,
      discountedPrice: myDiscount,
      reviews: myReviews,
      focusedFeatures: myFocusedFeatures
    };

    const competitorListings = selectedTool === "visual_brief" 
      ? competitors.filter(c => c.url || c.title)
      : competitors.filter(c => c.url && c.title && c.copy && c.price);

    try {
      const analysis = await analyzeListing(
        myListing, 
        competitorListings, 
        currentKeywords, 
        context, 
        uploadedKeywords,
        selectedTool,
        {
          brandAesthetic,
          emotionalHook,
          directPrompt: isVisualBriefDirect ? visualBriefDirectPrompt : undefined
        }
      );
      setResult(analysis);

      // Save to History
      const id = await saveAnalysis({
        toolType: selectedTool,
        inputData: {
          myListing,
          competitors: competitorListings,
          currentKeywords,
          additionalGoals: context,
          uploadedKeywords
        },
        resultMarkdown: analysis,
        chatHistory: []
      });
      setSelectedAnalysisId(id);
      loadHistory();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed. Please check your data and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateListing = async () => {
    if (!result) return;

    setIsGeneratingListing(true);
    setError(null);

    const myListing: ListingData = {
      url: myUrl,
      title: myTitle,
      copy: myCopy,
      price: myPrice,
      discountedPrice: myDiscount,
      focusedFeatures: myFocusedFeatures
    };

    try {
      const optimized = await generateOptimizedListing(myListing, result);
      setOptimizedListing(optimized);
      setSelectedTitleIndex(0);

      // Update in Firestore
      if (selectedAnalysisId) {
        updateAnalysis(selectedAnalysisId, { optimizedListing: optimized });
      }

      // Scroll to the new section
      setTimeout(() => {
        document.getElementById('optimized-listing-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError("Failed to generate optimized listing.");
    } finally {
      setIsGeneratingListing(false);
    }
  };

  const handleGenerateResearch = async (index: number) => {
    const comp = competitors[index];
    if (!result || !comp.url || !comp.title) {
      setError("Competitor data (URL and Title) is required for detailed research.");
      return;
    }

    setIsGeneratingResearch(true);
    setError(null);

    try {
      const research = await generateCompetitorResearch(comp, result);
      setCompetitorResearch(research);

      // Update in Firestore
      if (selectedAnalysisId) {
        updateAnalysis(selectedAnalysisId, { competitorResearch: research });
      }

      setTimeout(() => {
        document.getElementById('competitor-research-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError("Failed to generate competitor research.");
    } finally {
      setIsGeneratingResearch(false);
    }
  };

  const handleGenerateVisualAudit = async () => {
    if (!result || competitors.length === 0) return;
    
    if (myImages.length === 0) {
      setError("Please upload at least one product image for visual analysis.");
      return;
    }

    setIsGeneratingVisualAudit(true);
    setError(null);

    const myListing: ListingData = {
      url: myUrl,
      title: myTitle,
      copy: myCopy,
      price: myPrice,
      discountedPrice: myDiscount,
      focusedFeatures: myFocusedFeatures
    };

    // Use the first competitor as the "best selling" for comparison
    const bestSellingComp = competitors[0];

    const myImagePayload = myImages.map(img => ({
      data: img.base64.split(',')[1],
      mimeType: img.file.type
    }));

    const compImagePayload = compImages.map(img => ({
      data: img.base64.split(',')[1],
      mimeType: img.file.type
    }));

    try {
      const audit = await generateVisualAudit(myListing, bestSellingComp, result, myImagePayload, compImagePayload);
      setVisualAudit(audit);

      // Update in Firestore
      if (selectedAnalysisId) {
        updateAnalysis(selectedAnalysisId, { visualAudit: audit });
      }

      setTimeout(() => {
        document.getElementById('visual-audit-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError("Failed to generate Visual Audit.");
    } finally {
      setIsGeneratingVisualAudit(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setError(null);

    try {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      let extractedText = "";

      if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        extractedText = json.map((row: any) => row.join(', ')).join('\n');
      } else if (fileType === 'pdf') {
        const data = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + "\n";
        }
        extractedText = fullText;
      } else if (fileType === 'txt') {
        extractedText = await file.text();
      } else {
        throw new Error("Unsupported file type. Please upload CSV, Excel, PDF, or TXT.");
      }

      setUploadedKeywords(prev => prev ? prev + "\n" + extractedText : extractedText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse file.");
    } finally {
      setIsParsingFile(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'my' | 'comp') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = await Promise.all(files.map(async (file) => {
      return new Promise<{ file: File; preview: string; base64: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            file,
            preview: URL.createObjectURL(file),
            base64: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    if (type === 'my') {
      setMyImages(prev => [...prev, ...newImages].slice(0, 10));
    } else {
      setCompImages(prev => [...prev, ...newImages].slice(0, 10));
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number, type: 'my' | 'comp') => {
    if (type === 'my') {
      setMyImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setCompImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleLaunch = () => {
    setShowSelection(true);
  };

  const selectTool = (tool: ToolType) => {
    setSelectedTool(tool);
    setShowSelection(false);
    setView("tool");
    
    // Reset states if needed or set defaults based on tool
    if (tool === "new_listing") {
      setMyUrl("");
      setMyTitle("");
      setMyCopy("");
      setMyPrice("");
      setMyDiscount("");
      setMyReviews("");
      setMyFocusedFeatures("");
    }
  };

  if (view === "home") {
    return (
      <>
        <HomePage onLaunch={handleLaunch} />
        <AnimatePresence>
          {showSelection && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSelection(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative z-10 w-full max-w-4xl bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-10 space-y-10">
                  <div className="text-center space-y-2">
                    <h2 className="text-4xl font-bold tracking-tight text-slate-900">Select Your Objective</h2>
                    <p className="text-slate-500 text-sm font-medium">Choose a specialized engine for your marketplace growth</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: "listing_optimization", name: "Listing Optimization", desc: "Audit & optimize existing listings against competitors.", icon: <Zap className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-100" },
                      { id: "new_listing", name: "New Listing Creator", desc: "Build a high-converting listing from scratch.", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-100" },
                      { id: "comp_analysis", name: "Competitor Analysis", desc: "Deep dive into competitor vulnerabilities.", icon: <Search className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-100" },
                      { id: "industry_analysis", name: "Industry Intelligence", desc: "Analyze niche trends & customer psychology.", icon: <Globe className="w-5 h-5" />, color: "text-amber-600", bg: "bg-amber-100" },
                      { id: "keyword_research", name: "Keyword Intelligence", desc: "Deep dive into high-volume & hidden gem terms.", icon: <Target className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-100" },
                      { id: "brand_story", name: "Brand Story Strategy", desc: "A+ content & brand positioning roadmap.", icon: <Users className="w-5 h-5" />, color: "text-pink-600", bg: "bg-pink-100" },
                      { id: "visual_brief", name: "Visual Asset Brief", desc: "Detailed image strategy & creative direction.", icon: <Camera className="w-5 h-5" />, color: "text-rose-600", bg: "bg-rose-100" },
                    ].map((tool) => (
                      <button 
                        key={tool.id}
                        onClick={() => selectTool(tool.id as ToolType)}
                        className="group p-6 bg-slate-50 border border-slate-200 rounded-3xl text-left hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all space-y-4"
                      >
                        <div className={cn("p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform", tool.bg, tool.color)}>
                          {tool.icon}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 tracking-tight">{tool.name}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{tool.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-600/5 blur-[120px]" />
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl border-l border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <History className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">Analysis History</h2>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isHistoryLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-xs font-bold text-slate-400">Syncing History...</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-8">
                    <div className="p-4 bg-slate-100 rounded-full">
                      <Clock className="w-12 h-12 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900">No History Yet</h3>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Your growth strategies and audits will appear here once you run them.</p>
                    </div>
                  </div>
                ) : (
                  history.map((record, idx) => (
                    <button 
                      key={`history-row-${record.id}-${idx}-${record.createdAt?.seconds}`}
                      onClick={() => handleSelectHistory(record)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all space-y-3 group/item relative",
                        selectedAnalysisId === record.id 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded uppercase tracking-widest">
                            {record.toolType.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400">
                            {new Date(record.createdAt?.seconds * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteHistory(record.id, e)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight">
                          {record.inputData.myListing.title || record.inputData.additionalGoals || "Untitled Analysis"}
                        </h4>
                        <div className="flex items-center gap-3">
                          {record.optimizedListing && (
                            <div className="flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-orange-600" />
                              <span className="text-[8px] font-bold text-orange-600">Optimized</span>
                            </div>
                          )}
                          {record.competitorResearch && (
                            <div className="flex items-center gap-1">
                              <Search className="w-2.5 h-2.5 text-purple-600" />
                              <span className="text-[8px] font-bold text-purple-600">Research</span>
                            </div>
                          )}
                          {record.visualAudit && (
                            <div className="flex items-center gap-1">
                              <Camera className="w-2.5 h-2.5 text-rose-600" />
                              <span className="text-[8px] font-bold text-rose-600">Visual</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <button 
                  onClick={() => {
                    setResult(null);
                    setOptimizedListing(null);
                    setCompetitorResearch(null);
                    setVisualAudit(null);
                    setChatMessages([]);
                    setView("home");
                    setIsHistoryOpen(false);
                    setSelectedAnalysisId(null);
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all shadow-lg"
                >
                  Start Fresh Journey
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <header className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md p-6 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView("home")}>
          <div className="relative">
            <Zap className="w-8 h-8 fill-blue-600 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">Eagle Eye</h1>
            <div className="text-[10px] font-bold text-blue-600">Marketplace Insights</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-full hover:bg-slate-200 transition-all"
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
          <button onClick={() => signOut(auth)} className="text-[10px] font-bold text-slate-500 hover:text-red-600 transition-all">Sign Out</button>
          {result && (
            <button 
              onClick={() => {
                setResult(null);
                setOptimizedListing(null);
                setCompetitorResearch(null);
                setVisualAudit(null);
                setMyImages([]);
                setCompImages([]);
                setChatMessages([]);
              }}
              className="px-4 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-full hover:bg-slate-200 hover:text-black transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Run New Analysis
            </button>
          )}
          <div className="hidden md:flex items-center gap-4 text-[10px] font-bold opacity-50">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              System Online
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <span>v4.0.2-ALPHA</span>
          </div>
          <button 
            onClick={() => setShowSelection(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-full hover:bg-blue-100 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            {selectedTool.replace('_', ' ')}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Section - Hidden when result exists */}
            {!result && (
              <section className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Tabs */}
                  <div className="flex bg-slate-100 p-1">
              <button 
                onClick={() => setActiveTab("my")}
                className={cn(
                  "flex-1 py-3 text-[10px] font-bold transition-all rounded-xl",
                  activeTab === "my" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {selectedTool === "new_listing" ? "Product Info" : "Core Listing"}
              </button>
              <button 
                onClick={() => setActiveTab("comp")}
                className={cn(
                  "flex-1 py-3 text-[10px] font-bold transition-all rounded-xl",
                  activeTab === "comp" ? "bg-slate-200 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Target Comp
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAnalyze} className="space-y-5">
                {activeTab === "my" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600">
                        {selectedTool === "new_listing" || selectedTool === "visual_brief" ? "Product Name" : "Product Title"}
                      </label>
                      <input 
                        type="text" 
                        placeholder={selectedTool === "new_listing" || selectedTool === "visual_brief" ? "What are you selling?" : "Enter your current listing title..."}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                        value={myTitle}
                        onChange={(e) => setMyTitle(e.target.value)}
                        required
                      />
                    </div>
                    {selectedTool !== "new_listing" && selectedTool !== "visual_brief" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 font-bold">Amazon Product URL</label>
                        <input 
                          type="text" 
                          placeholder="https://www.amazon.com/dp/..."
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                          value={myUrl}
                          onChange={(e) => setMyUrl(e.target.value)}
                        />
                      </div>
                    )}
                    {selectedTool !== "new_listing" && selectedTool !== "visual_brief" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-600 font-bold">Price</label>
                          <input 
                            type="text" 
                            placeholder="$29.99"
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 text-slate-900"
                            value={myPrice}
                            onChange={(e) => setMyPrice(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-600 font-bold">Discount</label>
                          <input 
                            type="text" 
                            placeholder="$24.99"
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 text-slate-900"
                            value={myDiscount}
                            onChange={(e) => setMyDiscount(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    {selectedTool === "visual_brief" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center gap-4 p-1 bg-slate-800 border border-slate-700 rounded-xl w-fit">
                          <button
                            type="button"
                            onClick={() => setIsVisualBriefDirect(false)}
                            className={cn(
                              "px-4 py-2 text-[10px] font-bold rounded-lg transition-all",
                              !isVisualBriefDirect ? "bg-slate-700 text-rose-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            Structured Input
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsVisualBriefDirect(true)}
                            className={cn(
                              "px-4 py-2 text-[10px] font-bold rounded-lg transition-all",
                              isVisualBriefDirect ? "bg-slate-700 text-rose-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            Direct Prompt
                          </button>
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">My Product Images (Max 10)</label>
                            <div className="grid grid-cols-5 gap-2">
                              {myImages.map((img, i) => (
                                    <div key={`my-upload-preview-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                                  <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                                  <button 
                                    type="button"
                                    onClick={() => removeImage(i, 'my')}
                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {myImages.length < 10 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group">
                                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'my')} />
                                  <Camera className="w-5 h-5 text-slate-600 group-hover:text-rose-400 transition-colors" />
                                  <span className="text-[8px] font-bold text-slate-600 group-hover:text-rose-400 mt-1">Upload</span>
                                </label>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Comp Images (Optional)</label>
                            <div className="grid grid-cols-5 gap-2">
                              {compImages.map((img, i) => (
                                    <div key={`comp-upload-preview-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                                  <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                                  <button 
                                    type="button"
                                    onClick={() => removeImage(i, 'comp')}
                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {compImages.length < 10 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'comp')} />
                                  <Camera className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                  <span className="text-[8px] font-bold text-slate-600 group-hover:text-purple-400 mt-1">Upload</span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isVisualBriefDirect ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-600 font-bold">Brand Aesthetic</label>
                              <select 
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none text-slate-900"
                                value={brandAesthetic}
                                onChange={(e) => setBrandAesthetic(e.target.value)}
                              >
                                <option value="" className="bg-white">Select Aesthetic...</option>
                                <option value="Quiet Luxury" className="bg-white">Quiet Luxury</option>
                                <option value="Industrial / Rugged" className="bg-white">Industrial / Rugged</option>
                                <option value="High-Tech Minimalist" className="bg-white">High-Tech Minimalist</option>
                                <option value="Vibrant / Energetic" className="bg-white">Vibrant / Energetic</option>
                                <option value="Organic / Sustainable" className="bg-white">Organic / Sustainable</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-600 font-bold">Emotional Hook</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Relief, Status, Safety..."
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 text-slate-900"
                                value={emotionalHook}
                                onChange={(e) => setEmotionalHook(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold">Direct Creative Prompt</label>
                            <textarea 
                              placeholder="Describe exactly what you want the visual brief to focus on..."
                              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 custom-scrollbar text-slate-900"
                              value={visualBriefDirectPrompt}
                              onChange={(e) => setVisualBriefDirectPrompt(e.target.value)}
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                    {selectedTool !== "visual_brief" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-900 font-bold">
                          {selectedTool === "new_listing" ? "Product Description / Features" : "Listing Copy (Bullets/Description)"}
                        </label>
                        <textarea 
                          placeholder={selectedTool === "new_listing" ? "Describe your product in detail..." : "Paste your current listing copy here..."}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 custom-scrollbar text-slate-900"
                          value={myCopy}
                          onChange={(e) => setMyCopy(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    {selectedTool !== "visual_brief" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-900 font-bold">Focused Features (USPs to emphasize)</label>
                        <textarea 
                          placeholder="e.g. Patented cooling tech, 100% organic materials..."
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 custom-scrollbar text-slate-900"
                          value={myFocusedFeatures}
                          onChange={(e) => setMyFocusedFeatures(e.target.value)}
                        />
                      </div>
                    )}
                    {selectedTool !== "visual_brief" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 font-bold">Customer Sentiment (Optional)</label>
                        <textarea 
                          placeholder="Paste common customer feedback or reviews..."
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 custom-scrollbar text-slate-900"
                          value={myReviews}
                          onChange={(e) => setMyReviews(e.target.value)}
                        />
                      </div>
                    )}

                    {selectedTool !== "visual_brief" && (
                      <div className="space-y-3 border-t border-slate-800 pt-5 mt-5">
                        <label className="text-[10px] font-bold text-slate-600 flex justify-between items-center">
                          External Intelligence (Helium10/Excel)
                          {isParsingFile && <Loader2 className="w-3 h-3 animate-spin" />}
                        </label>
                        <div className="flex gap-3">
                          <textarea 
                            placeholder="Manual or uploaded keywords..."
                            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 custom-scrollbar text-slate-900"
                            value={uploadedKeywords}
                            onChange={(e) => setUploadedKeywords(e.target.value)}
                          />
                          <div className="flex flex-col gap-2">
                            <label className="cursor-pointer bg-slate-100 border border-slate-200 rounded-xl p-4 hover:bg-slate-200 transition-all flex items-center justify-center group" title="Upload CSV/Excel/PDF">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".csv,.xlsx,.xls,.pdf,.txt"
                                onChange={handleFileUpload}
                                disabled={isParsingFile}
                              />
                              <FileUp className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                            </label>
                            {uploadedKeywords && (
                              <button 
                                type="button"
                                onClick={() => setUploadedKeywords("")}
                                className="bg-slate-100 border border-slate-200 rounded-xl p-4 hover:bg-red-50 text-red-600 transition-all flex items-center justify-center group"
                                title="Clear Keywords"
                              >
                                <XCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold">
                          AI engine parses CSV, Excel, PDF, and TXT exports.
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "comp" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-slate-900">Competitor Analysis Matrix ({competitors.length}/5)</h3>
                      {competitors.length < 5 && (
                        <button 
                          type="button"
                          onClick={addCompetitor}
                          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          Add Competitor
                        </button>
                      )}
                    </div>

                    <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {competitors.map((comp, idx) => (
                        <div key={`competitor-input-${comp.title.substring(0, 10).replace(/\s+/g, '-')}-${idx}`} className="space-y-5 p-6 bg-white border border-slate-200 rounded-3xl relative group shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Competitor #{idx + 1}</span>
                            {competitors.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => removeCompetitor(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                                                    
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-900 font-bold">Title</label>
                            <input 
                              type="text" 
                              placeholder="Enter competitor's listing title..."
                              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                              value={comp.title}
                              onChange={(e) => updateCompetitor(idx, "title", e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-900 font-bold">Amazon Product URL</label>
                            <input 
                              type="text" 
                              placeholder="https://www.amazon.com/dp/..."
                              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                              value={comp.url}
                              onChange={(e) => updateCompetitor(idx, "url", e.target.value)}
                            />
                          </div>
                          {selectedTool !== "visual_brief" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-600 font-bold">Price</label>
                                <input 
                                  type="text" 
                                  placeholder="$29.99"
                                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 text-slate-900"
                                  value={comp.price}
                                  onChange={(e) => updateCompetitor(idx, "price", e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-900 font-bold">Discount</label>
                                <input 
                                  type="text" 
                                  placeholder="$24.99"
                                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 text-slate-900"
                                  value={comp.discountedPrice || ""}
                                  onChange={(e) => updateCompetitor(idx, "discountedPrice", e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                          {selectedTool !== "visual_brief" && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-900 font-bold">Copy</label>
                              <textarea 
                                placeholder="Paste competitor's bullet points and description..."
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 custom-scrollbar text-slate-900"
                                value={comp.copy}
                                onChange={(e) => updateCompetitor(idx, "copy", e.target.value)}
                              />
                            </div>
                          )}
                          {selectedTool !== "visual_brief" && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-900 font-bold">Sentiment</label>
                              <textarea 
                                placeholder="Paste competitor reviews to analyze sentiment..."
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400 custom-scrollbar text-slate-900"
                                value={comp.reviews || ""}
                                onChange={(e) => updateCompetitor(idx, "reviews", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className={cn(
                          "w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 rounded-xl font-bold text-xs flex justify-center items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-6 group",
                          isAnalyzing && "cursor-not-allowed"
                        )}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Initializing Market Audit...
                          </>
                        ) : (
                          <>
                            Run Market Analysis
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
              </form>
            </div>
          </div>

          {/* Status Cards */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm group hover:border-cyan-500/30 transition-all">
                <TrendingUp className="w-6 h-6 mb-3 text-cyan-600 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] text-slate-400 font-bold">Growth Mode</div>
                <div className="text-xl font-bold tracking-tight text-white">Aggressive</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm group hover:border-green-500/30 transition-all">
                <ShieldCheck className="w-6 h-6 mb-3 text-green-600 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] text-slate-400 font-bold">Leak Protection</div>
                <div className="text-xl font-bold tracking-tight text-white">Optimized</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <MarketPulse />
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      <section className={cn("lg:col-span-7", result && "lg:col-span-12")}>
          <AnimatePresence mode="wait">
            {result === null && !isAnalyzing && !error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full"></div>
                  <BarChart3 className="w-24 h-24 text-slate-200 relative z-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-500">Marketplace Engine Ready</h3>
                  <p className="text-sm text-slate-500/60 max-w-xs mx-auto">Enter your Amazon listing details to begin the deep audit and growth strategy generation.</p>
                </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 space-y-10"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                  <Zap className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 fill-blue-600/10 animate-pulse" />
                </div>
                <div className="space-y-3 text-center">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 animate-pulse">Analyzing Market Data</h3>
                  <div className="flex gap-1.5 justify-center">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={`loading-dot-${i}`} className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                  {[
                    "SEO Audit",
                    "Competitor Gap Analysis",
                    "Consumer Psychology Mapping",
                    "Growth Strategy Modeling"
                  ].map((task, i) => (
                    <div key={`loading-task-${i}`} className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                      <div className="w-2 h-2 bg-blue-600/40 rounded-full animate-pulse" />
                      {task}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-100 p-10 rounded-3xl text-center space-y-6"
              >
                <div className="p-4 bg-red-100 rounded-full w-fit mx-auto">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-red-900">Connection Error</h3>
                  <p className="text-sm text-red-600/60 max-w-sm mx-auto">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="bg-red-600 text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Retry Analysis
                </button>
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-900/30 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-bold tracking-tight text-slate-900">Listing Audit</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleCopy}
                        className={cn(
                          "p-2 rounded-lg border transition-all flex items-center gap-2",
                          copied ? "bg-green-600 border-green-700 text-white" : "border-slate-200 hover:bg-slate-100 text-slate-600"
                        )}
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        {copied && <span className="text-[10px] font-bold">Copied</span>}
                      </button>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="prose prose-slate prose-base max-w-none prose-headings:text-blue-600 prose-strong:text-slate-900 prose-a:text-blue-600 custom-scrollbar max-h-[800px] overflow-y-auto pr-4">
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="mt-8 pt-8 border-t border-slate-800 space-y-6">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600/60">
                        <MessageSquare className="w-3 h-3" />
                        Refinement Chat
                      </div>
                      
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {chatMessages.map((msg, i) => (
                          <div key={`chat-bubble-${i}-${msg.role}-${msg.text.substring(0, 10)}`} className={cn(
                            "flex flex-col space-y-1",
                            msg.role === "user" ? "items-end" : "items-start"
                          )}>
                            <div className={cn(
                              "max-w-[85%] p-4 rounded-2xl text-sm",
                              msg.role === "user" 
                                ? "bg-blue-600 text-white shadow-md" 
                                : "bg-slate-800 border border-slate-700 text-slate-200"
                            )}>
                              <div className="markdown-body">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex gap-2 items-center">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-xs text-slate-500 font-bold">Thinking...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleChat} className="relative">
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask for enhancements or changes..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800 transition-all placeholder:text-slate-600 text-white"
                          disabled={isChatting}
                        />
                        <button 
                          type="submit"
                          disabled={isChatting || !chatInput.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>

                    {!optimizedListing && (selectedTool === "listing_optimization" || selectedTool === "new_listing") && (
                        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-wrap justify-center gap-4">
                          <button 
                            onClick={handleGenerateListing}
                            disabled={isGeneratingListing}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-[10px] flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 shadow-md"
                          >
                            {isGeneratingListing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {selectedTool === "new_listing" ? "Build Optimized Listing" : "Generate Optimized Listing"}
                          </button>
                          
                          {competitors.map((comp, idx) => {
                            if (!comp.url || !comp.title) return null;
                            const uniqueKey = `btn-research-opt-${idx}-${comp.title.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
                            return (
                              <button 
                                key={uniqueKey}
                                onClick={() => handleGenerateResearch(idx)}
                                disabled={isGeneratingResearch}
                                className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-3 rounded-xl font-bold text-[10px] flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                              >
                            {isGeneratingResearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-purple-600" />}
                            Research Comp #{idx + 1}
                          </button>
                            );
                          })}
                        </div>
                    )}
                    
                    {!optimizedListing && (selectedTool !== "listing_optimization" && selectedTool !== "new_listing") && (
                      <div className="mt-8 pt-8 border-t border-slate-800 flex flex-wrap justify-center gap-4">
                        {competitors.map((comp, idx) => {
                          if (!comp.url || !comp.title) return null;
                          const uniqueKey = `btn-research-def-${idx}-${comp.title.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
                          return (
                            <button 
                              key={uniqueKey}
                              onClick={() => handleGenerateResearch(idx)}
                              disabled={isGeneratingResearch}
                              className="bg-slate-800 border border-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold text-[10px] flex items-center gap-2 hover:bg-slate-700 transition-all disabled:opacity-50"
                            >
                              {isGeneratingResearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-purple-600" />}
                              Research Comp #{idx + 1}
                            </button>
                          );
                        })}
                        
                        {!visualAudit && (
                          <div className="w-full flex flex-col items-center gap-6 mt-8 pt-8 border-t border-slate-800">
                            {myImages.length === 0 && (
                              <div className="text-center space-y-4 max-w-md">
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                  <p className="text-xs text-rose-400 font-bold">Visual Audit requires product images. Please upload your images below to compare against the best-sellers.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">My Images</label>
                                    <label className="aspect-video rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group">
                                      <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'my')} />
                                      <Camera className="w-6 h-6 text-slate-600 group-hover:text-rose-400 transition-colors" />
                                      <span className="text-[10px] font-bold text-slate-600 group-hover:text-rose-400 mt-2">Upload Mine</span>
                                    </label>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Comp Images</label>
                                    <label className="aspect-video rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                                      <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'comp')} />
                                      <Camera className="w-6 h-6 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                      <span className="text-[10px] font-bold text-slate-600 group-hover:text-purple-400 mt-2">Upload Comp</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {myImages.length > 0 && (
                              <div className="w-full space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready for Visual Intelligence</h4>
                                  <span className="text-[10px] font-bold text-rose-400">{myImages.length} My Images • {compImages.length} Comp Images</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                  {myImages.map((img, i) => (
                                    <div key={`my-result-preview-${i}`} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-700 group">
                                      <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                                      <button onClick={() => removeImage(i, 'my')} className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XCircle className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                  {compImages.map((img, i) => (
                                    <div key={`comp-result-preview-${i}`} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-purple-900/50 group">
                                      <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                                      <button onClick={() => removeImage(i, 'comp')} className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XCircle className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <button 
                              onClick={handleGenerateVisualAudit}
                              disabled={isGeneratingVisualAudit}
                              className={cn(
                                "bg-slate-800 border border-slate-700 text-slate-300 px-10 py-4 rounded-xl font-bold text-xs flex items-center gap-3 hover:bg-slate-700 transition-all disabled:opacity-50 shadow-xl",
                                myImages.length > 0 && "bg-gradient-to-r from-rose-600 to-purple-600 text-white border-none"
                              )}
                            >
                              {isGeneratingVisualAudit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                              Run Visual Audit & Comp Comparison
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {competitorResearch && (
                  <motion.div 
                    id="competitor-research-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden"
                  >
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-900/30 rounded-lg">
          <Search className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">Competitor Insights</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600" 
                style={{ width: `${competitorResearch.listingScore}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-blue-600">
              Listing Score: {competitorResearch.listingScore}/100
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-800">
        Analysis Active
      </div>
                    </div>

                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Market Strengths
                          </h4>
                          <ul className="space-y-2">
                            {competitorResearch.pros.map((pro, idx) => (
                              <li key={`research-pro-${idx}`} className="text-sm flex gap-2 text-slate-400">
                                <span className="text-green-500 font-bold">•</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-red-600 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Market Weaknesses
                          </h4>
                          <ul className="space-y-2">
                            {competitorResearch.cons.map((con, idx) => (
                              <li key={`research-con-${idx}`} className="text-sm flex gap-2 text-slate-400">
                                <span className="text-red-500 font-bold">•</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold">Keyword Strategy Audit</label>
                          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm leading-relaxed text-slate-300">
                            {competitorResearch.keywordStrategy}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold">Conversion Tactics</label>
                          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm leading-relaxed text-slate-300">
                            {competitorResearch.conversionTactics}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold">Visual & Image Audit</label>
                          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm leading-relaxed text-slate-300">
                            {competitorResearch.visualAudit}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold">Strategic Vulnerabilities</label>
                          <div className="bg-red-900/20 border border-red-900/30 p-4 rounded-xl text-sm font-bold text-red-400 leading-relaxed">
                            {competitorResearch.vulnerabilities}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            Keywords Winning
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {competitorResearch.keywordAnalysis.good.map((kw, i) => (
                              <span key={`kw-good-${kw.replace(/\s+/g, '-')}-${i}`} className="px-2 py-1 bg-green-900/30 border border-green-800 rounded text-[10px] text-green-400 font-medium">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-red-600 flex items-center gap-2">
                            <XCircle className="w-3 h-3" />
                            Keywords Missing/Weak
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {competitorResearch.keywordAnalysis.bad.map((kw, i) => (
                              <span key={`kw-bad-${kw.replace(/\s+/g, '-')}-${i}`} className="px-2 py-1 bg-red-900/30 border border-red-800 rounded text-[10px] text-red-400 font-medium">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {optimizedListing && (
                  <motion.div 
                    id="optimized-listing-section"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden relative group"
                  >
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between relative z-10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-900/30 rounded-lg">
          <Zap className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">Optimized Listing</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500" 
                style={{ width: `${optimizedListing.overallListingScore}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-orange-600">
              Overall Score: {optimizedListing.overallListingScore}/100
            </span>
          </div>
        </div>
      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const text = `TITLE (Selected Option ${selectedTitleIndex + 1}):\n${optimizedListing.titles[selectedTitleIndex].text}\n\nALL TITLE OPTIONS:\n${optimizedListing.titles.map((t, i) => `Option ${i+1} (Score: ${t.score}): ${t.text}`).join('\n')}\n\nBULLETS:\n${optimizedListing.bulletPoints.map(b => `[Score: ${b.score}] ${b.text}`).join('\n')}\n\nDESCRIPTION:\n${optimizedListing.description}\n\nSEARCH TERMS:\n${optimizedListing.searchTerms}\n\nOVERALL LISTING SCORE: ${optimizedListing.overallListingScore}`;
                            navigator.clipboard.writeText(text);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-orange-600"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-8 space-y-8 relative z-10">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-orange-600">Title Options (Top 5)</h3>
                        <div className="space-y-3">
                          {optimizedListing.titles.map((title, idx) => (
                            <button
                              key={`title-option-${title.text.substring(0, 20).replace(/\s+/g, '-')}-${idx}`}
                              onClick={() => setSelectedTitleIndex(idx)}
                              className={cn(
                                "w-full text-left p-4 rounded-xl border transition-all relative group/item",
                                selectedTitleIndex === idx 
                                  ? "bg-orange-900/20 border-orange-800 text-white" 
                                  : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded",
                                  selectedTitleIndex === idx ? "bg-orange-600 text-white" : "bg-slate-700 text-slate-400"
                                )}>
                                  Option 0{idx + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-orange-500" 
                                        style={{ width: `${title.score}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-bold text-orange-600">{title.score}</span>
                                  </div>
                                  <span className="text-[9px] opacity-40">{title.text.length}/200 chars</span>
                                </div>
                              </div>
                              <p className="text-sm font-medium leading-relaxed text-slate-200">{title.text}</p>
                              {selectedTitleIndex === idx && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-blue-600">High-Conversion Bullet Points</h3>
                        <div className="space-y-3">
                          {optimizedListing.bulletPoints.map((bullet, idx) => (
                            <div key={`bullet-point-${bullet.text.substring(0, 20).replace(/\s+/g, '-')}-${idx}`} className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm flex gap-4 text-slate-300 relative overflow-hidden group">
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-400/30 group-hover:bg-orange-600 transition-all" 
                                style={{ height: `${bullet.score}%` }}
                              />
                              <div className="flex flex-col items-center gap-1 min-w-[32px]">
                                <span className="text-orange-600 font-bold mt-0.5">0{idx + 1}</span>
                                <span className="text-[8px] font-bold text-orange-600/60">{bullet.score}</span>
                              </div>
                              <p className="leading-relaxed">{bullet.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-cyan-600">Product Description (HTML)</h3>
                        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl text-sm whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar text-slate-300">
                          {optimizedListing.description}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-orange-600">Backend Search Terms</h3>
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm text-slate-300 break-all">
                          {optimizedListing.searchTerms}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-[10px] font-bold text-orange-600">Keyword Rationale</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {optimizedListing.keywordRationale.map((item, idx) => (
                            <div key={`keyword-rationale-${item.term.replace(/\s+/g, '-')}-${idx}`} className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                              <div className="text-xs font-bold text-orange-600 mb-1">{item.term}</div>
                              <p className="text-[11px] opacity-60 leading-relaxed">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex justify-center gap-4 relative z-10">
                      <button 
                        onClick={() => {
                          const text = `TITLE (Selected Option ${selectedTitleIndex + 1}):\n${optimizedListing.titles[selectedTitleIndex].text}\n\nALL TITLE OPTIONS:\n${optimizedListing.titles.map((t, i) => `Option ${i+1} (Score: ${t.score}): ${t.text}`).join('\n')}\n\nBULLETS:\n${optimizedListing.bulletPoints.map(b => `[Score: ${b.score}] ${b.text}`).join('\n')}\n\nDESCRIPTION:\n${optimizedListing.description}\n\nSEARCH TERMS:\n${optimizedListing.searchTerms}\n\nOVERALL LISTING SCORE: ${optimizedListing.overallListingScore}`;
                          navigator.clipboard.writeText(text);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-[10px] flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        {copied ? "Copied All" : "Copy Optimized Listing"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {visualAudit && (
                  <motion.div 
                    id="visual-audit-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden"
                  >
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-900/30 rounded-lg">
                          <Camera className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Visual Audit & Competitor Comparison</h3>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-rose-900/30 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-rose-800">
                        Visual Intelligence Active
                      </div>
                    </div>

                    <div className="p-8 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Our Visual Strategy</h4>
                          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl text-sm leading-relaxed text-slate-300">
                            {visualAudit.myVisualStrategy}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest">Best-Seller Visual Secrets</h4>
                          <div className="bg-rose-900/10 border border-rose-900/30 p-5 rounded-2xl text-sm leading-relaxed text-rose-200">
                            {visualAudit.competitorVisualStrategy}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest">The Visual Gap Analysis</h4>
                        <div className="bg-amber-900/10 border border-amber-900/30 p-5 rounded-2xl text-sm leading-relaxed text-amber-200">
                          {visualAudit.gapAnalysis}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest">7-Image Optimization Plan</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {visualAudit.imageOptimizationPlan.map((img, idx) => (
                            <div key={`visual-asset-plan-${img.title.replace(/\s+/g, '-')}-${idx}`} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden space-y-3 group hover:border-blue-600 transition-all">
                              <div className="aspect-square bg-slate-900 relative">
                                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold mb-2">
                                    {img.imageNumber}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Visual Concept</span>
                                </div>
                                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-bold text-white border border-white/10">
                                  IMAGE 0{img.imageNumber}
                                </div>
                              </div>
                              <div className="p-5 space-y-3">
                                <h5 className="font-bold text-white text-sm">{img.title}</h5>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{img.description}</p>
                                <div className="pt-2 border-t border-slate-700">
                                  <p className="text-[9px] font-bold text-blue-400 italic uppercase tracking-tight">WHY IT WINS: {img.whyItWins}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-slate-800">
                        <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest">Visual Conversion Triggers</h4>
                        <div className="flex flex-wrap gap-2">
                          {visualAudit.conversionTriggers.map((trigger, i) => (
                            <span key={`visual-trigger-${i}`} className="px-3 py-1.5 bg-green-900/20 border border-green-800/50 rounded-full text-[10px] text-green-400 font-bold">
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 flex justify-center">
                        <button 
                          onClick={() => {
                            const text = `VISUAL AUDIT REPORT\n\nOUR STRATEGY:\n${visualAudit.myVisualStrategy}\n\nCOMPETITOR SECRETS:\n${visualAudit.competitorVisualStrategy}\n\nGAP ANALYSIS:\n${visualAudit.gapAnalysis}\n\nOPTIMIZATION PLAN:\n${visualAudit.imageOptimizationPlan.map(img => `Image ${img.imageNumber}: ${img.title}\n${img.description}\nWhy it wins: ${img.whyItWins}`).join('\n\n')}\n\nCONVERSION TRIGGERS:\n${visualAudit.conversionTriggers.join(', ')}`;
                            navigator.clipboard.writeText(text);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="bg-rose-600 text-white px-8 py-4 rounded-xl font-bold text-[10px] flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                          {copied ? "Copied Visual Brief" : "Copy Visual Optimization Brief"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Strategy Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-orange-500/30 transition-all">
                    <Target className="w-6 h-6 mb-4 text-orange-600 group-hover:scale-110 transition-transform" />
                    <h4 className="text-[10px] font-bold mb-2 text-slate-500">Primary Goal</h4>
                    <p className="text-sm text-slate-900">Dominate Category BSR & Maximize Organic Rank</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-500/30 transition-all">
                    <Users className="w-6 h-6 mb-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <h4 className="text-[10px] font-bold mb-2 text-slate-500">Market Sentiment</h4>
                    <p className="text-sm text-slate-900">Competitor is winning on social proof & pricing psychology.</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-yellow-500/30 transition-all">
                    <Zap className="w-6 h-6 mb-4 text-yellow-600 group-hover:scale-110 transition-transform" />
                    <h4 className="text-[10px] font-bold mb-2 text-slate-500">Quick Win</h4>
                    <p className="text-sm text-slate-900">Optimize Title Keywords & Update Main Image Contrast.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800 p-8 text-center">
        <div className="text-[10px] font-bold opacity-40 text-slate-500">
          Powered by Gemini 3.1 Pro & AmzGrowth Proprietary Algorithms
        </div>
      </footer>
    </div>
  );
}
