import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-serif">
      <nav className="max-w-3xl mx-auto w-full px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs font-mono">
            ✦
          </span>
          <span className="text-xs tracking-widest uppercase text-gray-400 font-mono">
            Studio
          </span>
        </div>
        <Link
          href="/login"
          className="text-xs tracking-wide text-gray-400 hover:text-gray-900 transition-colors font-mono"
        >
          Sign in →
        </Link>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="mb-8 px-4 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-400 tracking-widest uppercase font-mono">
          Cloudflare R2 · EditorJS · Next.js
        </div>
        <h1 className="text-center font-normal text-gray-900 mb-6 leading-tight text-5xl sm:text-6xl lg:text-7xl">
          Write without
          <br />
          <em className="italic text-black">boundaries.</em>
        </h1>

        {/* Sub */}
        <p className="text-center text-gray-400 mb-12 max-w-sm leading-relaxed font-mono text-sm">
          Rich media editing with secure file uploads — images, video, audio and
          PDFs stored directly on R2.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/editor"
            className="px-8 py-3 rounded-full text-sm font-medium text-white bg-black hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-mono tracking-wide"
          >
            Open Editor
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-full text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:border-gray-400 hover:text-black transition-all duration-200 font-mono tracking-wide"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-20 max-w-3xl w-full rounded-2xl overflow-hidden bg-white ring-1 ring-gray-200 shadow-sm">
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs tracking-widest uppercase text-gray-400 font-mono">
              What&apos;s included
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-100">
            {[
              {
                icon: "🖼",
                label: "Images",
                desc: "Auto-compressed, up to 10 MB",
              },
              { icon: "🎬", label: "Video", desc: "MP4, WebM, up to 100 MB" },
              {
                icon: "🎵",
                label: "Audio",
                desc: "MP3, WAV, OGG, up to 50 MB",
              },
              { icon: "📄", label: "PDF", desc: "Documents, up to 20 MB" },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="px-6 py-6 flex flex-col gap-2">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-gray-900 font-mono">
                  {label}
                </span>
                <span className="text-xs text-gray-400 leading-relaxed font-mono">
                  {desc}
                </span>
              </div>
            ))}
          </div>
          <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-300 font-mono">
              Auth required to upload · Presigned URLs · 5 min expiry
            </span>
            <Link
              href="/editor"
              className="text-xs text-gray-500 hover:text-black transition-colors font-mono"
            >
              Start writing →
            </Link>
          </div>
        </div>
      </main>
      <footer className="max-w-3xl mx-auto w-full px-6 pb-8 flex items-center justify-between">
        <span className="text-xs text-gray-300 font-mono">© 2026 Studio</span>
        <span className="text-xs text-gray-300 font-mono">
          Built with Next.js & EditorJS
        </span>
      </footer>
    </div>
  );
}
