import UserScanForm from "@/components/UserScanForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="min-h-screen backdrop-blur-sm">
        <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-6">
              <svg
                className="w-8 h-8 text-purple-400"
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
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl mb-4">
              User Stalking
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Enter an email address or username to scan and retrieve user information.
            </p>
          </div>

          {/* Form */}
          <UserScanForm />
        </main>
      </div>
    </div>
  );
}
