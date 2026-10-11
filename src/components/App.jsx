import React, { useState, useEffect } from "react";

import Settings from "./settings.jsx";
import TextTemplate from "./textTemplate.jsx";
import Upload from "./upload.jsx";

const styles = {
    nav: {
        display: "flex",
        flexDirection: "row",
        // alignContent: 'center',
        justifyContent: "space-between",
        gap: "12px",
        paddingBottom: "10px",
        color: "#06001A",
        fontFamily: "Avenir Next",
        fontSize: "14px",
        fontStyle: "normal",
        fontWeight: 600,
        lineHeight: "normal"
    },
    tabButton: {
        flex: 1,
        border: "none",
        borderRadius: "20px",
        padding: "10px 0",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
        transition: "all 0.2s ease",
        backgroundColor: "#EBF3FE",
        color: "#06001A"
    },
    tabButtonActive: {
        backgroundColor: "#1178FF",
        color: "white"
    }
};

const App = ({ sandboxProxy }) => {
    const [extractedText, setExtractedText] = useState("");

    // Settings state
    const [flashcardSettings, setFlashcardSettings] = useState({
        totalCardNumber: 6
    });

    // Template state
    const [templateSetting, setTemplateSetting] = useState({
        template: "none",
        cardSize: "102x152",
        sided: "qa_same_side",
        orientation: "horizontal"
    });

    // Text component state - lifted from Text component
    const [entryTab, setEntryTab] = useState("Upload");
    const tabs = ["Upload", "Settings", "Flashcard"];

    const [cards, setCards] = useState([
        { question: "Metaphor", answer: "A comparison between two things or ideas where one becomes the other" },
        { question: "What role do protons play in atoms?", answer: "are fundamental particles located in the nucleus of an atom and play a crucial role in determining the element's identity and chemical behavior. They carry a positive electrical charge, and their number in an atom's nucleus defines its atomic number, which is unique to each element. Protons also contribute to the atom's mass and, along with neutrons, make up the nucleus. " },
        { question: "Myth", answer: "" },
        { question: "Myth", answer: "" },
        { question: "Myth", answer: "" },
        { question: "Myth", answer: "" },
        { question: "Myth", answer: "" },
        { question: "Myth", answer: "" },

    ]);

    const handleSettingsChange = newSettings => {
        setFlashcardSettings(newSettings);
    };

    useEffect(() => {
        async function resize() {
            if (!sandboxProxy) {
                console.log("sandboxProxy not available");
                return;
            }
            await sandboxProxy.resizeCanvas();
        }
        resize();
    }, [sandboxProxy]);

    const insertCards = async () => {
        if (!sandboxProxy) {
            console.log("sandboxProxy not available");
            return;
        }

        try {
            // Filter out empty cards
            const validCards = cards.filter(card => card.question.trim() !== "" || card.answer.trim() !== "");

            if (validCards.length === 0) {
                console.log("Please fill in at least one card with question or answer");
                return;
            }

            console.log(`Preparing to insert ${validCards.length} flashcards`);

            // pass layout settings
            await sandboxProxy.createFlashcards(validCards, {
                template: templateSetting?.template || "none",
                cardSize: templateSetting?.cardSize || "102x152",
                orientation: templateSetting?.orientation || "horizontal",
                typeKey: templateSetting?.sided || "qa_same_side"
            });

            console.log(`Successfully inserted ${validCards.length} flashcards`);
        } catch (error) {
            console.error("Failed to insert flashcards:", error);
            console.log("Error occurred while inserting flashcards, please check console");
        }
    };

    return (
        <div style={{ height: "95vh", display: "flex", flexDirection: "column", margin: "0 18px 18px" }}>
            {tabs.indexOf(entryTab) != 0 && (
                <div style={styles.nav}>
                    <button
                        style={{ cursor: "pointer", border: "none", backgroundColor: "white", padding: "0" }}
                        onClick={() => {
                            setEntryTab(tabs[tabs.indexOf(entryTab) - 1]);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14" fill="none">
                            <path
                                d="M1.30544 5.86993H14.3479C14.5208 5.86993 14.6867 5.93864 14.809 6.06094C14.9313 6.18323 15 6.3491 15 6.52206C15 6.69501 14.9313 6.86088 14.809 6.98318C14.6867 7.10547 14.5208 7.17418 14.3479 7.17418H1.30544C1.13249 7.17418 0.966619 7.10547 0.844323 6.98318C0.722026 6.86088 0.65332 6.69501 0.65332 6.52206C0.65332 6.3491 0.722026 6.18323 0.844323 6.06094C0.966619 5.93864 1.13249 5.86993 1.30544 5.86993Z"
                                fill="black"
                            />
                            <path
                                d="M1.57539 6.52205L6.98409 11.9294C7.10654 12.0519 7.17533 12.218 7.17533 12.3911C7.17533 12.5643 7.10654 12.7304 6.98409 12.8528C6.86164 12.9753 6.69556 13.0441 6.52239 13.0441C6.34922 13.0441 6.18314 12.9753 6.06069 12.8528L0.191585 6.98375C0.130856 6.92317 0.0826731 6.85121 0.0497978 6.77198C0.0169224 6.69276 0 6.60782 0 6.52205C0 6.43627 0.0169224 6.35134 0.0497978 6.27211C0.0826731 6.19288 0.130856 6.12092 0.191585 6.06034L6.06069 0.191243C6.18314 0.0687922 6.34922 0 6.52239 0C6.69556 0 6.86164 0.0687922 6.98409 0.191243C7.10654 0.313694 7.17533 0.479774 7.17533 0.652946C7.17533 0.826118 7.10654 0.992197 6.98409 1.11465L1.57539 6.52205Z"
                                fill="black"
                            />
                        </svg>
                    </button>
                    <div>{entryTab}</div>
                    <div style={{ height: "13px", width: "13px", padding: "0" }}></div>
                </div>
            )}

            {entryTab === "Upload" && (
                <Upload setExtractedText={setExtractedText} nextPage={() => setEntryTab("Settings")} />
            )}

            {entryTab === "Settings" && (
                <Settings
                    flashcardSettings={flashcardSettings}
                    onSettingsChange={handleSettingsChange}
                    nextPage={() => setEntryTab("Flashcard")}
                    extractedText={extractedText}
                    cards={cards}
                    setCards={setCards}
                    insertCards={insertCards}
                />
            )}

            {entryTab === "Flashcard" && (
                <TextTemplate
                    flashcardSettings={flashcardSettings}
                    templateSetting={templateSetting}
                    cards={cards}
                    setCards={setCards}
                    setTemplateSetting={setTemplateSetting}
                    insertCards={insertCards}
                    extractedText={extractedText}
                />
            )}
        </div>
    );
};

export default App;
