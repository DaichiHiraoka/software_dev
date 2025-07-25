import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Modal = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10",
        className
      )}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
        
        {children}
      </div>
    </div>
  )
}

export const ModalHeader = ({ children, className }) => (
  <div className={cn("mb-4 pr-8", className)}>
    {children}
  </div>
)

export const ModalTitle = ({ children, className }) => (
  <h2 className={cn("text-xl font-semibold text-gray-900", className)}>
    {children}
  </h2>
)

export const ModalContent = ({ children, className }) => (
  <div className={cn("mb-6", className)}>
    {children}
  </div>
)

export const ModalFooter = ({ children, className }) => (
  <div className={cn("flex justify-end space-x-3", className)}>
    {children}
  </div>
)