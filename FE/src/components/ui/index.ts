/**
 * ALTERA UI Component Library — Barrel Export
 * Import all UI components from this single entry point.
 *
 * @example
 * import { Button, Card, Badge } from '@/components/ui'
 */

export { Button } from './Button'
export type { ButtonProps } from './Button'

export { Input, Label } from './Input'
export type { InputProps } from './Input'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card'
export type { CardProps } from './Card'

export { Badge } from './Badge'
export type { BadgeProps } from './Badge'

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalClose,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  useModal,
} from './Modal'
export type { ModalContentProps } from './Modal'

export { Skeleton, Spinner } from './Skeleton'

export { LoadingState, GridLoadingState } from './LoadingState'
export { ErrorState } from './ErrorState'
export { EmptyState } from './EmptyState'
export * from './ProcessCard'
