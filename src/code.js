import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor, colorUtils } from "express-document-sdk";

const { runtime } = addOnSandboxSdk.instance;

// Default font family for consistent typography
const DEFAULT_FONT_FAMILY = "Arial, Helvetica, sans-serif";

// Central configuration for text positioning across all flashcard layouts
const TEXT_POSITION_CONFIG = {
    // Label positioning (for two-side cards)
    label: {
        yRatio: 0.15
    },
    // Same-side card positioning
    sameSide: {
        question: {
            yRatio: 0.25
        },
        answer: {
            yRatio: 0.4
        },
        divider: {
            yRatio: 0.3
        }
    },
    // Two-side card positioning
    twoSide: {
        content: {
            yRatio: 0.45
        }
    }
};

// Unified font size calculation
function getUnifiedFontSize(cardWidth, cardHeight) {
    return Math.max(10, Math.min(18, Math.min(cardWidth, cardHeight) / 15));
}

const MAX_CARDS_PER_ARTBOARD = 4;

function getCardsPerPageLimit() {
    return MAX_CARDS_PER_ARTBOARD;
}

function getOrCreateArtboard(artboardIndex) {
    const pages = editor.documentRoot.pages;
    let page = pages.item(artboardIndex);
    let artboard = page.artboards.first;
    return { page, artboard };
}

// Text wrapping function
function wrapText(text, maxWidth, fontSize) {
    if (!text || !text.trim()) return "";

    // Estimate character width based on font size
    const charWidthRatio = 0.7;
    const avgCharWidth = fontSize * charWidthRatio;
    const calculatedMaxChars = Math.floor(maxWidth / avgCharWidth);

    // Set reasonable line wrapping limits - avoid lines that are too long for readability
    const idealMaxChars = Math.min(calculatedMaxChars, 50); // Maximum 50 characters per line
    const maxCharsPerLine = Math.max(10, idealMaxChars); // Minimum 20 characters per line

    // If text is short, no wrapping needed
    if (text.length <= maxCharsPerLine) {
        return text;
    }

    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        // Check if current line plus new word exceeds limit
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        if (testLine.length <= maxCharsPerLine) {
            currentLine = testLine;
        } else {
            // If current line is not empty, save current line first
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // If word is too long, force split
                if (word.length > maxCharsPerLine) {
                    let remainingWord = word;
                    while (remainingWord.length > maxCharsPerLine) {
                        lines.push(remainingWord.substring(0, maxCharsPerLine));
                        remainingWord = remainingWord.substring(maxCharsPerLine);
                    }
                    currentLine = remainingWord;
                } else {
                    currentLine = word;
                }
            }
        }
    }

    // Add the last line
    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.join("\n");
}

// Create text element with wrapping
function createFlashcardText(text, maxWidth, fontSize, centerX, centerY) {
    try {
        // Use wrapText for intelligent text wrapping
        const wrappedText = wrapText(text, maxWidth, fontSize);
        const textElement = editor.createText(wrappedText);

        // Set basic styles
        textElement.fullContent.applyCharacterStyles(
            { fontSize: fontSize, fontFamily: DEFAULT_FONT_FAMILY },
            { start: 0, length: wrappedText.length }
        );

        // Set position
        textElement.setPositionInParent({ x: centerX, y: centerY }, { x: 0.5, y: 0.5 });

        return textElement;
    } catch (error) {
        console.error("Text creation failed:", error);
        return null;
    }
}

// Create card data based on type
function createCardData(cards, typeKey) {
    if (typeKey === "qa_two_side") {
        // For two-side type: create separate cards for questions and answers
        const cardData = [];
        cards.forEach((card, index) => {
            // Question card
            cardData.push({
                type: "question",
                content: card.question || "",
                question: card.question || "",
                answer: card.answer || "",
                index: index,
                label: `Q${index + 1}`,
                isEmpty: !card.question || !card.question.trim()
            });
            // Answer card
            cardData.push({
                type: "answer",
                content: card.answer || "",
                question: card.question || "",
                answer: card.answer || "",
                index: index,
                label: `A${index + 1}`,
                isEmpty: !card.answer || !card.answer.trim()
            });
        });
        return cardData;
    } else {
        // For same-side type: keep original card structure
        return cards.map((card, index) => ({
            type: "qa_combined",
            question: card.question,
            answer: card.answer,
            index: index
        }));
    }
}

