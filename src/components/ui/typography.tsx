import * as React from 'react'

import { cn } from '@/lib/utils'

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const

const textWeightClasses = {
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
} as const

interface BaseTextProps {
  size?: keyof typeof textSizeClasses
  weight?: keyof typeof textWeightClasses
}

type ParagraphTextProps = BaseTextProps &
  React.ComponentPropsWithoutRef<'p'> & {
    as?: 'p'
  }

type SpanTextProps = BaseTextProps &
  React.ComponentPropsWithoutRef<'span'> & {
    as: 'span'
  }

type DivTextProps = BaseTextProps &
  React.ComponentPropsWithoutRef<'div'> & {
    as: 'div'
  }

export type TextProps = ParagraphTextProps | SpanTextProps | DivTextProps

function getTextClassName({
  size = 'md',
  weight = 'regular',
  className,
}: Pick<BaseTextProps, 'size' | 'weight'> & { className?: string }) {
  return cn(textSizeClasses[size], textWeightClasses[weight], className)
}

export function Text(props: TextProps) {
  if (props.as === 'span') {
    const { as: _as, size, weight, className, ...spanProps } = props

    return (
      <span
        className={getTextClassName({ size, weight, className })}
        {...spanProps}
      />
    )
  }

  if (props.as === 'div') {
    const { as: _as, size, weight, className, ...divProps } = props

    return (
      <div
        className={getTextClassName({ size, weight, className })}
        {...divProps}
      />
    )
  }

  const { as: _as, size, weight, className, ...paragraphProps } = props

  return (
    <p
      className={getTextClassName({ size, weight, className })}
      {...paragraphProps}
    />
  )
}

export function Heading1({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn('type-heading-1', className)} {...props} />
}

export function Heading2({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('type-heading-2', className)} {...props} />
}

export function Heading3({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('type-heading-3', className)} {...props} />
}

export function Heading4({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn('type-heading-4', className)} {...props} />
}
