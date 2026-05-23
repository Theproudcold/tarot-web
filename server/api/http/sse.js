export const openFastifyEventStream = (reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  reply.raw.socket?.setNoDelay?.(true);
  reply.raw.flushHeaders?.();
  reply.raw.write(`: ${' '.repeat(2048)}\n\n`);
};

export const writeFastifySseEvent = (reply, event, payload) => {
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
  reply.raw.flush?.();
};
