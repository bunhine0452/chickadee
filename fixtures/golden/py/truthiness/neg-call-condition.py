def run(job):
    if is_ready(job):
        job.start()
    return job
