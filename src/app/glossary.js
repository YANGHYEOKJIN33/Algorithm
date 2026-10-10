/**
 * 용어 사전 — 화면에는 교과서와 같은 정확한 용어를 쓰고, 뜻은 여기서 쉬운 말로 찾아본다.
 * term: 우리말 용어 · en: 영어/파이썬 이름 · plain: 한 문장 뜻 · where: 사이트 어디서 만나나
 */
export const GLOSSARY = [
  {
    group: '데이터와 표',
    items: [
      { term: '데이터', en: 'data', plain: '관찰하거나 잰 값을 모아 둔 것. 인공지능은 데이터에서 규칙을 배워요.', where: '🏁 시작' },
      { term: '데이터프레임', en: 'DataFrame (pandas)', plain: '행과 열로 이루어진 표. 파이썬의 판다스(pandas)는 표를 이런 모양으로 다뤄요.', where: '🏁 시작 0-4' },
      { term: '행', en: 'row', plain: '표의 가로 한 줄. 이 수업에서는 펭귄 한 마리의 기록이에요.', where: '모든 표' },
      { term: '열', en: 'column', plain: '표의 세로 한 줄. 몸무게처럼 같은 종류의 값이 모여 있어요.', where: '모든 표' },
      { term: '속성', en: 'feature · attribute', plain: '데이터에 담긴 특징 하나. 표에서는 열 하나가 곧 속성 하나예요.', where: '🧹 전처리 3-1' },
      { term: '인덱스', en: 'index', plain: '판다스가 행마다 붙이는 자리 번호. 0부터 세고, 펭귄 번호와는 다른 값이에요.', where: '표 왼쪽 회색 칸' },
      { term: 'CSV', en: 'Comma-Separated Values', plain: '칸은 쉼표(,)로, 줄은 줄바꿈으로 나눈 글자 파일. 표를 저장할 때 많이 써요.', where: '🕸 수집 1-2' },
      { term: '리스트', en: 'list [ ]', plain: '값을 순서대로 담는 상자. 0번, 1번, 2번… 하는 자리 번호로 값을 꺼내요.', where: '자료구조 칸' },
      { term: '사전', en: 'dictionary { }', plain: '열쇠(key)와 값(value)을 짝지어 담는 상자. 열쇠로 값을 바로 찾아요.', where: '자료구조 칸' },
      { term: '큐', en: 'queue', plain: '먼저 넣은 것부터 꺼내는 줄. 의사결정 트리에서는 나눌 노드를 큐 뒤에 넣고, 앞에서부터 하나씩 꺼내요.', where: '🤖 의사결정 트리 5-8' },
      { term: '변수', en: 'variable', plain: '이름표를 붙인 상자. ←로 새 값을 넣으면 예전 값은 사라져요.', where: '🏁 시작 0-5' },
    ],
  },
  {
    group: '수집',
    items: [
      { term: '웹 크롤링', en: 'web crawling · scraping', plain: '프로그램을 써서 웹 페이지에서 원하는 데이터를 자동으로 모으는 일.', where: '🕸 수집' },
      { term: 'HTML', en: 'HyperText Markup Language', plain: '웹 페이지를 이루는 글. 제목, 표, 칸 같은 부분을 <태그>로 표시해요.', where: '🕸 수집 1-1' },
      { term: '태그', en: 'tag', plain: '<tr>, <td>처럼 꺾쇠로 둘러싼 표시. 안에 든 내용이 무엇인지 알려 줘요.', where: '🕸 수집 1-1' },
      { term: '요청과 응답', en: 'request · response', plain: '내 컴퓨터가 서버에 "이 쪽을 보내 주세요" 하고 부탁하는 것이 요청, 서버가 HTML을 보내 주는 것이 응답이에요.', where: '🕸 수집 1-2' },
      { term: '파싱', en: 'parsing (BeautifulSoup)', plain: '길게 이어진 HTML 글을 태그 나무로 정리해서, 원하는 태그를 찾기 쉽게 만드는 일.', where: '🕸 수집 1-2' },
      { term: 'robots.txt', en: 'robots.txt', plain: '사이트가 "크롤러는 여기까지만 와 주세요"라고 적어 둔 안내 파일.', where: '🕸 수집 1-3' },
      { term: 'API', en: 'Application Programming Interface', plain: '사이트가 프로그램에 데이터를 주려고 열어 둔 정식 통로. API가 있으면 크롤링보다 API를 먼저 써요.', where: '🕸 수집 1-3' },
      { term: '개인정보', en: 'personal information', plain: '이름, 연락처, 사진처럼 누구인지 알아볼 수 있는 정보. 크롤링으로 모으거나 퍼뜨리면 안 돼요.', where: '🕸 수집 1-3' },
      { term: '편향', en: 'bias', plain: '데이터가 한쪽으로 치우친 것. 예를 들어 앞부분만 모으면 아델리펭귄만 담긴 데이터가 돼요.', where: '🕸 수집 1-3' },
    ],
  },
  {
    group: '가공 — 결측치와 이상치',
    items: [
      { term: '결측치', en: 'missing value · NaN', plain: '값이 비어 있는 칸. 판다스에서는 NaN(Not a Number)으로 표시돼요.', where: '🔍 가공 2-1~2-3' },
      { term: 'True / False', en: 'bool', plain: '참과 거짓을 나타내는 값. 더할 때는 True를 1로, False를 0으로 쳐서 계산해요.', where: '🔍 가공 2-1~2-2' },
      { term: '이상치', en: 'outlier', plain: '다른 값들과 동떨어진 값. 잘못 적은 값일 수도 있고, 정말로 특이한 값일 수도 있어요.', where: '🔍 가공 2-4~2-5' },
      { term: '사분위수', en: 'quartile · Q1 Q2 Q3', plain: '값을 크기순으로 줄 세워 네 덩어리로 나눌 때, 그 경계에 오는 값. Q2가 바로 중앙값이에요.', where: '🔍 가공 2-4' },
      { term: '중앙값', en: 'median', plain: '값을 크기순으로 줄 세웠을 때 한가운데 오는 값. 이상치가 있어도 잘 흔들리지 않아요.', where: '🔍 가공 2-4' },
      { term: 'IQR', en: 'interquartile range', plain: 'Q3 − Q1. 가운데 절반의 값들이 퍼져 있는 폭이에요.', where: '🔍 가공 2-4' },
      { term: '상자그림', en: 'box plot', plain: '사분위수를 상자와 선, 수염, 점으로 나타낸 그림. 이상치는 점으로 따로 찍혀요.', where: '🔍 가공 2-5' },
    ],
  },
  {
    group: '전처리',
    items: [
      { term: '전처리', en: 'preprocessing', plain: '모은 데이터를 학습에 쓸 수 있게 다듬는 일. 지우고, 채우고, 바꾸는 일이 모두 여기에 들어가요.', where: '🧹 전처리' },
      { term: '핵심 속성 추출', en: 'feature selection', plain: '목표와 관계있는 속성만 골라 남기는 일.', where: '🧹 전처리 3-1' },
      { term: '평균값 대체', en: 'fillna(mean)', plain: '숫자 열의 빈칸을 그 열의 평균으로 채우는 일.', where: '🧹 전처리 3-4' },
      { term: '최빈값', en: 'mode', plain: '가장 자주 나온 값. 글자 열의 빈칸을 채울 때 써요.', where: '🧹 전처리 3-5' },
      { term: '텍스트 값 대체', en: 'replace · map', plain: '"수컷/암컷" 같은 글자를 0/1 같은 숫자로 바꾸는 일. 모델은 숫자로 계산하거든요.', where: '🧹 전처리 3-6' },
      { term: '정규화', en: 'normalization · min-max scaling', plain: '열마다 값을 0~1 범위로 맞추는 일(크기 맞추기). 각 칸 ← (값 − 최솟값) ÷ (최댓값 − 최솟값). 몸무게(수천 g)와 부리(수십 mm)처럼 크기가 크게 다른 열을 함께 써서 거리를 재면, 숫자가 큰 열이 거리를 혼자 정해 버려요. 정규화는 이런 일을 막아 줘요. 데이터를 나눈 뒤에는 훈련 데이터의 최솟값과 최댓값으로 계산해요.', where: '🧹 전처리 3-7 · 🚀 프로젝트 6-1' },
      { term: '겹친 행', en: 'duplicate', plain: '모든 값이 똑같은 행이 두 번 이상 들어 있는 것. 하나만 남기고 지워야 해요.', where: '🧹 전처리 3-2' },
      { term: '데이터 누수', en: 'data leakage', plain: '정답의 힌트가 입력에 몰래 섞여 드는 것. 그러면 연습 때만 잘 맞히고 새 데이터는 못 맞히는 모델이 돼요.', where: '🧹 전처리 3-1' },
    ],
  },
  {
    group: '학습 준비',
    items: [
      { term: '데이터 통합', en: 'concat · merge', plain: '여러 표를 하나로 합치는 일. 위아래로 잇는 concat과, 열쇠를 기준으로 옆에 붙이는 merge가 있어요.', where: '🧩 학습 준비 4-1~4-2' },
      { term: '열쇠', en: 'key', plain: '두 표에서 같은 대상을 찾아 이어 주는 공통 열. 이 수업에서는 펭귄 번호가 열쇠예요.', where: '🧩 학습 준비 4-2' },
      { term: 'X와 y', en: 'features · label', plain: 'X는 모델이 보고 판단하는 입력 속성이고, y는 모델이 맞혀야 할 정답이에요.', where: '🧩 학습 준비 4-3' },
      { term: '레이블', en: 'label', plain: '데이터에 붙은 정답. 지도학습에는 레이블이 꼭 있어야 해요.', where: '🤖 기계학습 5-1~5-3' },
      { term: '훈련 데이터', en: 'training data', plain: '모델이 공부할 때 쓰는 데이터. 문제집에 해당해요.', where: '🧩 학습 준비 4-3' },
      { term: '테스트 데이터', en: 'test data', plain: '학습이 끝난 뒤 실력을 재는 데이터. 시험 문제와 같아서 공부할 때 미리 보면 안 돼요.', where: '🧩 학습 준비 4-3' },
    ],
  },
  {
    group: '기계학습',
    items: [
      { term: '기계학습', en: 'machine learning', plain: '사람이 규칙을 하나하나 짜 주지 않아도 컴퓨터가 데이터에서 규칙을 스스로 찾게 하는 방법.', where: '🤖 기계학습' },
      { term: '모델', en: 'model', plain: '데이터에서 배운 규칙을 담은 것. 새 데이터를 넣으면 답을 내놓아요.', where: '🤖 기계학습' },
      { term: '지도학습', en: 'supervised learning', plain: '정답(레이블)이 있는 데이터로 배우는 방법. 분류와 회귀가 여기에 속해요.', where: '🤖 기계학습 5-1' },
      { term: '비지도학습', en: 'unsupervised learning', plain: '정답 없이 데이터 속에서 비슷한 무리 같은 구조를 찾는 방법. 군집이 대표적이에요.', where: '🤖 기계학습 5-1' },
      { term: '강화학습', en: 'reinforcement learning', plain: '직접 행동해 보고 그 결과로 보상을 받으면서, 더 나은 행동을 스스로 익혀 가는 방법.', where: '🤖 기계학습 5-2' },
      { term: '보상', en: 'reward', plain: '강화학습에서 행동의 결과가 좋았는지 나빴는지 알려 주는 점수.', where: '🤖 기계학습 5-2' },
      { term: '분류', en: 'classification', plain: '종처럼 미리 정해 둔 무리 가운데 하나를 고르는 일.', where: '🤖 기계학습 5-3' },
      { term: '회귀', en: 'regression', plain: '몸무게 같은 숫자 값을 내놓는 일. 넓게 보면 분류와 회귀 모두 예측이지만, 이 수업에서 회귀라고 하면 숫자를 내놓는 예측을 말해요.', where: '🤖 기계학습 5-3' },
      { term: '군집', en: 'clustering', plain: '정답 없이 비슷한 것끼리 무리 짓는 일.', where: '🤖 기계학습 5-3' },
      { term: '하이퍼파라미터', en: 'hyperparameter', plain: '학습을 시작하기 전에 사람이 정해 주는 값. k-최근접 이웃의 k나 k-평균의 k가 이런 값이에요.', where: '🤖 k-최근접 이웃' },
    ],
  },
  {
    group: '알고리즘',
    items: [
      { term: 'k-최근접 이웃', en: 'k-Nearest Neighbors (KNN)', plain: '가장 가까운 이웃 k개를 찾아 다수결로 분류하는 방법.', where: '🤖 k-최근접 이웃' },
      { term: '거리', en: 'Euclidean distance', plain: '그래프 위 두 점 사이의 직선거리. √((가로 차)² + (세로 차)²)로 구해요.', where: '🤖 k-최근접 이웃 5-5' },
      { term: '의사결정 트리', en: 'decision tree', plain: '예/아니오로 답하는 질문을 차례로 이어서 답을 정하는 나무 모양 모델.', where: '🤖 의사결정 트리' },
      { term: '지니 불순도', en: 'Gini impurity', plain: '한 무리에 여러 종이 얼마나 섞였는지 재는 값. 한 종뿐이면 0이에요.', where: '🤖 의사결정 트리 5-8' },
      { term: '노드와 잎', en: 'node · leaf', plain: '트리의 마디 하나하나가 노드이고, 더 나뉘지 않고 답이 정해진 끝 노드가 잎이에요.', where: '🤖 의사결정 트리' },
      { term: '선형 회귀', en: 'linear regression', plain: '점들 사이를 가장 잘 지나는 직선을 찾아 숫자를 예측하는 방법.', where: '🤖 선형 회귀' },
      { term: '기울기와 절편', en: 'slope w · intercept b', plain: '직선 y = w×x + b에서 기울기 w는 x가 1 늘 때 y가 변하는 양이고, 절편 b는 x가 0일 때의 높이예요.', where: '🤖 선형 회귀' },
      { term: '오차', en: 'error · residual', plain: '실제 값과 예측 값의 차이. 그래프에서는 점과 직선 사이의 세로 거리예요.', where: '🤖 선형 회귀 5-10' },
      { term: '평균 제곱 오차', en: 'MSE', plain: '오차를 제곱해서 평균을 낸 값. 작을수록 직선이 점들에 잘 맞는다는 뜻이에요.', where: '🤖 선형 회귀 5-10' },
      { term: '최소제곱법', en: 'least squares', plain: '오차를 제곱해 더한 값이 가장 작은 직선을 공식으로 한 번에 구하는 방법.', where: '🤖 선형 회귀 5-11' },
      { term: '경사 하강법', en: 'gradient descent', plain: '오차가 줄어드는 쪽으로 w, b를 조금씩 고쳐 가는 방법.', where: '🤖 선형 회귀 5-10' },
      { term: 'k-평균', en: 'k-Means', plain: '중심 k개를 정하고, 점마다 가장 가까운 중심에 배정한 뒤 중심을 옮기는 일을 되풀이해서 k개 무리로 나누는 방법.', where: '🤖 k-평균' },
      { term: '중심', en: 'centroid', plain: '한 무리에 속한 점들의 평균 위치.', where: '🤖 k-평균' },
    ],
  },
  {
    group: '평가와 도구',
    items: [
      { term: '정확도', en: 'accuracy', plain: '맞힌 개수 ÷ 전체 개수. 분류 모델의 기본 성적표예요.', where: '🚀 프로젝트 6-1' },
      { term: '의사코드', en: 'pseudocode', plain: '사람의 말과 프로그램 코드의 중간쯤 되는 말로 적은 절차. 어떤 프로그래밍 언어로든 옮길 수 있어요.', where: '모든 단계 실행 쪽' },
      { term: '파이썬', en: 'Python', plain: '인공지능에서 가장 많이 쓰는 프로그래밍 언어.', where: '🐍 실습 쪽' },
      { term: 'Colab', en: 'Google Colaboratory', plain: '아무것도 설치하지 않고 브라우저에서 파이썬을 실행할 수 있는 구글의 무료 노트북.', where: '📒 Colab 단추' },
      { term: '판다스', en: 'pandas', plain: '표(데이터프레임)를 다루는 파이썬 도구 모음.', where: '🐍 실습 쪽' },
      { term: '사이킷런', en: 'scikit-learn', plain: '기계학습 모델을 코드 몇 줄로 만들 수 있는 파이썬 도구 모음.', where: '🐍 실습 쪽' },
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
