/**
 * UI Components Index - Export tất cả UI components
 *
 * File này tập trung export tất cả UI components từ 1 nơi.
 * Thay vì import từng file:
 *   import { Button } from '@/components/ui/Button'
 *   import { Card } from '@/components/ui/Card'
 *
 * Bạn có thể import từ index:
 *   import { Button, Card, Input } from '@/components/ui'
 */

// Components
export { Button }       from './Button';
export { Badge }        from './Badge';
export { Card, CardHeader, CardTitle, CardDescription } from './Card';
export { PriceTag }     from './PriceTag';
export { Input }        from './Input';
export { Textarea }     from './Textarea';
export { Select }       from './Select';
export { ErrorView }    from './ErrorView';
export { default as CountUp } from './CountUp';
export { default as TypewriterText } from './TypewriterText';
export { default as WavyNavLink } from './WavyNavLink';

// Types (chỉ export type, không export component)
export type { ButtonProps }  from './Button';
export type { BadgeProps, BadgeVariant } from './Badge';
export type { CardProps }    from './Card';
export type { PriceTagProps } from './PriceTag';
export type { InputProps }   from './Input';
export type { TextareaProps } from './Textarea';
export type { SelectProps, SelectOption } from './Select';
export type { ErrorViewProps } from './ErrorView';
