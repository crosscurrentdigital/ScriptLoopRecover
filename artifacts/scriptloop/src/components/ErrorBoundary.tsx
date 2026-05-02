import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SentrySDK } from "@/lib/sentry";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Route error boundary caught:", error, info);
    try {
      SentrySDK.captureException(error, {
        contexts: { react: { componentStack: info.componentStack } },
      });
    } catch {
      /* ignore Sentry failures */
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. You can try again or head back to
                your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground break-words">
                {this.state.error.message || "Unknown error"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={this.handleReset} variant="outline">
                  Try again
                </Button>
                <Button asChild onClick={this.handleReset}>
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
