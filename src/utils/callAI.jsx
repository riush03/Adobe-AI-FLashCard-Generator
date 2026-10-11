const lengthPrompts = {
    question: {
        Small: "Keep questions very short and concise (2-3 words max).",
        Medium: "Keep questions moderately detailed (around 7 words).",
        Large: "More detailed and comprehensive (around 12 words)."
    },
    answer: {
        Small: "Keep answers very brief (4-5 words max).",
        Medium: "Provide moderately detailed answers (15-20 words).",
        Large: "Give comprehensive answers with examples (around 30 words)."
    }
};

export function createQuestionPrompt(n, length) {
    return `You are an education expert.
    From the given query, extract EXACTLY ${n} important key terms that
    a general audience should learn. ONLY when absolutely necessary,
    if the concept is too complex for just generating a term, you may phrase it
    as a question. For example, prefer "Protons" over "What are protons?"
    
    ${lengthPrompts.question[length]}
    
    Respond with STRICT JSON:
    { "questions": ["Q1", "Q2", ...] }
    IMPORTANT: You must return exactly ${n} questions unless the content is insufficient.`;
}

export function createAnswerPrompt(n, length) {
    return `You are an expert study-card generator. Answer each entry 
    appropriately for a general audience. Unless not mentioned in the query, 
    the answers should be generated based on the query.

    You are an expert study-card generator.
    Unless not mentioned in the query, the answers should be generated based 
    on the query. Write every answer so it is appropriate for a general audience 
    (choose vocabulary, length, and examples accordingly).
    {length_instruction}

    For each entry, provide a concise, accurate answer.
      • If the entry is a single word, give a short, precise definition.
      • If the entry is a full question, answer it directly.

    Do **not** repeat the entry inside the answer itself.
    For example, if the question is "Electrons", instead of "Electrons 
    are negatively charged particles that orbit the nucleus of an atom,"
    write "Negatively charged particles that orbit the nucleus of an atom."
    
    ${lengthPrompts.answer[length]}
    
    Return strict JSON like:
    { "answers": ["<answer1>", "<answer2>", ...] }

    IMPORTANT: You must return exactly ${n} answers in the order that is listed.`;
}

export async function fetchCardsFromText(
    extractedText,
    totalCardNumber,
    questionLength,
    answerLength
) {
    const questionPrompt = createQuestionPrompt(totalCardNumber, questionLength);
    const answerPrompt = createAnswerPrompt(totalCardNumber, answerLength);

    const res = await fetch(
        process.env.REACT_APP_REGEN_END_POINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text: extractedText,
            questionPrompt,
            answerPrompt
        })
    });

    return res;
}


function createRegenQuestionPrompt(regenHow, length, question) {
    return `You are an education expert.

    The original question is "${question}".

    However, the user didn't like it and want it changed. Look at user's 
    demand and regenerate a question. When there is a conflict of rules, 
    always prioritize user's demand unless it is of malicious intent.

    ${lengthPrompts.question[length]}

    Respond with ONLY A STRING. If regenerate based on the user request could
    not be executed, response with "!Invalid Request."
    
    User's demand:
    ${regenHow}`
}

function createRegenAnswerPrompt(extractedText, regenHow, length) {
    return `You are an expert study-card generator.
    
    The query is an existing answer that the user didn't like and want it changed.
    Treat the query as a placeholder regardless of topic, even if it is about a different particle.
    If the query is irrelevant, ignore it. When there is a conflict of rules, 
    always prioritize user's demand unless it is of malicious intent.

    Generate an answer that is appropriate for a general audience. 
    (Choose vocabulary, length, and examples accordingly) based on the updated question. 
    Unless directly mentioned, the answers should be generated based on the context given. 
    If it is a request about re-phrasing or re-wording, you do not have to generate based on the context.

    Provide a concise, accurate answer.  
    • If the entry is a single word, give a short, precise definition.  
    • If the entry is a full question, answer it directly.  

    Do **not** repeat the question inside the answer itself.
    For example, if the question is "Electrons", instead of "Electrons
    are negatively charged particles that orbit the nucleus of an atom,"
    write "Negatively charged particles that orbit the nucleus of an atom."
    
    ${lengthPrompts.answer[length]}
    
    Respond with ONLY A STRING. If regenerate based on the user request could
    not be executed, response with "!Invalid Request."

    User's demand:
    ${regenHow}
    
    Content: 
    ${extractedText}`;
}

export async function reGenNewCardFromText(
    extractedText,
    regenHow,
    questionLength,
    answerLength,
    existingContext
) {
    const questionPrompt = questionLength ? createRegenQuestionPrompt(regenHow, questionLength, existingContext.question) : null;
    const answerPrompt = answerLength ? createRegenAnswerPrompt(extractedText, regenHow, answerLength) : null;

    const res = await fetch(
        process.env.REACT_APP_GEN_END_POINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text: extractedText,
            questionPrompt,
            answerPrompt,
            existingContext
        })
    });

    return res;
}