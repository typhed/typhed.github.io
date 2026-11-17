import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container flex max-w-2xl flex-col items-center py-32 text-center">
      <p className="font-display text-brand text-6xl font-bold">404</p>
      <h1 className="font-display text-foreground mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mt-2">
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground mt-8 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Back to all posts
      </Link>
    </div>
  )
}
