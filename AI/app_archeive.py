import sys, json, re, logging
from typing import List, Dict, Any, Union

from flask import Flask, request, jsonify, current_app
from flask_cors import CORS
from llmproxy import generate

sys.stdout.reconfigure(encoding='utf-8')  

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app, supports_credentials=True, origins=[
    "https://localhost:5241",
    "https://localhost:4000",
    "https://localhost:3000"
])

import logging
log = logging.getLogger("pdf_logger")

def _safe_get_json(raw: Union[Dict[str, Any], str], key: str) -> dict:
    """
    raw  - dict returned by llmproxy.generate()
    key  - the field that *should* contain JSON or a JSON-ish string

    Returns a **dict** (never a str).  Raises if it can't be parsed.
    """
    if isinstance(raw, str):
        current_app.logger.error("Raw response is string, not dict: %r", raw)
        raise ValueError("LLM output is not valid JSON")
    
    payload = raw.get(key, "")

    if isinstance(payload, dict):
        return payload

    if not isinstance(payload, str) or not payload.strip():
        current_app.logger.error("Empty/invalid payload for key '%s': %r", key, payload)
        raise ValueError("LLM output is not valid JSON")

    cleaned = re.sub(r"^\s*```[^\\n]*\n|\n```$", "", payload.strip(), flags=re.MULTILINE)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        current_app.logger.error("JSON decode failed: %s\nRaw payload: %r", e, payload)
        raise ValueError("LLM output is not valid JSON")


def _llm_get_questions(md_text: str, n: int, question_length: str) -> List[str]:
    length_instructions = {
        "Small": "Keep questions very short and concise (2-3s words maximum, like 'What are protons?').",
        "Medium": "Keep questions moderately detailed but clear (around 7 words, like 'How do protons and electrons interact in an atom?').",
        "Large": "Questions can be more detailed and comprehensive (around 12 words, like 'What is the relationship between protons, neutrons, and electrons in determining the properties of different elements?')."
    }
    
    length_instruction = length_instructions.get(question_length, length_instructions["Medium"])
    
    sys_prompt = f"""
    You are an education expert.
    From the given markdown context, extract EXACTLY {n} important key terms that
    a general audience should learn. ONLY when absolutely necessary,
    if the concept is too complex for just generating a term, you may phrase it
    as a question. For example, prefer "Protons" over "What are protons?"

    {length_instruction}

    **Respond with STRICT JSON only – NO markdown, NO code fences, NO extra keys**
    {{ "questions": ["Q1", "Q2", ...] }}
    
    IMPORTANT: You must return exactly {n} questions unless the content is insufficient.
    """
    
    current_app.logger.info(f"System prompt sent to AI: {sys_prompt}")

    raw = generate(
        model="4o-mini",
        system=sys_prompt,
        query=md_text[:8000],   # truncate for cost/speed safety
        temperature=0.3,
        lastk=0,
        session_id="ai-question-gen",
    )

    questions_dict = _safe_get_json(raw, "response")
    questions = questions_dict.get("questions", [])
    current_app.logger.info(f"AI returned {len(questions)} questions: {questions}")
    return questions
    
