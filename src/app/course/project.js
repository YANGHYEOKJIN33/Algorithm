/** 🚀 프로젝트 */
export default {
  id: 'project',
  label: '프로젝트',
  icon: '🚀',
  verb: '',
  tip: '모델 평가 · 전체 정리 · 이해 확인 · 프로젝트 안내',
  unit: { no: 6 },
  pages: [
    {
      id: 'eval',
      scene: 'evaluate',
      title: '모델 평가 — 정확도 재기',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '테스트 펭귄 6마리를 하나씩 채점하며 정확도가 계산되는 것을 보세요. 틀린 펭귄은 왜 틀렸을까요?',
          check: 'visit',
        },
      ],
      more: '모델을 만들었으면 처음 보는 데이터(테스트 데이터)로 시험을 봐요. 맞힌 개수 ÷ 전체 = 정확도예요. 틀린 문제를 살펴보면 모델의 약점도 보여요.',
      minutes: 5,
    },
    {
      id: 'flow',
      scene: 'summary',
      title: '전체 흐름 정리 — 수집부터 평가까지',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '표의 줄을 눌러 그 단계로 다시 가 볼 수 있어요. 의사코드와 파이썬 함수를 짝지어 보세요.',
          check: 'visit',
        },
      ],
      more: '펭귄 데이터가 거쳐 온 길을 한 장으로 정리해요. 프로젝트에서도 이 순서를 그대로 따라가면 돼요.',
      minutes: 5,
    },
    {
      id: 'quiz',
      scene: 'quiz',
      title: '이해 확인',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '답을 고르면 바로 정답과 이유가 나와요. 틀려도 괜찮아요 — 이유를 읽고 다시 생각해 보세요.',
          check: 'visit',
        },
      ],
      more: '수집·가공·전처리·학습 준비·기계학습에서 배운 개념을 문제로 되짚어요.',
      minutes: 5,
    },
    {
      id: 'guide',
      scene: 'project',
      title: '파이썬 인공지능 프로젝트 안내',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '단계별 체크리스트를 확인하고 "프로젝트 틀 노트북"을 Colab에서 열어 보세요.',
          check: 'visit',
        },
      ],
      more: '이제 여러분 차례예요. 관심 있는 문제를 골라 같은 순서로 인공지능을 만들어 봐요. 프로젝트 틀 노트북에 단계마다 채울 자리가 준비되어 있어요.',
      minutes: 5,
    },
  ],
};
