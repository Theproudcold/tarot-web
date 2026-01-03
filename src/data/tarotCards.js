import card0 from '../assets/cards/0.png';
import card13 from '../assets/cards/13.png';
import card17 from '../assets/cards/17.png';
import card19 from '../assets/cards/19.png';

export const tarotCards = [
  {
    id: 0,
    image: card0,
    image_placeholder_color: "#FFD700",
    name: {
      en: "The Fool",
      zh: "愚者"
    },
    suite: {
      en: "Major Arcana",
      zh: "大阿卡纳"
    },
    meaning_upright: {
      en: "Beginnings, innocence, spontaneity, a free spirit",
      zh: "新的开始，天真，自发性，自由的灵魂"
    },
    meaning_reversed: {
      en: "Holding back, recklessness, risk-taking",
      zh: "退缩，鲁莽，冒险"
    }
  },
  {
    id: 1,
    image: '/src/assets/cards/1.png',
    image_placeholder_color: '#4B0082',
    name: { en: 'The Magician', zh: '魔术师' },
    suite: { en: 'Major Arcana', zh: '大阿卡纳' },
    meaning_upright: { en: 'Manifestation, resourcefulness, power', zh: '创造力，足智多谋，力量' },
    meaning_reversed: { en: 'Manipulation, poor planning, latent talents', zh: '操纵，计划不周，潜能未发' }
  },
  {
    id: 2,
    image: '/src/assets/cards/2.png',
    image_placeholder_color: '#00008B',
    name: { en: 'The High Priestess', zh: '女祭司' },
    suite: { en: 'Major Arcana', zh: '大阿卡纳' },
    meaning_upright: { en: 'Intuition, sacred knowledge, divine feminine', zh: '直觉，神圣知识，神性女性' },
    meaning_reversed: { en: 'Secrets, disconnected from intuition, withdrawal', zh: '秘密，与直觉断联，孤僻' }
  },
  {
    id: 3,
    image: '/src/assets/cards/3.png',
    image_placeholder_color: '#228B22',
    name: { en: 'The Empress', zh: '皇后' },
    suite: { en: 'Major Arcana', zh: '大阿卡纳' },
    meaning_upright: { en: 'Femininity, beauty, nature, nurturing', zh: '女性特质，美，自然，滋养' },
    meaning_reversed: { en: 'Creative block, dependence to others', zh: '创作受阻，依赖他人' }
  },
  {
    id: 4,
    image: '/src/assets/cards/4.png',
    image_placeholder_color: '#8B0000',
    name: { en: 'The Emperor', zh: '皇帝' },
    suite: { en: 'Major Arcana', zh: '大阿卡纳' },
    meaning_upright: { en: 'Authority, establishment, structure', zh: '权威，建立，结构' },
    meaning_reversed: { en: 'Domination, excessive control, lack of discipline', zh: '支配，过度控制，缺乏纪律' }
  },
  {
    id: 5,
    image: '/src/assets/cards/5.png',
    image_placeholder_color: '#800000',
    name: { en: 'The Hierophant', zh: '教皇' },
    suite: { en: 'Major Arcana', zh: '大阿卡纳' },
    meaning_upright: { en: 'Spiritual wisdom, religious beliefs, conformity', zh: '精神智慧，宗教信仰，循规蹈矩' },
    meaning_reversed: { en: 'Personal beliefs, freedom, challenging the status quo', zh: '个人信仰，自由，挑战现状' }
  },
  {
    id: 6,
    image: '/src/assets/cards/6.png',
    image_placeholder_color: '#FF69B4',
    name: { en: 'The Lovers', zh: '恋人' },
    suite: { en: 'Major Arcana', zh: '大阿卡纳' },
    meaning_upright: { en: 'Love, harmony, relationships, values alignment', zh: '爱，和谐，关系，价值观一致' },
    meaning_reversed: { en: 'Self-love, disharmony, imbalance, misalignment of values', zh: '自爱，不和谐，不平衡，价值观不一致' }
  },
  {
    id: 13,
    image: card13,
    image_placeholder_color: "#000000",
    name: {
      en: "Death",
      zh: "死神"
    },
    suite: {
      en: "Major Arcana",
      zh: "大阿卡纳"
    },
    meaning_upright: {
      en: "Endings, change, transformation, transition",
      zh: "结束，改变，转变，过渡"
    },
    meaning_reversed: {
      en: "Resistance to change, personal transformation, inner purging",
      zh: "抗拒改变，个人转变，内在净化"
    }
  },
  {
    id: 17,
    image: card17,
    image_placeholder_color: "#FFFFE0",
    name: {
      en: "The Star",
      zh: "星星"
    },
    suite: {
      en: "Major Arcana",
      zh: "大阿卡纳"
    },
    meaning_upright: {
      en: "Hope, faith, purpose, renewal, spirituality",
      zh: "希望，信仰，目标，更新，灵性"
    },
    meaning_reversed: {
      en: "Lack of faith, despair, self-trust, disconnection",
      zh: "缺乏信仰，绝望，自我信任，断联"
    }
  },
  {
    id: 19,
    image: card19,
    image_placeholder_color: "#FFDAB9",
    name: {
      en: "The Sun",
      zh: "太阳"
    },
    suite: {
      en: "Major Arcana",
      zh: "大阿卡纳"
    },
    meaning_upright: {
      en: "Positivity, fun, warmth, success, vitality",
      zh: "积极，乐趣，温暖，成功，活力"
    },
    meaning_reversed: {
      en: "Inner child, feeling down, overly optimistic",
      zh: "内在小孩，情绪低落，过度乐观"
    }
  }
];

// Data for Minor Arcana
const minorArcanaData = [
  { suite: 'Wands', suiteZh: '权杖', element: 'Fire', color: '#e63946' },
  { suite: 'Cups', suiteZh: '圣杯', element: 'Water', color: '#457b9d' },
  { suite: 'Swords', suiteZh: '宝剑', element: 'Air', color: '#a8dadc' },
  { suite: 'Pentacles', suiteZh: '星币', element: 'Earth', color: '#588157' }
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
    tarotCards.push({
      id: cardId++,
      image: null,
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
        zh: `${suiteInfo.suiteZh}的能量体现于${rank.zh}。关注${suiteInfo.suiteZh}的主题。` 
      },
      meaning_reversed: {
        en: `Blocked or internal energy of ${rank.name} of ${suiteInfo.suite}.`,
        zh: `${suiteInfo.suiteZh}${rank.zh}的能量受阻或内在化。`
      }
    });
  });
});

