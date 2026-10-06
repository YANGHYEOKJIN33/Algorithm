/** 🤖 기계학습 › 개념 */
export default {
  id: 'concept',
  name: '개념',
  tag: '',
  pages: [
    {
      id: 'types',
      scene: 'learnTypes',
      title: '학습 방법에 따른 구분 — 지도 · 비지도 · 강화',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '세 가지 학습을 견주어 보고, 아래 사례가 어떤 학습인지 골라 보세요.',
          check: 'visit',
        },
      ],
      more: '정답을 알려 주며 가르치면 지도학습, 정답 없이 비슷한 것끼리 묶게 하면 비지도학습, 해 보고 받은 보상으로 스스로 익히게 하면 강화학습이에요. 데이터에 정답(레이블)이 있느냐가 첫째 기준이에요.',
      minutes: 5,
    },
    {
      id: 'rl',
      scene: 'rl',
      title: '강화학습 맛보기 — 보상으로 길 찾기',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '한 단계씩 누르며 점수표의 칸이 바뀌는 것을 보세요. 몇 번째 도전부터 곧장 물고기로 가나요?',
          check: 'visit',
        },
      ],
      more: '강화학습에는 정답이 없어요. 펭귄이 움직여 보고 받은 보상(물고기 +10, 구멍 −10)으로 점수표를 고쳐 가며 스스로 길을 익혀요. 점수표(Q)라는 자료구조가 어떻게 바뀌는지 보세요.',
      minutes: 5,
    },
    {
      id: 'purpose',
      scene: 'purposes',
      title: '학습 목적에 따른 구분 — 분류 · 예측 · 군집',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '세 그림을 견주어 보고, 아래 알고리즘 지도에서 알고리즘을 눌러 그 탭으로 가 보세요.',
          check: 'visit',
        },
      ],
      more: '무엇을 내놓느냐로도 나눠요. 정해진 무리 중 하나를 고르면 분류, 숫자를 내놓으면 예측(회귀), 정답 없이 무리를 만들면 군집이에요. 이 수업의 네 알고리즘이 어디에 속하는지 알아봐요.',
      minutes: 5,
    },
  ],
};
