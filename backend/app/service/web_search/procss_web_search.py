from service.web_search.web_search import serper_search, process_search_results


def store_and_query_snippets(question: str, top_k: int = 5):
    """
    获取 Serper 搜索结果并返回前 top_k 条 snippets。
    说明：DeepSeek 不提供 embedding，这里直接截取搜索结果，不再做向量重排。
    """
    search_results = serper_search(question)
    snippets, related_questions = process_search_results(search_results)
    return snippets[:top_k], related_questions
