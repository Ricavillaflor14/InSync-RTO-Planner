import { useEffect } from 'react'

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onRemove: (id: string) => void;
}

const Toast = ({ id, message, type, duration = 5000, onRemove }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onRemove])

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600'
      case 'error':
        return 'bg-red-500 text-white border-red-600'
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600'
      case 'info':
        return 'bg-blue-500 text-white border-blue-600'
      default:
        return 'bg-gray-500 text-white border-gray-600'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }

  return (
    <div className={`
      flex items-center justify-between px-4 py-3 rounded-lg border-2 shadow-lg
      transform transition-all duration-300 ease-in-out
      ${getToastStyles()}
    `}>
      <div className="flex items-center space-x-3">
        <span className="text-lg font-bold">{getIcon()}</span>
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="ml-4 text-lg font-bold hover:opacity-75 transition-opacity"
      >
        ×
      </button>
    </div>
  )
}

export default Toast