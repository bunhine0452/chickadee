import os


DIR_MODE = 0o750


def secure(path):
    os.chmod(path, DIR_MODE)
    return path