// Layout selection
function getOptimalLayout(qaCount, layoutType, canvasWidth, canvasHeight, typeKey) {
    if (layoutType === "list") {
        if (typeKey === "qa_two_side") {
            return { rows: qaCount * 2, cols: 1, type: "list_paired", qaCount: qaCount };
        } else {
            return { rows: qaCount, cols: 1, type: "list", qaCount: qaCount };
        }
    }

    // Grid layout
    if (typeKey === "qa_two_side") {
        if (qaCount === 1) return { rows: 2, cols: 1, type: "grid_paired", qaCount: qaCount };
        if (qaCount === 2) return { rows: 2, cols: 2, type: "grid_paired", qaCount: qaCount };
        if (qaCount === 3) return { rows: 2, cols: 3, type: "grid_paired", qaCount: qaCount };
        if (qaCount === 4) return { rows: 4, cols: 2, type: "grid_paired", qaCount: qaCount };
        if (qaCount <= 6) return { rows: 4, cols: 3, type: "grid_paired", qaCount: qaCount };
        if (qaCount <= 9) return { rows: 6, cols: 3, type: "grid_paired", qaCount: qaCount };

        const cols = Math.min(4, Math.ceil(Math.sqrt(qaCount)));
        const rows = Math.ceil(qaCount / cols) * 2;
        return { rows, cols, type: "grid_paired", qaCount: qaCount };
    } else {
        // For qa_same_side, keep original 2x2 grid logic for compatibility
        if (qaCount <= 4) {
            const positions = [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
                { row: 1, col: 0 },
                { row: 1, col: 1 }
            ];
            return { rows: 2, cols: 2, type: "grid", qaCount: qaCount, positions };
        }

        // For more than 4 cards, use flexible grid
        if (qaCount <= 6) return { rows: 2, cols: 3, type: "grid", qaCount: qaCount };
        if (qaCount <= 9) return { rows: 3, cols: 3, type: "grid", qaCount: qaCount };
        if (qaCount <= 12) return { rows: 3, cols: 4, type: "grid", qaCount: qaCount };

        const cols = Math.min(4, Math.ceil(Math.sqrt(qaCount)));
        const rows = Math.ceil(qaCount / cols);
        return { rows, cols, type: "grid", qaCount: qaCount };
    }
}

function getCardSizeInPixels(sizeKey) {
    // Convert mm to pixels (assuming 96 DPI)
    const mmToPixels = mm => Math.round((mm * 96) / 25.4);

    const sizes = {
        "74x105": { width: mmToPixels(74), height: mmToPixels(105) }, // A7 (smallest)
        "76x127": { width: mmToPixels(76), height: mmToPixels(127) }, // 3×5 inches
        "105x148": { width: mmToPixels(105), height: mmToPixels(148) }, // A6
        "102x152": { width: mmToPixels(102), height: mmToPixels(152) }, // 4×6 inches
        "127x203": { width: mmToPixels(127), height: mmToPixels(203) } // 5×8 inches (largest)
    };

    return sizes[sizeKey] || sizes["102x152"]; // Default to 4×6
}

// Calculate card size
function calculateCardSize(layoutConfig, canvasWidth, canvasHeight, cardSizeKey, orientation) {
    const physicalSize = getCardSizeInPixels(cardSizeKey);
    let cardWidth = physicalSize.width;
    let cardHeight = physicalSize.height;

    // Swap dimensions for vertical orientation
    if (orientation === "vertical") {
        if (cardWidth > cardHeight) {
            [cardWidth, cardHeight] = [cardHeight, cardWidth];
        }
    } else {
        // For horizontal, ensure width > height
        if (cardWidth < cardHeight) {
            [cardWidth, cardHeight] = [cardHeight, cardWidth];
        }
    }

    // Scale down if card is too large for canvas
    const maxWidth = canvasWidth * 0.9;
    const maxHeight = canvasHeight * 0.9;
    const scale = Math.min(1, maxWidth / cardWidth, maxHeight / cardHeight);

    return {
        cardWidth: Math.round(cardWidth * scale),
        cardHeight: Math.round(cardHeight * scale)
    };
}

