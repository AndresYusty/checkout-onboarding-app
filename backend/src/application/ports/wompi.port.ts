export interface IWompiPort {
  getAcceptanceToken(): Promise<string>;
  tokenizeCard(cardData: WompiCardData): Promise<WompiTokenResponse>;
  createTransaction(data: WompiTransactionData): Promise<WompiTransactionResponse>;
  getTransaction(transactionId: string): Promise<WompiTransactionResponse>;
}

export interface WompiCardData {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardHolder: string;
}

export interface WompiTokenResponse {
  data: {
    id: string;
  };
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
  // shippingAddress se omite - no es obligatorio y causa errores 422 en sandbox
  // La dirección se guarda en el backend pero no se envía a Wompi
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

