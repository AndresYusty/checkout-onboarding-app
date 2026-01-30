import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { IWompiPort, WompiTransactionData, WompiTransactionResponse } from '../../application/ports/wompi.port';

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

  async createTransaction(data: WompiTransactionData): Promise<WompiTransactionResponse> {
    try {
      // En Wompi, el token se crea desde el frontend usando la public key
      // El token ya viene del frontend, solo lo usamos directamente
      const transactionData: any = {
        amount_in_cents: data.amountInCents,
        currency: data.currency,
        customer_email: data.customerEmail,
        payment_method: {
          type: data.paymentMethod.type,
          installments: data.paymentMethod.installments,
          token: data.paymentMethod.token,
        },
        reference: data.reference,
      };

      // Agregar dirección de envío si existe
      if (data.shippingAddress) {
        transactionData.shipping_address = {
          address_line_1: data.shippingAddress.addressLine1,
          city: data.shippingAddress.city,
          phone_number: data.shippingAddress.phoneNumber,
          region: data.shippingAddress.region,
          country: data.shippingAddress.country,
        };
      }

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

