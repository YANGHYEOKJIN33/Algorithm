/**
 * 용어 사전 — 화면에는 교과서와 같은 정확한 용어를 쓰고, 뜻은 여기서 쉬운 말로 찾아본다.
 * term: 우리말 용어 · en: 영어/파이썬 이름 · plain: 한 문장 뜻 · where: 사이트 어디서 만나나
 */
export const GLOSSARY = [
  {
    group: '데이터와 표',
    items: [
      { term: '데이터', en: 'data', plain: '관찰하거나 잰 값을 모아 둔 것. 인공지능은 데이터에서 규칙을 배워요.', where: '🏁 시작' },
      { term: '데이터프레임', en: 'DataFrame (pandas)', plain: '행과 열로 된 표. 파이썬의 판다스(pandas)가 표를 다루는 방식이에요.', where: '🏁 시작 2쪽' },
      { term: '행', en: 'row', plain: '표의 가로 한 줄. 여기서는 펭귄 한 마리의 기록이에요.', where: '모든 표' },
      { term: '열', en: 'column', plain: '표의 세로 한 줄. 같은 종류의 값(예: 몸무게)이 모여 있어요.', where: '모든 표' },
      { term: '속성', en: 'feature · attribute', plain: '데이터가 가진 특징 하나. 표에서는 열 하나가 속성 하나예요.', where: '🧹 전처리 1쪽' },
      { term: '인덱스', en: 'index', plain: '판다스가 행마다 붙이는 자리 번호. 0부터 세며, 펭귄 번호와는 달라요.', where: '표 왼쪽 회색 칸' },
      { term: 'CSV', en: 'Comma-Separated Values', plain: '칸을 쉼표(,)로, 줄을 줄바꿈으로 나눈 글자 파일. 표를 저장할 때 많이 써요.', where: '🕸 수집 2쪽' },
      { term: '리스트', en: 'list [ ]', plain: '값을 순서대로 담는 상자. 0번, 1번, 2번… 자리 번호로 꺼내요.', where: '자료구조 칸' },
      { term: '사전', en: 'dictionary { }', plain: '열쇠(key)와 값(value)을 짝지어 담는 상자. 열쇠로 값을 바로 찾아요.', where: '자료구조 칸' },
      { term: '변수', en: 'variable', plain: '이름표가 붙은 상자. ←로 값을 넣으면 예전 값은 사라져요.', where: '🏁 시작 3쪽' },
    ],
  },
  {
    group: '수집',
    items: [
      { term: '웹 크롤링', en: 'web crawling · scraping', plain: '웹 페이지에서 원하는 데이터를 프로그램으로 자동으로 모으는 일.', where: '🕸 수집' },
      { term: 'HTML', en: 'HyperText Markup Language', plain: '웹 페이지를 이루는 글자. <태그>로 제목·표·칸 같은 부분을 표시해요.', where: '🕸 수집 1쪽' },
      { term: '태그', en: 'tag', plain: '<tr>, <td>처럼 꺾쇠로 둘러싼 표시. 내용이 무엇인지 알려 줘요.', where: '🕸 수집 1쪽' },
      { term: '요청과 응답', en: 'request · response', plain: '내 컴퓨터가 서버에 "이 쪽 주세요"(요청)라고 하면 서버가 HTML을 보내 줘요(응답).', where: '🕸 수집 2쪽' },
      { term: '파싱', en: 'parsing (BeautifulSoup)', plain: '긴 HTML 글자를 태그 나무로 분석해, 원하는 태그를 찾을 수 있게 만드는 일.', where: '🕸 수집 2쪽' },
      { term: 'robots.txt', en: 'robots.txt', plain: '사이트가 "크롤러는 여기까지만 와 주세요"라고 적어 둔 안내 파일.', where: '🕸 수집 3쪽' },
      { term: 'API', en: 'Application Programming Interface', plain: '사이트가 프로그램에게 데이터를 주려고 열어 둔 정식 통로. 있으면 크롤링보다 먼저 써요.', where: '🕸 수집 3쪽' },
      { term: '개인정보', en: 'personal information', plain: '이름·연락처·사진처럼 누구인지 알아볼 수 있는 정보. 크롤링으로 모으거나 퍼뜨리면 안 돼요.', where: '🕸 수집 3쪽' },
      { term: '편향', en: 'bias', plain: '데이터가 한쪽으로 치우친 것. 앞쪽만 모으면 아델리펭귄뿐인 데이터가 돼요.', where: '🕸 수집 3쪽' },
    ],
  },
  {
    group: '가공 — 결측치와 이상치',
    items: [
      { term: '결측치', en: 'missing value · NaN', plain: '값이 비어 있는 칸. 판다스는 NaN(Not a Number)으로 보여 줘요.', where: '🔍 가공 1~3쪽' },
      { term: 'True / False', en: 'bool', plain: '참과 거짓. 더할 때 True는 1, False는 0으로 계산돼요.', where: '🔍 가공 1~2쪽' },
      { term: '이상치', en: 'outlier', plain: '다른 값들과 동떨어진 값. 잘못 적은 값일 수도, 정말 특이한 값일 수도 있어요.', where: '🔍 가공 4~5쪽' },
      { term: '사분위수', en: 'quartile · Q1 Q2 Q3', plain: '값을 줄 세워 네 덩어리로 나누는 자리의 값. Q2는 중앙값이에요.', where: '🔍 가공 4쪽' },
      { term: '중앙값', en: 'median', plain: '줄 세웠을 때 한가운데 있는 값. 이상치에 잘 흔들리지 않아요.', where: '🔍 가공 4쪽' },
      { term: 'IQR', en: 'interquartile range', plain: 'Q3 − Q1. 가운데 절반의 값이 퍼져 있는 폭.', where: '🔍 가공 4쪽' },
      { term: '상자그림', en: 'box plot', plain: '사분위수를 상자·선·수염·점으로 그린 그림. 이상치가 점으로 따로 보여요.', where: '🔍 가공 5쪽' },
    ],
  },
  {
    group: '전처리',
    items: [
      { term: '전처리', en: 'preprocessing', plain: '모은 데이터를 학습에 쓸 수 있게 다듬는 일. 지우기·채우기·바꾸기 등.', where: '🧹 전처리' },
      { term: '핵심 속성 추출', en: 'feature selection', plain: '목표와 관계있는 속성만 골라 남기는 일.', where: '🧹 전처리 1쪽' },
      { term: '평균값 대체', en: 'fillna(mean)', plain: '숫자 열의 빈칸을 그 열의 평균으로 채우기.', where: '🧹 전처리 4쪽' },
      { term: '최빈값', en: 'mode', plain: '가장 자주 나온 값. 글자 열의 빈칸을 채울 때 써요.', where: '🧹 전처리 5쪽' },
      { term: '텍스트 값 대체', en: 'replace · map', plain: '"수컷/암컷" 같은 글자를 0/1 같은 숫자로 바꾸기. 모델은 숫자로 계산하니까요.', where: '🧹 전처리 6쪽' },
      { term: '겹친 행', en: 'duplicate', plain: '모든 값이 똑같은 행이 두 번 이상 있는 것. 지워야 해요.', where: '🧹 전처리 2쪽' },
    ],
  },
  {
    group: '학습 준비',
    items: [
      { term: '데이터 통합', en: 'concat · merge', plain: '여러 표를 하나로 합치기. 위아래로 잇기(concat)와 열쇠로 옆에 붙이기(merge)가 있어요.', where: '🧩 학습 준비 1~2쪽' },
      { term: '열쇠', en: 'key', plain: '두 표에서 같은 대상을 찾아 잇는 공통 열. 여기서는 펭귄 번호예요.', where: '🧩 학습 준비 2쪽' },
      { term: 'X와 y', en: 'features · label', plain: 'X는 모델이 보고 판단할 입력 속성들, y는 맞혀야 할 정답이에요.', where: '🧩 학습 준비 3쪽' },
      { term: '레이블', en: 'label', plain: '데이터에 붙은 정답. 지도학습에는 레이블이 꼭 있어야 해요.', where: '🤖 기계학습 개념' },
      { term: '훈련 데이터', en: 'training data', plain: '모델이 공부하는 데 쓰는 데이터(문제집).', where: '🧩 학습 준비 3쪽' },
      { term: '테스트 데이터', en: 'test data', plain: '학습이 끝난 뒤 실력을 재는 데이터(시험 문제). 공부할 때 보면 안 돼요.', where: '🧩 학습 준비 3쪽' },
    ],
  },
  {
    group: '기계학습',
    items: [
      { term: '기계학습', en: 'machine learning', plain: '사람이 규칙을 짜 주지 않아도, 데이터에서 규칙을 스스로 찾게 하는 방법.', where: '🤖 기계학습' },
      { term: '모델', en: 'model', plain: '데이터에서 배운 규칙을 담은 것. 새 데이터를 넣으면 답을 내놓아요.', where: '🤖 기계학습' },
      { term: '지도학습', en: 'supervised learning', plain: '정답(레이블)이 있는 데이터로 배우는 방법. 분류와 예측이 여기에 속해요.', where: '🤖 개념 1쪽' },
      { term: '비지도학습', en: 'unsupervised learning', plain: '정답 없이 데이터의 구조(비슷한 무리)를 찾는 방법. 군집이 대표적이에요.', where: '🤖 개념 1쪽' },
      { term: '강화학습', en: 'reinforcement learning', plain: '행동해 보고 받은 보상으로 더 좋은 행동을 스스로 익히는 방법.', where: '🤖 개념 2쪽' },
      { term: '보상', en: 'reward', plain: '강화학습에서 행동의 결과가 좋았는지 나빴는지 알려 주는 점수.', where: '🤖 개념 2쪽' },
      { term: '분류', en: 'classification', plain: '정해진 무리(종) 중 하나를 고르는 일.', where: '🤖 개념 3쪽' },
      { term: '예측(회귀)', en: 'regression', plain: '몸무게 같은 숫자 값을 내놓는 일.', where: '🤖 개념 3쪽' },
      { term: '군집', en: 'clustering', plain: '정답 없이 비슷한 것끼리 무리 짓는 일.', where: '🤖 개념 3쪽' },
      { term: '하이퍼파라미터', en: 'hyperparameter', plain: '학습 전에 사람이 정하는 값. k-최근접 이웃의 k, k-평균의 k 등.', where: '🤖 k-최근접 이웃' },
    ],
  },
  {
    group: '알고리즘',
    items: [
      { term: 'k-최근접 이웃', en: 'k-Nearest Neighbors (KNN)', plain: '가장 가까운 이웃 k개의 다수결로 분류해요.', where: '🤖 k-최근접 이웃' },
      { term: '거리', en: 'Euclidean distance', plain: '그래프 위 두 점 사이의 곧은 길이. √((가로 차)² + (세로 차)²)', where: '🤖 k-최근접 이웃 2쪽' },
      { term: '의사결정 트리', en: 'decision tree', plain: '예/아니오 질문을 이어 붙여 답을 정하는 나무 모양 모델.', where: '🤖 의사결정 트리' },
      { term: '지니 불순도', en: 'Gini impurity', plain: '한 무리에 여러 종이 얼마나 섞였는지 재는 값. 한 종뿐이면 0이에요.', where: '🤖 의사결정 트리 2쪽' },
      { term: '노드와 잎', en: 'node · leaf', plain: '트리의 마디가 노드, 더 나뉘지 않고 답을 가진 끝 노드가 잎이에요.', where: '🤖 의사결정 트리' },
      { term: '선형 회귀', en: 'linear regression', plain: '점들 사이를 가장 잘 지나는 직선으로 숫자를 예측해요.', where: '🤖 선형 회귀' },
      { term: '기울기와 절편', en: 'slope w · intercept b', plain: '직선 y = w×x + b에서 w는 기울기(x가 1 늘 때 y 변화), b는 x가 0일 때 높이.', where: '🤖 선형 회귀' },
      { term: '오차', en: 'error · residual', plain: '실제 값과 예측 값의 차이. 그래프에서 점과 직선 사이의 세로 거리예요.', where: '🤖 선형 회귀 1쪽' },
      { term: '평균 제곱 오차', en: 'MSE', plain: '오차를 제곱해 평균 낸 값. 작을수록 직선이 점에 잘 맞아요.', where: '🤖 선형 회귀 1쪽' },
      { term: '최소제곱법', en: 'least squares', plain: '오차 제곱의 합이 가장 작은 직선을 공식으로 한 번에 구하는 방법.', where: '🤖 선형 회귀 2쪽' },
      { term: '경사 하강법', en: 'gradient descent', plain: '오차가 줄어드는 쪽으로 w, b를 조금씩 고쳐 가는 방법.', where: '🤖 선형 회귀 1쪽' },
      { term: 'k-평균', en: 'k-Means', plain: '중심 k개를 정하고 배정·이동을 되풀이해 k개 무리로 나눠요.', where: '🤖 k-평균' },
      { term: '중심', en: 'centroid', plain: '한 무리 점들의 평균 위치.', where: '🤖 k-평균' },
    ],
  },
  {
    group: '평가와 도구',
    items: [
      { term: '정확도', en: 'accuracy', plain: '맞힌 개수 ÷ 전체 개수. 분류 모델의 기본 성적표예요.', where: '🚀 프로젝트 1쪽' },
      { term: '의사코드', en: 'pseudocode', plain: '사람 말과 프로그램 코드의 중간쯤으로 적은 절차. 어떤 언어로든 옮길 수 있어요.', where: '모든 단계 실행 쪽' },
      { term: '파이썬', en: 'Python', plain: '인공지능에서 가장 많이 쓰는 프로그래밍 언어.', where: '🐍 실습 쪽' },
      { term: 'Colab', en: 'Google Colaboratory', plain: '설치 없이 브라우저에서 파이썬을 실행하는 구글의 무료 노트북.', where: '📒 Colab 단추' },
      { term: '판다스', en: 'pandas', plain: '표(데이터프레임)를 다루는 파이썬 도구 모음.', where: '🐍 실습 쪽' },
      { term: '사이킷런', en: 'scikit-learn', plain: '기계학습 모델을 몇 줄로 만들 수 있게 해 주는 파이썬 도구 모음.', where: '🐍 실습 쪽' },
    ],
  },
];

export function glossaryEntries() {
  return GLOSSARY.flatMap((g) => g.items.map((it) => ({ ...it, group: g.group })));
}

export function searchGlossary(query) {
  const q = query.trim().toLowerCase();
  if (!q) return GLOSSARY;
  return GLOSSARY
    .map((g) => ({ group: g.group, items: g.items.filter((it) => `${it.term} ${it.en} ${it.plain} ${it.where}`.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
}
