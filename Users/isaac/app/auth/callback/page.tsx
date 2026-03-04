'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      try {
        // ---------------------------------------------------------
        // 1. TRY PKCE FLOW (?code=...)
        // Used for Magic Links / OAuth
        // ---------------------------------------------------------
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          
          await redirectBasedOnRole(supabase, router)
          return
        }

        // ---------------------------------------------------------
        // 2. TRY IMPLICIT FLOW (#access_token=...)
        // Used for Admin Invite Links (generateLink)
        // We must manually extract the hash because server routes 
        // cannot see URL fragments.
        // ---------------------------------------------------------
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          // Remove the leading '#' and parse as query params
          const hashParams = new URLSearchParams(hash.substring(1))
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')

          if (access_token) {
            // Explicitly set the session
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token || '',
            })
            
            if (error) throw error

            // Clean the URL (remove tokens from address bar)
            window.history.replaceState(null, '', window.location.pathname)
            
            await redirectBasedOnRole(supabase, router)
            return
          }
        }

        // ---------------------------------------------------------
        // 3. NO TOKENS FOUND
        // ---------------------------------------------------------
        throw new Error('No authentication tokens found in URL.')

      } catch (err: any) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setErrorMessage(err.message || 'Authentication failed.')
      }
    }

    handleAuthCallback()
  }, [router])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0d0b]">
        <div className="text-center">
          <h1 className="text-2xl text-[#b87a7a] font-light mb-4">Authentication Error</h1>
          <p className="text-[#8a8278] mb-6">{errorMessage}</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-[#c9a87c] text-[#0e0d0b] rounded-sm text-sm font-medium hover:bg-[#a08050]"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0e0d0b]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#c9a87c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8a8278] text-sm tracking-wide">Verifying credentials...</p>
      </div>
    </div>
  )
}

// Helper to determine post-login destination
async function redirectBasedOnRole(supabase: any, router: any) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const role = user?.app_metadata?.role
  
  if (role === 'admin') {
    router.push('/dashboard')
  } else {
    router.push('/portal')
  }
}
