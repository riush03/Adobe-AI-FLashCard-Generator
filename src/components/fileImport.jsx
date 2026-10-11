import React, { useRef, useState } from "react";

import ErrorDisplay from "./loading/errorDisplay.jsx";

const styles = {
    wrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid #CBE2FF",
        borderRadius: 10,
        padding: "60px 36px 24px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        textAlign: "center",
    },
    wrapperActive: { backgroundColor: "#F4F9FF" },
    icon: { fontSize: 48, marginBottom: 12, color: "#1178FF" },
    info: { marginTop: 32, fontSize: 14, fontWeight: 400, color: "#06001A" },
    hint: { fontSize: 14, color: "#666", marginTop: 4 },
    error: {
        marginTop: 12,
        color: "#dc3545",
        fontSize: 14,
        fontWeight: 600,
    },
    fileName: { marginTop: 12, fontWeight: 600 },
};

export default function FileImport({
    setFile,
}) {
    const inputRef = useRef(null);
    const [isDragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");

    const accept =
        ".pdf,application/pdf," +
        ".ppt,application/vnd.ms-powerpoint," +
        ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation," +
        ".png,image/png," +
        ".jpg,.jpeg,image/jpeg";

    const openFileDialog = () => inputRef.current?.click();
    const onDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };
    const onDragLeave = () => setDragOver(false);

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        setFile(e.dataTransfer.files[0]);
    };

    async function handleFile(file) {
        if (!file) return;

        const okExt = accept
            .split(",")
            .some((substr) => file.type.includes(substr) || file.name.toLowerCase().endsWith(substr.trim()));
        if (!okExt) {
            setError("Unsupported file type");
            return;
        }

        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setError("File too large (max 10MB)");
            return;
        }

        setFileName(file.name);
        setFile(file);
    }

    return (
        <>
            <div
                style={{
                    ...styles.wrapper,
                    ...(isDragOver ? styles.wrapperActive : {}),
                }}
                onClick={openFileDialog}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <ErrorDisplay error={error} setError={setError} />

                {fileName ?
                    <>
                        <span style={styles.icon}>📄</span>
                        <div style={styles.info}>{fileName}</div>
                    </>
                    :
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="41" viewBox="0 0 38 41" fill="none">
                            <path d="M19.0003 26.0416V5.45825M19.0003 5.45825L25.3337 12.3853M19.0003 5.45825L12.667 12.3853" stroke="#1C274C" strokeWidth="2.375" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M23.75 35.5416H14.25C9.77165 35.5416 7.53249 35.5416 6.14124 34.1504C4.75 32.7591 4.75 30.5199 4.75 26.0416M33.25 26.0416C33.25 30.5199 33.25 32.7591 31.8587 34.1504C31.384 34.625 30.8107 34.9377 30.0833 35.1437" stroke="#1C274C" strokeWidth="2.375" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div style={styles.info}>Click or drag file here</div>
                    </>}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
            />
        </>
    );
}