/**
 * Hostinger API Client
 * Docs: https://developers.hostinger.com/
 *
 * NOTE: Direct API calls disabled due to CORS.
 * Subdomains must be created manually via SSH or Hostinger panel for now.
 * TODO: Implement backend proxy to avoid CORS issues.
 */

const HOSTINGER_API_KEY = 'NnCMQHduGea3nTHSp2Xum3GvzngsfhjyvKCO0jKlfbe9a79b';
const HOSTINGER_API_URL = 'https://api.hostinger.com/v1';
const DOMAIN = 'creavisuel.pro';

// Temporary: Mock mode to bypass CORS
const MOCK_MODE = true;

interface SubdomainCreateParams {
  subdomain: string;
  domainId?: string;
}

interface HostingerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a subdomain on Hostinger
 */
export async function createSubdomain(slug: string): Promise<HostingerResponse> {
  if (MOCK_MODE) {
    // Mock mode: Return success without actual API call
    console.log(`[MOCK] Would create subdomain: ${slug}.${DOMAIN}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    return {
      success: true,
      data: { subdomain: slug, domain: DOMAIN },
      message: `Subdomain ${slug}.${DOMAIN} marqué comme créé (mode simulation - créer manuellement via Hostinger panel)`
    };
  }

  try {
    const response = await fetch(`${HOSTINGER_API_URL}/domains/${DOMAIN}/subdomains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subdomain: slug,
        document_root: `/var/www/${slug}.${DOMAIN}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      message: `Subdomain ${slug}.${DOMAIN} created successfully`
    };
  } catch (error: any) {
    console.error('Hostinger API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create subdomain'
    };
  }
}

/**
 * Delete a subdomain from Hostinger
 */
export async function deleteSubdomain(slug: string): Promise<HostingerResponse> {
  if (MOCK_MODE) {
    // Mock mode: Return success without actual API call
    console.log(`[MOCK] Would delete subdomain: ${slug}.${DOMAIN}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    return {
      success: true,
      message: `Subdomain ${slug}.${DOMAIN} marqué comme supprimé (mode simulation - supprimer manuellement via Hostinger panel)`
    };
  }

  try {
    const response = await fetch(`${HOSTINGER_API_URL}/domains/${DOMAIN}/subdomains/${slug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: true,
      message: `Subdomain ${slug}.${DOMAIN} deleted successfully`
    };
  } catch (error: any) {
    console.error('Hostinger API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete subdomain'
    };
  }
}

/**
 * List all subdomains
 */
export async function listSubdomains(): Promise<HostingerResponse> {
  if (MOCK_MODE) {
    // Mock mode: Return empty list (all subdomains assumed to exist)
    console.log(`[MOCK] Would list subdomains for ${DOMAIN}`);
    return {
      success: true,
      data: []
    };
  }

  try {
    const response = await fetch(`${HOSTINGER_API_URL}/domains/${DOMAIN}/subdomains`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Hostinger API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list subdomains'
    };
  }
}

/**
 * Check if a subdomain already exists
 */
export async function subdomainExists(slug: string): Promise<boolean> {
  if (MOCK_MODE) {
    // Mock mode: Assume all client subdomains don't exist yet (need manual creation)
    console.log(`[MOCK] Checking subdomain: ${slug}.${DOMAIN} - returning false`);
    return false;
  }

  const result = await listSubdomains();
  if (!result.success || !result.data) return false;

  const subdomains = Array.isArray(result.data) ? result.data : result.data.subdomains || [];
  return subdomains.some((sd: any) => sd.name === slug || sd.subdomain === slug);
}

/**
 * Generate a unique slug from company name
 */
export function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  // Must be 3-63 characters, lowercase alphanumeric and hyphens, no leading/trailing hyphens
  return /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(slug);
}
