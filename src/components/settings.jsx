import React, { useState, useEffect } from "react";

import { fetchCardsFromText } from "../utils/callAI.jsx";
import LoadingComponents from "./loading/loadingComponents.jsx";

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: "100%",
        height: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: "Avenir Next, sans-serif",
    },
    settingRow: {
        marginBottom: 18
    },
    labelRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        color: "#06001A",
        fontFamily: "Avenir Next",
        fontSize: "12px",
        fontStyle: "normal",
        fontWeight: 500,
        lineHeight: "normal",
        marginBottom: 10,
    },
    cardNumberDropdown: {
        borderRadius: 10,
        border: "1px solid #CBE2FF",
        background: "#FFF",
        display: "flex",
        padding: "8px 17px 8px 15px",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdown: {
        outline: "none",
        cursor: "pointer",
        display: "flex",
        height: "20px",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
        borderRadius: 10,
        border: "1px solid #CBE2FF",
        background: "#FFF",
        color: "#06001A",
        fontSize: "12px",
        lineHeight: "1",
        padding: "0 8px",         // figma version 8px
        marginBottom: 8
    },
    previewBox: {
        display: "flex",
        height: "186px",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
        borderRadius: 10,
        border: "1px solid #CBE2FF",
        background: "#FFF",
        overflow: "hidden",
        padding: 24,
        boxSizing: "border-box",
    },
    previewText: {
        color: "#000",
        fontSize: 14,
        fontWeight: 400,
        fontFamily: "Avenir Next",
        textAlign: "center",
        lineHeight: "normal",
        display: "block"
    },
    insertCardBtn: {
        alignSelf: "center",
        marginTop: "5px",
        padding: "10px 42px",
        fontSize: 13,
        width: "100%",
        fontWeight: 700,
        color: "white",
        backgroundColor: "#1178FF",
        border: "none",
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s ease"
    },
    totalCardNumberBox: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginBottom: 15
    }
};

const CARD_NUMBERS = [1, 2, 3, 4, 5, 6];
const LENGTH_OPTIONS = ["Small", "Medium", "Large"];
const PREVIEW_TEXTS = {
    Small: "Lorem ipsum dolor sit.",
    Medium: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio.",
    Large: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."
};

export default function Settings({
    flashcardSettings,
    onSettingsChange,
    insertCards,
    nextPage,
    extractedText,
    cards,
    setCards
}) {
    const {
        totalCardNumber = 6,
        questionLength = "Medium",
        answerLength = "Medium"
    } = flashcardSettings || {};

    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const updateSettings = newSettings => {
        if (onSettingsChange) {
            onSettingsChange({
                ...flashcardSettings,
                ...newSettings
            });
        }
    };

    // useEffect(() => {
    //     if (!Array.isArray(cards)) return;

    //     if (cards.length > 0 && status == "Generating...") {
    //         setStatus("Inserting Current Cards for Preview...");

    //         (async () => {
    //             await new Promise((resolve) => setTimeout(resolve, 2000));
    //             await insertCards();

    //             await new Promise((resolve) => setTimeout(resolve, 1500));
    //             nextPage();
    //         })();
    //     }
    // }, [cards]);

    const generate = async () => {
        setStatus("Generating...");

        (async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStatus("Inserting Current Cards for Preview...");

            await new Promise(resolve => setTimeout(resolve, 2000));
            await insertCards();

            await new Promise(resolve => setTimeout(resolve, 1500));
            nextPage();
        })();

        // try {
        //     setStatus("Generating...");

        //     if (!extractedText) new Error("Problem occurred in text extraction");

        //     const res = await fetchCardsFromText(
        //         extractedText,
        //         totalCardNumber,
        //         questionLength,
        //         answerLength);

        //     if (!res.ok) {
        //         const { response = "Server error" } = await res.json().catch(() => ({}));
        //         throw new Error(response);
        //     }

        //     const data = await res.json();

        //     if (Array.isArray(data.cards)) {
        //         setCards(data.cards);
        //     }
        //     else {
        //         throw new Error("Something went wrong");
        //     }
        // } catch (err) {
        //     setError(`⚠️ ${err.message || err.toString()}`);
        //     console.error(err);
        // }
    };

    const SettingsComponents = () => (
        <div style={{ width: '100%' }}>
            <div style={styles.totalCardNumberBox}>
                <label style={styles.label}>Total Card Number</label>
                <select
                    style={styles.cardNumberDropdown}
                    value={totalCardNumber}
                    onChange={e => updateSettings({ totalCardNumber: Number(e.target.value) })}
                >
                    {CARD_NUMBERS.map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                </select>
            </div>

            <div style={styles.settingRow}>
                <div style={styles.labelRow}>
                    <label style={styles.label}>Question Length</label>
                    <select
                        style={styles.dropdown}
                        value={questionLength}
                        onChange={e => updateSettings({ questionLength: e.target.value })}
                    >
                        {LENGTH_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <div style={styles.previewBox}>
                    <span style={styles.previewText}>{PREVIEW_TEXTS[questionLength]}</span>
                </div>
            </div>

            <div style={styles.settingRow}>
                <div style={styles.labelRow}>
                    <label style={styles.label}>Answer Length</label>
                    <select
                        style={styles.dropdown}
                        value={answerLength}
                        onChange={e => updateSettings({ answerLength: e.target.value })}
                    >
                        {LENGTH_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <div style={styles.previewBox}>
                    <span style={styles.previewText}>{PREVIEW_TEXTS[answerLength]}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={{ overflowY: "auto", flex: 1 }}>
                {status === "" ?
                    <SettingsComponents /> :
                    <div style={{ paddingTop: '30vh' }}>
                        <LoadingComponents status={status} error={error} setError={setError} />
                    </div>}
            </div>

            {status === "" && (
                <button style={styles.insertCardBtn} onClick={generate}>
                    AI Generate
                </button>
            )}
        </div>
    );
}
