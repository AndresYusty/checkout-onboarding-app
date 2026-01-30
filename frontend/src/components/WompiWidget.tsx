import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    WidgetCheckout: any
  }
}

interface WompiWidgetProps {
  publicKey: string
  currency: string
  amountInCents: number
  reference: string
  signature: string
  redirectUrl?: string
  shippingAddress?: any
  customerData?: any
  taxInCents?: {
    vat?: number
    consumption?: number
  }
  onSuccess?: (result: any) => void
  onError?: (error: any) => void
}

export default function WompiWidget({
  publicKey,
  currency,
  amountInCents,
  reference,
  signature,
  redirectUrl,
  shippingAddress,
  customerData,
  taxInCents,
  onSuccess,
  onError,
}: WompiWidgetProps) {
  const checkoutRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    // Cargar el script de Wompi si no está cargado
    if (!scriptLoadedRef.current) {
      // Verificar si el script ya existe
      const existingScript = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]')
      if (existingScript) {
        scriptLoadedRef.current = true
        initializeCheckout()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.wompi.co/widget.js'
      script.async = true
      script.onload = () => {
        scriptLoadedRef.current = true
        initializeCheckout()
      }
      script.onerror = () => {
        console.error('Error loading Wompi widget script')
        onError?.({ message: 'Error al cargar el widget de Wompi' })
      }
      document.head.appendChild(script)
    } else {
      initializeCheckout()
    }

    return () => {
      // Cleanup si es necesario
    }
  }, [publicKey, currency, amountInCents, reference, signature])

  const initializeCheckout = () => {
    if (!window.WidgetCheckout) {
      console.error('WidgetCheckout not available')
      return false
    }

    try {
      const config: any = {
        currency,
        amountInCents,
        reference,
        publicKey,
        signature: {
          integrity: signature,
        },
      }

      if (redirectUrl) {
        config.redirectUrl = redirectUrl
      }

      if (taxInCents) {
        config.taxInCents = taxInCents
      }

      if (customerData) {
        config.customerData = customerData
      }

      if (shippingAddress) {
        config.shippingAddress = shippingAddress
      }

      console.log('Initializing Wompi checkout with config:', config)
      checkoutRef.current = new window.WidgetCheckout(config)
      console.log('Checkout instance created:', checkoutRef.current)
      return true
    } catch (error: any) {
      console.error('Error initializing Wompi checkout:', error)
      onError?.(error)
      return false
    }
  }

  const openCheckout = () => {
    console.log('Opening Wompi checkout...')
    console.log('Current state:', {
      scriptLoaded: scriptLoadedRef.current,
      widgetAvailable: !!window.WidgetCheckout,
      checkoutInstance: !!checkoutRef.current,
    })
    
    // Verificar que el script esté cargado
    if (!window.WidgetCheckout) {
      console.error('WidgetCheckout not available, waiting for script...')
      onError?.({ message: 'El widget de Wompi no está disponible. Por favor recarga la página.' })
      return
    }

    // Si no hay instancia, inicializar
    if (!checkoutRef.current) {
      console.log('Initializing checkout...')
      const initialized = initializeCheckout()
      if (!initialized) {
        console.error('Failed to initialize checkout')
        onError?.({ message: 'Error al inicializar el widget de pago' })
        return
      }
    }

    if (checkoutRef.current) {
      console.log('Opening checkout widget...')
      try {
        checkoutRef.current.open((result: any) => {
          console.log('Checkout result:', result)
          if (result && result.transaction) {
            onSuccess?.(result)
          } else if (result && result.error) {
            onError?.(result)
          } else {
            // Si no hay transacción pero tampoco hay error, podría ser que el usuario canceló
            console.log('Checkout closed without transaction')
          }
        })
      } catch (error: any) {
        console.error('Error opening checkout:', error)
        onError?.(error)
      }
    } else {
      console.error('Checkout instance not available after initialization')
      onError?.({ message: 'Error al inicializar el widget de pago' })
    }
  }

  return (
    <button
      onClick={openCheckout}
      className="w-full bg-green-600 text-white py-4 px-6 rounded-md font-medium text-lg hover:bg-green-700 transition-colors"
    >
      Pagar con Wompi
    </button>
  )
}

