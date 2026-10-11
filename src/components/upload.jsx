import React, { useState } from "react";

import FileImport from "./fileImport.jsx";
import ErrorDisplay from "./loading/errorDisplay.jsx";
import Spinner from "./loading/spinner.jsx";

import { extractText } from "../utils/extractText.jsx";

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItem: 'center',
        justifyContent: 'center',
        width: "100%",
        height: '100%',
        fontFamily: "Avenir Next, sans-serif",
    },
    content: {
        flex: 1,
        overflowY: 'auto',
    },
    label: {
        color: "#06001A",
        fontSize: 14,
        fontWeight: 500,
        marginTop: '30%',
        marginBottom: 15,
        display: "block"
    },
    insertCardBtn: {
        alignSelf: "center",
        padding: "10px 42px",
        fontSize: 13,
        marginTop: '5px',
        width: '100%',
        fontWeight: 700,
        color: "white",
        backgroundColor: "#1178FF",
        border: "none",
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s ease"
    },
    insertCardBtnDisabled: {
        backgroundColor: "grey",
        cursor: "not-allowed"
    },
};

export default function AIGenerate({ setExtractedText, nextPage }) {
    const [file, setFile] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    async function processFile() {
        try {
            setStatus("Extracting Text...");
            setError("");

            const rawText = await extractText(file);
            if (!rawText) throw new Error("Could not extract readable text.");
            setExtractedText(rawText.slice(0, 8000));
            nextPage();
        } catch (err) {
            setError(`⚠️ ${err.message || err.toString()}`);
            setStatus("");
            console.error(err);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <ErrorDisplay error={error} setError={setError} />

                {status == "Extracting Text..." ?
                    <div style={{ marginTop: '70%' }}>
                        <Spinner status={status} />
                    </div> :
                    <div>
                        <div style={styles.label}>Effortlessly turn your PDF, PPT, PNG, or JPG notes into flashcards</div>
                        <FileImport
                            setFile={setFile}
                        />
                    </div>}
            </div>

            {status != "Extracting Text..." &&
                <button
                    style={{
                        ...styles.insertCardBtn,
                        ...(file == "" ? styles.insertCardBtnDisabled : {})
                    }}
                    onClick={processFile}
                    disabled={file == ""}
                >
                    Next
                </button>}
        </div>
    );
}