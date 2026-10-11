import React, { useState } from "react";

import AutoTextarea from "./autoTextArea.jsx";
import LoadingComponents from "../loading/loadingComponents.jsx";

import { reGenNewCardFromText } from "../../utils/callAI.jsx";

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        fontFamily: "Avenir Next, sans-serif",
        boxSizing: "border-box"
    },
    card: {
        border: "1px solid #CBE2FF",
        borderRadius: "12px 10px",
        padding: "10px",
        margin: "10px 0",
        cursor: "pointer"
    },
    inputLabel: {
        fontSize: 14,
        color: "#06001A"
    },
    addCardBtn: {
        alignSelf: "center",
        marginTop: 32,
        padding: "14px 42px",
        fontSize: 18,
        fontWeight: 700,
        color: "white",
        backgroundColor: "#1178FF",
        border: "none",
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s ease"
    },
    addCardBtnDisabled: {
        backgroundColor: "#CCCCCC",
        cursor: "not-allowed"
    },
    /* Warning message */
    warningMessage: {
        marginTop: 16,
        padding: "12px 16px",
        backgroundColor: "#FFF3CD",
        border: "1px solid #FFE69C",
        borderRadius: 8,
        color: "#856404",
        fontSize: 14,
        textAlign: "center"
    },
    titleContainer: {
        display: "flex",
        justifyContent: "space-between"
    },
    resetButton: {
        background: "white",
        border: "none",
        borderRadius: 4,
        padding: "4px 8px",
        cursor: "pointer"
    },
    deleteBtnContainer: {
        display: "flex",
        justifyContent: "space-between",
        width: '100%',
    },
    deleteBtn: {
        background: "white",
        border: "none",
        borderRadius: 4,
        padding: "4px 8px",
        cursor: "pointer"
    },
    writeBtn: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        border: '1px solid #CBE2FF',
        backgroundColor: '#FFF',
        padding: '4px 8px',
        gap: '8px',
        cursor: 'pointer'
    },
    writeBtnSelected: {
        backgroundColor: '#CBE2FF',
        border: '1px solid #1178FF',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.20)',
        zIndex: 999,
        fontFamily: "Avenir Next",
        fontSize: "14px",
        fontStyle: "normal",
        fontWeight: 400,
        cursor: 'default'
    },
    modalContainer: {
        boxShadow: "0px 1px 3.2px 0px rgba(17, 120, 255, 0.50)",
        margin: '80px 25px',
        borderRadius: '10px',
        padding: '24px 20px',
        height: 'fit-content',
        backgroundColor: 'white',
    },
    regenSelectBtn: {
        borderRadius: '30px',
        border: "1px solid #CBE2FF",
        background: "#FFF",
        padding: "10px 24px",
        width: 'fit-content',
        color: "#808080",
        cursor: "pointer",
    },
    regenSelectBtnSelected: {
        border: "1px solid #1178FF",
        background: "#1178FF",
        color: "white",
    },
    regenerateBtn: {
        color: 'white',
        borderRadius: '30px',
        border: "1px solid #1178FF",
        backgroundColor: "#1178FF",
        width: 'fit-content',
        marginTop: '-15px',
        padding: "10px 24px",
        cursor: "pointer",
    },
    regenerateDisabled: {
        border: "none",
        backgroundColor: "grey",
        border: "1px solid grey",
        cursor: "not-allowed"
    },
};

