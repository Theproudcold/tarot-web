import React from 'react';

const Interpretation = ({ cards, language = 'en' }) => {
  if (!cards || cards.length < 3) return null;

  const [past, present, future] = cards;

  // Helper to safely get localized string
  const getLocalized = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj['en'] || '';
  };

  const titles = {
    en: {
      summary: "Reading Interpretation",
      past: "The Past",
      present: "The Present",
      future: "The Future",
      synthesis: "Guidance"
    },
    zh: {
      summary: "牌阵解读",
      past: "过去",
      present: "现在",
      future: "未来",
      synthesis: "指引"
    }
  };

  const t = titles[language];

  // Helper to remove trailing punctuation
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/[。.,，\s]+$/, '');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-black/40 backdrop-blur-md rounded-xl border border-tarot-gold/30 p-8 text-left animate-fadeIn">
      <h2 className="text-3xl text-tarot-gold font-serif text-center mb-8 pb-4 border-b border-tarot-gold/20">
        {t.summary}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Past */}
        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
          <h3 className="text-tarot-gold text-xl font-serif mb-3">{t.past}</h3>
          <p className="text-sm text-gray-400 mb-2">{getLocalized(past.name)}</p>
          <p className="text-gray-200 leading-relaxed italic">
            "{getLocalized(past.meaning_upright)}"
          </p>
        </div>

        {/* Present */}
        <div className="bg-white/5 p-6 rounded-lg border border-white/10 md:transform md:-translate-y-4 shadow-lg shadow-black/30">
          <h3 className="text-tarot-gold text-xl font-serif mb-3">{t.present}</h3>
          <p className="text-sm text-gray-400 mb-2">{getLocalized(present.name)}</p>
          <p className="text-gray-200 leading-relaxed italic">
            "{getLocalized(present.meaning_upright)}"
          </p>
        </div>

        {/* Future */}
        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
          <h3 className="text-tarot-gold text-xl font-serif mb-3">{t.future}</h3>
          <p className="text-sm text-gray-400 mb-2">{getLocalized(future.name)}</p>
          <p className="text-gray-200 leading-relaxed italic">
            "{getLocalized(future.meaning_upright)}"
          </p>
        </div>
      </div>

      {/* Synthesis / Story */}
      <div className="bg-tarot-gold/10 p-6 rounded-xl border border-tarot-gold/20">
        <h3 className="text-tarot-gold text-xl font-serif mb-4 flex items-center gap-2">
          <span>✨</span> {t.synthesis}
        </h3>
        <p className="text-gray-200 leading-loose">
          {language === 'zh' ? (
            `你的过去受到了${getLocalized(past.name)}的影响，这意味着${cleanText(getLocalized(past.meaning_upright))}。
             现在，${getLocalized(present.name)}显现，提示你关注${cleanText(getLocalized(present.meaning_upright))}。
             展望未来，${getLocalized(future.name)}预示着${cleanText(getLocalized(future.meaning_upright))}。
             综合来看，这是一个关于转变与成长的旅程，请相信直觉的指引。`
          ) : (
            `Your path began with the energy of ${getLocalized(past.name)}, signifying ${cleanText(getLocalized(past.meaning_upright))}. 
             Currently, you are embodying ${getLocalized(present.name)}, which brings focus to ${cleanText(getLocalized(present.meaning_upright))}. 
             Moving forward, ${getLocalized(future.name)} suggests a destiny involving ${cleanText(getLocalized(future.meaning_upright))}. 
             Trust the process and the wisdom revealed today.`
          )}
        </p>
      </div>
    </div>
  );
};

export default Interpretation;
