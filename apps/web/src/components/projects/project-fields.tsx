'use client';

import React from 'react';

interface JsonEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  description?: string;
  disabled?: boolean;
}

export function JsonEditor({
  id,
  label,
  value,
  onChange,
  error,
  description,
  disabled,
}: JsonEditorProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase text-muted-foreground"
      >
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-description`}
        className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-semibold text-destructive"
        >
          {error}
        </p>
      ) : (
        description && (
          <p id={`${id}-description`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )
      )}
    </div>
  );
}

export function parseJsonObject(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(
      'Enter a JSON object, for example {"environment":"production"}.',
    );
  }
  return parsed as Record<string, unknown>;
}
