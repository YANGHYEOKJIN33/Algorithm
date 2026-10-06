/** 🤖 기계학습 › k-최근접 이웃 */
export default {
  id: 'knn',
  name: 'k-최근접 이웃',
  tag: '',
  pages: [
    {
      id: 'idea',
      scene: 'knnExplore',
      title: 'k-최근접 이웃 ① 아이디어 — 가까운 이웃에게 물어보기',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '그래프를 눌러 새 펭귄(★)을 옮기고, k를 1·3·5·7로 바꿔 보세요. 예측이 바뀌는 곳은 어디인가요?',
          check: 'visit',
        },
      ],
      more: '새 펭귄의 종을 모를 때, 그래프에서 가장 가까운 펭귄 k마리를 찾아 다수결로 정해요. 비슷한 것끼리는 가까이 모인다는 생각이에요. (분류 · 지도학습)',
      minutes: 5,
    },
    {
      id: 'step',
      scene: 'knn',
      title: 'k-최근접 이웃 ② 의사코드로 한 단계씩',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '한 단계씩 누르며 거리목록이 쌓이고 정렬되는 것, 세기표의 투표를 보세요. 그림 위에서 k를 바꿔 다시 실행해 보세요.',
          check: 'visit',
        },
      ],
      more: '거리 재기 → 거리목록에 모으기 → 정렬 → 앞에서 k개 → 세기표로 투표. k-최근접 이웃은 리스트와 사전만으로 만들 수 있어요. 341번 펭귄은 k=1이면 틀리고 k=3이면 맞혀요.',
      minutes: 5,
    },
    {
      id: 'python',
      scene: 'python:05_knn',
      title: 'k-최근접 이웃 ③ 🐍 파이썬 실습 (Colab)',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: 'Colab에서 셀을 차례로 실행하고, k를 바꿔 정확도가 어떻게 달라지는지 확인하세요.',
          check: 'visit',
        },
      ],
      more: '의사코드를 그대로 옮긴 파이썬과, 프로젝트에서 쓸 scikit-learn 세 줄(만들기·fit·predict)을 견주어 봐요. 두 방법의 답이 같아요.',
      minutes: 5,
    },
  ],
};
