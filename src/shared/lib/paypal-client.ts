/**
 * PayPal API Client
 * Integration with PayPal for payments and subscriptions
 */

const PAYPAL_CLIENT_ID = 'ATyTZSjNo1qXMpqlHNRPKcfjk2Vtjw86CZCni5pQi13KBgZ3iT1en9xR5UWl38BLfoniP9SF9RvE1BzI';
const PAYPAL_SECRET = 'EMq_YrCF8FJsKsHzBtXrPgBPnXz-oBbnDbWkTDlgzYKubiLHCYORC6AEjMhin6zDznxRUhKgO33zq3lj';
const PAYPAL_API_URL = 'https://api-m.paypal.com'; // Production

interface PayPalOrder {
  id?: string;
  intent: 'CAPTURE';
  purchase_units: {
    reference_id?: string;
    description?: string;
    amount: {
      currency_code: string;
      value: string;
    };
    invoice_id?: string;
  }[];
  application_context?: {
    return_url?: string;
    cancel_url?: string;
    brand_name?: string;
    locale?: string;
    user_action?: 'PAY_NOW' | 'CONTINUE';
  };
}

interface PayPalSubscriptionPlan {
  id?: string;
  product_id?: string;
  name: string;
  description: string;
  billing_cycles: {
    frequency: {
      interval_unit: 'MONTH' | 'YEAR';
      interval_count: number;
    };
    tenure_type: 'REGULAR';
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        currency_code: string;
        value: string;
      };
    };
  }[];
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee_failure_action: 'CONTINUE' | 'CANCEL';
    payment_failure_threshold: number;
  };
}

class PayPalClient {
  private clientId: string;
  private secret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = PAYPAL_CLIENT_ID;
    this.secret = PAYPAL_SECRET;
    this.baseUrl = PAYPAL_API_URL;
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = btoa(`${this.clientId}:${this.secret}`);
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PayPal Auth Error: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1min before expiry

    return this.accessToken;
  }

  /**
   * Make authenticated request to PayPal API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create a PayPal order for invoice payment
   */
  async createOrder(invoice: {
    id: string;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; approvalUrl: string }> {
    const orderData: PayPalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: invoice.id,
          description: invoice.description,
          amount: {
            currency_code: 'EUR',
            value: invoice.amount.toFixed(2),
          },
          invoice_id: invoice.id,
        },
      ],
      application_context: {
        return_url: invoice.returnUrl,
        cancel_url: invoice.cancelUrl,
        brand_name: 'CréaVisuel',
        locale: 'fr-FR',
        user_action: 'PAY_NOW',
      },
    };

    const order = await this.request<any>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

    return {
      id: order.id,
      approvalUrl: approvalUrl || '',
    };
  }

  /**
   * Capture payment for an approved order
   */
  async captureOrder(orderId: string): Promise<any> {
    return this.request(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    });
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    return this.request(`/v2/checkout/orders/${orderId}`);
  }

  /**
   * Create a subscription plan
   */
  async createSubscriptionPlan(plan: {
    name: string;
    description: string;
    price: number;
    interval: 'MONTH' | 'YEAR';
  }): Promise<string> {
    // First create a product
    const product = await this.request<any>('/v1/catalogs/products', {
      method: 'POST',
      body: JSON.stringify({
        name: plan.name,
        description: plan.description,
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    });

    // Then create billing plan
    const planData: PayPalSubscriptionPlan = {
      product_id: product.id,
      name: plan.name,
      description: plan.description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: plan.interval,
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              currency_code: 'EUR',
              value: plan.price.toFixed(2),
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    };

    const billingPlan = await this.request<any>('/v1/billing/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });

    return billingPlan.id;
  }

  /**
   * Create a subscription
   */
  async createSubscription(planId: string, returnUrl: string, cancelUrl: string): Promise<{ id: string; approvalUrl: string }> {
    const subscription = await this.request<any>('/v1/billing/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'CréaVisuel',
          locale: 'fr-FR',
          user_action: 'SUBSCRIBE_NOW',
        },
      }),
    });

    const approvalUrl = subscription.links.find((link: any) => link.rel === 'approve')?.href;

    return {
      id: subscription.id,
      approvalUrl: approvalUrl || '',
    };
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    return this.request(`/v1/billing/subscriptions/${subscriptionId}`);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    await this.request(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

// Export singleton instance
export const paypal = new PayPalClient();

export type { PayPalOrder, PayPalSubscriptionPlan };
