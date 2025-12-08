import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const HOSTINGER_API_KEY = 'NnCMQHduGea3nTHSp2Xum3GvzngsfhjyvKCO0jKlfbe9a79b'
const HOSTINGER_API_URL = 'https://api.hostinger.com/v1'
const DOMAIN = 'creavisuel.pro'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, slug } = await req.json()

    let response
    let hostingerUrl

    switch (action) {
      case 'list':
        // List all subdomains
        hostingerUrl = `${HOSTINGER_API_URL}/domains/${DOMAIN}/subdomains`
        response = await fetch(hostingerUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HOSTINGER_API_KEY}`,
            'Content-Type': 'application/json',
          }
        })
        break

      case 'create':
        // Create subdomain
        if (!slug) {
          return new Response(
            JSON.stringify({ success: false, error: 'Slug is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        hostingerUrl = `${HOSTINGER_API_URL}/domains/${DOMAIN}/subdomains`
        response = await fetch(hostingerUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HOSTINGER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subdomain: slug,
            document_root: `/var/www/${slug}.${DOMAIN}`
          })
        })
        break

      case 'delete':
        // Delete subdomain
        if (!slug) {
          return new Response(
            JSON.stringify({ success: false, error: 'Slug is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        hostingerUrl = `${HOSTINGER_API_URL}/domains/${DOMAIN}/subdomains/${slug}`
        response = await fetch(hostingerUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${HOSTINGER_API_KEY}`,
            'Content-Type': 'application/json',
          }
        })
        break

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Parse Hostinger response
    const data = response.ok ? await response.json().catch(() => ({})) : null

    if (!response.ok) {
      const errorData = data || {}
      return new Response(
        JSON.stringify({
          success: false,
          error: errorData.message || `Hostinger API error: ${response.status}`
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: `Action ${action} completed successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Hostinger Proxy Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
