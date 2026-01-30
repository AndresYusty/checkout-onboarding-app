export interface IWompiPort {
  createTransaction(data: WompiTransactionData): Promise<WompiTransactionResponse>;
  getTransaction(transactionId: string): Promise<WompiTransactionResponse>;
}

export interface WompiTransactionData {
  amountInCents: number;
  currency: string;
  customerEmail: string;
  paymentMethod: {
    type: string;
    installments: number;
    token: string;
  };
  reference: string;
  shippingAddress?: {
    addressLine1: string;
    city: string;
    phoneNumber: string;
    region: string;
    country: string;
  };
}

export interface WompiTransactionResponse {
  data: {
    id: string;
    status: string;
    amount_in_cents: number;
    currency: string;
    customer_email: string;
    payment_method: {
      type: string;
      extra: {
        bin: string;
        name: string;
        exp_year: string;
        exp_month: string;
        card_brand: string;
      };
    };
    reference: string;
    created_at: string;
    finalized_at?: string;
  };
}

