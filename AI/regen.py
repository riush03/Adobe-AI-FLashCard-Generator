import requests
import os
from flask import Request, jsonify
import functions_framework

api_key = os.environ.get("api_key")
end_point = os.environ.get("end_point")

@functions_framework.http
def regenerate_card(request: Request):
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
    answer_prompt = (data.get("answerPrompt") or "").strip()
    question_prompt = (data.get("questionPrompt") or "").strip()
    existingContext = data.get("existingContext", {})

    question = existingContext.get("question", "")
    answer = existingContext.get("answer", "")

    if not raw_text:
        response = jsonify({"response": "Please provide non-empty 'text'."})
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response, 400

    try:
        card = {"question": "", "answer": ""}

        if question_prompt:
            q_result = generate(question_prompt, raw_text[:8000])
                
            if q_result["response"] == "!Invalid Request." :
                response = jsonify({"response": "Sorry! No regeneration acheived"})
                return response, 422

        card["question"] = q_result["response"]
        if answer_prompt:
            base_question = card["question"] or question or ""
            context = f"Updated question you need to provide an answer is '{base_question}' \n\n{answer_prompt}"
            
            a_result = generate(context, answer)
            
            if a_result["response"] == "!Invalid Request." :
                response = jsonify({"response": "Sorry! No regeneration achieved"})
                response.headers["Access-Control-Allow-Origin"] = "*"
                return response, 422
            
            card["answer"] = a_result["response"]

        response = jsonify({"card": card})
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response

    except Exception as e:
        response = jsonify({"response": f"Failed to regenerate card. {e}"})
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response, 500

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