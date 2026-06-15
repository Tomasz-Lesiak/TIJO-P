import os
import re
import json
from flask import Flask, request, jsonify, render_template
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_INSTRUCTION = (
    "Jesteś 'QA-MasterMind AI', elitarnym Seniorem QA i audytorem kodu. "
    "Zwracasz odpowiedź wyłącznie jako surowy obiekt JSON — konkretna struktura "
    "jest określona w każdym prompcie. "
    "Wszystkie pola tekstowe muszą być w języku polskim. "
    "Nigdy nie używaj emoji ani żadnych ikon unicode w żadnym polu odpowiedzi. "
    "Nigdy nie owijaj JSON w znaczniki markdown."
)

PROMPTS = {
    "code_quality": (
        "Przeprowadź pełny, automatyczny przegląd kodu (Code Review).\n"
        "1. Wykryj typowe błędy (bugi, podatności, problemy z wydajnością).\n"
        "2. Sprawdź zgodność z dobrymi praktykami (Clean Code, czytelność, standardy formatowania).\n"
        "3. Dla każdego problemu zaproponuj konkretną poprawkę.\n\n"
        "Kod:\n```\n{input}\n```\n\n"
        "Zwróć TYLKO surowy obiekt JSON (bez znaczników markdown) z następującymi kluczami:\n"
        "- 'summary': krótkie ogólne podsumowanie audytu (string, po polsku)\n"
        "- 'score': ocena jakości kodu od 0 do 100 (integer)\n"
        "- 'issues': lista obiektów, każdy z polami:\n"
        "    - 'title': krótki tytuł problemu (string)\n"
        "    - 'severity': dokładnie jeden z: 'CRITICAL', 'WARNING', 'INFO' (string)\n"
        "    - 'description': jasne wyjaśnienie problemu po polsku (string, może zawierać markdown)\n"
        "    - 'suggestion': konkretna propozycja poprawki po polsku (string, może zawierać bloki kodu markdown)\n"
        "- 'positives': lista stringów opisujących dobre aspekty kodu (po polsku)\n"
    ),
    "unit_tests": (
        "Generujesz kod testów oraz ich strukturę dla poniższego kodu. "
        "Użyj unittest/pytest dla Pythona lub standardowego frameworka JS. "
        "Uwzględnij happy path oraz przypadki skrajne.\n\n"
        "Kod:\n```\n{input}\n```\n\n"
        "Zwróć TYLKO surowy obiekt JSON (bez znaczników markdown) z następującymi kluczami:\n"
        "- 'code': kompletny, gotowy do uruchomienia kod testów (string, bez owijania w ```)\n"
        "- 'strategy': krótki opis frameworka i głównego celu testów (string po polsku)\n"
        "- 'mocks': lista obiektów z polami:\n"
        "    - 'component': nazwa mockowanego elementu (string)\n"
        "    - 'purpose': wyjaśnienie dlaczego i jak jest mockowany (string po polsku)\n"
        "- 'test_cases': lista obiektów z polami:\n"
        "    - 'name': nazwa funkcji testowej bez nawiasów (string, snake_case)\n"
        "    - 'description': co ten test weryfikuje (string po polsku)\n"
        "Cały tekst opisowy musi być po polsku, bez żadnych ikon ani emotikonów."
    ),
}


def call_gemini(prompt_key: str, user_input: str) -> dict:
    prompt = PROMPTS[prompt_key].format(input=user_input)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    raw = response.text
    if not raw:
        raise ValueError("Gemini zwrócił pustą odpowiedź. Spróbuj ponownie.")

    raw = raw.strip()

    # Strip markdown code fences the model may emit despite the instruction
    # Handles ```json ... ```, ``` ... ```, etc.
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    raw = raw.strip()

    return json.loads(raw)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/audit-quality", methods=["POST"])
def audit_quality():
    data = request.get_json(silent=True) or {}
    user_input = data.get("input", "").strip()
    if not user_input:
        return jsonify({"error": "No input provided."}), 400
    try:
        return jsonify(call_gemini("code_quality", user_input))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/unit-tests", methods=["POST"])
def unit_tests():
    data = request.get_json(silent=True) or {}
    user_input = data.get("input", "").strip()
    if not user_input:
        return jsonify({"error": "No input provided."}), 400
    try:
        return jsonify(call_gemini("unit_tests", user_input))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
