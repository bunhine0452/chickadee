TEMPLATE = "{name} has {count}"


def render(values):
    return TEMPLATE.format(**values)