export default function Cards({ cards, setCards, extractedText, questionLength, answerLength }) {
    const [selected, setSelected] = useState(0);

    const [regenIndex, setRegenIndex] = useState(null);
    const [regenPart, setRegenPart] = useState(null);
    const [regenHow, setRegenHow] = useState("");

    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    if (!cards || !Array.isArray(cards)) {
        return <div>No cards to display.</div>;
    }

    const updateCard = (idx, field, value) =>
        setCards(prev => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));

    const removeCard = idx => {
        if (cards.length > 1) {
            setCards(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const handleModalClose = () => {
        setRegenHow("");
        setRegenIndex(null);
        setStatus("");
    }

    const regenerate = async () => {
        try {
            if (!extractedText) new Error("Problem occurred in text extraction");

            setStatus("Generating...");

            const res = await reGenNewCardFromText(
                extractedText,
                regenHow,
                regenPart === 1 ? null : questionLength,
                regenPart === 0 ? null : answerLength,
                cards[regenIndex]);

            if (!res.ok) {
                const { response = "Server error" } = await res.json().catch(() => ({}));
                throw new Error(response);
            }

            const data = await res.json();
            setCards(prev =>
                prev.map((c, i) => {
                    if (i !== regenIndex) return c;

                    return {
                        question: data.card.question?.trim() ? data.card.question : c.question,
                        answer: data.card.answer?.trim() ? data.card.answer : c.answer,
                    };
                })
            );

            handleModalClose();
        } catch (err) {
            setError(`⚠️ ${err.message || err.toString()}`);
            console.error(err);
        }
    }

    const regenOptions = ["Regenerate Question", "Regenerate Answer", "Regenerate Both"];

    const ModalExitBtn = () => {
        return <button
            style={{ cursor: "pointer", backgroundColor: 'white', border: "none" }}
            onClick={handleModalClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11" stroke="black" strokeLinecap="round" />
                <path d="M11 1L1 11" stroke="black" strokeLinecap="round" />
            </svg>
        </button>
    }

    const RegenerateModalContent = () => {
        return <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 500 }}>AI Regenerate</div>
                <ModalExitBtn />
            </div>
            <div>1. Which part do you want to regenerate?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {regenOptions.map((r, idx) =>
                    <button
                        key={r}
                        style={{
                            ...styles.regenSelectBtn,
                            ...regenPart == idx ? styles.regenSelectBtnSelected : {}
                        }}
                        onClick={() => setRegenPart(idx)}>
                        {r}
                    </button>)}
            </div>

            <div>
                <div>2. How can it be better?</div>

                <AutoTextarea
                    ey={`regen-how-${regenIndex}`}
                    placeholder="How should it be improved?"
                    value={regenHow}
                    onChange={e => setRegenHow(e.target.value)}
                    autoFocus={true}
                />
            </div>

            <button
                style={{
                    ...styles.regenerateBtn,
                    ...(!regenPart && regenHow == "" ? styles.regenerateDisabled : {})
                }}
                onClick={regenerate}
                disabled={!regenPart && regenHow == ""}
            >
                Start Regenerate</button>
        </div>
    }

    const RegenerateModal = () => {
        return <div style={styles.modalOverlay}>
            <div style={styles.modalContainer}>
                {status === "" ?
                    <RegenerateModalContent /> :
                    <div>
                        <div style={{ paddingLeft: '90%' }}><ModalExitBtn /></div>
                        <div style={{ margin: "120px 0" }}>
                            <LoadingComponents status={status} error={error} setError={setError} />
                        </div>
                    </div>}
            </div>
        </div>
    }

    return (
        <>
            {cards.map((card, idx) => (
                <div
                    style={{
                        ...styles.card,
                        borderColor: selected == idx ? "#1178FF" : "#CBE2FF",
                        boxShadow: selected == idx ? "0px 1px 3.2px 0px rgba(17, 120, 255, 0.50)" : "none"
                    }}
                    key={idx}
                    onClick={() => setSelected(idx)}
                >
                    <label style={styles.inputLabel}>Question {idx + 1}</label>

                    <AutoTextarea
                        id={`question${idx}`}
                        value={card.question}
                        placeholder="Enter question"
                        onChange={e => updateCard(idx, "question", e.target.value)}
                    />

                    <label style={styles.inputLabel}>Answer {idx + 1}</label>

                    <AutoTextarea
                        id={`answer${idx}`}
                        value={card.answer}
                        placeholder="Enter answer"
                        onChange={e => updateCard(idx, "answer", e.target.value)}
                    />
                    <div style={styles.deleteBtnContainer}>
                        <button
                            style={{
                                ...styles.writeBtn,
                                ...regenIndex == idx ? styles.writeBtnSelected : {}
                            }}
                            onClick={() => setRegenIndex(idx == regenIndex ? null : idx)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M3.27169 0.427366C3.49655 -0.142785 4.30342 -0.142779 4.52828 0.427372L5.22508 2.19422C5.29372 2.36829 5.43154 2.50608 5.6056 2.57473L7.37235 3.27157C7.94253 3.49643 7.94253 4.30334 7.37235 4.52821L5.6056 5.22503C5.43154 5.29368 5.29372 5.4315 5.22508 5.60557L4.52828 7.37239C4.30342 7.94259 3.49655 7.94259 3.27169 7.37239L2.57488 5.60557C2.50623 5.4315 2.36845 5.29368 2.19438 5.22503L0.427594 4.52821C-0.142535 4.30334 -0.142529 3.49643 0.4276 3.27157L2.19438 2.57473C2.36845 2.50608 2.50623 2.36829 2.57488 2.19422L3.27169 0.427366Z" fill="#1178FF" />
                                <path d="M8.95429 6.83481C9.07789 6.52154 9.52128 6.52154 9.64488 6.83481L10.1852 8.20507C10.223 8.30078 10.2987 8.3765 10.3944 8.41424L11.7646 8.95462C12.0779 9.07822 12.0779 9.52164 11.7646 9.64524L10.3944 10.1856C10.2987 10.2234 10.223 10.2991 10.1852 10.3948L9.64488 11.7651C9.52128 12.0783 9.07789 12.0783 8.95429 11.7651L8.41393 10.3948C8.37619 10.2991 8.30047 10.2234 8.20477 10.1856L6.83455 9.64524C6.52129 9.52164 6.52129 9.07822 6.83455 8.95462L8.20477 8.41424C8.30047 8.3765 8.37619 8.30078 8.41393 8.20507L8.95429 6.83481Z" fill="#1178FF" />
                            </svg>
                            Write with AI
                        </button>
                        {cards.length > 1 && (
                            <button onClick={() => removeCard(idx)} style={styles.deleteBtn}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="16"
                                    viewBox="0 0 14 16"
                                    fill="none"
                                >
                                    <path
                                        d="M1 3.33333H13M10 3.33333L9.79705 2.70183C9.60032 2.08986 9.50193 1.78388 9.31953 1.55765C9.15843 1.35788 8.95157 1.20325 8.71787 1.10794C8.4532 1 8.14225 1 7.5202 1H6.4798C5.85775 1 5.5468 1 5.28213 1.10794C5.04844 1.20325 4.84156 1.35788 4.68047 1.55765C4.49804 1.78388 4.39969 2.08986 4.20298 2.70183L4 3.33333M11.5 3.33333V11.2667C11.5 12.5735 11.5 13.2268 11.2548 13.726C11.0391 14.1651 10.6949 14.522 10.2715 14.7457C9.79015 15 9.16015 15 7.9 15H6.1C4.83988 15 4.20982 15 3.72852 14.7457C3.30516 14.522 2.96095 14.1651 2.74524 13.726C2.5 13.2268 2.5 12.5735 2.5 11.2667V3.33333M8.5 6.44444V11.8889M5.5 6.44444V11.8889"
                                        stroke="black"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                    {regenIndex != null && <RegenerateModal />}
                </div>
            ))}
        </>
    );
}
