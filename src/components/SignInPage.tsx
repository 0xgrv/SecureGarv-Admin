import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMEg0MFY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWYyYTM1IiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-20" />

      {/* Subtle Glow Effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600 rounded-full filter blur-[120px] opacity-10" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600 rounded-full filter blur-[120px] opacity-10" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Portfolio Admin
          </h1>
        </div>

        {/* Subtle Border Card */}
        <div className="relative">
          {/* Simple gradient border - no animation */}
          <div className="absolute -inset-px bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-cyan-500/30 rounded-2xl" />

          {/* Clerk SignIn */}
          <div className="relative bg-[#0d1220] rounded-2xl border border-white/5">
            <SignIn
              appearance={{
                elements: {
                  card: "bg-transparent shadow-none",
                  header: "hidden",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  formFieldLabel: "text-gray-300 text-xs font-mono uppercase tracking-wider mb-1",
                  formFieldInput: "w-full bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all",
                  formButtonPrimary: "w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-mono text-sm font-semibold tracking-wider py-2.5 rounded-lg transition-all duration-200",
                  footerActionText: "text-gray-500 text-xs font-mono",
                  footerActionLink: "text-purple-400 hover:text-purple-300 text-xs font-mono transition-colors",
                  socialButtonsBlockButton: "w-full bg-[rgba(255,255,255,0.03)] border border-white/10 hover:bg-[rgba(255,255,255,0.07)] text-white text-sm py-2.5 rounded-lg transition-all duration-200",
                  socialButtonsBlockButtonText: "text-white text-sm font-medium",
                  dividerText: "text-gray-500 text-xs",
                  identityPreview: "bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-lg p-4",
                  identityPreviewText: "text-white text-sm",
                  identityPreviewEditButton: "text-purple-400 hover:text-purple-300 text-xs",
                  formFieldAction: "text-purple-400 hover:text-purple-300 text-xs",
                  alert: "bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm p-3",
                },
                layout: {
                  logoPlacement: "none",
                }
              }}
              redirectUrl="/"
            />
          </div>
        </div>
      </div>
    </div>
  );
}