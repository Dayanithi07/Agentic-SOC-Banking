import os
import json
from pydantic import BaseModel
from typing import Type, TypeVar, Optional

T = TypeVar("T", bound=BaseModel)
_client = None

def _get_client():
    global _client
    from app.config import GEMINI_API_KEY
    if _client is None and GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            _client = genai.GenerativeModel("gemini-1.5-flash")
        except Exception as e:
            print(f"Error initializing Gemini: {e}")
            _client = None
    return _client

async def generate_structured_response(prompt: str, response_schema: Type[T]) -> Optional[T]:
    client = _get_client()
    if client:
        try:
            # We enforce JSON output formatting via prompt since Gemini Python SDK 
            # structured output is best done via generation_config.
            # Using basic generation_config with response_mime_type
            import google.generativeai as genai
            response = client.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                )
            )
            data = json.loads(response.text)
            return response_schema(**data)
        except Exception as e:
            print(f"AI Service Error: {e}")
            pass
            
    # Fallback to mock for testing without API key
    print("Fallback mock triggered for structured response")
    try:
        # We can attempt to return a default constructed model
        # Just create an empty dict and let Pydantic handle default factories
        # In reality, this depends heavily on the model structure.
        return None
    except Exception:
        return None

async def chat(message: str, history: list[dict] | None = None) -> str:
    # Retain standard chat for the frontend chat interface if needed
    client = _get_client()
    if client:
        try:
            response = client.generate_content(f"You are a SOC Analyst. User: {message}")
            return response.text.strip()
        except Exception:
            pass
    return "SOC Copilot operational. No Gemini key found."