// Calculate card position
function calculateCardPosition(index, layoutConfig, cardWidth, cardHeight, canvasWidth, canvasHeight, cardData) {
    const gap = layoutConfig.type.includes("list") ? 15 : 30; // Keep original gap for grid

    const totalGridWidth = layoutConfig.cols * cardWidth + (layoutConfig.cols - 1) * gap;
    const totalGridHeight = layoutConfig.rows * cardHeight + (layoutConfig.rows - 1) * gap;

    const startX = (canvasWidth - totalGridWidth) / 2;
    const startY = (canvasHeight - totalGridHeight) / 2;

    let row, col;

    if (layoutConfig.type === "grid_paired") {
        const card = cardData[index];
        const pairIndex = card.index;
        const isAnswer = card.type === "answer";

        const pairCol = pairIndex % layoutConfig.cols;
        const pairRowGroup = Math.floor(pairIndex / layoutConfig.cols);

        row = pairRowGroup * 2 + (isAnswer ? 1 : 0);
        col = pairCol;
    } else if (layoutConfig.type === "list_paired") {
        const card = cardData[index];
        const pairIndex = card.index;
        const isAnswer = card.type === "answer";

        row = pairIndex * 2 + (isAnswer ? 1 : 0);
        col = 0;
    } else if (layoutConfig.positions) {
        // Use original 2x2 positions for compatibility
        const position = layoutConfig.positions[index] || {
            row: Math.floor(index / layoutConfig.cols),
            col: index % layoutConfig.cols
        };
        row = position.row;
        col = position.col;
    } else {
        // for cards on this page, use current page index
        row = Math.floor(index / layoutConfig.cols);
        col = index % layoutConfig.cols;
    }

    return {
        x: startX + col * (cardWidth + gap),
        y: startY + row * (cardHeight + gap)
    };
}

// Add this function near the top of the file, after imports
function applyCardCornerRadius(rect) {
    rect.topLeftRadius = 30;
    rect.topRightRadius = 30;
    rect.bottomLeftRadius = 30;
    rect.bottomRightRadius = 30;
}

