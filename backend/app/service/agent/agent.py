import json
import re
from utils.llm import get_llm_client, get_chat_model, get_reasoner_model

def extract_json_content(input_str):
    """
    提取字符串中第一个"["和最后一个"]"之间的内容（包括中括号）
    
    Args:
        input_str (str): 需要处理的输入字符串
    
    Returns:
        str or None: 提取的JSON内容，如果没有匹配则返回None
    """
    # 使用正则表达式匹配第一个"["到最后一个"]"之间的内容
    # [\s\S]* 匹配任意字符（包括换行符）
    pattern = r'(\[[\s\S]*\])'
    match = re.search(pattern, input_str)
    
    # 如果匹配成功，返回匹配的内容；否则返回None
    return match.group(1) if match else None

def middle_json_model(prompt):

    client = get_llm_client()
    completion = client.chat.completions.create(
        model=get_chat_model(),
        messages=[
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': prompt}],
        response_format={"type": "json_object"}
        )
        
    return completion.choices[0].message.content

# rag搜索
def rag(query):
    indexNames = "1"
    try:
        from service.core.retrieval import retrieve_content
        from service.core.rag.utils.es_conn import ESConnection
        es = ESConnection()
        if not es.es.indices.exists(index=indexNames):
            print(f"本地知识库索引 {indexNames} 不存在，跳过本地文档搜索")
            return []
    except Exception as e:
        print(f"检查知识库索引失败，跳过本地文档搜索: {e}")
        return []

    rag_results = retrieve_content(indexNames, query)
    return rag_results

# 网页搜索
def web_search_answer(query):
    # 简化版本：直接使用搜索结果，不进行向量化处理
    try:
        from service.web_search.web_search import serper_search, process_search_results
        
        # 直接获取搜索结果
        search_results = serper_search(query)
        snippets, related_questions = process_search_results(search_results)
        
        # 直接返回搜索结果，不需要向量化和相似度计算
        return snippets
        
    except Exception as e:
        print(f"网络搜索失败: {e}")
        return f"网络搜索暂时不可用，错误信息: {str(e)}"


ALLOWED_ACTIONS = {"本地文档搜索", "网络搜索"}


def normalize_planned_actions(value, allow_web=True):
    """Normalize planner output and enforce the tools allowed by the request."""
    if isinstance(value, dict):
        value = value.get("actions", [])
    if not isinstance(value, list):
        return []

    normalized = []
    for item in value:
        if not isinstance(item, dict):
            continue
        action_name = item.get("action_name")
        if action_name not in ALLOWED_ACTIONS:
            continue
        if action_name == "网络搜索" and not allow_web:
            continue

        prompts = item.get("prompts", [])
        if isinstance(prompts, str):
            prompts = [prompts]
        if not isinstance(prompts, list):
            continue

        prompts = [prompt.strip() for prompt in prompts if isinstance(prompt, str) and prompt.strip()]
        if prompts:
            normalized.append({"action_name": action_name, "prompts": prompts[:3]})

    return normalized


#规划模块plan
def agent_plan(query, allow_web=True):
    prompt = f'''
你是 DeepSearch 的通用研究规划器。分析用户问题，并判断是否真的需要外部检索。

用户问题：{query}
联网是否允许：{"是" if allow_web else "否"}

可用工具：
1. 本地文档搜索：仅搜索用户已上传或组织内部的知识库。
2. 网络搜索：搜索需要时效性的公开网络信息；只有联网允许时才可使用。

选择规则：
- 编程实现、算法、数学推导、文本改写、翻译、常识问答、闲聊等可凭模型知识可靠回答的问题，必须直接回答，actions 返回空数组。
- 用户明确提到“文档、知识库、上传资料、内部资料、根据材料”等内容时，才使用本地文档搜索。
- 用户询问新闻、当前价格、近期版本、实时数据，或明确要求联网查证时，才使用网络搜索。
- 不得把用户问题改写成无关产品、品牌或行业问题。
- 每种工具最多生成 3 个简洁且与原问题直接相关的查询。

示例：
- “帮我实现一个快速排序” => {{"actions": []}}
- “根据我上传的产品文档总结续航参数” => {{"actions": [{{"action_name": "本地文档搜索", "prompts": ["产品文档中的续航参数"]}}]}}
- “搜索今天的 AI 新闻” => {{"actions": [{{"action_name": "网络搜索", "prompts": ["今天的 AI 新闻"]}}]}}

只返回 JSON 对象：
{{"actions": [{{"action_name": "本地文档搜索或网络搜索", "prompts": ["查询"]}}]}}
'''
    result = middle_json_model(prompt)
    print(result)
    try:
        parsed = json.loads(result)
    except (TypeError, json.JSONDecodeError):
        json_list = extract_json_content(result or "")
        try:
            parsed = json.loads(json_list) if json_list else {"actions": []}
        except json.JSONDecodeError:
            parsed = {"actions": []}

    return normalize_planned_actions(parsed, allow_web=allow_web)
        
    

#任务状态state
def adjust_format(original_data):
    """
    调整数据格式，使每个action_name只搭配一个prompt
    
    参数:
    original_data (list): 原始数据，每个action_name对应多个prompts
    
    返回:
    list: 调整后的数据，每个action_name只对应一个prompt
    """
    adjusted_data = []
    
    for item in original_data:
        action_name = item['action_name']
        prompts = item['prompts']
        
        # 为每个prompt创建一个新的字典
        for prompt in prompts:
            adjusted_item = {
                'action_name': action_name,
                'prompt': prompt
            }
            adjusted_data.append(adjusted_item)
    
    return adjusted_data


def reflection(user_query, memory_global, allow_web=True):
    prompt = f'''
你是 DeepSearch 的通用研究审查器。判断现有检索资料是否足以回答原问题。

原问题：{user_query}
现有资料：{memory_global}
联网是否允许：{"是" if allow_web else "否"}

规则：
- 资料已经覆盖问题时，不再搜索。
- 补充查询必须与原问题直接相关，不得引入无关品牌、产品或行业。
- 只有用户问题明确依赖其文档时才使用本地文档搜索。
- 只有需要最新公开信息且联网允许时才使用网络搜索。
- 最多补充 2 个查询。

只返回 JSON 对象；不需要补充时返回 {{"actions": []}}：
{{"actions": [{{"action_name": "本地文档搜索或网络搜索", "prompts": ["补充查询"]}}]}}
'''
    result = middle_json_model(prompt)
    try:
        parsed = json.loads(result)
    except (TypeError, json.JSONDecodeError):
        parsed = {"actions": []}
    return normalize_planned_actions(parsed, allow_web=allow_web)
        
    

def deduplicate_memory_global(memory):
    """
    对最终的memory进行全局去重，根据所有结果中的content_with_weight字段去重
    
    Args:
        memory: 记忆列表，每个元素包含"提问"和"结果"字段
        
    Returns:
        deduplicated_memory: 去重后的记忆列表
    """
    if not isinstance(memory, list):
        return memory
    
    # 用于跟踪已见过的content_with_weight
    seen_content = set()
    deduplicated_memory = []
    
    for memory_item in memory:
        if not isinstance(memory_item, dict) or '结果' not in memory_item:
            # 如果不是预期的结构，直接添加
            deduplicated_memory.append(memory_item)
            continue
            
        result = memory_item['结果']
        
        # 如果结果是列表，需要检查每个元素的content_with_weight
        if isinstance(result, list):
            deduplicated_result = []
            for item in result:
                if isinstance(item, dict) and 'content_with_weight' in item:
                    content = item['content_with_weight'].strip()  # 去除首尾空格
                    content_hash = hash(content)  # 使用hash来比较，避免长字符串比较问题
                    
                    if content_hash not in seen_content:
                        seen_content.add(content_hash)
                        deduplicated_result.append(item)
                    else:
                        # 如果已见过，打印调试信息
                        print(f"发现重复内容，已过滤: id={item.get('id', 'unknown')}, 内容前50字符: {content[:50]}")
                else:
                    # 如果没有content_with_weight字段，直接添加
                    deduplicated_result.append(item)
            
            # 创建新的memory_item，使用去重后的结果
            new_memory_item = {
                "提问": memory_item['提问'],
                "结果": deduplicated_result
            }
            deduplicated_memory.append(new_memory_item)
        else:
            # 如果结果不是列表，直接添加
            deduplicated_memory.append(memory_item)
    
    return deduplicated_memory

#执行模块tools,依次执行actions内的动作，根据action_name判断执行函数web_search_answer()，还是rag()
def process_actions(actions):
    """
    处理动作列表函数
    
    Args:
        actions: 动作列表，每个动作包含action_name和prompt
        
    Returns:
        memory: 包含每次调用结果的记忆列表
    """
    # 初始化记忆列表
    memory = []
    
    # 依次处理每个动作
    for action in actions:
        action_name = action['action_name']
        prompt = action['prompt']
        
        print(f'正在执行{action_name}: "{prompt}"')
        
        try:
            # 根据动作类型调用相应的函数
            if action_name == '本地文档搜索':
                result = rag(prompt)
            elif action_name == '网络搜索':
                result = web_search_answer(prompt)
            else:
                result = f"未知的动作类型: {action_name}"
            
            # 将结果添加到记忆中
            memory_item = {
                "提问": prompt,
                "结果": result
            }
            memory.append(memory_item)
            
            # 输出结果
            print(f"提问：{prompt}")
            print(f"结果：{result}")
            print("-------------------")
            
        except Exception as e:
            # 如果执行失败，打印详细错误信息，继续下一轮循环
            print(f"--------{action_name}检索失败，错误详情: {str(e)}-----------")
            import traceback
            print(f"完整错误堆栈: {traceback.format_exc()}")
            continue
    
    print("所有执行动作已完成，结果已添加到memory中。")
    
    # 对最终的memory进行全局去重
    # 统计去重前的总结果数量
    total_before = sum(len(item['结果']) if isinstance(item['结果'], list) else 1 for item in memory)
    
    deduplicated_memory = deduplicate_memory_global(memory)
    
    # 统计去重后的总结果数量
    total_after = sum(len(item['结果']) if isinstance(item['结果'], list) else 1 for item in deduplicated_memory)
    
    print(f"去重前memory数量: {len(memory)}, 去重后memory数量: {len(deduplicated_memory)}")
    print(f"去重前总结果数量: {total_before}, 去重后总结果数量: {total_after}, 过滤了 {total_before - total_after} 个重复项")
    
    return deduplicated_memory


def has_usable_memory(memory):
    if not memory:
        return False
    for item in memory:
        result = item.get("结果") if isinstance(item, dict) else None
        if isinstance(result, list) and result:
            return True
        if isinstance(result, str) and result.strip() and "暂时不可用" not in result:
            return True
    return False


def build_final_prompt(user_query, memory_global, conversation_history=None):
    references = json.dumps(memory_global, ensure_ascii=False) if memory_global else "无"
    history = (
        json.dumps(conversation_history, ensure_ascii=False)
        if conversation_history
        else "无"
    )
    return f'''
你是 DeepSearch，一个通用、准确且中立的 AI 助手。

回答规则：
1. 直接回答用户实际提出的问题，不得引入无关品牌、产品、行业或营销内容。
2. 对话历史是当前会话的真实上下文。遇到“上一个问题”“刚才的回答”“继续解释”等指代时，必须依据对话历史回答。
3. 参考资料仅作为相关证据；忽略与问题无关的资料。没有资料时，使用可靠的通用知识回答。
4. 不得声称无法访问已提供的对话历史，也不得编造来源。
5. 使用与用户相同的语言，结构清晰、简洁但完整。
6. 如果用户要求代码，先给出完整可执行的 Markdown 代码块，再解释实现、复杂度和关键边界情况。
7. 如果资料之间存在冲突或信息不足，要明确说明不确定性。

当前会话历史（按时间顺序）：
{history}

参考资料：
{references}

用户问题：
{user_query}
'''


# 初始化 LLM 客户端
def final_answer(
    user_query,
    allow_web=True,
    session_id=None,
    user_id="1",
    conversation_history=None,
):
    client = get_llm_client()
    answer_content = ""

    action_tool = agent_plan(user_query, allow_web=allow_web)
    print("action_tool")
    print(action_tool)

    if action_tool:
        adjusted_tools = adjust_format(action_tool)
        actions=adjusted_tools
    else:
        actions=[]

    for action in actions:
        action_name = action['action_name']
        prompt = action['prompt']
        message = {
            "role": "agent",
            "content": f'正在执行{action_name}: "{prompt}"'
        }

        json_message = json.dumps(message)
        yield f"event: message\ndata: {json_message}\n\n"

    memory_new = process_actions(actions)
    memory_global = list(memory_new)

    # 仅在已经检索到有效资料时审查是否需要补充，直接回答不触发二次检索。
    action_reflect = (
        reflection(user_query, memory_global, allow_web=allow_web)
        if actions and has_usable_memory(memory_global)
        else []
    )
    if action_reflect:
        print("回顾内容，进行反思...")
        message = {
            "role": "agent",
            "content": "正在补充检索更多信息..."
        }
        yield f"event: message\ndata: {json.dumps(message)}\n\n"
        try:
            # reflection 可能返回 prompts 为字符串，这里统一成列表
            normalized = []
            for item in action_reflect:
                prompts = item.get("prompts")
                if isinstance(prompts, str):
                    normalized.append({"action_name": item["action_name"], "prompts": [prompts]})
                elif isinstance(prompts, list):
                    normalized.append(item)
            if normalized:
                reflect_actions = adjust_format(normalized)
                memory_new = process_actions(reflect_actions)
                memory_global.extend(memory_new)
        except Exception as e:
            print(f"反思补充检索失败: {e}")

    final_prompt = build_final_prompt(
        user_query,
        memory_global,
        conversation_history=conversation_history,
    )

    print(final_prompt)    
    print('-'*130)
    
    # 创建聊天完成请求
    completion = client.chat.completions.create(
        model=get_reasoner_model(),
        messages=[
            {"role": "user", "content": final_prompt}
        ],
        stream=True,
    )
    
    print("\n" + "=" * 20 + "思考过程" + "=" * 20 + "\n")
    
    for chunk in completion:
        if chunk.choices[0].finish_reason == "stop":
            if session_id:
                try:
                    from service.core.chat import write_chat_to_db, update_session_name

                    write_chat_to_db(
                        session_id,
                        user_query,
                        answer_content,
                        [],
                        [],
                        "",
                    )
                    update_session_name(session_id, user_query, user_id)
                except Exception as error:
                    print(f"保存深度研究会话失败: {error}")

            # 结束时发送 [DONE] 事件
            yield "event: end\ndata: [DONE]\n\n"
            break
        else:
            # 实时输出消息
            delta = chunk.choices[0].delta
            if delta.content:
                answer_content += delta.content
                message = {
                    "role": "assistant",
                    "content": delta.content,
                    "thinking": False,
                }
                json_message = json.dumps(message)
                yield f"event: message\ndata: {json_message}\n\n"
            else:
                reasoning = getattr(delta, "reasoning_content", None)
                if reasoning:
                    message = {
                        "role": "assistant",
                        "content": reasoning,
                        "thinking": True,
                    }
                    json_message = json.dumps(message)
                    yield f"event: message\ndata: {json_message}\n\n"


