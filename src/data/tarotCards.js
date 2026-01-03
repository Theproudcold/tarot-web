import card0 from '../assets/cards/0.png';
import card13 from '../assets/cards/13.png';
import card17 from '../assets/cards/17.png';
// Major Arcana Data
export const tarotCards = [
  {
    id: 0,
    name: { en: "The Fool", zh: "愚者" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar00.jpg",
    image_placeholder_color: "#a8dadc",
    meaning_upright: { en: "Beginnings, innocence, spontaneity, a free spirit.", zh: "开始，天真，自发性，自由精神" },
    meaning_reversed: { en: "Recklessness, being taken advantage of, inconsideration.", zh: "鲁莽，被利用，不体谅" }
  },
  {
    id: 1,
    name: { en: "The Magician", zh: "魔术师" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar01.jpg",
    image_placeholder_color: "#eec0c6",
    meaning_upright: { en: "Manifestation, resourcefulness, power, inspired action.", zh: "显化，足智多谋，力量，受启发的行动" },
    meaning_reversed: { en: "Manipulation, poor planning, untapped talents.", zh: "操纵，糟糕的计划，未开发的才能" }
  },
  {
    id: 2,
    name: { en: "The High Priestess", zh: "女祭司" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar02.jpg",
    image_placeholder_color: "#9d4edd",
    meaning_upright: { en: "Intuition, sacred knowledge, divine feminine, the subconscious mind.", zh: "直觉，神圣知识，神圣女性，潜意识" },
    meaning_reversed: { en: "Secrets, disconnected from intuition, withdrawal and silence.", zh: "秘密，与直觉断联，退缩和沉默" }
  },
  {
    id: 3,
    name: { en: "The Empress", zh: "皇后" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar03.jpg",
    image_placeholder_color: "#ffc8dd",
    meaning_upright: { en: "Femininity, beauty, nature, nurturing, abundance.", zh: "女性气质，美丽，自然，以此，富足" },
    meaning_reversed: { en: "Creative block, dependence on others.", zh: "创意受阻，依赖他人" }
  },
  {
    id: 4,
    name: { en: "The Emperor", zh: "皇帝" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar04.jpg",
    image_placeholder_color: "#e63946",
    meaning_upright: { en: "Authority, establishment, structure, a father figure.", zh: "权威，建立，结构，父亲形象" },
    meaning_reversed: { en: "Domination, excessive control, lack of discipline, inflexibility.", zh: "支配，过度控制，缺乏纪律，僵化" }
  },
  {
    id: 5,
    name: { en: "The Hierophant", zh: "教皇" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar05.jpg",
    image_placeholder_color: "#f1ad42",
    meaning_upright: { en: "Spiritual wisdom, religious beliefs, conformity, tradition, institutions.", zh: "精神智慧，宗教信仰，从众，传统，机构" },
    meaning_reversed: { en: "Personal beliefs, freedom, challenging the status quo.", zh: "个人信仰，自由，挑战现状" }
  },
  {
    id: 6,
    name: { en: "The Lovers", zh: "恋人" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar06.jpg",
    image_placeholder_color: "#ef476f",
    meaning_upright: { en: "Love, harmony, relationships, values alignment, choices.", zh: "爱，和谐，关系，价值观一致，选择" },
    meaning_reversed: { en: "Self-love, disharmony, imbalance, misalignment of values.", zh: "自爱，不和谐，不平衡，价值观不一致" }
  },
  {
    id: 7,
    name: { en: "The Chariot", zh: "战车" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar07.jpg",
    image_placeholder_color: "#eec0c6",
    meaning_upright: { en: "Victory, control, will-power, success, action, determination.", zh: "胜利，控制，意志力，成功，行动，决心" },
    meaning_reversed: { en: "Opposition, lack of direction, stone walls.", zh: "反对，缺乏方向，障碍" }
  },
  {
    id: 8,
    name: { en: "Strength", zh: "力量" },
    suite: { en: "Major Arcana", zh: "大阿卡那" },
    image: "/src/assets/cards/rws/ar08.jpg",
    image_placeholder_color: "#f4a261",
    meaning_upright: { en: "Strength, courage, patience, control, compassion.", zh: "力量，勇气，耐心，控制，同情" },
    meaning_reversed: { en: "Weakness, self-doubt, lack of self-discipline.", zh: "软弱，自我怀疑，缺乏自律" }
  },
  { id: 9, name: { en: "The Hermit", zh: "隐士" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar09.jpg", image_placeholder_color: "#3d405b", meaning_upright: { en: "Soul-searching, introspection, being alone, inner guidance.", zh: "灵魂探寻，内省，独处，内在指引" }, meaning_reversed: { en: "Isolation, loneliness, withdrawal.", zh: "孤立，孤独，退缩" } },
  { id: 10, name: { en: "Wheel of Fortune", zh: "命运之轮" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar10.jpg", image_placeholder_color: "#ffb703", meaning_upright: { en: "Good luck, karma, life cycles, destiny, a turning point.", zh: "好运，业力，生命周期，命运，转折点" }, meaning_reversed: { en: "Bad luck, resistance to change, breaking cycles.", zh: "厄运，抗拒改变，打破循环" } },
  { id: 11, name: { en: "Justice", zh: "正义" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar11.jpg", image_placeholder_color: "#a8dadc", meaning_upright: { en: "Justice, fairness, truth, cause and effect, law.", zh: "正义，公平，真相，因果，法律" }, meaning_reversed: { en: "Unfairness, lack of accountability, dishonesty.", zh: "不公平，缺乏责任感，不诚实" } },
  { id: 12, name: { en: "The Hanged Man", zh: "倒吊人" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar12.jpg", image_placeholder_color: "#457b9d", meaning_upright: { en: "Pause, surrender, letting go, new perspectives.", zh: "暂停，臣服，放手，新视角" }, meaning_reversed: { en: "Delays, resistance, stalling, indecision.", zh: "延误，抗拒，拖延，优柔寡断" } },
  { id: 13, name: { en: "Death", zh: "死神" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar13.jpg", image_placeholder_color: "#000000", meaning_upright: { en: "Endings, change, transformation, transition.", zh: "结束，改变，转变，过渡" }, meaning_reversed: { en: "Resistance to change, personal transformation, inner purging.", zh: "抗拒改变，个人转变，内在净化" } },
  { id: 14, name: { en: "Temperance", zh: "节制" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar14.jpg", image_placeholder_color: "#f1faee", meaning_upright: { en: "Balance, moderation, patience, purpose.", zh: "平衡，适度，耐心，目的" }, meaning_reversed: { en: "Imbalance, excess, self-healing, realignment.", zh: "不平衡，过度，自我疗愈，重新调整" } },
  { id: 15, name: { en: "The Devil", zh: "恶魔" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar15.jpg", image_placeholder_color: "#1d3557", meaning_upright: { en: "Shadow self, attachment, addiction, restriction, sexuality.", zh: "阴影自我，依恋，成瘾，限制，性" }, meaning_reversed: { en: "Releasing limiting beliefs, exploring dark thoughts, detachment.", zh: "释放限制性信念，探索黑暗思想，超脱" } },
  { id: 16, name: { en: "The Tower", zh: "高塔" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar16.jpg", image_placeholder_color: "#e63946", meaning_upright: { en: "Sudden change, upheaval, chaos, revelation, awakening.", zh: "突变，剧变，混乱，启示，觉醒" }, meaning_reversed: { en: "Personal transformation, fear of change, averting disaster.", zh: "个人转变，害怕改变，避免灾难" } },
  { id: 17, name: { en: "The Star", zh: "星星" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar17.jpg", image_placeholder_color: "#caf0f8", meaning_upright: { en: "Hope, faith, purpose, renewal, spirituality.", zh: "希望，信仰，目标，更新，灵性" }, meaning_reversed: { en: "Lack of faith, despair, self-trust, disconnection.", zh: "缺乏信仰，绝望，自我信任，断联" } },
  { id: 18, name: { en: "The Moon", zh: "月亮" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar18.jpg", image_placeholder_color: "#023e8a", meaning_upright: { en: "Illusion, fear, anxiety, subconscious, intuition.", zh: "幻觉，恐惧，焦虑，潜意识，直觉" }, meaning_reversed: { en: "Release of fear, repressed emotion, inner confusion.", zh: "释放恐惧，压抑的情绪，内在困惑" } },
  { id: 19, name: { en: "The Sun", zh: "太阳" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar19.jpg", image_placeholder_color: "#ffba08", meaning_upright: { en: "Positivity, fun, warmth, success, vitality.", zh: "积极，乐趣，温暖，成功，活力" }, meaning_reversed: { en: "Inner child, feeling down, overly optimistic.", zh: "内在小孩，情绪低落，过度乐观" } },
  { id: 20, name: { en: "Judgement", zh: "审判" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar20.jpg", image_placeholder_color: "#4a4e69", meaning_upright: { en: "Judgement, rebirth, inner calling, absolution.", zh: "审判，重生，内在召唤，赦免" }, meaning_reversed: { en: "Self-doubt, inner critic, ignoring the call.", zh: "自我怀疑，内在批评，忽视召唤" } },
  { id: 21, name: { en: "The World", zh: "世界" }, suite: { en: "Major Arcana", zh: "大阿卡那" }, image: "/src/assets/cards/rws/ar21.jpg", image_placeholder_color: "#6b705c", meaning_upright: { en: "Completion, integration, accomplishment, travel.", zh: "完成，整合，成就，旅行" }, meaning_reversed: { en: "Seeking personal closure, short-cuts, delays.", zh: "寻求个人了结，捷径，延误" } }
];

// Data for Minor Arcana
const minorArcanaData = [
  { suite: 'Wands',  suiteZh: '权杖', code: 'wa', element: 'Fire',  color: '#e63946' },
  { suite: 'Cups',   suiteZh: '圣杯', code: 'cu', element: 'Water', color: '#457b9d' },
  { suite: 'Swords', suiteZh: '宝剑', code: 'sw', element: 'Air',   color: '#a8dadc' },
  { suite: 'Pentacles', suiteZh: '星币', code: 'pe', element: 'Earth', color: '#588157' }
];

const ranks = [
  { id: 1, name: 'Ace', zh: '一' },
  { id: 2, name: 'Two', zh: '二' },
  { id: 3, name: 'Three', zh: '三' },
  { id: 4, name: 'Four', zh: '四' },
  { id: 5, name: 'Five', zh: '五' },
  { id: 6, name: 'Six', zh: '六' },
  { id: 7, name: 'Seven', zh: '七' },
  { id: 8, name: 'Eight', zh: '八' },
  { id: 9, name: 'Nine', zh: '九' },
  { id: 10, name: 'Ten', zh: '十' },
  { id: 11, name: 'Page', zh: '侍从' },
  { id: 12, name: 'Knight', zh: '骑士' },
  { id: 13, name: 'Queen', zh: '皇后' },
  { id: 14, name: 'King', zh: '国王' }
];

let cardId = 22; // Start after Major Arcana (0-21)

minorArcanaData.forEach(suiteInfo => {
  ranks.forEach(rank => {
    // Format rank ID with leading zero (01, 02... 14)
    const rankStr = rank.id < 10 ? `0${rank.id}` : `${rank.id}`;
    const imagePath = `/src/assets/cards/rws/${suiteInfo.code}${rankStr}.jpg`;

    tarotCards.push({
      id: cardId++,
      image: imagePath,
      image_placeholder_color: suiteInfo.color,
      name: {
        en: `${rank.name} of ${suiteInfo.suite}`,
        zh: `${suiteInfo.suiteZh}${rank.zh}`
      },
      suite: {
        en: `${suiteInfo.suite}`,
        zh: `${suiteInfo.suiteZh}`
      },
      element: suiteInfo.element, // New property for styling
      meaning_upright: {
        en: `Energy of ${suiteInfo.element} in the realm of ${rank.name}. Focus on ${suiteInfo.suite} themes.`, // Placeholder for brevity in demo, ideally unique
        zh: `${suiteInfo.suiteZh}的能量体现于${rank.zh}。关注${suiteInfo.suiteZh}的主题` 
      },
      meaning_reversed: {
        en: `Blocked or internal energy of ${rank.name} of ${suiteInfo.suite}.`,
        zh: `${suiteInfo.suiteZh}${rank.zh}的能量受阻或内在化`
      }
    });
  });
});
