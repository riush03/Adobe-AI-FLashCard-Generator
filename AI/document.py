import json
import requests
import os
from typing import List, Dict, Any, Union
from flask import Request, jsonify
import functions_framework

api_key = os.environ.get("api_key")
end_point = os.environ.get("end_point")

def _safe_get_json(raw: Union[Dict[str, Any], str], key: str) -> dict:
    payload = raw.get(key, "") if isinstance(raw, dict) else ""
    if isinstance(payload, dict):
        return payload
    try:
        cleaned = payload.strip().removeprefix("```json").removesuffix("```").strip()
        return json.loads(cleaned)
    except Exception as e:
        raise ValueError("Invalid JSON in LLM output")

def _cards_from_text(
        text: str, questionPrompt: str, answerPrompt: str
) -> List[Dict[str, str]]:
    questions = _safe_get_json(generate(text, questionPrompt), "response").get("questions", [])

    if not questions:
        raise ValueError("No questions generated.")

    cards = [{"question": q, "answer": ""} for q in questions]
    context_header = f"### CONTEXT\n{text[:8000]}\n\n### CONTEXT END\n### QUESTIONS\n"
    numbered_questions = "\n".join(f"{i+1}. {card['question']}" for i, card in enumerate(cards))
    query = f"{context_header}{numbered_questions}"

    answers = _safe_get_json(generate(system=answerPrompt, query=query), "response").get("answers", [])

    for i, a in enumerate(answers):
        if i < len(cards):
            cards[i]["answer"] = a.strip()

    return cards

@functions_framework.http
def respond_document(request: Request):
    ADDON_ORIGIN = "https://wi4km212g.wxp.adobe-addons.com"
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": ADDON_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key",
            "Access-Control-Max-Age": "3600",
        }

        return ("", 204, headers)

    data = request.get_json(force=True, silent=True) or {}
    raw_text = (data.get("text") or "").strip()
    questionPrompt = str(data.get("questionPrompt", ""))
    answerPrompt = str(data.get("answerPrompt", ""))

    if not raw_text:
        response = jsonify({"response": "Please provide non-empty 'text'."})
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response, 400

    try:
        cards = _cards_from_text(raw_text, questionPrompt, answerPrompt)
        response = jsonify({"cards": cards})
    except Exception as e:
        response = jsonify({"response": f"Failed to generate flash cards. {e}"})
        response.headers["Access-Control-Allow-Origin"] = ADDON_ORIGIN
        return response, 500

    response.headers["Access-Control-Allow-Origin"] = ADDON_ORIGIN
    return response

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

    try:
        response = requests.post(end_point, headers=headers, json=payload)

        if response.status_code == 200:
            return {'response': response.json().get('result', {})}
        else:
            return f"Error: Received response code {response.status_code}"
    except requests.exceptions.RequestException as e:
        return {"response": f"An error occurred: {e}"}