import asyncio
from time import time

class MTimer:
    def __init__(self, timeout, callback, **kwargs):
        self._timeout = timeout
        self._callback = callback
        self._task = asyncio.create_task(self._run())
        self._kwargs = kwargs

    async def _run(self):
        await asyncio.sleep(self._timeout)
        await self._callback(**self._kwargs)

    def cancel(self):
        self._task.cancel()


def time_ms():
    return int(time() * 1000)
