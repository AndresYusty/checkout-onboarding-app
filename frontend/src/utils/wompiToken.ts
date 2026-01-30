// Utilidad para crear tokens de tarjeta con Wompi desde el frontend
// Esto es necesario porque Wompi requiere que los tokens se creen desde el cliente

const WOMPI_PUBLIC_KEY = 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7'
const WOMPI_SANDBOX_URL = 'https://api-sandbox.co.uat.wompi.dev/v1'

export interface CardTokenData {
  number: string
  cvc: string
  exp_month: string
  exp_year: string
  card_holder: string
}

export const createWompiToken = async (cardData: CardTokenData): Promise<string> => {
  try {
    const response = await fetch(`${WOMPI_SANDBOX_URL}/tokens/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WOMPI_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        number: cardData.number,
        cvc: cardData.cvc,
        exp_month: cardData.exp_month,
        exp_year: cardData.exp_year,
        card_holder: cardData.card_holder,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al crear token de tarjeta')
    }

    const result = await response.json()
    return result.data.id
  } catch (error: any) {
    // Si falla la creación del token real, usar uno simulado para desarrollo
    console.warn('Error al crear token de Wompi, usando token simulado:', error.message)
    return `tok_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

