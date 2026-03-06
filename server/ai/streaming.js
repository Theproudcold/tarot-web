const STREAM_DELAY_MS = 90;

const clone = (value) => JSON.parse(JSON.stringify(value));

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const sentencePattern = /(?<=[。！？.!?])\s+/u;

const createTextSnapshots = (text, chunkSize = 90) => {
  if (!text) return [];

  const sentences = text.split(sentencePattern).map((item) => item.trim()).filter(Boolean);
  if (sentences.length > 1) {
    return sentences.map((_, index) => sentences.slice(0, index + 1).join(' '));
  }

  const snapshots = [];
  for (let index = chunkSize; index < text.length; index += chunkSize) {
    snapshots.push(text.slice(0, index));
  }
  snapshots.push(text);
  return snapshots;
};

export const createReadingStreamFrames = (reading) => {
  if (!reading) return [];

  const current = {
    version: reading.version,
    language: reading.language,
    source: reading.source,
    model: reading.model,
    question: reading.question,
    createdAt: reading.createdAt,
    orchestration: reading.orchestration ?? null,
    agentPipeline: reading.agentPipeline ?? null,
    dominantElement: reading.dominantElement,
    elementDistribution: reading.elementDistribution,
    quote: '',
    summary: '',
    perCard: reading.perCard.map((item) => ({
      slot: item.slot,
      slotLabel: item.slotLabel,
      title: item.title,
      orientation: item.orientation,
      orientationLabel: item.orientationLabel,
      keyword: item.keyword,
      message: '',
    })),
    advice: [],
    followUps: [],
    mantra: '',
    safetyNote: '',
  };

  const frames = [clone(current)];

  createTextSnapshots(reading.quote, 48).forEach((snapshot) => {
    current.quote = snapshot;
    frames.push(clone(current));
  });

  createTextSnapshots(reading.summary, 110).forEach((snapshot) => {
    current.summary = snapshot;
    frames.push(clone(current));
  });

  reading.perCard.forEach((item, index) => {
    createTextSnapshots(item.message, 95).forEach((snapshot) => {
      current.perCard[index].message = snapshot;
      frames.push(clone(current));
    });
  });

  reading.advice.forEach((_, index) => {
    current.advice = reading.advice.slice(0, index + 1);
    frames.push(clone(current));
  });

  if (reading.mantra) {
    current.mantra = reading.mantra;
    frames.push(clone(current));
  }

  reading.followUps.forEach((_, index) => {
    current.followUps = reading.followUps.slice(0, index + 1);
    frames.push(clone(current));
  });

  if (reading.safetyNote) {
    current.safetyNote = reading.safetyNote;
    frames.push(clone(current));
  }

  return frames;
};

export const writeSseEvent = (response, event, payload) => {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
  response.flush?.();
};

export const streamReadingFrames = async (response, reading, options = {}) => {
  const { abortedRef, delayMs = STREAM_DELAY_MS, stage = null } = options;
  const frames = createReadingStreamFrames(reading);

  for (const frame of frames) {
    if (abortedRef?.current) return;
    writeSseEvent(response, 'partial', { reading: frame, stage });
    await sleep(delayMs);
  }

  if (!abortedRef?.current) {
    writeSseEvent(response, 'complete', { reading, stage });
  }
};
