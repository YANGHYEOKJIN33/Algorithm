# 🐧 펭귄 데이터로 배우는 인공지능

파이썬을 잘 몰라도 **남극 펭귄 데이터 하나**로 인공지능 프로젝트의 전 과정 —
**수집(웹 크롤링) → 가공(결측치·이상치) → 전처리 → 학습 준비 → 기계학습 → 평가** — 을 배우는 웹 학습 사이트입니다.

[8-퍼즐 탐색 학습 사이트](https://github.com/YANGHYEOKJIN33/8puzzle)와 같은 방식으로 만들었습니다.
**의사코드가 한 줄 실행될 때마다 표·리스트·사전·트리·그래프가 어떻게 바뀌는지** 눈으로 보며 익히고,
파이썬은 "🐍 같이 보기"와 **Colab 실습**에서 꺼내 씁니다.

```
사이트 주소   https://yanghyeokjin33.github.io/Algorithm/
연습 사이트   https://yanghyeokjin33.github.io/Algorithm/practice/   (크롤링 연습용 7쪽)
```

> 처음 배포하는 방법은 [`docs/DEPLOY.md`](./docs/DEPLOY.md)를 보세요.

---

## 무엇을 배우나요 — 큰 탭 7개, 43쪽

| 탭 | 쪽 | 배우는 것 | 한 단계씩 보는 자료구조 |
|---|---|---|---|
| 🏁 시작 | 3 | 프로젝트 흐름 · 펭귄 데이터와 표(데이터프레임) · 의사코드 읽는 법 | 변수 상자 |
| 🕸 수집 | 4 | 웹 페이지와 HTML · 크롤링 한 단계씩 · 크롤링 예절 · 🐍 실습 | 태그 나무 · 행목록(리스트 안의 리스트) |
| 🔍 가공 | 6 | 결측치 여부·개수·위치 · 사분위수 · 상자그림 · 🐍 실습 | True/False 표 · 개수표 · 위치목록 · 수직선 |
| 🧹 전처리 | 7 | 핵심 속성 · 데이터 삭제 · 결측치 삭제 · 평균값/최빈값 대체 · 텍스트 값 대체 · 🐍 실습 | 표 · 세기표/바꿈표(사전) |
| 🧩 학습 준비 | 4 | 세로 통합(concat) · 가로 통합(merge) · 훈련/테스트 분할 · 🐍 실습 | 표 두 개 → 하나 · X/y · 훈련/테스트 |
| 🤖 기계학습 | 15 | 개념(지도·비지도·강화, 분류·예측·군집) + **k-최근접 이웃 · 의사결정 트리 · 선형 회귀 · k-평균** | 거리목록·세기표 · 할일 큐·트리 · 계산표 · 중심표·소속목록 · 점수표 Q |
| 🚀 프로젝트 | 4 | 모델 평가(정확도) · 전체 흐름 정리 · 이해 확인 10문제 · 프로젝트 안내 | 채점표 |

기계학습 알고리즘은 모두 **같은 3쪽**으로 배웁니다.

1. **① 아이디어** — 직접 조작해 봐요(새 펭귄 옮기기 · k 바꾸기 · 직선 맞추기 · 처음 중심 고르기)
2. **② 의사코드로 한 단계씩** — 줄이 켜질 때마다 그래프와 자료구조가 함께 움직여요
3. **③ 🐍 파이썬 실습** — 의사코드를 그대로 옮긴 파이썬 + 프로젝트에서 쓸 scikit-learn 세 줄

## 한 데이터로 끝까지

[palmerpenguins](https://allisonhorst.github.io/palmerpenguins/)(CC0, 344마리)를 우리말로 옮겨 씁니다.
가공·전처리를 배울 수 있도록 **함정 세 가지**를 일부러 넣고 공개합니다.

- 빈칸 1칸 (7번 펭귄의 부리길이) — 원본에 있던 결측치(측정값 2줄·성별 11칸)는 그대로
- 이상치 1칸 (13번 펭귄 몸무게 3200g → 8200g)
- 겹친 행 1줄 (50번 펭귄이 1쪽 끝과 2쪽 처음에 두 번)

학생은 크롤링으로 345줄을 모은 뒤, 가공 수업에서 함정을 찾고, 전처리 수업에서 고칩니다.
사이트의 값은 판다스·사이킷런과 **똑같이** 나오도록 맞췄습니다(예: Q1=3450, 선형 회귀 w=42.35, 341번 펭귄 k=3 → 턱끈).

## Colab 실습 노트북 9개

| 노트북 | 탭 |
|---|---|
| [01 웹 크롤링](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/01_web_crawling.ipynb) | 🕸 수집 |
| [02 결측치·이상치](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/02_missing_outlier.ipynb) | 🔍 가공 |
| [03 전처리](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/03_preprocessing.ipynb) | 🧹 전처리 |
| [04 통합·분할](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/04_merge_split.ipynb) | 🧩 학습 준비 |
| [05 k-최근접 이웃](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/05_knn.ipynb) · [06 의사결정 트리](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/06_decision_tree.ipynb) · [07 선형 회귀](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/07_linear_regression.ipynb) · [08 k-평균](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/08_kmeans.ipynb) | 🤖 기계학습 |
| [09 프로젝트 틀](https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/09_project_template.ipynb) | 🚀 프로젝트 |

모든 노트북은 처음부터 끝까지 오류 없이 실행되는 것을 확인했습니다. (Colab 링크는 `main` 브랜치를 가리킵니다.)

## 화면 사용법

- 맨 위 **탭을 왼쪽부터** 차례로(시작 → 1 수집 … 6 프로젝트). 단원 처음엔 **🧭 표지**(무엇을 할 수 있게 되나), 끝엔 **📝 정리**(1분 요약·확인 문제).
- 쪽마다 **🎯 목표**(~할 수 있다)와 **✋ 할 일**이 있어요. 할 일을 직접 하면 저절로 ✅가 되고, **❓ 확인 문제**로 이해했는지 확인해요.
- **📚 목차**에서 전체 단원의 목표와 내 진도(이 브라우저에 저장)를 봐요.
- **⏭ 한 단계 / ⏮ 뒤로 / ▶ 재생** — 키보드 `→` `←` `Space` `Home` `End`도 됩니다.
- 의사코드 패널의 **🐍 파이썬 같이 보기**를 켜면 줄마다 같은 일을 하는 파이썬이 붙고, **📒 Colab**으로 실습이 열려요.
- **📖 용어**(69개) · **ⓘ 용어 풍선** · **가+/가−** 글자 크기 · **🌗** 밝게/어둡게.

## 문서

- [요구사항 정의서 (REQUIREMENTS.md)](./REQUIREMENTS.md) — 무엇을, 누구를 위해, 어떤 기준으로
- [교사용 안내 (docs/TEACHER.md)](./docs/TEACHER.md) — 차시 계획 · 쪽별 수업 포인트 · Colab 지도 팁 · 프로젝트 지도
- [학습 목표표 (docs/OBJECTIVES.md)](./docs/OBJECTIVES.md) — 단원·쪽마다 🎯 목표 · 학습 요소 · ✋ 할 일 · 성취기준 (자동 생성)
- [구조 안내 (docs/ARCHITECTURE.md)](./docs/ARCHITECTURE.md) — 폴더 · 장면(frame) 방식 · 수업 추가하는 법
- [배포 안내 (docs/DEPLOY.md)](./docs/DEPLOY.md) — GitHub Pages 켜는 법

## 개발

빌드 도구도 설치할 의존성도 없습니다.

```bash
python3 -m http.server 8000   # http://localhost:8000 (ES 모듈이라 file://로는 열리지 않아요)
npm test                      # 판다스·사이킷런 대조 + 수업 내용 약속 테스트 (Node 내장 도구만)
npm run build                 # 연습 사이트·CSV·노트북·학습 목표표를 원본에서 다시 만들기
node scripts/check-course.mjs # 수업 내용(목표·할 일·확인 문제) 점검
```

데이터 출처: Horst AM, Hill AP, Gorman KB (2020). palmerpenguins: Palmer Archipelago (Antarctica) penguin data. CC0.