def _complete_cards(
    cards: List[Dict[str, str]],
    context_md: str = "",
    model: str = "4o-mini",
    answer_length: str = "Medium",
) -> None:
    unanswered_idx = [i for i, c in enumerate(cards) if not str(c.get("answer", "")).strip()]
    if not unanswered_idx:
        return

    qs = [cards[i]["question"].strip() for i in unanswered_idx]


    length_instructions = {
        "Small": "Keep answers very brief and to the point (4-5 words maximum, like 'Protons are positive particles.').",
        "Medium": "Provide moderately detailed answers (15-20 words, like 'Protons are positively charged particles found in the nucleus of atoms.').",
        "Large": "Give comprehensive answers with examples and explanations (around 30 words, like 'Protons are positively charged subatomic particles found in the nucleus of atoms, and they determine the atomic number of an element.')."
    }
    
    length_instruction = length_instructions.get(answer_length, length_instructions["Medium"])

    sys_prompt = f"""
    You are an expert study-card generator.
    Write every answer so it is appropriate for a general audience (choose vocabulary, length, and examples accordingly).
    {length_instruction}
    
    For each entry, provide a concise, accurate answer.
      • If the entry is a single word, give a short, precise definition.
      • If the entry is a full question, answer it directly.

    Do **not** repeat the entry inside the answer itself.

    Return STRICT JSON of the form:
    {{ "answers": ["<answer1>", "<answer2>", ...] }}   (no markdown).
    """

    user_parts = []
    if context_md:
        user_parts.append("### CONTEXT\n" + context_md[:8000])
    user_parts.append("\n" + "\n".join(f"{i+1}. {q}" for i, q in enumerate(qs)))
    user_prompt = "\n\n".join(user_parts)

    raw = generate(
        model=model,
        system=sys_prompt,
        query=user_prompt,
        temperature=0.0,
        lastk=0,
        session_id="ai-card-complete",
    )

    answers = _safe_get_json(raw, "response").get("answers", [])

    if len(answers) != len(unanswered_idx):
        raise ValueError("Answer count mismatch")

    for idx, ans in zip(unanswered_idx, answers):
        cards[idx]["answer"] = ans.strip()

def _cards_from_text(text: str, total_card_number: int = 4, question_length: str = "Medium", answer_length: str = "Medium") -> List[Dict[str, str]]:
    questions = _llm_get_questions(text,  n=total_card_number, question_length=question_length)
    cards = [{"question": q, "answer": ""} for q in questions]

    _complete_cards(cards, text, answer_length=answer_length)
    return cards

@app.route("/api/document", methods=["POST"])
def respond_document():
    data = request.get_json(force=True, silent=True) or {}
    raw_text = str(data.get("text", "")).strip()
    total_card_number = int(data.get("totalCardNumber", 4))
    question_length = str(data.get("questionLength", "Medium"))
    answer_length = str(data.get("answerLength", "Medium"))

    # 详细的调试日志
    current_app.logger.info(f"=== API Request Debug ===")
    current_app.logger.info(f"Raw data received: {data}")
    current_app.logger.info(f"totalCardNumber from request: {data.get('totalCardNumber')}")
    current_app.logger.info(f"Parsed total_card_number: {total_card_number}")
    current_app.logger.info(f"questionLength: {question_length}")
    current_app.logger.info(f"answerLength: {answer_length}")

    if not raw_text:
        return jsonify({"response": "Please provide non-empty 'text'."}), 400

    try:
        cards = _cards_from_text(raw_text,total_card_number, question_length, answer_length)
        current_app.logger.info(f"Final cards generated: {len(cards)}")
        current_app.logger.info(f"Card questions: {[card.get('question', '') for card in cards]}")
    except Exception as e:
        current_app.logger.error("Error in /api/document: %s", e)
        return jsonify({"response": "Failed to generate flash cards."}), 500

    return jsonify({"cards": cards})

@app.route("/api/text", methods=["POST"])
def respond_text():
    data     = request.get_json(force=True, silent=True) or {}
    cards    = data.get("cards")

    if not isinstance(cards, list) or not cards:
        return jsonify({"response": "Please provide a non-empty 'cards' array."}), 400

    unanswered_idx = [i for i, c in enumerate(cards) if not str(c.get("answer", "")).strip()]
    if not unanswered_idx:
        return jsonify({"cards": cards})

    try:
        _complete_cards(cards)
    except Exception as e:
        current_app.logger.error("Error in /api/text generate: %s", e)
        return jsonify({"response": "Internal error during answer generation."}), 500

    return jsonify({"cards": cards})

if __name__ == "__main__":
    app.run(ssl_context=("dev.crt", "dev.key"), host="127.0.0.1", port=5001)