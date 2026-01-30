import { createContext, useContext, useState, ReactNode } from 'react'
import Modal from '../components/Modal'

interface ModalContextType {
  showModal: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void
  hideModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'success' | 'error' | 'info' | 'warning'>('info')
  const [title, setTitle] = useState<string | undefined>(undefined)

  const showModal = (
    msg: string,
    modalType: 'success' | 'error' | 'info' | 'warning' = 'info',
    modalTitle?: string
  ) => {
    setMessage(msg)
    setType(modalType)
    setTitle(modalTitle)
    setIsOpen(true)
  }

  const hideModal = () => {
    setIsOpen(false)
  }

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={hideModal}
        message={message}
        type={type}
        title={title}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

