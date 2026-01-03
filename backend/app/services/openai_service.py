"""Wrapper around the OpenAI client for chat completions."""

from __future__ import annotations

from typing import Iterator, List, Optional

from openai import OpenAI

from ..config import get_settings


class OpenAIService:
    def __init__(self) -> None:
        settings = get_settings()
        api_key = settings.openai_api_key

        self._client: Optional[OpenAI] = None
        self._is_mock_mode = False

        if api_key:
            try:
                self._client = OpenAI(api_key=api_key)
                print(f"[OpenAIService] Client initialized successfully with API key (length: {len(api_key)})")
            except Exception as e:
                print(f"[OpenAIService] Error initializing OpenAI client: {e}")
                # Fall back to mock mode if client creation fails
                self._is_mock_mode = True
        else:
            # Fall back to a lightweight mock so the app still runs without a key
            print("[OpenAIService] No API key found, using mock mode")
            self._is_mock_mode = True

    def _mock_response(self, messages: List[dict]) -> str:
        last_user_message = next(
            (m["content"] for m in reversed(messages) if m.get("role") == "user"),
            "",
        )

        preface = (
            "(Mock AI) I'm running in local demo mode because an OpenAI API key isn't set."
        )

        if last_user_message:
            return (
                f'{preface} I heard you say: "{last_user_message}". '
                "Charts and calculations will still update with your numbers."
            )
        return (
            f"{preface} Ask me about your home price, rent, down payment, and timeline and I'll keep the analysis flowing."
        )

    def chat_completion(self, model: str, messages: List[dict], temperature: float = 0.7, max_tokens: int = 200) -> str:
        print(f"[OpenAIService.chat_completion] Called with mock_mode={self._is_mock_mode}, client={self._client is not None}")
        if self._is_mock_mode or self._client is None:
            print(f"[OpenAIService.chat_completion] Returning mock response (mock_mode={self._is_mock_mode}, client=None={self._client is None})")
            return self._mock_response(messages)

        try:
            print(f"[OpenAIService.chat_completion] Calling OpenAI API...")
            completion = self._client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            response = completion.choices[0].message.content or "I'm having trouble responding right now. Can you try again?"
            print(f"[OpenAIService.chat_completion] Success! Response length: {len(response)}")
            return response
        except Exception as exc:  # broad fallback to keep the chat responsive
            # Fall back to mock response so the UI keeps working
            print(f"[OpenAIService.chat_completion] Falling back to mock response due to error: {exc}")
            import traceback
            traceback.print_exc()
            return self._mock_response(messages)

    def chat_completion_stream(self, model: str, messages: List[dict], temperature: float = 0.7, max_tokens: int = 150) -> Iterator[str]:
        """Stream chat completion tokens as they arrive."""
        if self._is_mock_mode or self._client is None:
            # For mock mode, yield the response word by word to simulate streaming
            mock_text = self._mock_response(messages)
            for word in mock_text.split():
                yield word + " "
            return

        try:
            stream = self._client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as exc:
            print(f"[OpenAIService] Streaming error: {exc}")
            # Fall back to mock response
            mock_text = self._mock_response(messages)
            for word in mock_text.split():
                yield word + " "
