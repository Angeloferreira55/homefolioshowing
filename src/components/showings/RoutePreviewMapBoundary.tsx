import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { errorLogger } from "@/lib/errorLogger";

type Props = {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export default class RoutePreviewMapBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorLogger.log(error, "high", {
      component: "RoutePreviewMap",
      action: "render",
      metadata: {
        componentStack: errorInfo.componentStack,
        href: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="overflow-hidden border-border">
          <div className="bg-card px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="font-medium text-foreground">
              {this.props.title ?? "Optimized Route"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={this.props.onClose}
              className="ml-auto h-7 w-7 p-0"
              aria-label="Close route preview"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 text-sm text-muted-foreground">
            The route was optimized, but the map preview failed to render on this device/browser.
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
