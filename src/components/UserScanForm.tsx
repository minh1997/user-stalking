"use client";

import { useState, FormEvent, useCallback } from "react";
import { ScanResult, ScanStatus } from "@/types/scan";

type SearchType = "email" | "username";

// Define available scanners with their endpoints
const EMAIL_SCANNERS = [
  { id: "facebook", name: "Facebook", category: "social", endpoint: "/api/scan/facebook" },
  { id: "instagram", name: "Instagram", category: "social", endpoint: "/api/scan/instagram" },
  { id: "x", name: "X", category: "social", endpoint: "/api/scan/x" },
  { id: "pinterest", name: "Pinterest", category: "social", endpoint: "/api/scan/pinterest" },
  { id: "github", name: "GitHub", category: "dev", endpoint: "/api/scan/github" },
  { id: "spotify", name: "Spotify", category: "music", endpoint: "/api/scan/spotify" },
  { id: "duolingo", name: "Duolingo", category: "learning", endpoint: "/api/scan/duolingo" },
];

const USERNAME_SCANNERS = [
  { id: "linkedin", name: "LinkedIn", category: "social", endpoint: "/api/scan/linkedin" },
  { id: "youtube", name: "YouTube", category: "social", endpoint: "/api/scan/youtube" },
  { id: "tiktok", name: "TikTok", category: "social", endpoint: "/api/scan/tiktok" },
  { id: "x-user", name: "X", category: "social", endpoint: "/api/scan/x-user" },
  { id: "discord", name: "Discord", category: "social", endpoint: "/api/scan/discord" },
  { id: "instagram-user", name: "Instagram", category: "social", endpoint: "/api/scan/instagram-user" },
  { id: "reddit", name: "Reddit", category: "social", endpoint: "/api/scan/reddit" },
  { id: "buymeacoffee", name: "Buy Me a Coffee", category: "donation", endpoint: "/api/scan/buymeacoffee" },
  { id: "github-user", name: "GitHub", category: "dev", endpoint: "/api/scan/github-user" },
  { id: "patreon", name: "Patreon", category: "creator", endpoint: "/api/scan/patreon" },
  { id: "medium", name: "Medium", category: "creator", endpoint: "/api/scan/medium" },
];

interface ScannerStatus {
  id: string;
  name: string;
  category: string;
  status: "pending" | "scanning" | "completed" | "error";
  result?: ScanResult;
}

