interface CardLogoProps {
  brand: 'VISA' | 'MASTERCARD' | 'UNKNOWN'
}

export function CardLogo({ brand }: CardLogoProps) {
  if (brand === 'VISA') {
    return (
      <div className="flex items-center">
        <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="25" rx="4" fill="#1434CB"/>
          <path d="M17.5 8.5L15 16.5H12.5L14.5 8.5H17.5ZM25.5 8.5L23.5 16.5H21L23 8.5H25.5ZM20 8.5C18.5 8.5 17.5 9 17 9.5L16.5 10.5C16 11 15.5 11 15 11H14.5L14 12.5H15.5C16 12.5 16.5 12.5 17 12L17.5 12.5C18 13 18.5 13.5 20 13.5C21.5 13.5 22.5 13 23 12.5L23.5 12C24 11.5 24.5 11.5 25 11.5H25.5L26 10H25C24.5 10 24 10 23.5 9.5L23 9C22.5 8.5 21.5 8.5 20 8.5Z" fill="white"/>
        </svg>
      </div>
    )
  }

  if (brand === 'MASTERCARD') {
    return (
      <div className="flex items-center">
        <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="25" rx="4" fill="#000"/>
          <circle cx="15" cy="12.5" r="6" fill="#EB001B"/>
          <circle cx="25" cy="12.5" r="6" fill="#F79E1B"/>
          <path d="M20 8.5C18.5 9.5 17.5 10.8 17.5 12.5C17.5 14.2 18.5 15.5 20 16.5C21.5 15.5 22.5 14.2 22.5 12.5C22.5 10.8 21.5 9.5 20 8.5Z" fill="#FF5F00"/>
        </svg>
      </div>
    )
  }

  return null
}

