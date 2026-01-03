import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const Interpretation = ({ cards, language = 'en' }) => {
  if (!cards || cards.length < 3) return null;

  const [past, present, future] = cards;

  // --- Helpers ---
  const getLocalized = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj['en'] || '';
  };

  const cleanText = (text) => text ? text.replace(/[。.,，\s]+$/, '') : '';

  const getMeaning = (card) => cleanText(getLocalized(card.isReversed ? card.meaning_reversed : card.meaning_upright));

  const getPositionLabel = (card) => card.isReversed ? (language === 'zh' ? '逆位' : 'Reversed') : (language === 'zh' ? '正位' : 'Upright');

  // --- Elemental Analysis ---
  const elements = useMemo(() => {
    const counts = { Fire: 0, Water: 0, Air: 0, Earth: 0 };
    cards.forEach(c => {
      if (c.element && counts[c.element] !== undefined) {
        counts[c.element]++;
      }
    });
    const total = 3;
    const analysis = Object.keys(counts).map(k => ({
      name: k,
      percent: Math.round((counts[k] / total) * 100),
      label: { en: k, zh: k === 'Fire' ? '火' : k === 'Water' ? '水' : k === 'Air' ? '风' : '土' }
    }));

    // Find dominant
    const dominant = analysis.reduce((prev, current) => (prev.percent > current.percent) ? prev : current);
    return { distribution: analysis, dominant };
  }, [cards]);

  // --- Static Creative Text (Simulated AI) ---
  const quotes = {
    zh: [
      "“在欲望的荆棘丛中，你曾为自己戴上金锁；如今，抉择的晨星已悬于眉睫。”",
      "“命运并非在手中，而是在你的决断之中。风起之时，便是起航之日。”",
      "“你灵魂的每一次颤抖，都是星辰给你的指引。倾听它，不要怀疑。”"
    ],
    en: [
      "“Amidst the thorns of desire, you forged your own golden chains; now, the morning star of choice hangs upon your brow.”",
      "“Destiny is determined not by what you hold, but by what you decide. When the wind rises, we must try to live.”",
      "“Every tremor of your soul is guidance from the stars. Listen to it without doubt.”"
    ]
  };

  const advices = {
    zh: [
      "请在新月或清晨日出时分，进行一项“释放与接纳”的仪式。写下旧的束缚，将其燃烧。",
      "并在窗台放置一颗水晶，感受月光给予的净化之力。",
      "找一个安静的午后，整理你的空间，因为外在的秩序往往映射内在的清明。"
    ],
    en: [
      "Perform a 'Release and Accept' ritual at sunrise. Write down old bindings and burn the paper safely.",
      "Place a crystal on your windowsill to absorb the cleansing light of the moon.",
      "Spend a quiet afternoon organizing your space, for outer order often reflects inner clarity."
    ]
  };

  // Pseudo-random pick based on card IDs
  const seed = cards[0].id + cards[1].id + cards[2].id;
  const quote = quotes[language][seed % quotes[language].length];
  const advice = advices[language][seed % advices[language].length];

  // --- Localized Labels ---
  const t = {
    elementalTitle: language === 'zh' ? "元素能量分析" : "Elemental Energy Analysis",
    dominant: language === 'zh' ? "主导能量" : "Dominant Energy",
    whisperTitle: language === 'zh' ? "✧ 星辰的低语 ✧" : "✧ Whispers of the Stars ✧",
    resonanceTitle: language === 'zh' ? "◈ 能量共鸣" : "◈ Energy Resonance",
    deepDiveTitle: language === 'zh' ? "❖ 深演：命途之迹" : "❖ Deep Dive: Path of Fate",
    pastLabel: language === 'zh' ? "【过去/根源】" : "【Past/Root】",
    presentLabel: language === 'zh' ? "【现在/处境】" : "【Present/Situation】",
    futureLabel: language === 'zh' ? "【未来/趋向】" : "【Future/Trend】",
    adviceTitle: language === 'zh' ? "⚖ 启示：宇宙的密语" : "⚖ Revelation: Cosmic Whisper",
    mantraTitle: language === 'zh' ? "🔮 命运箴言" : "🔮 Oracle's Mantra",
    mantraText: language === 'zh' ? "“锁链自铸，亦能自熔；择你所爱，光便从内而生。”" : "“Chains self-forged can be self-melted; choose what you love, and light will spring from within.”"
  };

  // --- Energy Resonance Text Generation ---
  const generateResonance = () => {
    if (language === 'zh') {
      return `这是一场关于${getMeaning(past)}的旅程。此刻，${getMeaning(present)}的能量正在显化，这要求你保持觉知。未来的${getMeaning(future)}预示着只要你信任内在的指引，便能穿越迷雾，抵达真实的彼岸。`;
    }
    return `This is a journey rooted in ${getMeaning(past)}. Currently, the energy of ${getMeaning(present)} is manifesting, requiring your full awareness. The future promise of ${getMeaning(future)} suggests that if you trust your inner guidance, you will pierce through the fog and reach your true destination.`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 text-left animate-fadeIn font-serif text-gray-200">

      {/* 1. Elemental & Dominant */}
      <div className="bg-black/40 backdrop-blur-md rounded-xl border border-tarot-gold/30 p-8 mb-8">
        <h2 className="text-xl text-tarot-gold mb-6 border-b border-tarot-gold/20 pb-2">{t.elementalTitle}</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Chart */}
          <div className="flex gap-4 items-end h-32 w-full md:w-1/2 justify-around">
            {elements.distribution.map(stat => (
              <div key={stat.name} className="flex flex-col items-center gap-2 h-full justify-end w-12">
                <span className="text-xs text-tarot-gold">{stat.percent}%</span>
                <div className="w-full bg-white/10 rounded-t overflow-hidden relative" style={{ height: '100%' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${stat.percent}%` }}
                    className={`absolute bottom-0 w-full ${stat.name === 'Fire' ? 'bg-red-500' : stat.name === 'Water' ? 'bg-blue-500' : stat.name === 'Air' ? 'bg-yellow-400' : 'bg-green-500'} opacity-70`}
                  />
                </div>
                <span className="text-xs text-gray-400">{getLocalized(stat.label)}</span>
              </div>
            ))}
          </div>
          {/* Dominant Text */}
          <div className="md:w-1/2 text-center md:text-left">
            <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-1">{t.dominant}</h3>
            <div className="text-3xl text-tarot-gold font-bold mb-2">
              {getLocalized(elements.dominant.label)} {language === 'zh' ? '元素主导' : 'Dominant'}
            </div>
            <p className="text-sm text-gray-300 italic opacity-80">
              {language === 'zh'
                ? "这意味着在当前局势中，该元素的特质（如行动、情感、思维或物质）将占据主导地位。"
                : "This signifies that in the current situation, the qualities of this element (Action, Emotion, Thought, or Matter) play a leading role."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Star Whispers & Resonance */}
      <div className="bg-white/5 rounded-xl p-8 mb-8 border-l-4 border-tarot-gold">
        <h3 className="text-center text-tarot-gold/80 mb-4 tracking-widest text-sm">{t.whisperTitle}</h3>
        <p className="text-center text-xl italic text-gray-100 mb-8 font-light leading-relaxed">
          {quote}
        </p>

        <h3 className="text-tarot-gold font-bold mb-3">{t.resonanceTitle}</h3>
        <p className="leading-loose text-gray-300">
          {generateResonance()}
        </p>
      </div>

      {/* 3. Deep Dive */}
      <div className="mb-12">
        <h2 className="text-2xl text-center text-tarot-gold mb-8 tracking-[0.2em]">{t.deepDiveTitle}</h2>
        <div className="space-y-6">
          {/* Past */}
          <div className="bg-gradient-to-r from-black/60 to-transparent p-6 rounded-lg border-t border-white/10">
            <h3 className="text-tarot-gold text-lg mb-2">
              {t.pastLabel} · {getLocalized(past.name)} · {getPositionLabel(past)}
            </h3>
            <p className="text-gray-300 leading-relaxed pl-4 border-l-2 border-white/20">
              "{getMeaning(past)}"
              <br /><span className="text-sm opacity-60 mt-2 block">{language === 'zh' ? '这张牌揭示了你根基中存在的能量...' : 'This card reveals the energy existing at your foundation...'}</span>
            </p>
          </div>

          {/* Present */}
          <div className="bg-gradient-to-r from-tarot-gold/20 to-transparent p-6 rounded-lg border-l-4 border-tarot-gold">
            <h3 className="text-tarot-gold text-lg mb-2">
              {t.presentLabel} · {getLocalized(present.name)} · {getPositionLabel(present)}
            </h3>
            <p className="text-gray-200 leading-relaxed pl-4 border-l-2 border-white/20">
              "{getMeaning(present)}"
              <br /><span className="text-sm opacity-60 mt-2 block">{language === 'zh' ? '此刻，你正站在一个至关重要的节点...' : 'At this moment, you stand at a crucial junction...'}</span>
            </p>
          </div>

          {/* Future */}
          <div className="bg-gradient-to-r from-black/60 to-transparent p-6 rounded-lg border-t border-white/10">
            <h3 className="text-tarot-gold text-lg mb-2">
              {t.futureLabel} · {getLocalized(future.name)} · {getPositionLabel(future)}
            </h3>
            <p className="text-gray-300 leading-relaxed pl-4 border-l-2 border-white/20">
              "{getMeaning(future)}"
              <br /><span className="text-sm opacity-60 mt-2 block">{language === 'zh' ? '未来的能量指向...' : 'The future energy points towards...'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Advice & Mantra */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white/5 p-6 rounded-lg">
          <h3 className="text-tarot-gold font-bold mb-3 border-b border-white/10 pb-2">{t.adviceTitle}</h3>
          <p className="text-gray-300 leading-relaxed">
            {advice}
          </p>
        </div>
        <div className="bg-tarot-gold/10 p-6 rounded-lg flex flex-col justify-center items-center text-center">
          <h3 className="text-tarot-gold/60 text-xs tracking-widest mb-4">{t.mantraTitle}</h3>
          <p className="text-xl text-tarot-gold font-serif italic">
            {t.mantraText}
          </p>
        </div>
      </div>

    </div>
  );
};

export default Interpretation;
