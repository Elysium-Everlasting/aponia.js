import cn from 'clsx'
import NextLink from 'next/link'

export type CardProps = {
  children?: React.ReactNode
  className?: string
  title?: string
  icon?: React.ReactNode
  arrow?: boolean
  href: string
}

/**
 * Card that renders title above children, adapted from nextra built-ins.
 * @see https://github.com/shuding/nextra/blob/main/packages/nextra/src/components/cards.tsx#L28
 */
export function Card({ arrow, children, className, href, icon, title, ...props }: CardProps) {
  return (
    <NextLink
      href={href}
      className={cn(
        className,
        'nextra-card nx-group nx-p-4 nx-flex nx-flex-col nx-justify-start nx-overflow-hidden nx-rounded-lg nx-border nx-border-gray-200',
        'nx-text-current nx-no-underline dark:nx-shadow-none',
        'hover:nx-shadow-gray-100 dark:hover:nx-shadow-none nx-shadow-gray-100',
        'active:nx-shadow-sm active:nx-shadow-gray-200',
        'nx-transition-all nx-duration-200 hover:nx-border-gray-300',
        'nx-bg-gray-100 nx-shadow dark:nx-border-neutral-700 dark:nx-bg-neutral-800 dark:nx-text-gray-50 hover:nx-shadow-lg dark:hover:nx-border-neutral-500 dark:hover:nx-bg-neutral-700',
      )}
      {...props}
    >
      <span
        className={cn(
          'nx-flex nx-font-semibold nx-items-start nx-gap-2 nx-text-gray-700 hover:nx-text-gray-900',
          'dark:nx-text-neutral-200 dark:hover:nx-text-neutral-50 nx-flex nx-items-center',
        )}
      >
        {icon}
        <span className="nx-flex nx-gap-1">
          {title}
          {arrow && (
            <span className="nx-transition-transform nx-duration-75 group-hover:nx-translate-x-[2px]">
              →
            </span>
          )}
        </span>
      </span>
      {children}
    </NextLink>
  )
}
