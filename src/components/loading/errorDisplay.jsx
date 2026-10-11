import React from "react";

export default function Error({ error, setError }) {
    const styles = {
        toast: {
            width: "auto",
            marginTop: 12,
            background: "#FDEAEA",
            color: "#C53030",
            padding: "8px 12px",
            marginBottom: "10px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
        },
        toastClose: {
            background: "transparent",
            border: "none",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            color: "#C53030",
        },
    }

    return (
        error && <div style={styles.toast}>
            {String(error)}
            <button
                onClick={() => setError("")}
                aria-label="Dismiss"
                style={styles.toastClose}
            >
                x
            </button>
        </div>
    );
}