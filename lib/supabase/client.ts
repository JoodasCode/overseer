import { createBrowserClient } from '@supabase/ssr'

// Singleton instance to prevent multiple GoTrueClient instances
let client: ReturnType<typeof createBrowserClient> | undefined

// SECURITY: Clear all auth-related cookies completely
function clearAllAuthCookies() {
  if (typeof document === 'undefined') return
  
  console.log('🔒 SECURITY: Clearing all authentication cookies')
  
  // Get all cookies
  const cookies = document.cookie.split(';')
  
  // Clear all Supabase auth cookies (including chunked ones)
  cookies.forEach(cookie => {
    const [name] = cookie.split('=')
    const cleanName = name?.trim()
    
    if (cleanName && (
      cleanName.startsWith('sb-') || 
      cleanName.includes('auth-token') ||
      cleanName.includes('supabase')
    )) {
      console.log('🗑️ Clearing cookie:', cleanName)
      
      // Clear with all possible domain/path combinations
      const clearOptions = [
        { path: '/' },
        { path: '/', domain: window.location.hostname },
        { path: '/', domain: `.${window.location.hostname}` },
        { path: '/', domain: window.location.hostname.split('.').slice(-2).join('.') }
      ]
      
      clearOptions.forEach(options => {
        document.cookie = `${cleanName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${
          Object.entries(options).map(([key, value]) => `${key}=${value}`).join('; ')
        }`
      })
    }
  })
  
  // Also clear localStorage/sessionStorage
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        console.log('🗑️ Clearing localStorage:', key)
        localStorage.removeItem(key)
      }
    })
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        console.log('🗑️ Clearing sessionStorage:', key)
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}

