import clsx from 'clsx'

const sizes = {
  icon: 'p-0.5 text-xs rounded',
  xs: 'px-2.5 py-1.5 text-xs rounded',
  sm: 'px-3 py-2 text-sm leading-4 rounded-md',
  default: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-4 py-2 text-base rounded-md',
  xl: 'px-6 py-3 text-base rounded-md',
}
const colors = {
  primary: {
    primary:
      'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    secondary:
      'text-primary-700 bg-primary-100 hover:bg-primary-200 focus:ring-primary-500',
  },
  red: {
    primary: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    secondary: 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500',
  },
  rose: {
    primary: 'text-white bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    secondary:
      'text-rose-700 bg-rose-100 hover:bg-rose-200 focus:ring-rose-500',
  },
}

const LoadingIcon = ({ className, ...props }: { className: string }) => (
  <svg
    className={clsx('h-5 w-5 text-white', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

export interface PropTypes
  extends Omit<
    React.PropsWithChildren<
      React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
      >
    >,
    'size'
  > {
  size?: keyof typeof sizes
  color?: keyof typeof colors
  secondary?: boolean
  icon?: React.ElementType
  className?: string
  loading?: boolean

  onClick?(event: React.MouseEvent<HTMLButtonElement>): void
}

export default function Button({
  size = 'default',
  color = 'primary',
  secondary,
  children,
  icon: Icon,
  className,
  loading,
  ...props
}: PropTypes) {
  const tier = secondary ? 'secondary' : 'primary'

  if (loading) {
    Icon = LoadingIcon
    if (props.onClick) delete props.onClick
  }

  return (
    <button
      className={clsx(
        'inline-flex items-center border border-transparent font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-transparent select-none',
        sizes[size],
        colors[color][tier],
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon
          className={clsx('h-5 w-5', {
            '-ml-1 mr-2': !!children,
            'animate-spin': loading,
          })}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