function start() {
    runtime.exposeApi({
        createFlashcards: async (cards, settings = {}) => {
            try {
                console.log("Starting to create flashcards with settings:", settings);

                const cardSizeKey = settings.cardSize || "102x152";
                const cardColor = settings.cardColor || "#FFFFFF";
                const layout = settings.layout || "grid";
                const typeKey = settings.typeKey || "qa_same_side";
                const orientation = settings.orientation || "horizontal";

                // Create card data based on type
                const cardData = createCardData(cards, typeKey);

                // get card number limits
                const cardsPerArtboard = getCardsPerPageLimit();

                // caculate total artboards
                const totalArtboards = Math.ceil(cardData.length / cardsPerArtboard);
                const totalPages = Math.ceil(cardData.length / cardsPerArtboard);

                const pages = editor.documentRoot.pages;
                const pagesLength = pages.length;

                if (pagesLength > 1) {
                    for (let i = pagesLength - 1; i >= 1; i--) {
                        pages.remove(pages.item(i));
                    }
                }

                const artboards = pages.first.artboards;

                // Step 1: Remove all artboards except the first one
                while (artboards.length > 1) {
                    artboards.remove(artboards.last); // remove from end
                }

                // Step 2: Clear all children from the first (remaining) artboard
                artboards.first.children.clear();

                // add all necessary pages
                const pageWidth = artboards.first.width;
                const pageHeight = artboards.first.height;
                while (pages.length < totalPages) {
                    pages.addPage({
                        height: pageHeight,
                        width: pageWidth
                    });
                }

                // group cards by artboard
                for (let artboardIndex = 0; artboardIndex < totalArtboards; artboardIndex++) {
                    const startIndex = artboardIndex * cardsPerArtboard;
                    const endIndex = Math.min(startIndex + cardsPerArtboard, cardData.length);
                    const cardsOnThisArtboard = cardData.slice(startIndex, endIndex);

                    // get the current artboard
                    const calculatedArtboardIndex = Math.floor(startIndex / cardsPerArtboard);
                    const { page, artboard } = getOrCreateArtboard(calculatedArtboardIndex);
                    const canvasWidth = artboard.width;
                    const canvasHeight = artboard.height;

                    // caculates layout
                    const layoutConfig = {
                        rows: 2,
                        cols: 2,
                        type: "grid",
                        qaCount: 4,
                        positions: [
                            { row: 0, col: 0 },
                            { row: 0, col: 1 },
                            { row: 1, col: 0 },
                            { row: 1, col: 1 }
                        ]
                    };

                    // caculates card size
                    const { cardWidth, cardHeight } = calculateCardSize(
                        layoutConfig,
                        canvasWidth,
                        canvasHeight,
                        cardSizeKey,
                        orientation
                    );


                    // Template key mapping
                    const templateMap = {
                        peachy_dawn: "template1",
                        template1: "template1",
                        blue_sky: "template2",
                        template2: "template2",
                        vivid_colors: "template4",
                        template4: "template4"
                    };
                    const templateKey = templateMap[settings.template] || settings.template;

                    // process cards on this artboard
                    cardsOnThisArtboard.forEach((card, artboardCardIndex) => {
                        // caculate global card index
                        const globalCardIndex = startIndex + artboardCardIndex;

                        // caculate card position on this artboard
                        const position = calculateCardPosition(
                            artboardCardIndex,
                            layoutConfig,
                            cardWidth,
                            cardHeight,
                            canvasWidth,
                            canvasHeight,
                            cardsOnThisArtboard
                        );

                        const cardGroup = editor.createGroup();

                        // Build cardForTemplate to ensure question/answer fields exist
                        let cardForTemplate = { ...card };
                        if (card.type === "question" && !cardForTemplate.question) {
                            cardForTemplate.question = card.content;
                        }
                        if (card.type === "answer" && !cardForTemplate.answer) {
                            cardForTemplate.answer = card.content;
                        }

                        // Template branch: if template exists, use template colors only
                        if (templateKey && templateKey !== "none") {
                            let applyTemplate;
                            switch (templateKey) {
                                case "template1":
                                    applyTemplate = applyTemplate1;
                                    break;
                                case "template2":
                                    applyTemplate = applyTemplate2;
                                    break;
                                case "template4":
                                    applyTemplate = applyTemplate4;
                                    break;
                                default:
                                    applyTemplate = applyTemplate1;
                                    break;
                            }
                            console.log(`Applying template ${templateKey} - template will use its own colors`);
                            applyTemplate(
                                cardGroup,
                                { cardWidth, cardHeight },
                                cardForTemplate,
                                { x: position.x, y: position.y },
                                globalCardIndex,
                                orientation
                            );
                        } else {
                            // Default branch: use settings color and text wrapping
                            const cardRect = editor.createRectangle();
                            cardRect.width = cardWidth;
                            cardRect.height = cardHeight;
                            applyCardCornerRadius(cardRect);
                            cardRect.translation = { x: 0, y: 0 };
                            try {
                                const bgColor = colorUtils.fromHex(cardColor);
                                const bgFill = editor.makeColorFill(bgColor);
                                cardRect.fill = bgFill;
                                console.log(`Applied color: ${cardColor}`);
                            } catch (colorError) {
                                console.log("Invalid color, using default:", colorError);
                                const bgColor = colorUtils.fromHex("#FFFFFF");
                                const bgFill = editor.makeColorFill(bgColor);
                                cardRect.fill = bgFill;
                            }
                            const strokeColor = colorUtils.fromHex("#CCCCCC");
                            const stroke = editor.makeStroke({
                                color: strokeColor,
                                width: 2
                            });
                            cardRect.stroke = stroke;
                            cardGroup.children.append(cardRect);

                            // Add content based on card type
                            if (card.type === "question") {
                                // Question-only card (qa_two_side)
                                addQuestionOnlyContent(cardGroup, card, cardWidth, cardHeight, orientation);
                            } else if (card.type === "answer") {
                                // Answer-only card (qa_two_side)
                                addAnswerOnlyContent(cardGroup, card, cardWidth, cardHeight, orientation);
                            } else {
                                // Combined Q&A card (qa_same_side) - use helper function
                                addSameSideContent(cardGroup, card, cardWidth, cardHeight, orientation, "#CCCCCC");
                            }
                        }

                        // Set flashcard group position
                        cardGroup.translation = {
                            x: position.x,
                            y: position.y
                        };
                        artboard.children.append(cardGroup);
                    });
                }
            } catch (error) {
                console.error("Failed to insert flashcards:", error);
                throw error;
            }
        },
        resizeCanvas: async () => {
            const pages = editor.documentRoot.pages;
            const artboards = pages.first.artboards;

            const pageWidth = artboards.first.width;
            const pageHeight = artboards.first.height;

            if (pageWidth != 2500  && pageHeight != 2500 ) {
                pages.addPage({ height: 2500 , width: 2500 });
                pages.remove(pages.item(0));
            }
        }
    });
}

