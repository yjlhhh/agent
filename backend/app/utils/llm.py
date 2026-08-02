import os
from openai import OpenAI


def get_llm_client() -> OpenAI:
    """优先使用 DeepSeek；若未配置则回退到 DashScope。"""
    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    if deepseek_key:
        return OpenAI(
            api_key=deepseek_key,
            base_url=os.getenv("LLM_BASE_URL", "https://api.deepseek.com"),
        )

    return OpenAI(
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url=os.getenv(
            "LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"
        ),
    )


def get_chat_model() -> str:
    if os.getenv("DEEPSEEK_API_KEY"):
        return os.getenv("LLM_CHAT_MODEL", "deepseek-chat")
    return os.getenv("LLM_CHAT_MODEL", "qwen-plus")


def get_reasoner_model() -> str:
    if os.getenv("DEEPSEEK_API_KEY"):
        return os.getenv("LLM_REASONER_MODEL", "deepseek-reasoner")
    return os.getenv("LLM_REASONER_MODEL", "deepseek-r1")
