import { Body, Controller, Get, Post } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Get('products')
  async getProducts() {
    return this.stripeService.getProducts();
  }

  @Get('customers')
  async getCustomers() {
    return this.stripeService.getCustomers();
  }

  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body() body: { amount: number; currency: string },
  ) {
    const { amount, currency } = body;
    return this.stripeService.createPaymentIntent(amount, currency);
  }

  @Post('subscriptions')
  async createSubscription(
    @Body() body: { customerId: string; priceId: string },
  ) {
    const { customerId, priceId } = body;
    return this.stripeService.createSubscription(customerId, priceId);
  }

  @Post('customers')
  async createCustomer(@Body() body: { email: string; name: string }) {
    return this.stripeService.createCustomer(body.email, body.name);
  }

  @Post('products')
  async createProduct(
    @Body() body: { name: string; description: string; price: number },
  ) {
    return this.stripeService.createProduct(
      body.name,
      body.description,
      body.price,
    );
  }

  @Post('refunds')
  async refundPayment(@Body() body: { paymentIntentId: string }) {
    return this.stripeService.refundPayment(body.paymentIntentId);
  }

  @Post('payment-links')
  async createPaymentLink(@Body() body: { priceId: string }) {
    return this.stripeService.createPaymentLink(body.priceId);
  }

  @Get('balance')
  async getBalance() {
    return this.stripeService.getBalance();
  }
}
