import React from "react";

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    hint: { fontSize: 14, color: "#666", marginTop: 4 },
    fileName: { marginTop: 12, fontWeight: 600 },
    spinner: {
        width: 32,
        height: 32,
        border: "4px solid #1178FF",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin360 0.8s linear infinite",
        marginBottom: 12,
    },
};

const spinnerStyles = `
@keyframes spin360 { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }`;
if (!document.getElementById("file-import-spinner-css")) {
    const styleTag = document.createElement("style");
    styleTag.id = "file-import-spinner-css";
    styleTag.textContent = spinnerStyles;
    document.head.appendChild(styleTag);
}

export default function spinner({ fileName, status }) {
    return (
        <div style={styles.container}>
            <div style={styles.spinner} />
            <div style={styles.hint}>{status}</div>
            {fileName && <div style={styles.fileName}>{fileName}</div>}
        </div>
    );
};