// Add question-only content
function addAnswerOnlyContent(cardGroup, card, cardWidth, cardHeight, orientation = "horizontal") {
    const fontSize = getUnifiedFontSize(cardWidth, cardHeight);

    // Add label
    if (card.label) {
        const labelText = editor.createText(card.label);
        labelText.setPositionInParent(
            { x: cardWidth / 2, y: cardHeight * TEXT_POSITION_CONFIG.label.yRatio },
            { x: 0.5, y: 0.5 }
        );

        try {
            labelText.fullContent.applyCharacterStyles(
                { fontSize: fontSize * 0.8, fontWeight: "bold", fontFamily: DEFAULT_FONT_FAMILY },
                { start: 0, length: card.label.length }
            );
        } catch (styleError) {
            console.log("Failed to set label text style:", styleError);
        }

        cardGroup.children.append(labelText);
    }

    // Add answer content with text wrapping
    let contentToShow = card.content && card.content.trim() ? card.content : "(Empty Answer)";

    // Calculate text area parameters for wrapping
    const textPadding = Math.max(10, cardWidth * 0.05);
    let maxTextWidth = cardWidth - textPadding * 2;

    const relevantEdge = orientation === "vertical" ? Math.min(cardWidth, cardHeight) : Math.max(cardWidth, cardHeight);

    maxTextWidth = Math.min(maxTextWidth, relevantEdge * 0.85);
    maxTextWidth = Math.min(maxTextWidth, fontSize * 30);

    const answerText = createFlashcardText(
        contentToShow,
        maxTextWidth,
        fontSize,
        cardWidth / 2,
        cardHeight * TEXT_POSITION_CONFIG.twoSide.content.yRatio
    );

    if (answerText) {
        cardGroup.children.append(answerText);
    }
}

// Add answer-only content
function addQuestionOnlyContent(cardGroup, card, cardWidth, cardHeight, orientation = "horizontal") {
    const fontSize = getUnifiedFontSize(cardWidth, cardHeight);

    // Add label
    if (card.label) {
        const labelText = editor.createText(card.label);
        labelText.setPositionInParent(
            { x: cardWidth / 2, y: cardHeight * TEXT_POSITION_CONFIG.label.yRatio },
            { x: 0.5, y: 0.5 }
        );

        try {
            labelText.fullContent.applyCharacterStyles(
                { fontSize: fontSize * 0.8, fontWeight: "bold", fontFamily: DEFAULT_FONT_FAMILY },
                { start: 0, length: card.label.length }
            );
        } catch (styleError) {
            console.log("Failed to set label text style:", styleError);
        }

        cardGroup.children.append(labelText);
    }

    // Add question content with text wrapping
    let contentToShow = card.content && card.content.trim() ? card.content : "(Empty Question)";

    // Calculate text area parameters for wrapping
    const textPadding = Math.max(10, cardWidth * 0.05);
    let maxTextWidth = cardWidth - textPadding * 2;

    const relevantEdge = orientation === "vertical" ? Math.min(cardWidth, cardHeight) : Math.max(cardWidth, cardHeight);

    maxTextWidth = Math.min(maxTextWidth, relevantEdge * 0.85);
    maxTextWidth = Math.min(maxTextWidth, fontSize * 30);

    const questionText = createFlashcardText(
        contentToShow,
        maxTextWidth,
        fontSize,
        cardWidth / 2,
        cardHeight * TEXT_POSITION_CONFIG.twoSide.content.yRatio
    );

    if (questionText) {
        cardGroup.children.append(questionText);
    }
}

// Template color schemes
const TEMPLATE_COLORS = ["#FFDCDC", "#FFF2EB", "#FFE8CD", "#FFD6BA"];
const TEMPLATE2_COLORS = ["#819A91", "#A7C1A8", "#D1D8BE", "#EEEFE0"];
const TEMPLATE4_COLORS = ["#E5D9F2", "#F5EFFF", "#CDC1FF", "#A594F9"];

// Helper function to create card background
function createCardBackground(cardWidth, cardHeight, colorHex, borderColor) {
    const rect = editor.createRectangle();
    rect.width = cardWidth;
    rect.height = cardHeight;
    applyCardCornerRadius(rect);
    rect.fill = editor.makeColorFill(colorUtils.fromHex(colorHex));
    rect.stroke = editor.makeStroke({ color: colorUtils.fromHex(borderColor), width: 2 });
    return rect;
}

