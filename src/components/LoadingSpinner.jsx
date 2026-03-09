export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-12 h-12 border-3',
  }

  return (
    <div
      className={`${sizes[size]} rounded-full border-gray-200 border-t-primary-600 animate-spin ${className}`}
      role="status"
      aria-label="Đang tải..."
    />
  )
}
