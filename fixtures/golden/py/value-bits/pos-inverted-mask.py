def cover(bits):
    keep = ~bits
    return keep


def widen(bits, room):
    return bits << room
