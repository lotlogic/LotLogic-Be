import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import Stripe from 'stripe';

const ACT_TIME_ZONE = 'Australia/Sydney';

export const PAID_REPORT_STRIPE_METADATA_KEYS = [
  'reportId',
  'clientName',
  'clientEmail',
  'clientPhone',
  'address',
  'suburb',
  'blockSizeM2',
  'zone',
  'intention',
  'stripePaymentId',
] as const;

export type PaidReportStripeMetadataKey =
  (typeof PAID_REPORT_STRIPE_METADATA_KEYS)[number];

export type PaidReportStripeMetadata = Partial<
  Record<PaidReportStripeMetadataKey, unknown>
>;

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject('STRIPE_API_KEY')
    private readonly apiKey: string,
    @Inject('STRIPE_CHECKOUT_PRICE_ID')
    private readonly checkoutPriceId: string,
  ) {
    this.stripe = new Stripe(this.apiKey, {});
  }

  // Stripe-Hosted Checkout Session
  async createCheckoutSession(params: {
    customerEmail: string;
    site: string;
    metadata?: PaidReportStripeMetadata;
    intention?: string;
  }): Promise<string | null> {
    try {
      const checkoutPriceId = this.checkoutPriceId?.trim();
      if (!checkoutPriceId) {
        throw new Error('Missing env var STRIPE_CHECKOUT_PRICE_ID');
      }

      const reportMetadata = this.normalizePaidReportMetadata(params.metadata);
      const metadata: Record<string, string> = {
        ...reportMetadata,
        intention: this.normalizeToMetadataValue(params.intention),
      };

      const session = await this.stripe.checkout.sessions.create({
        customer_email: params.customerEmail,
        client_reference_id: reportMetadata.reportId || undefined,
        line_items: [
          {
            quantity: 1,
            price: checkoutPriceId,
          },
        ],
        payment_intent_data: {
          // transaction dashboard metadata content
          metadata,
        },
        metadata,
        mode: 'payment',
        success_url: params.site + `/checkout?success={CHECKOUT_SESSION_ID}`,
        cancel_url: params.site + `/checkout?cancel={CHECKOUT_SESSION_ID}`,
      });

      this.logger.log('Checkout session created successfully');
      return session.url;
    } catch (error) {
      this.logger.error('Failed to create checkout session', error.stack);
      throw error;
    }
  }

  generateReportId(now = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-AU', {
      timeZone: ACT_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year =
      parts.find((part) => part.type === 'year')?.value || '0000';
    const month =
      parts.find((part) => part.type === 'month')?.value || '01';
    const day = parts.find((part) => part.type === 'day')?.value || '01';
    const suffix = String(randomInt(1000, 10000));
    return `BP-${year}${month}${day}-${suffix}`;
  }

  constructWebhookEvent(
    rawBody: Buffer,
    signatureHeader: string,
    webhookSecret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      webhookSecret,
    );
  }

  async extractPaidReportPayloadFromEvent(
    event: Stripe.Event,
  ): Promise<Record<PaidReportStripeMetadataKey, string> | null> {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const fallbackEmail =
        session.customer_email || session.customer_details?.email || '';

      let combinedMetadata: Stripe.Metadata | null | undefined =
        session.metadata;

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      if (paymentIntentId) {
        try {
          const paymentIntent =
            await this.stripe.paymentIntents.retrieve(paymentIntentId);

          combinedMetadata = {
            ...(paymentIntent.metadata || {}),
            ...(session.metadata || {}),
          };
        } catch (error) {
          this.logger.warn(
            `Failed to retrieve payment_intent metadata for session ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const payload = this.buildPaidReportPayload(combinedMetadata, fallbackEmail);

      if (paymentIntentId) {
        payload.stripePaymentId = paymentIntentId;
      }

      return payload;
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const fallbackEmail = paymentIntent.receipt_email || '';
      const payload = this.buildPaidReportPayload(
        paymentIntent.metadata,
        fallbackEmail,
      );
      payload.stripePaymentId = paymentIntent.id;
      return payload;
    }

    return null;
  }

  private normalizePaidReportMetadata(
    input: PaidReportStripeMetadata | undefined,
  ): Record<PaidReportStripeMetadataKey, string> {
    const metadata = {} as Record<PaidReportStripeMetadataKey, string>;
    for (const key of PAID_REPORT_STRIPE_METADATA_KEYS) {
      metadata[key] = this.normalizeToMetadataValue(input?.[key]);
    }
    return metadata;
  }

  private buildPaidReportPayload(
    metadata: Stripe.Metadata | null | undefined,
    fallbackEmail: string,
  ): Record<PaidReportStripeMetadataKey, string> {
    const payload = {} as Record<PaidReportStripeMetadataKey, string>;
    for (const key of PAID_REPORT_STRIPE_METADATA_KEYS) {
      payload[key] = this.normalizeToMetadataValue(metadata?.[key]);
    }

    if (!payload.clientEmail && fallbackEmail) {
      payload.clientEmail = fallbackEmail;
    }

    return payload;
  }

  private normalizeToMetadataValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // Get Products
  async getProducts(): Promise<Stripe.Product[]> {
    try {
      const products = await this.stripe.products.list();
      this.logger.log('Products fetched successfully');
      return products.data;
    } catch (error) {
      this.logger.error('Failed to fetch products', error.stack);
      throw error;
    }
  }

  // Get Customers
  async getCustomers() {
    try {
      const customers = await this.stripe.customers.list({});
      this.logger.log('Customers fetched successfully');
      return customers.data;
    } catch (error) {
      this.logger.error('Failed to fetch products', error.stack);
      throw error;
    }
  }

  // Accept Payments (Create Payment Intent)
  async createPaymentIntent(
    amount: number,
    currency: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
      });
      this.logger.log(
        `PaymentIntent created successfully with amount: ${amount} ${currency}`,
      );
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create PaymentIntent', error.stack);
      throw error;
    }
  }

  // Subscriptions (Create Subscription)
  async createSubscription(
    customerId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
      });
      this.logger.log(
        `Subscription created successfully for customer ${customerId}`,
      );
      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription', error.stack);
      throw error;
    }
  }

  // Customer Management (Create Customer)
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({ email, name });
      this.logger.log(`Customer created successfully with email: ${email}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to create customer', error.stack);
      throw error;
    }
  }

  // Product & Pricing Management (Create Product with Price)
  async createProduct(
    name: string,
    description: string,
    price: number,
  ): Promise<Stripe.Product> {
    try {
      const product = await this.stripe.products.create({ name, description });
      await this.stripe.prices.create({
        product: product.id,
        unit_amount: price * 100, // amount in cents
        currency: 'usd',
      });
      this.logger.log(`Product created successfully: ${name}`);
      return product;
    } catch (error) {
      this.logger.error('Failed to create product', error.stack);
      throw error;
    }
  }

  // Refunds (Process Refund)
  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
      this.logger.log(
        `Refund processed successfully for PaymentIntent: ${paymentIntentId}`,
      );
      return refund;
    } catch (error) {
      this.logger.error('Failed to process refund', error.stack);
      throw error;
    }
  }

  // Payment Method Integration (Attach Payment Method)
  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      this.logger.log(
        `Payment method ${paymentMethodId} attached to customer ${customerId}`,
      );
    } catch (error) {
      this.logger.error('Failed to attach payment method', error.stack);
      throw error;
    }
  }

  // Payment Links
  async createPaymentLink(priceId: string): Promise<Stripe.PaymentLink> {
    try {
      const paymentLink = await this.stripe.paymentLinks.create({
        line_items: [{ price: priceId, quantity: 1 }],
      });
      this.logger.log('Payment link created successfully');
      return paymentLink;
    } catch (error) {
      this.logger.error('Failed to create payment link', error.stack);
      throw error;
    }
  }

  // Reports and Analytics (Retrieve Balance)
  async getBalance(): Promise<Stripe.Balance> {
    try {
      const balance = await this.stripe.balance.retrieve();
      this.logger.log('Balance retrieved successfully');
      return balance;
    } catch (error) {
      this.logger.error('Failed to retrieve balance', error.stack);
      throw error;
    }
  }
}
