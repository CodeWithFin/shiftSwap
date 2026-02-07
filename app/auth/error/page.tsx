import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight"
          >
            SHIFT<span className="text-primary">SWAP</span>
          </Link>
        </div>

        <div className="border border-border bg-card p-8 rounded-lg">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight mb-3 text-foreground">
            Authentication Error
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Something went wrong during authentication. Please try again.
          </p>
          <Link
            href="/auth/login"
            className="inline-block border border-border px-6 py-3 text-sm uppercase tracking-[0.2em] font-display font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all rounded-md"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}
