/** 🤖 기계학습 › 의사결정 트리 */
export default {
  id: 'tree',
  name: '의사결정 트리',
  tag: '',
  pages: [
    {
      id: 'idea',
      scene: 'treeExplore',
      title: '의사결정 트리 ① 아이디어 — 스무고개처럼 질문하기',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '날개길이·부리길이를 바꿔 보며 새 펭귄이 트리를 따라 내려가는 길과, 그래프에서 나뉜 칸을 견주어 보세요.',
          check: 'visit',
        },
      ],
      more: '예/아니오 질문을 이어 답을 좁혀요. 컴퓨터는 데이터를 가장 깔끔하게 나누는 질문을 스스로 찾아요. 완성된 트리는 사람이 읽을 수 있는 규칙이 돼요. (분류 · 지도학습)',
      minutes: 5,
    },
    {
      id: 'step',
      scene: 'tree',
      title: '의사결정 트리 ② 의사코드로 한 단계씩',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: '후보 표에서 가장 좋은 질문이 골라지고, 트리와 그래프가 함께 나뉘는 것을 보세요. 마지막엔 새 펭귄이 트리를 따라 내려가요.',
          check: 'visit',
        },
      ],
      more: '질문 후보마다 나눈 뒤 얼마나 섞이는지(지니 불순도)를 재고, 가장 덜 섞이는 질문을 골라요. 나눈 자식 노드는 할일 큐에 넣어 차례로 다시 나눠요.',
      minutes: 5,
    },
    {
      id: 'python',
      scene: 'python:06_decision_tree',
      title: '의사결정 트리 ③ 🐍 파이썬 실습 (Colab)',
      short: '',
      objective: '',
      why: '',
      terms: [],
      missions: [
        {
          text: 'Colab에서 셀을 차례로 실행하고 plot_tree 그림을 사이트의 트리와 견주어 보세요.',
          check: 'visit',
        },
      ],
      more: 'scikit-learn으로 트리를 만들고, 만들어진 질문을 글자와 그림으로 꺼내 봐요. 사이트에서 손으로 만든 트리와 같은 질문이 나와요.',
      minutes: 5,
    },
  ],
};
