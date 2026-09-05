READ = 1
WRITE = 2


def slot_for(index):
    return READ << index


def rest_of(index):
    return index >> 1
