/**
 * Dolibarr API Client
 * Integration with Dolibarr ERP for billing and invoicing
 */

const DOLIBARR_API_URL = 'https://b2santos.com/api/index.php';
const DOLIBARR_API_KEY = 'XdP2mXmwRUM1gtq1UQ373t90uV9TStw5';

interface DolibarrThirdParty {
  id?: number;
  name: string;
  email: string;
  client: number; // 1 = client, 0 = not a client
  code_client?: string;
  address?: string;
  zip?: string;
  town?: string;
  country_code?: string;
  phone?: string;
  url?: string;
  note_public?: string;
  note_private?: string;
}

interface DolibarrInvoice {
  id?: number;
  socid: number; // Third party ID
  date: number; // Unix timestamp
  date_lim_reglement?: number; // Due date
  cond_reglement_id?: number; // Payment condition ID
  mode_reglement_id?: number; // Payment mode ID
  note_public?: string;
  note_private?: string;
  lines: DolibarrInvoiceLine[];
}

interface DolibarrInvoiceLine {
  desc: string; // Description
  subprice: number; // Unit price
  qty: number; // Quantity
  tva_tx: number; // VAT rate (e.g., 20 for 20%)
  product_type?: number; // 0 = product, 1 = service
}

class DolibarrClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = DOLIBARR_API_URL;
    this.apiKey = DOLIBARR_API_KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'DOLAPIKEY': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dolibarr API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create a third party (customer) in Dolibarr
   */
  async createThirdParty(data: DolibarrThirdParty): Promise<number> {
    const result = await this.request<number>('/thirdparties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  }

  /**
   * Get third party by email
   */
  async getThirdPartyByEmail(email: string): Promise<DolibarrThirdParty | null> {
    try {
      const result = await this.request<DolibarrThirdParty[]>(`/thirdparties?sqlfilters=(t.email:=:'${email}')`);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching third party:', error);
      return null;
    }
  }

  /**
   * Get third party by ID
   */
  async getThirdParty(id: number): Promise<DolibarrThirdParty> {
    return this.request<DolibarrThirdParty>(`/thirdparties/${id}`);
  }

  /**
   * Update third party
   */
  async updateThirdParty(id: number, data: Partial<DolibarrThirdParty>): Promise<void> {
    await this.request(`/thirdparties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create an invoice in Dolibarr
   */
  async createInvoice(data: DolibarrInvoice): Promise<number> {
    const result = await this.request<number>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  }

  /**
   * Validate an invoice (make it official)
   */
  async validateInvoice(invoiceId: number): Promise<void> {
    await this.request(`/invoices/${invoiceId}/validate`, {
      method: 'POST',
    });
  }

  /**
   * Get invoices for a third party
   */
  async getInvoicesByThirdParty(thirdPartyId: number): Promise<any[]> {
    return this.request<any[]>(`/invoices?sortfield=t.datec&sortorder=DESC&sqlfilters=(t.fk_soc:=:${thirdPartyId})`);
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: number): Promise<any> {
    return this.request(`/invoices/${invoiceId}`);
  }

  /**
   * Generate PDF for invoice
   */
  async getInvoicePDF(invoiceId: number): Promise<Blob> {
    const url = `${this.baseUrl}/documents/download?modulepart=invoice&original_file=${invoiceId}/${invoiceId}.pdf&DOLAPIKEY=${this.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download invoice PDF: ${response.statusText}`);
    }
    return response.blob();
  }

  /**
   * Create or update a customer in Dolibarr from CréaVisuel tenant
   */
  async syncTenant(tenant: {
    id: string;
    name: string;
    slug: string;
    ownerEmail: string;
    phone?: string;
  }): Promise<number> {
    // Check if customer already exists
    const existing = await this.getThirdPartyByEmail(tenant.ownerEmail);

    if (existing && existing.id) {
      // Update existing customer
      await this.updateThirdParty(existing.id, {
        name: tenant.name,
        url: `https://${tenant.slug}.creavisuel.pro`,
        note_private: `CréaVisuel Tenant ID: ${tenant.id}`,
      });
      return existing.id;
    } else {
      // Create new customer
      const thirdPartyData: DolibarrThirdParty = {
        name: tenant.name,
        email: tenant.ownerEmail,
        client: 1, // Mark as customer
        code_client: tenant.slug.toUpperCase(),
        country_code: 'FR',
        url: `https://${tenant.slug}.creavisuel.pro`,
        note_public: `Client CréaVisuel SaaS - ${tenant.name}`,
        note_private: `CréaVisuel Tenant ID: ${tenant.id}\nSlug: ${tenant.slug}`,
        phone: tenant.phone,
      };

      const newId = await this.createThirdParty(thirdPartyData);
      return newId;
    }
  }

  /**
   * Create a subscription invoice for a tenant
   */
  async createSubscriptionInvoice(
    thirdPartyId: number,
    plan: {
      name: string;
      price: number;
      period: string; // "monthly" or "yearly"
    }
  ): Promise<number> {
    const today = Math.floor(Date.now() / 1000);
    const dueDate = today + (30 * 24 * 60 * 60); // 30 days from now

    const invoiceData: DolibarrInvoice = {
      socid: thirdPartyId,
      date: today,
      date_lim_reglement: dueDate,
      cond_reglement_id: 1, // Payment condition: immediate
      mode_reglement_id: 6, // Payment mode: bank transfer (adjust as needed)
      note_public: `Abonnement CréaVisuel SaaS - Plan ${plan.name}`,
      note_private: `Facturation automatique depuis CréaVisuel SaaS`,
      lines: [
        {
          desc: `Abonnement ${plan.name} - ${plan.period === 'monthly' ? 'Mensuel' : 'Annuel'}`,
          subprice: plan.price,
          qty: 1,
          tva_tx: 20, // 20% VAT (adjust for your region)
          product_type: 1, // Service
        },
      ],
    };

    const invoiceId = await this.createInvoice(invoiceData);

    // Auto-validate the invoice
    await this.validateInvoice(invoiceId);

    return invoiceId;
  }
}

// Export singleton instance
export const dolibarr = new DolibarrClient();

export type { DolibarrThirdParty, DolibarrInvoice, DolibarrInvoiceLine };