export default function UserScanForm() {
  const [searchType, setSearchType] = useState<SearchType>("email");
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scannerStatuses, setScannerStatuses] = useState<ScannerStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanSingleService = useCallback(async (
    scanner: typeof EMAIL_SCANNERS[0],
    query: string
  ): Promise<ScanResult | null> => {
    try {
      // Update status to scanning
      setScannerStatuses(prev => 
        prev.map(s => s.id === scanner.id ? { ...s, status: "scanning" } : s)
      );

      const response = await fetch(scanner.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        // Update with result
        setScannerStatuses(prev =>
          prev.map(s => s.id === scanner.id 
            ? { ...s, status: "completed", result: data.result } 
            : s
          )
        );
        return data.result;
      } else {
        setScannerStatuses(prev =>
          prev.map(s => s.id === scanner.id ? { ...s, status: "error" } : s)
        );
        return null;
      }
    } catch {
      setScannerStatuses(prev =>
        prev.map(s => s.id === scanner.id ? { ...s, status: "error" } : s)
      );
      return null;
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setIsLoading(true);
    setError(null);

    // Initialize all scanners as pending based on search type
    const scanners = searchType === "email" ? EMAIL_SCANNERS : USERNAME_SCANNERS;
    setScannerStatuses(
      scanners.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        status: "pending" as const,
      }))
    );

    // Run all scans in parallel - each one updates independently
    await Promise.all(
      scanners.map(scanner => scanSingleService(scanner, searchValue))
    );

    setIsLoading(false);
  };

  const getStatusIcon = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.TAKEN:
        return (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case ScanStatus.AVAILABLE:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case ScanStatus.ERROR:
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusText = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.TAKEN:
        return <span className="text-green-400 font-medium">Found</span>;
      case ScanStatus.AVAILABLE:
        return <span className="text-slate-400 font-medium">Not Found</span>;
      case ScanStatus.ERROR:
        return <span className="text-yellow-400 font-medium">Error</span>;
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Type Toggle */}
          <div className="flex rounded-xl bg-slate-800/50 p-1">
            <button
              type="button"
              onClick={() => setSearchType("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                searchType === "email"
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email
            </button>
            <button
              type="button"
              onClick={() => setSearchType("username")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                searchType === "username"
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Username
            </button>
          </div>

          {/* Input Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {searchType === "email" ? (
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            <input
              type={searchType === "email" ? "email" : "text"}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={
                searchType === "email"
                  ? "Enter email address..."
                  : "Enter username..."
              }
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !searchValue.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Start Scan
              </>
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Results - Real-time updates grouped by category */}
        {scannerStatuses.length > 0 && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Scan Results</h3>
              <span className="text-xs text-slate-500">
                {scannerStatuses.filter(s => s.status === "completed" || s.status === "error").length}/{scannerStatuses.length} completed
              </span>
            </div>
            
            {/* Group by category */}
            {Object.entries(
              scannerStatuses.reduce((acc, scanner) => {
                if (!acc[scanner.category]) {
                  acc[scanner.category] = [];
                }
                acc[scanner.category].push(scanner);
                return acc;
              }, {} as Record<string, ScannerStatus[]>)
            ).map(([category, scanners]) => (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${
                    category === "social" ? "bg-blue-400" :
                    category === "dev" ? "bg-green-400" :
                    category === "creator" ? "bg-pink-400" :
                    category === "entertainment" ? "bg-purple-400" :
                    category === "gaming" ? "bg-red-400" :
                    "bg-slate-400"
                  }`} />
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    {category}
                  </h4>
                  <div className="flex-1 h-px bg-slate-700/50" />
                  <span className="text-xs text-slate-500">
                    {scanners.filter(s => s.status === "completed" && s.result?.status === "taken").length} found
                  </span>
                </div>
                
                {/* Scanners in this category */}
                <div className="space-y-2">
                  {scanners.map((scanner) => (
                    <div
                      key={scanner.id}
                      className={`flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl transition-all duration-300 ${
                        scanner.status === "scanning" ? "animate-pulse" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {scanner.status === "pending" && (
                          <div className="w-8 h-8 rounded-full bg-slate-600/20 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-slate-500" />
                          </div>
                        )}
                        {scanner.status === "scanning" && (
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <svg className="animate-spin w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        )}
                        {scanner.status === "completed" && scanner.result && getStatusIcon(scanner.result.status)}
                        {scanner.status === "error" && (
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{scanner.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {scanner.status === "pending" && (
                          <span className="text-slate-500 text-sm">Waiting...</span>
                        )}
                        {scanner.status === "scanning" && (
                          <span className="text-purple-400 text-sm">Scanning...</span>
                        )}
                        {scanner.status === "completed" && scanner.result && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              {getStatusText(scanner.result.status)}
                              {scanner.result.url && scanner.result.status === ScanStatus.TAKEN && (
                                <a
                                  href={scanner.result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
                                  title="View Profile"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            {scanner.result.reason && (
                              <p className="text-slate-500 text-xs max-w-[200px] truncate">{scanner.result.reason}</p>
                            )}
                          </div>
                        )}
                        {scanner.status === "error" && (
                          <span className="text-red-400 text-sm">Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Text */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Perfect for finding a unique username across GitHub, X, Reddit, Instagram, and more, all in a single tool.
        </p>
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 mb-2">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="text-xs text-slate-400">Fast Scan</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 mb-2">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-xs text-slate-400">OSINT</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 mb-2">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-xs text-slate-400">Multi-Platform</p>
        </div>
      </div>
    </div>
  );
}
