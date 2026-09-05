def route(code, retry):
    if code == 503:
        if retry:
            return "retry"
    return "stop"
