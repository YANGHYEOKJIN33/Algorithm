/** 🤖 기계학습 › k-평균 */
export default {
  id: 'kmeans',
  name: 'k-평균',
  tag: '',
  pages: [
    {
      id: 'idea',
      scene: 'kmeansExplore',
      title: 'k-평균 ① 아이디어 — 정답 없이 묶기',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '처음 중심이 될 점 3개를 직접 골라 "끝까지 실행"을 눌러 보세요. 시작에 따라 결과가 달라지기도 해요.',
          check: 'visit',
        },
      ],
      more: '종을 모르는 펭귄들을 가까운 것끼리 k개 묶음으로 나눠요. 중심을 정하고 → 점을 가까운 중심에 배정하고 → 중심을 옮기기를 되풀이해요. (군집 · 비지도학습)',
      minutes: 5,
    },
    {
      id: 'step',
      scene: 'kmeans',
      title: 'k-평균 ② 의사코드로 한 단계씩',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '첫 되풀이에서는 점이 하나씩 배정되고, 그다음부터는 한꺼번에 다시 배정돼요. 몇 번 만에 멈추나요?',
          check: 'visit',
        },
      ],
      more: '배정(가장 가까운 중심 찾기)과 이동(묶음의 평균으로)을 되풀이하면 중심이 제자리를 찾아가요. 중심표와 소속목록이 바뀌는 것을 보세요.',
      minutes: 5,
    },
    {
      id: 'python',
      scene: 'python:08_kmeans',
      title: 'k-평균 ③ 🐍 파이썬 실습 (Colab)',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: 'Colab에서 셀을 차례로 실행하고, n_clusters를 2·3·4로 바꿔 그림이 어떻게 달라지는지 보세요.',
          check: 'visit',
        },
      ],
      more: 'scikit-learn KMeans로 펭귄을 묶고, 묶음을 실제 종과 견주어 봐요. 정답 없이도 종과 꽤 비슷하게 나뉘어요.',
      minutes: 5,
    },
  ],
};
