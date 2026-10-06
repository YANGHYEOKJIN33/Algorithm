/**
 * 🚀 이해 확인 — 수업 전체(1~5단원)를 되짚는 10문제 (보기를 고르면 바로 정답과 이유)
 *
 * page: { tab, page, sub } — 그 개념을 배운 쪽. 틀리면 [📖 그 쪽 다시 보기 →]가 그리로 데려간다
 *       (scenes/project.js가 ctx.go(tab, page, sub)로 연다. sub는 기계학습 하위 탭만)
 * 정답 자리는 0~3에 고르게 섞어 둔다(내용을 몰라도 맞히는 일이 없도록).
 */
export const QUIZ = [
  {
    q: '웹 크롤러가 표의 데이터를 꺼낼 때 "한 줄"을 찾으려고 찾는 HTML 태그는?',
    options: ['<table>', '<td>', '<tr>', '<a>'], answer: 2,
    why: '<tr>(table row)이 표의 한 줄, 그 안의 <td>가 칸 하나예요. <table>은 표 전체를 감싸요.',
    page: { tab: 'collect', page: 'web' },
  },
  {
    q: 'df.isnull().sum()의 결과가 뜻하는 것은?',
    options: ['열마다 결측치(빈칸)의 개수', '열마다 값의 합', '행마다 결측치의 개수', '전체 행의 개수'], answer: 0,
    why: 'isnull()이 빈칸을 True(1)로 바꾸고, sum()이 열마다 더해요.',
    page: { tab: 'inspect', page: 'count' },
  },
  {
    q: 'Q1 = 3450, Q3 = 3800일 때 위 울타리(이 값보다 크면 이상치)는?',
    options: ['3800', '4150', '4325', '8200'], answer: 2,
    why: 'IQR = 350, 위 울타리 = Q3 + 1.5 × IQR = 3800 + 525 = 4325예요.',
    page: { tab: 'inspect', page: 'quartile' },
  },
  {
    q: '성별처럼 글자로 된 열의 빈칸을 채우기에 알맞은 값은?',
    options: ['평균값', '0', '가장 큰 값', '최빈값'], answer: 3,
    why: '글자는 평균을 낼 수 없어요. 가장 자주 나온 값(최빈값)으로 채워요.',
    page: { tab: 'prep', page: 'fillmode' },
  },
  {
    q: '"아델리→0, 턱끈→1, 젠투→2"처럼 바꾸는 까닭은?',
    options: ['모델은 숫자로 계산하니까', '데이터를 줄이려고', '젠투가 가장 커서', '보기 좋으려고'], answer: 0,
    why: '기계학습 모델은 숫자로 계산해요. 0·1·2의 크기에는 뜻이 없어요.',
    page: { tab: 'prep', page: 'replace' },
  },
  {
    q: '측정표와 판정표를 "번호"로 짝지어 옆으로 붙이는 판다스 함수는?',
    options: ['pd.concat', 'df.dropna', 'pd.merge', 'df.sort_values'], answer: 2,
    why: 'merge는 열쇠(번호)가 같은 행끼리 옆으로 이어요. concat은 위아래로 이어 붙여요.',
    page: { tab: 'ready', page: 'merge' },
  },
  {
    q: '테스트 데이터를 따로 떼어 두는 까닭은?',
    options: ['계산을 빠르게 하려고', '결측치를 없애려고', '그래프를 그리려고', '처음 보는 데이터로 실력을 공정하게 재려고'], answer: 3,
    why: '공부한 문제로 시험을 보면 실력을 알 수 없어요. 본 적 없는 데이터로 평가해요.',
    page: { tab: 'ready', page: 'split' },
  },
  {
    q: '정답(레이블) 없이 비슷한 펭귄끼리 묶는 알고리즘은?',
    options: ['k-평균', 'k-최근접 이웃', '의사결정 트리', '선형 회귀'], answer: 0,
    why: 'k-평균은 비지도학습(군집)이에요. 나머지 셋은 정답이 있는 지도학습이에요.',
    page: { tab: 'ml', sub: 'concept', page: 'types' },
  },
  {
    q: 'k-최근접 이웃에서 341번 펭귄은 k=1이면 아델리, k=3이면 턱끈으로 예측됐다. 알 수 있는 것은?',
    options: ['k는 결과에 영향이 없다', 'k에 따라 예측이 달라질 수 있다', 'k가 클수록 항상 정확하다', '거리를 잘못 쟀다'], answer: 1,
    why: 'k는 사람이 정하는 값(하이퍼파라미터)이에요. 너무 작으면 한 이웃에 휘둘리기 쉬워요.',
    page: { tab: 'ml', sub: 'knn', page: 'step' },
  },
  {
    q: '날개길이로 몸무게(g)를 예측하는 일은 학습 목적으로 보면?',
    options: ['분류', '예측(회귀)', '군집', '강화'], answer: 1,
    why: '숫자를 내놓으니 예측(회귀)이에요. 선형 회귀가 그 예예요.',
    page: { tab: 'ml', sub: 'concept', page: 'purpose' },
  },
];
