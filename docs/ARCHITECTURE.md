# 구조 안내 (개발자용)

빌드 도구·프레임워크 없이 **브라우저가 바로 읽는 HTML + CSS + ES 모듈**로 만든다(8-퍼즐 사이트와 같은 원칙).
`index.html`을 정적 서버로 열면 그대로 동작한다.

## 폴더

```
index.html                화면 뼈대 — 빈 패널만 두고 내용은 JS가 채운다
practice/                 크롤링 연습 사이트(정적 HTML 7쪽) ← npm run build가 만든다
data/                     수업용 CSV 4개 + source/(원본) ← npm run build가 만든다
notebooks/                Colab 노트북 9개 ← npm run build가 만든다
scripts/build.mjs         위 세 폴더와 docs/OBJECTIVES.md, docs/TEACHER.md의 차시표를 원본에서 만드는 생성기
scripts/check-course.mjs  수업 내용 점검기(목표 형식·할 일 확인 낱말·학습 요소) — 테스트도 쓴다
scripts/objectives.mjs    교사용 학습 목표표(docs/OBJECTIVES.md — ❓ 정답 포함)와 차시표 만들기
src/
  core/                   순수 로직 — 화면을 전혀 모른다 (Node 테스트 대상)
    data/penguins.js      원본 344마리(우리말로만 옮김)
    data/practice.js      수업용 함정 3가지를 더한 연습 데이터, 쪽 나누기
    data/sets.js          수업마다 쓰는 작은 표(번호로 고름)
    stats.js              평균·최빈값·분위수(판다스와 같은 선형 보간)·거리
    random.js             씨앗 있는 난수·섞기
    basics.js crawl.js inspect.js preprocess.js prepare.js
    ml/knn.js tree.js linreg.js kmeans.js rl.js evaluate.js
                          → 각 파일: PSEUDO(의사코드+줄 설명) · PYTHON(줄마다 짝) · xxxFrames()(장면 목록)
  app/
    course/<단원>.js      단원 하나 = 파일 하나: unit(생각 열기·할 수 있어요·1분 요약·확인 문제·성취기준)과
                          쪽(🎯 objective·why·terms·✋ missions·❓ ask·장면 이름). 기계학습은 ml.js + ml-<하위탭>.js
    lessons.js            course/를 모아 단원 표지·정리 쪽을 붙이고, 쪽 찾기·번호표(2-3)를 준다 — 머리말이 자료 형식
    progress.js           학습 진도(브라우저 저장) — 쪽마다 마친 할 일, 문제 답(지금 답 + 처음 고른 답), 생각 열기, 스스로 점검
    record.js             📋 내 학습 기록 — 처음에 맞힌 문제 수·진도·스스로 점검을 모아 복사할 글로
    plan.js               차시 계획(45분 × 13차시) — 쪽 시간을 더해 차시마다 묶는다(문서 생성·테스트가 쓴다)
    missions.js           할 일 자동 체크 — 재생기·문제 상자·Colab·장면의 ctx.check(이름) 사건을 받아 ✅
    state.js              상태 저장소(구독 방식 + 브라우저 저장)
    player.js             재생기 — 장면 목록을 앞뒤로 넘긴다
    notebooks.js          Colab 노트북 원본(사이트의 🐍 실습 쪽과 .ipynb가 함께 쓴다)
    glossary.js quiz.js links.js main.js
  scenes/                 장면 = 쪽 하나의 그림. step(단계 실행) / view(한 판)
    index.js              장면 이름 → 장면 정의
    start collect inspect prep ready concepts knn tree linreg kmeans project python
    unit.js               🧭 단원 표지 · 📝 단원 정리 (내용은 course/의 unit에서)
  viz/                    그림 부품 — 표(데이터프레임) · 리스트/사전/변수 상자 · 산점도 · SVG 도우미
  ui/                     화면 틀 — 상단 탭(진도) · 레슨 막대(단원 칩·쪽 단계·🎯·✋·❓) · 📚 목차(📋 학습 기록 복사) · 실행 제어 · 동작 카드
                          · 의사코드 패널 · 장면 무대 · 용어 사전 · 안내
  styles/                 tokens(색·간격) · base · layout · components · viz
test/                     node:test — 판다스·사이킷런과 같은 값인지, 만들어 둔 파일이 원본과 같은지
```

