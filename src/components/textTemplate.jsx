import React, { useState } from "react";

import Cards from "./cards/cards.jsx";
import Template from "./template.jsx";

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        fontFamily: "Avenir Next, sans-serif",
        boxSizing: "border-box",
        height: "100%",
        overflow: "hidden",
    },
    inputLabel: {
        fontWeight: 600,
        fontSize: 16,
        margin: "24px 0 8px",
        color: "#06001A"
    },
    textarea: {
        width: "calc(100% - 36px)",
        minHeight: 80,
        padding: "14px 18px",
        fontSize: 18,
        borderRadius: 12,
        border: "2px solid #CBE2FF",
        outline: "none",
        resize: "vertical"
    },

    /* Controls Section */
    controlsSection: {
        margin: "24px 0",
        padding: "16px",
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        border: "1px solid #E0E0E0"
    },
    controlsTitle: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 16,
        color: "#06001A"
    },
    controlRow: {
        display: "flex",
        alignItems: "center",
        marginBottom: 16,
        gap: 12
    },
    controlLabel: {
        fontSize: 14,
        fontWeight: 500,
        minWidth: 80,
        color: "#333"
    },
    slider: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E0E0E0",
        outline: "none",
        cursor: "pointer"
    },
    colorPicker: {
        width: 40,
        height: 40,
        borderRadius: 8,
        border: "2px solid #E0E0E0",
        cursor: "pointer",
        outline: "none"
    },
    controlValue: {
        fontSize: 14,
        fontWeight: 500,
        minWidth: 40,
        textAlign: "right",
        color: "#666"
    },
    divider: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
    },
    plusBtn: {
        background: "white",
        border: "none",
        margin: "24px",
        cursor: "pointer"
    },
    /* Add Card button */
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

    insertCardBtn: {
        alignSelf: "center",
        marginTop: "auto",
        padding: "10px 42px",
        fontSize: 13,
        marginTop: "5px",
        width: "100%",
        fontWeight: 700,
        color: "white",
        backgroundColor: "#1178FF",
        border: "none",
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s ease"
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

    /* Card counter */
    cardCounter: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginTop: 8
    },

    tabBar: {
        display: "flex",
        paddingBottom: "5px",
        gap: "8px"
    },
    tabButton: {
        padding: "6px 15px",
        border: "none",
        borderRadius: "30px",
        cursor: "pointer",
        fontWeight: 400,
        fontSize: 14,
        transition: "all 0.2s ease",
        border: "1px solid #CBE2FF",
        backgroundColor: "white",
        color: "#808080"
    },
    tabButtonActive: {
        backgroundColor: "#1178FF",
        color: "white"
    },
    paginationContainer: {
        display: "flex",
        alignSelf: "center",
        alignItems: "center",
        gap: "1px",
        padding: "1px",
        backgroundColor: "#EBF3FE",
        borderRadius: "20px",
        fontSize: "12px",
        marginLeft: "auto"
    },
    paginationButton: {
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#000"
    },
    paginationDisabled: {
        cursor: "not-allowed",
        color: "#ccc"
    }
};

export default function TextTemplate({
    flashcardSettings,
    cards,
    setCards,
    templateSetting,
    setTemplateSetting,
    insertCards,
    extractedText
}) {
    const [currentView, setCurrentView] = useState("Text");
    const [currentPage, setCurrentPage] = useState(1);
    const CARDS_PER_PAGE = 4;
    const totalPages = Math.ceil((cards?.length || 0) / CARDS_PER_PAGE);
    const {
        questionLength = "Medium",
        answerLength = "Medium"
    } = flashcardSettings || {};

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Get current page's cards
    const getCurrentPageCards = () => {
        const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
        const endIndex = startIndex + CARDS_PER_PAGE;
        return cards.slice(startIndex, endIndex);
    };

    const addCard = () => {
        setCards(prev => [...prev, { question: "", answer: "" }]);
    };

    const TextTab = () => {
        return <>
            <Cards
                cards={getCurrentPageCards()}
                setCards={setCards}
                extractedText={extractedText}
                questionLength={questionLength}
                answerLength={answerLength}
            />
            <div style={styles.divider}>
                <div style={{ height: "1px", width: "35%", borderTop: "1px solid #CBE2FF" }}></div>
                <button style={styles.plusBtn} onClick={addCard}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2Z"
                            fill="#1178FF"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M11 5C11 4.73478 10.8946 4.48043 10.7071 4.29289C10.5196 4.10536 10.2652 4 10 4C9.73478 4 9.48043 4.10536 9.29289 4.29289C9.10536 4.48043 9 4.73478 9 5V9H5C4.73478 9 4.48043 9.10536 4.29289 9.29289C4.10536 9.48043 4 9.73478 4 10C4 10.2652 4.10536 10.5196 4.29289 10.7071C4.48043 10.8946 4.73478 11 5 11H9V15C9 15.2652 9.10536 15.5196 9.29289 15.7071C9.48043 15.8946 9.73478 16 10 16C10.2652 16 10.5196 15.8946 10.7071 15.7071C10.8946 15.5196 11 15.2652 11 15V11H15C15.2652 11 15.5196 10.8946 15.7071 10.7071C15.8946 10.5196 16 10.2652 16 10C16 9.73478 15.8946 9.48043 15.7071 9.29289C15.5196 9.10536 15.2652 9 15 9H11V5Z"
                            fill="#1178FF"
                        />
                    </svg>
                </button>
                <div style={{ height: "1px", width: "35%", borderTop: "1px solid #CBE2FF" }}></div>
            </div>
        </>
    }

    const TabBar = () => {
        return <div style={styles.tabBar}>
            <button
                style={{
                    ...styles.tabButton,
                    ...(currentView === "Text" ? styles.tabButtonActive : {})
                }}
                onClick={() => {
                    setCurrentView("Text");
                    setCurrentPage(1); // Reset to first page when switching to Text view
                }}
            >
                Q&A
            </button>
            <button
                style={{
                    ...styles.tabButton,
                    ...(currentView === "Template" ? styles.tabButtonActive : {})
                }}
                onClick={() => setCurrentView("Template")}
            >
                Template
            </button>
            {currentView === "Text" && (
                <div style={styles.paginationContainer}>
                    <button
                        style={{
                            ...styles.paginationButton,
                            ...(currentPage <= 1 ? styles.paginationDisabled : {})
                        }}
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                    >
                        &lt;
                    </button>
                    <span>{currentPage}</span>
                    <button
                        style={{
                            ...styles.paginationButton,
                            ...(currentPage >= totalPages ? styles.paginationDisabled : {})
                        }}
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                    >
                        &gt;
                    </button>
                </div>
            )}
        </div>
    }

    return (
        <div style={styles.container}>
            <TabBar />

            <div style={{ overflowY: "auto" }}>
                {currentView === "Text" ? (
                    TextTab()
                ) : (
                    <Template
                        templateSetting={templateSetting}
                        setTemplateSetting={setTemplateSetting}
                    />
                )}
            </div>

            <button style={styles.insertCardBtn} onClick={insertCards}>
                Import
            </button>
        </div>
    );
}
