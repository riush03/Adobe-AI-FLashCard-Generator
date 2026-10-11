from __future__ import annotations
import sys
import json
import requests
import os
from typing import List, Dict, Any, Union
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()

api_key = os.getenv("api_key")
end_point = os.getenv("end_point")

print(f"API Key: {api_key}")
print(f"Database URL: {end_point}")

sys.stdout.reconfigure(encoding="utf-8")

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app, supports_credentials=True, origins=[
    "https://localhost:5241",
    "https://localhost:4000",
    "https://localhost:3000"
])


def _safe_get_json(raw: Union[Dict[str, Any], str], key: str) -> dict:
    payload = raw.get(key, "") if isinstance(raw, dict) else ""
    if isinstance(payload, dict):
        return payload
    try:
        cleaned = payload.strip().removeprefix("```json").removesuffix("```").strip()
        return json.loads(cleaned)
    except Exception as e:
        print(f"Failed JSON parse: {e}")
        raise ValueError("Invalid JSON in LLM output")

def _cards_from_text(
    text: str, questionPrompt: str, answerPrompt: str
) -> List[Dict[str, str]]:
    questions = _safe_get_json(generate(text, questionPrompt), "response").get("questions", [])
    print(f"questions: {questions}")

    if not questions:
        raise ValueError("No questions generated.")

    cards = [{"question": q, "answer": ""} for q in questions]
    context_header = f"### CONTEXT\n{text[:8000]}\n\n### CONTEXT END\n### QUESTIONS\n"
    numbered_questions = "\n".join(f"{i+1}. {card['question']}" for i, card in enumerate(cards))
    query = f"{context_header}{numbered_questions}"

    # Generate answers
    answers = _safe_get_json(generate(system=answerPrompt, query=query), "response").get("answers", [])
    print(f"answers: {answers}")

    for i, a in enumerate(answers):
        if i < len(cards):
            cards[i]["answer"] = a.strip()

    return cards

@app.route("/api/regen", methods=["POST"])
def regenerate_card():
    data = request.get_json(force=True, silent=True) or {}

    raw_text = str(data.get("text", "")).strip()
    answer_prompt = (data.get("answerPrompt") or "").strip()
    question_prompt = (data.get("questionPrompt") or "").strip()
    existingContext = data.get("existingContext", {})

    question = existingContext.get("question", "")
    answer = existingContext.get("answer", "")

    if not raw_text:
        return jsonify({"response": "Please provide non-empty 'text'."}), 400

    try:
        card = {"question": "", "answer": ""}

        if question_prompt:
            print("Generating regenerated question...")
            q_result = generate(question_prompt, raw_text[:8000])
                
            if q_result["response"] == "!Invalid Request." :
                return jsonify({"response": "Sorry! No regeneration acheived"}), 422
            card["question"] = q_result["response"]

        if answer_prompt:
            print("Generating regenerated answer...\n")
            base_question = card["question"] or question or ""
            context = f"Updated question you need to provide an answer is '{base_question}' \n\n{answer_prompt}"
            
            print(f"context: {context}\n")
            print(f"answer: {answer}\n")
            
            a_result = generate(context, answer)
            
            if a_result["response"] == "!Invalid Request." :
                return jsonify({"response": "Sorry! No regeneration achieved"}), 422
            
            card["answer"] = a_result["response"]

        return jsonify({"card": card})

    except Exception as e:
        print(f"Error in /api/regen: {e}")
        return jsonify({"response": "Failed to regenerate card."}), 500


@app.route("/api/document", methods=["POST"])
def respond_document():
    data = request.get_json(force=True, silent=True) or {}
    raw_text = str(data.get("text", "")).strip()
    questionPrompt = str(data.get("questionPrompt", ""))
    answerPrompt = str(data.get("answerPrompt", ""))

    print("=== API Request ===")
    print(f"Question Prompt: {questionPrompt}")
    print(f"Answer Prompt: {answerPrompt}")

    if not raw_text:
        return jsonify({"response": "Please provide non-empty 'text'."}), 400

    try:
        cards = _cards_from_text(raw_text, questionPrompt, answerPrompt)
        print(f"Generated {len(cards)} cards.")
    except Exception as e:
        print(f"Error in /api/document: {e}")
        return jsonify({"response": "Failed to generate flash cards."}), 500

    return jsonify({"cards": cards})


def generate(system: str, query: str):
    headers = {'x-api-key': api_key}

    payload = {
        'model': "4o-mini",
        'system': system,
        'query': query,
        'temperature': 0.3,
        'lastk': 0,
        'session_id': "ai-question-gen",
        'rag_threshold': 0.5,
        'rag_usage': False,
        'rag_k': 0
    }

    print(f"request: {request}")

    try:
        response = requests.post(end_point, headers=headers, json=payload)
        print(f"response: {response}")
        if response.status_code == 200:
            return {'response': response.json().get('result', {})}
        else:
            return f"Error: Received response code {response.status_code}"
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return {"response": f"An error occurred: {e}"}


if __name__ == "__main__":
    app.run(ssl_context=("dev.crt", "dev.key"), host="127.0.0.1", port=5001)