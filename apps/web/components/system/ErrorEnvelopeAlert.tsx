import React from "react";
import { AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { APIClientError } from "../../lib/api/client";

interface ErrorEnvelopeAlertProps {
  error: APIClientError | Error | null;
  onRetry?: () => void;
  className?: string;
}

export const ErrorEnvelopeAlert: React.FC<ErrorEnvelopeAlertProps> = ({
  error,
  onRetry,
  className = "",
}) => {
  if (!error) return null;

  const isClientError = error instanceof APIClientError;
  const code = isClientError ? error.code : "APPLICATION_ERROR";
  const message = error.message || "An unexpected error occurred.";
  const requestId = isClientError ? error.requestId : undefined;
  const requiredFields = isClientError ? error.requiredFields : [];

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50/70 p-4 text-red-900 shadow-sm ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="flex items-center gap-2 font-semibold text-red-950">
            <span>{message}</span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
              {code}
            </span>
          </div>

          {requiredFields && requiredFields.length > 0 && (
            <p className="mt-1 text-xs text-red-800">
              Required fields missing: <strong className="font-mono">{requiredFields.join(", ")}</strong>
            </p>
          )}

          {requestId && (
            <p className="mt-1 text-[11px] font-mono text-red-600/90">
              Request ID: {requestId}
            </p>
          )}
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
