import React from "react";
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Box, 
  Globe, 
  Cpu, 
  ChevronRight, 
  Layers, 
  BarChart3,
  Navigation,
  Search,
  Camera,
  Target
} from "lucide-react";
import { motion } from "motion/react";

interface HomePageProps {
  onLaunch: () => void;
}

export default function HomePage({ onLaunch }: HomePageProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      {/* Professional Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-200/10 blur-[150px]" />
        
        {/* Subtle Overlay */}
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:40px_40px]"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 flex justify-between items-center p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 group cursor-pointer">
          <Zap className="w-8 h-8 text-blue-600 fill-blue-600 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-black">Eagle Eye</span>
            <span className="text-[8px] text-blue-600 font-bold">Marketplace Optimization</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold text-slate-600">
          <a href="#" className="hover:text-blue-600 transition-colors">Audit</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Optimization</a>
          <a href="#" className="hover:text-blue-600 transition-colors">PPC Strategy</a>
          <button 
            onClick={onLaunch}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Enterprise-Grade Marketplace Intelligence
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] text-black">
            The Marketplace <br />
            <span className="text-blue-600">Standard</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
            Eagle Eye is the definitive platform for high-velocity Amazon brands. <br className="hidden md:block" />
            We don't just optimize listings; we engineer market growth through deep data and creative strategy.
          </p>
          
          <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={onLaunch}
              className="group relative px-10 py-5 bg-blue-600 text-white font-bold text-xs rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-600/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Analysis
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <div className="flex items-center gap-4 text-[10px] text-slate-700 font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Real-Time Analysis
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <span>Marketplace Compliant</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Vision Section */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-left">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">The Vision: <span className="text-blue-600">Dominance</span></h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                In a marketplace saturated with noise, only the most precise brands survive. Eagle Eye was built to bridge the gap between raw data and creative execution. We analyze over 100+ data points per listing to provide actionable intelligence that drives real ROI.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">98%</div>
                <div className="text-[10px] text-slate-700 font-bold uppercase">Accuracy Rate</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">100+</div>
                <div className="text-[10px] text-slate-700 font-bold uppercase">Data Points</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">Instant</div>
                <div className="text-[10px] text-slate-700 font-bold uppercase">Audit Speed</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">A10</div>
                <div className="text-[10px] text-slate-700 font-bold uppercase">Native Logic</div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="relative bg-white border border-slate-200 p-1 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-white p-8 rounded-[22px] space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="text-[10px] text-blue-600 font-bold">System Status</div>
                  <div className="text-[10px] text-slate-700 font-bold">Live Intelligence</div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Market Sentiment", value: "94%", color: "bg-blue-600" },
                    { label: "Keyword Density", value: "Optimal", color: "bg-green-600" },
                    { label: "Competitor Vulnerability", value: "High", color: "bg-slate-400" },
                    { label: "Visual Asset Score", value: "88/100", color: "bg-blue-500" },
                  ].map((stat) => (
                    <div key={stat.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-700">{stat.label}</span>
                        <span className="text-black">{stat.value}</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full ${stat.color}`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900">Core <span className="text-blue-600">Capabilities</span></h2>
          <p className="text-slate-500 text-[10px] font-bold">What we deliver to your brand</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 group hover:border-blue-500/30 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Deep Listing Audit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identify conversion leaks and SEO gaps in seconds. Our engine audits your titles, bullets, and descriptions against top-performing benchmarks.
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 group hover:border-slate-700/30 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">AI Copy Optimization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-converting copy optimized for the marketplace. We weave your top keywords into persuasive, benefit-driven narratives.
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 group hover:border-orange-500/30 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Comp. Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uncover competitor strategies and market gaps. Analyze what's working for top sellers and adapt your listing to dominate the niche.
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 group hover:border-blue-500/30 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">PPC Strategy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maximize ROI with data-driven PPC roadmaps. Get specific bidding tactics, competitor conquesting ASINs, and budget allocation advice.
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 group hover:border-rose-500/30 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Visual Asset Brief</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get professional creative direction for your product imagery. We provide detailed briefs for lighting, composition, and lifestyle hooks.
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 group hover:border-orange-500/30 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Keyword Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deep dive into high-volume and hidden gem terms. We extract every ounce of value from market context and raw search data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* USPs Section */}
      <section className="relative z-10 py-24 border-y border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold tracking-tight text-blue-500">Data-Driven</div>
            <div className="text-[10px] text-slate-500 font-bold">Market-Aware Analysis</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold tracking-tight text-slate-400">Conversion Focused</div>
            <div className="text-[10px] text-slate-500 font-bold">Engineered to Sell</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold tracking-tight text-orange-500">Marketplace Ready</div>
            <div className="text-[10px] text-slate-500 font-bold">Algorithm Optimized</div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-slate-800">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900">Future <span className="text-blue-600">Roadmap</span></h2>
          <p className="text-slate-500 text-[10px] font-bold">The evolution of Marketplace Intelligence</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Image Validation Engine</h3>
              <span className="px-3 py-1 bg-blue-900/30 text-blue-400 text-[8px] font-bold rounded-full">In Development</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your product images vs. competitors. Our AI will analyze composition, lighting, and USP visibility to provide a "Conversion Probability" score.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Live Market Monitoring</h3>
              <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[8px] font-bold rounded-full">Planned</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time tracking of competitor price changes, listing updates, and review sentiment with instant alerts to your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
            Ready to <span className="text-blue-500">Conquer</span> the Marketplace?
          </h2>
          <p className="text-slate-400 text-lg">
            Join the elite 1% of Amazon sellers using advanced intelligence to automate growth and eliminate conversion leaks.
          </p>
          <button 
            onClick={onLaunch}
            className="px-12 py-6 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all hover:scale-105 shadow-2xl shadow-blue-600/20"
          >
            Start Optimization
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 p-12 border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] text-slate-500 font-bold">Eagle Eye v4.0.2-ALPHA</span>
        </div>
        <div className="text-[9px] text-slate-500 font-bold">
          Marketplace Optimization & Market Intelligence © 2026. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
