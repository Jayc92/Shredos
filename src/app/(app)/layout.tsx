import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <Sidebar className="hidden md:flex w-56 flex-shrink-0 h-full" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* TopBar — mobile only */}
        <div className="md:hidden flex-shrink-0">
          <TopBar displayName={user.email ?? 'ForgeFitOS'} />
        </div>

        {/* Desktop topbar (name + signout) */}
        <div className="hidden md:flex items-center justify-end px-6 h-12 border-b border-border bg-card flex-shrink-0">
          <span className="text-sm text-muted-foreground">{user.email ?? 'ForgeFitOS'}</span>
          <form action="/api/auth/signout" method="POST" className="ml-4">
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
