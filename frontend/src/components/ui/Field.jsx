import React from 'react';
import { cn } from '../../lib/utils.js';

export function Field({ label, error, hint, required, children }) {
  return (
    <div>
      {label && (
        <label className="label-base">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> :
        hint ? <p className="mt-1.5 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

export const Input = React.forwardRef(({ className, invalid, ...rest }, ref) => {
  return <input ref={ref} className={cn('input-base', invalid && 'border-rose-400 focus:ring-rose-100 focus:border-rose-500', className)} {...rest} />;
});
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ className, invalid, ...rest }, ref) => {
  return <textarea ref={ref} className={cn('input-base min-h-[96px]', invalid && 'border-rose-400', className)} {...rest} />;
});
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ className, invalid, children, ...rest }, ref) => {
  return (
    <select ref={ref} className={cn('input-base', invalid && 'border-rose-400', className)} {...rest}>
      {children}
    </select>
  );
});
Select.displayName = 'Select';