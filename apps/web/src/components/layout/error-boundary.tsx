'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <div className="flex flex-col items-center max-w-md gap-4 p-8 border border-border rounded-xl bg-card shadow-xl shadow-black/25">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              System Exception
            </h1>
            <p className="text-sm text-muted-foreground">
              An unhandled crash occurred while rendering this layout partition.
            </p>
            {this.state.error && (
              <pre className="w-full overflow-x-auto rounded bg-muted/40 p-3 text-left text-xs font-semibold text-rose-400 border border-border">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset} className="w-full mt-2">
              Refresh Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
