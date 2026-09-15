import * as React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  id: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, placeholder, options, className, ...props }, ref) => {
    return (
      <div className="sel-field">
        {label && (
          <label className="sel-label" htmlFor={id}>
            {label}
            {props.required && <span className="required-dot">*</span>}
          </label>
        )}
        <div className={`sel-wrapper ${error ? 'has-error' : ''}`}>
          <select
            ref={ref}
            id={id}
            className={`sel-input ${className ?? ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="sel-chevron">
            <ChevronDown size={16} />
          </span>
        </div>
        {error && <span id={`${id}-error`} className="sel-error" role="alert">{error}</span>}
        {!error && hint && <span id={`${id}-hint`} className="sel-hint">{hint}</span>}

        <style jsx>{`
          .sel-field { display: flex; flex-direction: column; gap: 6px; }
          .sel-label {
            font-size: 13px;
            font-weight: 600;
            color: hsl(var(--text-secondary));
            display: flex;
            align-items: center;
            gap: 3px;
          }
          .required-dot { color: hsl(var(--error)); }

          .sel-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .sel-input {
            width: 100%;
            height: 40px;
            padding: 0 36px 0 14px;
            background: hsl(var(--bg-elevated));
            border: 1px solid hsl(var(--border-default));
            border-radius: var(--radius-md);
            color: hsl(var(--text-primary));
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
            outline: none;
            appearance: none;
            cursor: pointer;
          }

          .sel-input:focus {
            border-color: hsl(var(--brand-primary));
            box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.15);
          }

          .has-error .sel-input {
            border-color: hsl(var(--error));
          }
          .has-error .sel-input:focus {
            box-shadow: 0 0 0 3px hsl(var(--error) / 0.15);
          }

          .sel-chevron {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: hsl(var(--text-muted));
            pointer-events: none;
            display: flex;
          }

          .sel-error { font-size: 12px; color: hsl(var(--error)); }
          .sel-hint  { font-size: 12px; color: hsl(var(--text-muted)); }
        `}</style>
      </div>
    );
  }
);

Select.displayName = 'Select';
