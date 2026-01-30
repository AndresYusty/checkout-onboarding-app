import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { IWompiPort, WompiTransactionData, WompiTransactionResponse, WompiCardData, WompiTokenResponse } from '../../application/ports/wompi.port';

@Injectable()
export class WompiAdapter implements IWompiPort {
  private readonly axiosInstance: AxiosInstance;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY') || '';
    this.privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY') || '';
    this.baseUrl = this.configService.get<string>('WOMPI_BASE_URL') || 'https://api-sandbox.co.uat.wompi.dev/v1';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getAcceptanceToken(): Promise<string> {
    try {
      const response = await this.axiosInstance.get(`/merchants/${this.publicKey}`, {
        headers: {
          Authorization: `Bearer ${this.publicKey}`,
        },
      });

      return response.data.data.presigned_acceptance.acceptance_token;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message;
      throw new Error(`Wompi Acceptance Token Error: ${errorMessage}`);
    }
  }

  private generateWompiSignature(
    reference: string,
    amountInCents: number,
    currency: string,
    integrityKey: string
  ): string {
    // Formato: reference + amount_in_cents + currency + integrity_key
    const raw = `${reference}${amountInCents}${currency}${integrityKey}`;
    return crypto
      .createHash('sha256')
      .update(raw)
      .digest('hex');
  }

  async tokenizeCard(cardData: WompiCardData): Promise<WompiTokenResponse> {
    try {
      const response = await this.axiosInstance.post(
        '/tokens/cards',
        {
          number: cardData.number,
          exp_month: cardData.expMonth,
          exp_year: cardData.expYear,
          cvc: cardData.cvc,
          card_holder: cardData.cardHolder,
        },
        {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message;
      throw new Error(`Wompi Tokenization Error: ${errorMessage}`);
    }
  }

  async createTransaction(data: WompiTransactionData): Promise<WompiTransactionResponse> {
    try {
      // Obtener acceptance_token (OBLIGATORIO para Wompi)
      const acceptanceToken = await this.getAcceptanceToken();

      // Asegurar que amount_in_cents sea un entero (sin decimales)
      const amountInCents = Math.round(data.amountInCents);

      // Generar firma de integridad (OBLIGATORIO para Wompi)
      const integrityKey = this.configService.get<string>('WOMPI_INTEGRITY_SECRET') || '';
      const signature = this.generateWompiSignature(
        data.reference,
        amountInCents,
        data.currency,
        integrityKey
      );

      // Payload mínimo para Wompi (shipping_address NO es obligatorio y causa 422 en sandbox)
      const transactionData: any = {
        amount_in_cents: amountInCents,
        currency: data.currency,
        customer_email: data.customerEmail,
        payment_method: {
          type: data.paymentMethod.type,
          installments: data.paymentMethod.installments,
          token: data.paymentMethod.token,
        },
        reference: data.reference,
        acceptance_token: acceptanceToken, // OBLIGATORIO
        signature: signature, // OBLIGATORIO - Firma de integridad SHA256
      };

      // NOTA: shipping_address NO se envía a Wompi
      // La dirección se guarda en el backend pero no es requerida por Wompi para autorización
      // Enviarla causa errores 422 en sandbox por validaciones estrictas

      console.log('WOMPI PAYLOAD:', JSON.stringify(transactionData, null, 2));

      const response = await this.axiosInstance.post(
        '/transactions',
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      // Log detallado del error para debugging
      console.error('WOMPI ERROR:', JSON.stringify(error.response?.data, null, 2));
      console.error('Wompi API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Extraer mensajes de validación específicos si existen
      const validationMessages = error.response?.data?.messages;
      if (validationMessages) {
        console.error('Validation Errors:', JSON.stringify(validationMessages, null, 2));
      }
      
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message;
      throw new Error(`Wompi API Error: ${errorMessage}`);
    }
  }

  async getTransaction(transactionId: string): Promise<WompiTransactionResponse> {
    try {
      const response = await this.axiosInstance.get(`/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.publicKey}`,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Wompi API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

}

