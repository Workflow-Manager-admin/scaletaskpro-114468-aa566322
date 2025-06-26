import React, { createContext, useContext, useState, useCallback } from "react";

// PUBLIC_INTERFACE
/**
 * Provides global success message handling throughout the app.
 * Call useSuccessMessage() to trigger a success message visible in layout,
 * auto-dismisses after a default timeout or on route change.
 */
const SuccessMessageContext = createContext();

/**
 * Provider component, wraps app and manages message state and expiry.
 * Usage: <SuccessMessageProvider><AppLayout>...</AppLayout></SuccessMessageProvider>
 */
export function SuccessMessageProvider({ children }) {
  const [successMessage, setSuccessMessage] = useState(null);

  // Show message (msg: string, options?: {timeout: ms, id?: string})
  // Only one success message at a time (last one wins).
  const showSuccess = useCallback((msg, options = {}) => {
    setSuccessMessage({
      text: msg,
      timeout: options.timeout || 2600,
      id: options.id || Date.now()
    });
  }, []);

  // Clear message (manual or via timeout/route change)
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return (
    <SuccessMessageContext.Provider value={{
      successMessage,
      showSuccess,
      clearSuccess,
    }}>
      {children}
    </SuccessMessageContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useSuccessMessage() {
  return useContext(SuccessMessageContext);
}

/**
 * SuccessMessageBanner: animated, consistent, dismiss-on-click.
 * Usage: <SuccessMessageBanner /> beneath navbar/layout
 */
export function SuccessMessageBanner() {
  const { successMessage, clearSuccess } = useSuccessMessage();
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    if (successMessage) {
      setVisible(true);
      if (successMessage.timeout > 0) {
        const to = setTimeout(() => {
          setVisible(false);
          setTimeout(clearSuccess, 360); // animate out, then clear
        }, successMessage.timeout);
        return () => clearTimeout(to);
      }
    } else {
      setVisible(false);
    }
    // eslint-disable-next-line
  }, [successMessage]);

  if (!successMessage) return null;
  return (
    <div
      className={`success-message-banner${visible ? " visible" : ""}`}
      onClick={() => {
        setVisible(false);
        setTimeout(clearSuccess, 250);
      }}
      style={{
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        zIndex: 999,
        margin: "0 auto",
        maxWidth: 380,
        background: "var(--accent,#ff9800)",
        color: "#fff",
        textAlign: "center",
        borderRadius: "0 0 16px 16px",
        boxShadow: "0 6px 18px #1e90ff14",
        fontWeight: 500,
        padding: "0.9rem 1.3rem",
        letterSpacing: ".01em",
        fontSize: "1.11rem",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 320ms cubic-bezier(.4,1.1,.5,1.0)",
      }}
      tabIndex={0}
      role="status"
      aria-live="polite"
      title="Click to dismiss"
    >
      {successMessage.text}
    </div>
  );
}
