import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  id: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, id, className, ...props }, ref) => {
    return (
      <div className="field">
        {label && (
          <label className="field-label" htmlFor={id}>
            {label}
            {props.required && <span className="required-dot">*</span>}
          </label>
        )}
        <div className={`field-control ${error ? 'has-error' : ''} ${leftIcon ? 'has-left' : ''} ${rightIcon ? 'has-right' : ''}`}>
          {leftIcon && <span className="field-icon left">{leftIcon}</span>}
          <input
            ref={ref}
            id={id}
            className={`field-input ${className ?? ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />
          {rightIcon && <span className="field-icon right">{rightIcon}</span>}
        </div>
        {error && <span id={`${id}-error`} className="field-error" role="alert">{error}</span>}
        {!error && hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}

        <style jsx>{`
          .field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .field-label {
            font-size: 13px;
            font-weight: 600;
            color: hsl(var(--text-secondary));
            display: flex;
            align-items: center;
            gap: 3px;
          }

          .required-dot {
            color: hsl(var(--error));
          }

          .field-control {
            position: relative;
            display: flex;
            align-items: center;
          }

          .field-icon {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: hsl(var(--text-muted));
            display: flex;
            align-items: center;
            pointer-events: none;
          }
          .field-icon.left  { left: 12px; }
          .field-icon.right { right: 12px; }

          .field-input {
            width: 100%;
            height: 40px;
            padding: 0 14px;
            background: hsl(var(--bg-elevated));
            border: 1px solid hsl(var(--border-default));
            border-radius: var(--radius-md);
            color: hsl(var(--text-primary));
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
            outline: none;
          }

          .has-left .field-input  { padding-left: 38px; }
          .has-right .field-input { padding-right: 38px; }

          .field-input::placeholder { color: hsl(var(--text-muted)); }

          .field-input:focus {
            border-color: hsl(var(--brand-primary));
            box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.15);
          }

          .has-error .field-input {
            border-color: hsl(var(--error));
          }
          .has-error .field-input:focus {
            box-shadow: 0 0 0 3px hsl(var(--error) / 0.15);
          }

          .field-error {
            font-size: 12px;
            color: hsl(var(--error));
          }

          .field-hint {
            font-size: 12px;
            color: hsl(var(--text-muted));
          }
        `}</style>
      </div>
    );
  }
);

Input.displayName = 'Input';

/* ---------- Textarea variant ---------- */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  id: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    return (
      <div className="field">
        {label && (
          <label className="field-label" htmlFor={id}>
            {label}
            {props.required && <span className="required-dot">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={`field-textarea ${error ? 'has-error' : ''} ${className ?? ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {error && <span id={`${id}-error`} className="field-error" role="alert">{error}</span>}
        {!error && hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}

        <style jsx>{`
          .field { display: flex; flex-direction: column; gap: 6px; }
          .field-label { font-size: 13px; font-weight: 600; color: hsl(var(--text-secondary)); display:flex; align-items:center; gap:3px; }
          .required-dot { color: hsl(var(--error)); }

          .field-textarea {
            width: 100%;
            min-height: 90px;
            padding: 10px 14px;
            background: hsl(var(--bg-elevated));
            border: 1px solid hsl(var(--border-default));
            border-radius: var(--radius-md);
            color: hsl(var(--text-primary));
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
            outline: none;
            resize: vertical;
          }

          .field-textarea::placeholder { color: hsl(var(--text-muted)); }
          .field-textarea:focus {
            border-color: hsl(var(--brand-primary));
            box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.15);
          }
          .field-textarea.has-error { border-color: hsl(var(--error)); }
          .field-textarea.has-error:focus { box-shadow: 0 0 0 3px hsl(var(--error) / 0.15); }
          .field-error { font-size: 12px; color: hsl(var(--error)); }
          .field-hint  { font-size: 12px; color: hsl(var(--text-muted)); }
        `}</style>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