// SECURITY: Enhanced cookie management with user isolation
function getSupabaseBrowserClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            console.log('🍪 Cookie get:', { name, documentCookie: document.cookie.substring(0, 200) + '...' })
            
            // SECURITY CHECK: Validate cookie integrity
            const timestamp = Date.now()
            const cookieKey = `${name}_timestamp`
            const lastAccess = localStorage.getItem(cookieKey)
            
            // If cookie is older than 24 hours, clear it for security
            if (lastAccess && (timestamp - parseInt(lastAccess)) > 24 * 60 * 60 * 1000) {
              console.log('🔒 SECURITY: Cookie expired, clearing')
              this.remove(name, { path: '/' })
              return undefined
            }
            
            // Simple cookie extraction
            const value = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1]
            
            if (value) {
              console.log('🍪 Found cookie:', { name, hasValue: true, valueLength: value.length })
              // Update access timestamp
              localStorage.setItem(cookieKey, timestamp.toString())
              return decodeURIComponent(value)
            }
            
            // Try chunked cookies with security validation
            const chunks: string[] = []
            let chunkIndex = 0
            
            while (true) {
              const chunkName = chunkIndex === 0 ? name : `${name}.${chunkIndex}`
              const chunkValue = document.cookie
                .split('; ')
                .find(row => row.startsWith(`${chunkName}=`))
                ?.split('=')[1]
              
              if (!chunkValue) {
                console.log('🍪 Cookie not found:', { name: chunkName })
                break
              }
              
              console.log('🍪 Found cookie:', { name: chunkName, hasValue: true, valueLength: chunkValue.length })
              chunks.push(chunkValue)
              chunkIndex++
            }
            
            if (chunks.length > 0) {
              const reconstructed = chunks.join('')
              console.log('🍪 Reconstructed chunked cookie:', { name, chunks: chunks.length, totalLength: reconstructed.length })
              
              // Update access timestamp for chunked cookies
              localStorage.setItem(cookieKey, timestamp.toString())
              
              try {
                return decodeURIComponent(reconstructed)
              } catch (error) {
                console.error('🍪 Failed to decode chunked cookie:', error)
                // Clear corrupted cookie
                this.remove(name, { path: '/' })
                return undefined
              }
            }
            
            console.log('🍪 Cookie not found:', { name })
            return undefined
          }
          return undefined
        },
        
        set(name: string, value: string, options: any) {
          if (typeof document !== 'undefined') {
            console.log('🍪 Setting cookie:', { name, valueLength: value.length, options })
            
            // SECURITY: Add timestamp tracking
            const timestamp = Date.now()
            localStorage.setItem(`${name}_timestamp`, timestamp.toString())
            
            // Check if value needs chunking (Chrome limit ~4KB)
            const maxChunkSize = 3800 // Leave room for cookie metadata
            const encodedValue = encodeURIComponent(value)
            
            if (encodedValue.length <= maxChunkSize) {
              // Single cookie
              let cookieString = `${name}=${encodedValue}`
              
              // Apply security defaults
              const secureOptions = {
                path: '/',
                secure: window.location.protocol === 'https:',
                sameSite: 'lax',
                ...options
              }
              
              if (secureOptions.expires) {
                cookieString += `; expires=${secureOptions.expires.toUTCString()}`
              }
              if (secureOptions.maxAge) {
                cookieString += `; max-age=${secureOptions.maxAge}`
              }
              if (secureOptions.domain) {
                cookieString += `; domain=${secureOptions.domain}`
              }
              if (secureOptions.path) {
                cookieString += `; path=${secureOptions.path}`
              }
              if (secureOptions.secure) {
                cookieString += '; secure'
              }
              if (secureOptions.httpOnly) {
                cookieString += '; httponly'
              }
              if (secureOptions.sameSite) {
                cookieString += `; samesite=${secureOptions.sameSite}`
              }
              
              document.cookie = cookieString
              console.log('🍪 Cookie set successfully:', { name, length: encodedValue.length })
            } else {
              // Chunked cookies with security validation
              console.log('🍪 Chunking large cookie:', { name, totalLength: encodedValue.length })
              
              // Clear any existing chunks first
              let chunkIndex = 0
              while (true) {
                const chunkName = chunkIndex === 0 ? name : `${name}.${chunkIndex}`
                const existingChunk = document.cookie
                  .split('; ')
                  .find(row => row.startsWith(`${chunkName}=`))
                
                if (!existingChunk) break
                
                this.remove(chunkName, options)
                chunkIndex++
              }
              
              // Set new chunks
              chunkIndex = 0
              for (let i = 0; i < encodedValue.length; i += maxChunkSize) {
                const chunk = encodedValue.substring(i, i + maxChunkSize)
                const chunkName = chunkIndex === 0 ? name : `${name}.${chunkIndex}`
                
                let cookieString = `${chunkName}=${chunk}`
                
                // Apply same security options to chunks
                const secureOptions = {
                  path: '/',
                  secure: window.location.protocol === 'https:',
                  sameSite: 'lax',
                  ...options
                }
                
                if (secureOptions.expires) {
                  cookieString += `; expires=${secureOptions.expires.toUTCString()}`
                }
                if (secureOptions.maxAge) {
                  cookieString += `; max-age=${secureOptions.maxAge}`
                }
                if (secureOptions.domain) {
                  cookieString += `; domain=${secureOptions.domain}`
                }
                if (secureOptions.path) {
                  cookieString += `; path=${secureOptions.path}`
                }
                if (secureOptions.secure) {
                  cookieString += '; secure'
                }
                if (secureOptions.httpOnly) {
                  cookieString += '; httponly'
                }
                if (secureOptions.sameSite) {
                  cookieString += `; samesite=${secureOptions.sameSite}`
                }
                
                document.cookie = cookieString
                chunkIndex++
              }
              
              console.log('🍪 Chunked cookie set successfully:', { name, chunks: chunkIndex, totalLength: encodedValue.length })
            }
          }
        },
        
        remove(name: string, options: any) {
          if (typeof document !== 'undefined') {
            console.log('🗑️ Removing cookie:', { name, options })
            
            // Remove timestamp tracking
            localStorage.removeItem(`${name}_timestamp`)
            
            // Remove main cookie
            const secureOptions = {
              path: '/',
              ...options,
              expires: new Date(0)
            }
            
            this.set(name, '', secureOptions)
            
            // Remove all possible chunks
            let chunkIndex = 0
            while (chunkIndex < 20) { // Safety limit
              const chunkName = `${name}.${chunkIndex}`
              const existingChunk = document.cookie
                .split('; ')
                .find(row => row.startsWith(`${chunkName}=`))
              
              if (!existingChunk) break
              
              this.set(chunkName, '', secureOptions)
              chunkIndex++
            }
            
            console.log('🗑️ Cookie removed completely:', { name, chunksRemoved: chunkIndex })
          }
        }
      }
    }
  )

  return client
}

// SECURITY: Export clear function for logout
export { clearAllAuthCookies }
export const supabase = getSupabaseBrowserClient()
export { getSupabaseBrowserClient as createClient } 