// Generic template application function
function applyTemplate(
    cardGroup,
    { cardWidth, cardHeight },
    card,
    colorScheme,
    borderColor,
    dividerColor,
    orientation = "horizontal",
    index = 0
) {
    // Create background
    const colorIndex = card.type === "question" || card.type === "answer" ? card.index : index;
    const colorHex = colorScheme[colorIndex % colorScheme.length];
    const background = createCardBackground(cardWidth, cardHeight, colorHex, borderColor);
    cardGroup.children.append(background);

    // Handle content based on card type
    if (card.type === "question" || card.type === "answer") {
        addTwoSideContent(cardGroup, card, cardWidth, cardHeight, orientation);
    } else {
        addSameSideContent(cardGroup, card, cardWidth, cardHeight, orientation, dividerColor);
    }
}

// Helper function to handle qa_same_side content
function addSameSideContent(cardGroup, card, cardWidth, cardHeight, orientation, dividerColor) {
    // Calculate text area parameters
    const textPadding = Math.max(10, cardWidth * 0.05);
    let maxTextWidth = cardWidth - textPadding * 2;

    // Dynamic font size calculation
    let fontSize = getUnifiedFontSize(cardWidth, cardHeight);

    // Smart text wrapping with orientation-aware width calculation
    const relevantEdge = orientation === "vertical" ? Math.min(cardWidth, cardHeight) : Math.max(cardWidth, cardHeight);

    maxTextWidth = Math.min(maxTextWidth, relevantEdge * 0.85);
    maxTextWidth = Math.min(maxTextWidth, fontSize * 30);

    if (maxTextWidth < (cardWidth - textPadding * 2) * 0.7) {
        const widthReductionFactor = maxTextWidth / (cardWidth - textPadding * 2);
        fontSize = fontSize * Math.max(0.8, widthReductionFactor);
    }

    // Create question text with wrapping
    if (card.question && card.question.trim()) {
        const questionText = createFlashcardText(
            card.question,
            maxTextWidth,
            fontSize,
            cardWidth / 2,
            cardHeight * TEXT_POSITION_CONFIG.sameSide.question.yRatio
        );
        if (questionText) {
            cardGroup.children.append(questionText);
        }
    }

    // Create answer text with wrapping
    const answerContent = card.answer && card.answer.trim() ? card.answer : "[Answer to be added]";
    if (answerContent) {
        const answerText = createFlashcardText(
            answerContent,
            maxTextWidth,
            fontSize,
            cardWidth / 2,
            cardHeight * TEXT_POSITION_CONFIG.sameSide.answer.yRatio
        );
        if (answerText) {
            cardGroup.children.append(answerText);
        }
    }

    // Add divider line
    const line = editor.createRectangle();
    line.width = cardWidth * 0.8;
    line.height = 2;
    line.translation = { x: cardWidth * 0.1, y: cardHeight * TEXT_POSITION_CONFIG.sameSide.divider.yRatio };
    line.fill = editor.makeColorFill(colorUtils.fromHex(dividerColor));
    cardGroup.children.append(line);
}

// Helper function to handle qa_two_side content
function addTwoSideContent(cardGroup, card, cardWidth, cardHeight, orientation) {
    if (card.type === "question") {
        addQuestionOnlyContent(cardGroup, card, cardWidth, cardHeight, orientation);
    } else {
        addAnswerOnlyContent(cardGroup, card, cardWidth, cardHeight, orientation);
    }
}

function applyTemplate1(
    cardGroup,
    { cardWidth, cardHeight },
    card,
    position = { x: 0, y: 0 },
    index = 0,
    orientation = "horizontal"
) {
    applyTemplate(
        cardGroup,
        { cardWidth, cardHeight },
        card,
        TEMPLATE_COLORS,
        "#CCCCCC",
        "#FFB6B6",
        orientation,
        index
    );
}

function applyTemplate2(
    cardGroup,
    { cardWidth, cardHeight },
    card,
    position = { x: 0, y: 0 },
    index = 0,
    orientation = "horizontal"
) {
    applyTemplate(
        cardGroup,
        { cardWidth, cardHeight },
        card,
        TEMPLATE2_COLORS,
        "#5f706a",
        "#5f706a",
        orientation,
        index
    );
}

function applyTemplate4(
    cardGroup,
    { cardWidth, cardHeight },
    card,
    position = { x: 0, y: 0 },
    index = 0,
    orientation = "horizontal"
) {
    applyTemplate(
        cardGroup,
        { cardWidth, cardHeight },
        card,
        TEMPLATE4_COLORS,
        "#8a7dc9",
        "#8a7dc9",
        orientation,
        index
    );
}

start();
