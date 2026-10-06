/** 🤖 기계학습 › 선형 회귀 */
export default {
  id: 'linreg',
  name: '선형 회귀',
  tag: '',
  pages: [
    {
      id: 'idea',
      scene: 'linregExplore',
      title: '선형 회귀 ① 아이디어 — 점들 사이로 직선 긋기',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '기울기 w와 절편 b를 움직여 오차(빨간 선)를 줄여 보세요. "조금씩 고치기"를 누르면 컴퓨터가 오차를 줄여 가는 모습이 보여요.',
          check: 'visit',
        },
      ],
      more: '날개가 긴 펭귄이 더 무거워요. 이 관계를 직선 하나(몸무게 = w × 날개길이 + b)로 나타내면 처음 보는 펭귄의 몸무게도 예측할 수 있어요. 가장 좋은 직선은 오차가 가장 작은 직선이에요. (예측 · 지도학습)',
      minutes: 5,
    },
    {
      id: 'step',
      scene: 'linreg',
      title: '선형 회귀 ② 의사코드로 한 단계씩 (최소제곱법)',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '계산표에 dx×dy가 쌓이는 것을 보세요. 평균 점의 오른쪽 위·왼쪽 아래에 있는 점은 +, 나머지는 −예요.',
          check: 'visit',
        },
      ],
      more: '평균 점을 찾고, 펭귄마다 평균에서 벗어난 정도(dx, dy)를 곱해 더하면 기울기가 나와요. 계산표가 한 줄씩 채워지는 것을 따라가면 공식이 하는 일이 보여요.',
      minutes: 5,
    },
    {
      id: 'python',
      scene: 'python:07_linear_regression',
      title: '선형 회귀 ③ 🐍 파이썬 실습 (Colab)',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: 'Colab에서 셀을 차례로 실행하고 날개길이 210mm 펭귄의 몸무게를 예측해 보세요.',
          check: 'visit',
        },
      ],
      more: '직접 계산한 w, b와 scikit-learn LinearRegression의 결과가 같은지 확인하고, 오차(평균 제곱 오차)로 모델을 평가해요.',
      minutes: 5,
    },
  ],
};
