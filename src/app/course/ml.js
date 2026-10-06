/** 🤖 기계학습 — 개념(학습 방법·목적) + 알고리즘 네 가지(하위 탭): 분류 2 · 예측 1 · 군집 1 */
import CONCEPT from './ml-concept.js';
import KNN from './ml-knn.js';
import TREE from './ml-tree.js';
import LINREG from './ml-linreg.js';
import KMEANS from './ml-kmeans.js';

export default {
  id: 'ml',
  label: '기계학습',
  icon: '🤖',
  verb: '학습시키기',
  tip: '학습 방법·목적 · k-최근접 이웃 · 의사결정 트리 · 선형 회귀 · k-평균',
  unit: {
    no: 5,
    question: '펭귄 데이터만 주면, 컴퓨터가 스스로 규칙을 찾아 처음 보는 펭귄을 맞힐 수 있을까?',
    bigIdea: '기계학습은 데이터에서 규칙을 스스로 찾는 방법이에요. "정답(레이블)이 있나?"와 "무엇을 내놓나?"로 문제를 가르면 알고리즘이 정해져요 — 종은 분류(k-최근접 이웃·의사결정 트리), 몸무게는 예측(선형 회귀), 정답 없이 묶기는 군집(k-평균).',
    note: '🗺 알고리즘 지도 — 지도학습: k-최근접 이웃 · 의사결정 트리(분류), 선형 회귀(예측) / 비지도학습: k-평균(군집). 개념 탭 다음, 알고리즘 탭마다 ① 아이디어 → ② 의사코드 한 단계씩 → ③ 🐍 Colab 실습 순서로 배워요.',
    hook: {
      q: '종을 모르는 341번 펭귄이 왔어요. 그래프에서 가장 가까운 펭귄 한 마리의 종을 그대로 따르면 맞힐까요?',
      options: ['꼭 맞힌다', '틀릴 수도 있다', '거리로는 종을 알 수 없다'],
      answer: 1,
      reveal: '사이트의 훈련 펭귄 18마리 가운데 341번과 가장 가까운 펭귄은 38번 아델리라서, 한 마리(k = 1)만 보면 아델리로 틀려요. 가까운 3마리(k = 3: 아델리 1 · 턱끈 2)에게 물으면 턱끈으로 맞혀요. 이웃을 몇 마리 볼지 같은 선택이 결과를 바꿔요.',
    },
    canDo: [
      { text: '정답이 있는지와 무엇을 내놓는지로 문제에 맞는 학습 방법과 알고리즘을 고를 수 있다.', pages: ['concept:types', 'concept:purpose'] },
      { text: '거리를 재고 가까운 이웃 k마리의 다수결로 펭귄의 종을 분류할 수 있다.', pages: ['knn:idea', 'knn:step'] },
      { text: '불순도가 가장 낮은 질문으로 의사결정 트리를 만들고, 트리를 따라 종을 정할 수 있다.', pages: ['tree:idea', 'tree:step'] },
      { text: '선형 회귀로 몸무게를 예측하고, k-평균으로 정답 없이 펭귄을 묶을 수 있다.', pages: ['linreg:idea', 'linreg:step', 'kmeans:idea', 'kmeans:step', 'kmeans:python'] },
      { text: 'Colab에서 사이킷런으로 모델을 학습(fit)시키고, 테스트 데이터로 정확도나 오차를 잴 수 있다.', pages: ['knn:python', 'tree:python', 'linreg:python'] },
    ],
    before: '깨끗한 펭귄 341줄 — X(속성)·y(종), 훈련 272줄 · 테스트 69줄 (화면에서는 10~18마리만)',
    after: '학습한 모델 — 종 분류(테스트 정확도 0.957) · 몸무게 예측 · 3묶음 군집',
    minutes: 145,
    standards: [
      { code: '[12인기02-03]', text: '문제 해결에 적합한 기계학습의 유형과 알고리즘을 선정한다.', subject: '인공지능 기초' },
      { code: '[12인기02-04]', text: '훈련 데이터를 이용하여 학습을 진행하고, 테스트 데이터를 사용하여 성능을 평가한다.', subject: '인공지능 기초' },
      { code: '[12데과03-03]', text: '데이터의 속성에 대한 유사성을 측정하고 분석하여 군집을 형성하고, 군집 분석 결과의 의미를 해석한다.', subject: '데이터 과학' },
    ],
    summary: [
      '기계학습은 데이터에서 규칙을 스스로 찾는 방법이에요. 정답(레이블)이 있으면 지도학습, 없으면 비지도학습, 정답 대신 보상으로 배우면 강화학습이에요.',
      '무엇을 내놓느냐로도 나눠요. 종처럼 정해진 무리 중 하나를 고르면 분류, 몸무게 같은 숫자면 예측(회귀), 정답 없이 무리를 만들면 군집이에요.',
      'k-최근접 이웃은 가까운 k마리의 다수결로, 의사결정 트리는 불순도가 가장 낮은 예/아니오 질문을 이어 종을 분류해요. 선형 회귀는 오차가 가장 작은 직선으로 숫자를 예측하고, k-평균은 배정과 중심 이동을 되풀이해 묶어요.',
      '사이킷런에서는 모델 만들기 → fit(훈련 데이터) → predict(테스트 데이터)면 되고, 정확도(분류)나 오차(예측)로 실력을 재요.',
    ],
    cheats: [
      { idea: 'k-최근접 이웃 모델 (k = 3)', code: 'model = KNeighborsClassifier(n_neighbors=3)' },
      { idea: '훈련 데이터로 학습', code: 'model.fit(X_train, y_train)' },
      { idea: '테스트 데이터 예측 · 정확도', code: 'accuracy_score(y_test, model.predict(X_test))' },
      { idea: '의사결정 트리 (질문 3번까지)', code: 'model = DecisionTreeClassifier(max_depth=3, random_state=0)' },
      { idea: '트리의 질문을 글자로 보기', code: 'print(export_text(model, feature_names=features))' },
      { idea: '선형 회귀 · 기울기 w와 절편 b', code: 'model = LinearRegression().fit(X_train, y_train); model.coef_[0], model.intercept_' },
      { idea: '예측의 오차 (평균 제곱 오차)', code: 'mean_squared_error(y_test, pred)' },
      { idea: 'k-평균으로 3묶음 (정답 없이 X만)', code: 'model = KMeans(n_clusters=3, n_init=10, random_state=0).fit(Xs)' },
    ],
    quiz: [
      {
        q: '날개길이로 펭귄의 몸무게(g)를 맞히려고 해요. 알맞은 알고리즘은?',
        options: ['k-평균', '선형 회귀', 'k-최근접 이웃'],
        answer: 1,
        why: '답이 숫자(몸무게)인 예측(회귀) 문제라 선형 회귀예요. k-최근접 이웃은 종을 고르는 분류, k-평균은 정답 없이 묶는 군집이에요.',
        page: 'concept:purpose',
      },
      {
        q: '341번 펭귄과 가장 가까운 3마리가 아델리 1 · 턱끈 2마리예요. k = 3이면 예측은?',
        options: ['아델리', '턱끈', '젠투'],
        answer: 1,
        why: '이웃 3마리의 다수결이라 2표를 받은 턱끈이에요. k = 1이면 가장 가까운 38번 아델리만 보고 아델리로 예측해요.',
        page: 'knn:step',
      },
      {
        q: '의사결정 트리는 질문 후보 가운데 무엇을 골라 노드를 나눌까요?',
        options: ['나눈 뒤 불순도가 가장 낮은 질문', '나눈 뒤 불순도가 가장 높은 질문', '맨 처음 만든 질문'],
        answer: 0,
        why: '불순도는 섞인 정도예요. 나눈 뒤 양쪽이 가장 덜 섞이는(한 종으로 모이는) 질문이 좋은 질문이에요. 16마리에서는 "날개길이 ≤ 203.5?"(0.313)가 뽑혀요.',
        page: 'tree:step',
      },
    ],
  },
  sub: [CONCEPT, KNN, TREE, LINREG, KMEANS],
};
