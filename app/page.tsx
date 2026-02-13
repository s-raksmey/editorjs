import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-indigo-400 sm:text-6xl">
            Content Editor
          </h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
            Rich text editor with Cloudflare R2 media storage
          </p>
          <Link
            href="/editor"
            className="inline-block rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
          >
            Open Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
