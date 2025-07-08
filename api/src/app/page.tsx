export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
            Famatic.app
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            AI-Powered Viral TikTok Slideshow Creator
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Transform your photos into viral TikTok content with research-backed templates. 
            Upload photos, record your voice, and let AI create engaging slideshows that get millions of views.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-4">🎬</div>
            <h3 className="text-lg font-semibold text-white mb-2">Magic Create</h3>
            <p className="text-gray-300 text-sm">Record your voice, upload photos, and watch AI create viral content</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-white mb-2">Research-Backed</h3>
            <p className="text-gray-300 text-sm">Templates with proven 89% viral success rates from real data</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">10 Second Creation</h3>
            <p className="text-gray-300 text-sm">From upload to viral slideshow in under 10 seconds</p>
          </div>
        </div>

        <div className="space-y-4">
          <a
            href="/mobile"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Launch Mobile App
          </a>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <a href="/api/health/db" className="hover:text-purple-400 transition-colors">
              Database Status
            </a>
            <a href="/api/health/storage" className="hover:text-purple-400 transition-colors">
              Storage Status
            </a>
            <a href="/api/health/ai" className="hover:text-purple-400 transition-colors">
              AI Status
            </a>
          </div>
        </div>

        <div className="mt-16 text-gray-500 text-sm">
          <p>MVP Version • Built with Next.js, Supabase, OpenRouter AI & Cloudflare R2</p>
        </div>
      </div>
    </div>
  );
}