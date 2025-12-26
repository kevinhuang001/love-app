const getBaseUrl = () => {
  const { protocol, hostname, port } = window.location
  if (port === '5173') {
    return `${protocol}//${hostname}:3000`
  }
  return `${protocol}//${hostname}:${port}`
}

export const BASE_URL = getBaseUrl()

export const apiFetch = async <T = any>(endpoint: string, options: any = {}): Promise<T> => {
  const token = localStorage.getItem('token')

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Auto-set Content-Type for JSON, but let browser handle FormData
  if (!headers['Content-Type'] && options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Stringify body if it's an object and we're sending JSON
  if (headers['Content-Type'] === 'application/json' && options.body && typeof options.body !== 'string') {
    options.body = JSON.stringify(options.body)
  }

  // Debug log - Disabled per request to reduce console noise
  /*
  if (import.meta.env.DEV) {
    console.log(`🚀 [API] ${options.method || 'GET'} ${endpoint}`, {
      headers: { ...headers },
      body: options.body,
    })
  }
  */

  // IMPORTANT: Remove any Content-Type if body is undefined or null for GET/DELETE
  if (!options.body) {
    delete headers['Content-Type']
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      // Only log actual errors, not unimportant info
      // console.error(`❌ [API Error] ${endpoint}:`, data.error || response.statusText)
      throw new Error(data.error || `Request failed with status ${response.status}`)
    }

    return data as T
  } catch (error: any) {
    // Only log critical network errors
    /*
    if (error.name !== 'TypeError') { 
      console.error(`❌ [API Network Error] ${endpoint}:`, error.message)
    }
    */
    throw error
  }
}

export const processUrl = (url: string | null) => {
  if (!url) return ''
  if (url.startsWith('http')) {
    // If it already has a timestamp, don't add another one
    if (url.includes('?t=')) return url
    return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
  }
  return `${BASE_URL}${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
}

export const getCaptchaUrl = () => `${BASE_URL}/api/auth/captcha?t=${Date.now()}`
