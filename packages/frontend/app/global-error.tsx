"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#09011a',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          padding: '2rem',
          textAlign: 'center',
        }}>
          {/* Error Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem',
          }}>
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              padding: '1.5rem',
              display: 'inline-flex',
            }}>
              <AlertTriangle
                style={{ width: '4rem', height: '4rem', color: '#ef4444' }}
              />
            </div>
          </div>

          {/* Error Message */}
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}>
            Critical Error
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem',
            lineHeight: '1.6',
          }}>
            A critical error occurred that prevented the application from loading.
            Please try refreshing the page.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <details style={{
              textAlign: 'left',
              marginBottom: '2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '1rem',
              borderRadius: '0.5rem',
            }}>
              <summary style={{
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.875rem',
              }}>
                Error details (dev only)
              </summary>
              <pre style={{
                marginTop: '1rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#ef4444',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {error.message}
              </pre>
              {error.digest && (
                <p style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.5rem',
                }}>
                  Digest: {error.digest}
                </p>
              )}
            </details>
          )}

          {/* Action Button */}
          <button
            onClick={reset}
            style={{
              backgroundColor: '#450cf0',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3f0bda'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#450cf0'}
          >
            <RefreshCw style={{ width: '1rem', height: '1rem' }} />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
