import { Module } from '@nestjs/common';
import { CheckoutController } from './interfaces/rest/controllers/checkout.controller';
import { WompiWebhookController } from './interfaces/rest/controllers/wompi-webhook.controller';
import { TransactionRepository } from './infrastructure/repositories/transaction.repository.impl';
import { ProductRepository } from './infrastructure/repositories/product.repository.impl';
import { CreateTransactionUseCase } from './application/use-cases/checkout/create-transaction.use-case';
import { ProcessCheckoutUseCase } from './application/use-cases/checkout/process-checkout.use-case';
import { WompiAdapter } from './infrastructure/adapters/wompi.adapter';

@Module({
  controllers: [CheckoutController, WompiWebhookController],
  providers: [
    TransactionRepository,
    ProductRepository,
    CreateTransactionUseCase,
    ProcessCheckoutUseCase,
    WompiAdapter,
  ],
  exports: [TransactionRepository],
})
export class CheckoutModule {}

