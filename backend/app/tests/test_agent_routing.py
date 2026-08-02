import json
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from schemas.chat import ChatRequest
from service.agent import agent
from service.core import chat as chat_service


class AgentRoutingTests(unittest.TestCase):
    @patch.object(agent, "middle_json_model")
    def test_quicksort_is_planned_as_a_direct_answer(self, middle_json_model):
        middle_json_model.return_value = json.dumps({"actions": []})

        actions = agent.agent_plan("帮我实现一个快速排序")

        self.assertEqual(actions, [])
        planner_prompt = middle_json_model.call_args.args[0]
        self.assertIn("帮我实现一个快速排序", planner_prompt)
        self.assertIn("必须直接回答", planner_prompt)
        self.assertNotIn("星辰电动", planner_prompt)
        self.assertNotIn("汽车销售助手", planner_prompt)

    @patch.object(agent, "middle_json_model")
    def test_uploaded_documents_can_use_local_search(self, middle_json_model):
        middle_json_model.return_value = json.dumps(
            {
                "actions": [
                    {
                        "action_name": "本地文档搜索",
                        "prompts": ["上传文档中的续航参数"],
                    }
                ]
            }
        )

        self.assertEqual(
            agent.agent_plan("根据我上传的文档总结续航参数"),
            [
                {
                    "action_name": "本地文档搜索",
                    "prompts": ["上传文档中的续航参数"],
                }
            ],
        )

    @patch.object(agent, "middle_json_model")
    def test_web_actions_are_removed_when_web_is_disabled(self, middle_json_model):
        middle_json_model.return_value = json.dumps(
            {
                "actions": [
                    {
                        "action_name": "网络搜索",
                        "prompts": ["今天的 AI 新闻"],
                    }
                ]
            }
        )

        self.assertEqual(
            agent.agent_plan("今天的 AI 新闻", allow_web=False),
            [],
        )

    def test_chat_request_accepts_search_mode(self):
        request = ChatRequest(message="快速排序", web_search=False)

        self.assertFalse(request.web_search)
        self.assertEqual(request.attachments, [])

    def test_final_prompt_includes_session_history(self):
        prompt = agent.build_final_prompt(
            "我提问的上一个问题是什么",
            [],
            conversation_history=[
                {
                    "user": "你是什么模型",
                    "assistant": "我是 DeepSearch。",
                }
            ],
        )

        self.assertIn("你是什么模型", prompt)
        self.assertIn("我是 DeepSearch。", prompt)
        self.assertIn("必须依据对话历史回答", prompt)

    @patch.object(agent, "reflection")
    @patch.object(agent, "process_actions")
    @patch.object(agent, "agent_plan")
    @patch.object(agent, "get_llm_client")
    def test_final_answer_keeps_the_first_search_result(
        self,
        get_llm_client,
        agent_plan,
        process_actions,
        reflection,
    ):
        agent_plan.return_value = [
            {"action_name": "本地文档搜索", "prompts": ["问题"]}
        ]
        process_actions.return_value = [
            {
                "提问": "问题",
                "结果": [{"content_with_weight": "第一批资料"}],
            }
        ]
        reflection.return_value = []

        completion = [
            SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        finish_reason="stop",
                        delta=SimpleNamespace(content=None),
                    )
                ]
            )
        ]
        client = MagicMock()
        client.chat.completions.create.return_value = completion
        get_llm_client.return_value = client

        list(agent.final_answer("根据资料回答", allow_web=False))

        final_prompt = client.chat.completions.create.call_args.kwargs["messages"][0][
            "content"
        ]
        self.assertIn("第一批资料", final_prompt)
        self.assertNotIn("汽车销售助手", final_prompt)
        reflection.assert_called_once()

    @patch.object(agent, "reflection")
    @patch.object(agent, "process_actions")
    @patch.object(agent, "agent_plan")
    @patch.object(agent, "get_llm_client")
    def test_direct_answer_skips_reflection(
        self,
        get_llm_client,
        agent_plan,
        process_actions,
        reflection,
    ):
        agent_plan.return_value = []
        process_actions.return_value = []

        completion = [
            SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        finish_reason="stop",
                        delta=SimpleNamespace(content=None),
                    )
                ]
            )
        ]
        client = MagicMock()
        client.chat.completions.create.return_value = completion
        get_llm_client.return_value = client

        list(agent.final_answer("帮我实现一个快速排序"))

        reflection.assert_not_called()
        final_prompt = client.chat.completions.create.call_args.kwargs["messages"][0][
            "content"
        ]
        self.assertIn("先给出完整可执行的 Markdown 代码块", final_prompt)
        self.assertNotIn("星辰电动", final_prompt)

    @patch.object(chat_service, "update_session_name")
    @patch.object(chat_service, "write_chat_to_db")
    @patch.object(agent, "reflection")
    @patch.object(agent, "process_actions")
    @patch.object(agent, "agent_plan")
    @patch.object(agent, "get_llm_client")
    def test_completed_deep_research_is_persisted(
        self,
        get_llm_client,
        agent_plan,
        process_actions,
        reflection,
        write_chat_to_db,
        update_session_name,
    ):
        agent_plan.return_value = []
        process_actions.return_value = []

        completion = [
            SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        finish_reason=None,
                        delta=SimpleNamespace(
                            content="快速排序答案",
                            reasoning_content=None,
                        ),
                    )
                ]
            ),
            SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        finish_reason="stop",
                        delta=SimpleNamespace(content=None),
                    )
                ]
            ),
        ]
        client = MagicMock()
        client.chat.completions.create.return_value = completion
        get_llm_client.return_value = client

        list(
            agent.final_answer(
                "帮我实现快速排序",
                session_id="session-2",
                user_id="1",
            )
        )

        reflection.assert_not_called()
        write_chat_to_db.assert_called_once_with(
            "session-2",
            "帮我实现快速排序",
            "快速排序答案",
            [],
            [],
            "",
        )
        update_session_name.assert_called_once_with(
            "session-2",
            "帮我实现快速排序",
            "1",
        )


class WebSearchModeTests(unittest.TestCase):
    @patch.object(chat_service, "update_session_name")
    @patch.object(chat_service, "write_chat_to_db")
    @patch.object(chat_service, "serper_videos")
    @patch.object(chat_service, "serper_images")
    @patch.object(chat_service, "get_llm_client")
    def test_disabled_web_mode_skips_media_search(
        self,
        get_llm_client,
        serper_images,
        serper_videos,
        _write_chat_to_db,
        _update_session_name,
    ):
        completion = [
            SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        finish_reason="stop",
                        delta=SimpleNamespace(content=None),
                    )
                ]
            )
        ]
        client = MagicMock()
        client.chat.completions.create.return_value = completion
        get_llm_client.return_value = client

        list(
            chat_service.get_chat_completion(
                "session",
                "问题",
                [],
                "1",
                "prompt",
                [],
                [],
                enable_web_search=False,
            )
        )

        serper_images.assert_not_called()
        serper_videos.assert_not_called()


if __name__ == "__main__":
    unittest.main()