## 흐름

```
 [쪽 바뀜] store.set({ tab, 'step:<탭>': n })
      │
      ▼
 sceneHost ── getScene(page.scene) ──▶ 장면 정의
      │                                  │ frames(ctx)  ← core/*Frames() 가 만든 장면 목록
      │                                  ▼
      │                               player.load(frames)
      │                                  │ 한 단계 / 뒤로 / 재생
      ▼                                  ▼
 codePanel.setLine(frame.line)     handle.render(view) — 그림·자료구조를 다시 그린다
```

- **장면(frame)** = 의사코드 한 줄이 실행된 직후의 모습(그 순간의 표·리스트·사전…을 통째로 담는다).
  데이터가 작아서(6~18줄) 통째로 담아도 가볍고, 되감기가 "번호 하나 줄이기"가 된다.
- 화면은 장면을 받아 **다시 그리기만** 한다. 움직임은 `ui/flip.js`(FLIP)와 `viz/scatter.js`의 mover(CSS 전이)가 맡는다.
- `PSEUDO[i]`와 `PYTHON[i]`는 같은 줄이다(테스트가 줄 수를 확인). "🐍 파이썬 같이 보기"가 이 짝을 보여 준다.

## 할 일 자동 체크 (missions)

```
 재생기 이동 ─┐                         ┌─ progress.complete(쪽, i) → 레슨 막대 ✅ · 탭 진도 막대 · 📚 목차
 문제 상자    ─┤ sceneHost가 모아서 →  missions.emit(사건) ─┤
 Colab 링크   ─┤                         └─ 이 쪽의 미션 check 낱말과 맞으면 ✅
 ctx.check()  ─┘
```

check 낱말: `step:N`(N번 장면까지) · `end` · `back` · `python` · `colab` · `quiz` · `right:N` · `ask`(❓ 확인 문제) · `act:이름`(장면이 `ctx.check('이름')`).
`node scripts/check-course.mjs`가 낱말이 그 쪽에서 실제로 이룰 수 있는지(장면 수, 장면 소스의 `check('이름')`)까지 확인한다.

## 수업(쪽)을 더할 때

1. `src/core/`에 `xxxFrames()`와 `PSEUDO`·`PYTHON`을 만든다(화면 코드 금지). 테스트를 더한다.
2. `src/scenes/`에 장면을 만든다.
   ```js
   const myScene = {
     kind: 'step', pseudo: X.PSEUDO, python: X.PYTHON, notebook: '0n_xxx',
     stageTitle: '그림 제목', dataTitle: '자료구조 제목', rows: ['1.3fr', '0.8fr'],   // nodata: true 면 자료구조 칸 없음
     frames: () => X.xxxFrames(),
     mount({ stage, data, stageTools }, ctx) { return { render(view) { /* view.frame 을 그린다 */ } }; },
   };
   ```
3. `src/scenes/index.js`에 이름을 더하고, `src/app/course/<단원>.js`에 쪽을 더한다
   (title · short · 🎯 objective "~할 수 있다." · why · terms · ✋ missions · ❓ ask · more · minutes · scene).
   손으로 할 일이 장면 안의 행동이면 장면에서 `ctx.check('이름')`을 부르고 미션에 `act:이름`을 쓴다.
4. `node scripts/check-course.mjs <단원>`으로 점검하고, 파이썬 실습이 필요하면 `src/app/notebooks.js`에 노트북을 더한다.
5. `npm run build`(노트북·학습 목표표 다시 만들기) → `npm test`.

## 테스트

```bash
npm test
```

| 파일 | 확인하는 것 |
|---|---|
| `test/data.test.js` | 원본 344마리, 연습 데이터 = 원본 + 공개한 함정만, 쪽 나누기 |
| `test/inspect.test.js` | isnull·sum·위치, 사분위수(판다스 값), 상자그림 순서 |
| `test/preprocess.test.js` | 핵심 속성·삭제·dropna·평균/최빈값·텍스트 대체·concat·merge·분할 |
| `test/ml.test.js` | k-최근접 이웃·트리·선형 회귀·k-평균·강화학습·평가가 사이킷런과 같은 답 |
| `test/site.test.js` | 수업 내용 약속(check-course), 단원 표지·정리 위치, 노트북·연습 사이트·CSV·학습 목표표가 원본과 같은지 |
