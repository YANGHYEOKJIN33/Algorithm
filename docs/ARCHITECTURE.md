# 구조 안내 (개발자용)

빌드 도구·프레임워크 없이 **브라우저가 바로 읽는 HTML + CSS + ES 모듈**로 만든다(8-퍼즐 사이트와 같은 원칙).
`index.html`을 정적 서버로 열면 그대로 동작한다.

## 폴더

```
index.html                화면 뼈대 — 세 줄: #topnav(맨 위 줄) · #workspace(무대: #caption · 패널 · #slidecard) · #nowbar(지금 할 일 줄)
practice/                 크롤링 연습 사이트(정적 HTML 7쪽) ← npm run build가 만든다
data/                     수업용 CSV 4개 + source/(원본) ← npm run build가 만든다
notebooks/                Colab 노트북 9개 ← npm run build가 만든다
scripts/build.mjs         위 세 폴더와 docs/OBJECTIVES.md, docs/TEACHER.md의 차시표를 원본에서 만드는 생성기
scripts/check-course.mjs  수업 내용 점검기(목표 형식·할 일 확인 낱말·학습 요소·핵심 한 줄·볼 곳·장 차례·data-beat/data-act·없어진 화면 틀 낱말) — 테스트도 쓴다
scripts/objectives.mjs    교사용 학습 목표표(docs/OBJECTIVES.md — 핵심 한 줄·장 칩·❓ 정답 포함)와 차시표 만들기
scripts/audit-ui.mjs      화면 점검기(Playwright) — 모든 쪽 × 모든 장을 FINAL_SPEC §6.1 기준으로, --shots로 §6.2 스크린숏(npm test 밖)
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
                          쪽(🎯 objective·why·takeaway(핵심 한 줄)·setup·terms·✋ missions(look·chip)·beats(살펴보기 쪽의 장)·❓ ask·장면 이름).
                          기계학습은 ml.js + ml-<하위탭>.js
    lessons.js            course/를 모아 단원 표지·정리 쪽을 붙이고, 쪽 찾기·번호표(2-3)를 준다 — 머리말이 자료 형식
    beats.js              장(beat) 차례 — pageBeats(쪽)가 도입·읽기·할 일·확인·정리(표지 3장·정리 5장·Colab 묶음)를 만든다. 화면을 모르는 순수 함수
    flow.js               학습 흐름 제어기 — 지금 장·지금 할 일(open)·[계속]/[이전]·저절로 넘김·이어 하기('beat:<쪽>' 저장). DOM을 모른다
    nav.js                쪽 사이 이동 — nextPlace/prevPlace(단원 경계를 넘어), placeOf, beatKey, visitPatch(그 쪽의 첫 할 일 장 등)
    progress.js           학습 진도(브라우저 저장, 형식 2판) — 쪽마다 마친 할 일, 문제 답(지금 답 + 처음 고른 답), 생각 열기, 스스로 점검
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
    unit.js               🧭 단원 표지(cv-hook · cv-flow · cv-goals) · 📝 단원 정리(rv-summary … rv-end) (내용은 course/의 unit에서)
    python.js             🐍 Colab 실습 쪽(nb-open · nb-follow 섹션 넘기기 · nb-result 점검표)
                          장면은 장마다 보일 덩어리에 data-beat="id", 보라 고리가 갈 곳에 data-act="이름"을 단다
  viz/                    그림 부품 — 표(데이터프레임) · 리스트/사전/변수 상자 · 산점도 · SVG 도우미
  ui/                     화면 틀
    topNav.js             맨 위 줄 — 📚 목차 · 단원 이름표 ▾(점 7개 진도) · 쪽 이름표 ▾(기계학습은 하위 탭 묶음) · 🎯 · 장 칩 · 📖 용어 · ⋯ 메뉴
    nowBar.js             지금 할 일 줄 — 할 일 한 문장 · 🚩 막대 · 👀 볼 곳 · ✅ 잘했어요 · [← 이전] · 파란 단추/[건너뛰기 ↷] · 문제·섹션 넘기기(pager) · 키(Enter·PageDown·PageUp·←·→)
    spotlight.js          보라 고리 — 지금 할 곳 하나에 .is-now와 꼬리표(.now-tag), 무대 안 파란 단추는 .is-demoted
    slideCard.js          장면 위에 겹치는 슬라이드 — 도입 · 읽기(의사코드 미리 읽기) · ❓ 확인 · 정리(핵심 한 줄)
    sceneHost.js          장면 무대 — 쪽마다 장면을 한 번 붙이고, 장마다 슬라이드 또는 show 덩어리만 보이게(.beat-head), scene:render 사건
    controls.js           재생 단추 묶음(지금 할 일 줄 오른쪽) · actionCard.js 방금 자막 · codePanel.js 의사코드 패널(읽기 보기·🐍)
    courseDrawer.js       📚 목차 — ▶ 이어서 하기 · 단원·쪽·진도 · 👩‍🏫 선생님용(성취기준·차시 계획·정보) · 📋 기록 복사 · ↺ 초기화
    quizBox.js            문제 상자(한 문제씩 보기 + pager) · glossaryPanel.js 용어 사전 · recordCopy.js · infoTip.js · flip.js · dom.js
                          (없앤 것: topbar.js · lessonBar.js · onboarding.js — 상단 탭·레슨 바·첫 방문 안내 창)
  styles/                 tokens(색·간격, 보라 --now는 안내 전용) · base · layout(세 줄 배치) · shell(맨 위 줄·지금 할 일 줄·고리) · slides · components · learn · viz
test/                     node:test — 판다스·사이킷런과 같은 값인지, 만들어 둔 파일이 원본과 같은지
```

## 흐름

```
 store ('tab' · 'step:<탭>' · 'beat:<쪽열쇠>')  progress  missions
      └──────────────┬─────────────────────────┘
                     ▼
              flow (app/flow.js) — 지금 쪽 · 장 차례(beats.js) · 지금 장 · open(첫 안 끝난 할 일) · [계속]/[이전] 글자
       ┌─────────────┼──────────────────┬──────────────────┐
       ▼             ▼                  ▼                  ▼
   topNav        sceneHost            nowBar            spotlight
 (맨 위 줄)   슬라이드(slideCard)    할 일 한 문장       .is-now 하나
              또는 show 덩어리       파란 단추 하나      (scene:render·pager·
              단계 실행이면 ↓        pager 먼저 넘김      MutationObserver로 다시 찾기)
          getScene(page.scene) ──▶ 장면 정의
                                  │ frames(ctx)  ← core/*Frames() 가 만든 장면 목록
                                  ▼
                               player.load(frames) ── 한 단계 / 뒤로 / 재생
                                  ▼
 codePanel.setLine(frame.line)  handle.render(view) — 그림·자료구조를 다시 그린다 → 'scene:render'
```

- **단원 → 쪽 → 장 → 장면.** 장(beat)은 `pageBeats(tab, sub, page)`가 만든다(FINAL_SPEC §1.3). 장면은 쪽마다 **한 번만** 붙고,
  장을 바꾸면 보이는 것만 바뀐다(슬라이드 장은 장면 위에 겹치고 장면은 visibility:hidden + inert).
- **[계속 →]**(nowBar): ① 보이는 `[data-pager]`가 다음으로 갈 수 있으면 그것을 넘기고 ② 아니면 `flow.forward()` — 다음 장, 마지막 장이면 다음 쪽(그 쪽에 기억해 둔 장).
- **저절로 넘김**: 지금 장의 할 일을 다 하면, 다음 장이 같은 화면(`sameView`)의 할 일 장일 때만 1.2초 뒤 넘어간다.
- **장면(frame)** = 의사코드 한 줄이 실행된 직후의 모습(그 순간의 표·리스트·사전…을 통째로 담는다).
  데이터가 작아서(6~18줄) 통째로 담아도 가볍고, 되감기가 "번호 하나 줄이기"가 된다.
- 화면은 장면을 받아 **다시 그리기만** 한다. 움직임은 `ui/flip.js`(FLIP)와 `viz/scatter.js`의 mover(CSS 전이)가 맡는다.
- `PSEUDO[i]`와 `PYTHON[i]`는 같은 줄이다(테스트가 줄 수를 확인). "🐍 파이썬 같이 보기"가 이 짝을 보여 준다.
- 개발·점검용으로 `globalThis.__lab = { store, player, progress, missions, flow }`가 열려 있다(`scripts/audit-ui.mjs`가 쓴다).

## 할 일 자동 체크 (missions)

```
 재생기 이동 ─┐                         ┌─ progress.complete(쪽, i) → 지금 할 일 줄 ✅ · 장 칩 ✓ · 📚 목차 → flow가 다음 할 일/저절로 넘김
 문제 상자    ─┤ sceneHost가 모아서 →  missions.emit(사건) ─┤
 Colab 링크   ─┤                         └─ 이 쪽의 미션 check 낱말과 맞으면 ✅
 ctx.check()  ─┘
```

check 낱말: `step:N`(N번 장면까지) · `end` · `back` · `python` · `colab` · `quiz` · `right:N` · `ask`(❓ 확인 문제) · `act:이름`(장면이 `ctx.check('이름')`).
`node scripts/check-course.mjs`가 낱말이 그 쪽에서 실제로 이룰 수 있는지(장면 수, 장면 소스의 `check('이름')`)와
`act:이름`마다 보라 고리가 갈 `data-act="이름"`이 장면 소스(하위 폴더 포함)나 `ui/slideCard.js`에 있는지까지 확인한다.
할 일 하나는 꼭 한 장에만 들어간다(살펴보기 쪽은 course의 `beats[].checks`, 나머지는 beats.js의 틀).

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
   (title · short · 🎯 objective "~할 수 있다." · why · takeaway(핵심 한 줄) · terms · ✋ missions · ❓ ask · more · minutes · scene).
   단계 실행 쪽은 setup과 'step:N'·'end' 미션의 look, act 미션의 chip을, 살펴보기 쪽은 beats(장 차례)를 적는다(lessons.js 머리말).
   손으로 할 일이 장면 안의 행동이면 장면에서 `ctx.check('이름')`을 부르고 미션에 `act:이름`을 쓰며, 그 곳에 `data-act="이름"`을 단다.
   살펴보기 장면은 장마다 보일 덩어리에 `data-beat="id"`를 단다.
4. `node scripts/check-course.mjs <단원>`으로 점검하고, 파이썬 실습이 필요하면 `src/app/notebooks.js`에 노트북을 더한다.
5. `npm run build`(노트북·학습 목표표 다시 만들기) → `npm test` → 화면은 `node scripts/audit-ui.mjs --only 2-2`(로컬 서버 :8822 필요).

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
| `test/site.test.js` | 수업 내용 약속(check-course), 단원 표지·정리 위치, 노트북·연습 사이트·CSV·학습 목표표가 원본과 같은지, 없어진 화면 틀 낱말, 모든 쪽 장 3~8개 |
| `test/beats.test.js` | 모든 쪽의 장 차례(첫 장·끝 장·읽기·확인), 미션이 꼭 한 장에, `step:N` 장이 장면 수 안 |
| `test/flow.test.js` | [계속]/[이전](쪽 경계 포함)·이어서 보기·저절로 넘김(같은 화면만, 움직이면 취소)·건너뛰기·표지 출발 |
| `test/progress.test.js` | 진도 형식 2판 옮기기(0-2·6-1 미션 번호 한 칸 밀기) |
| `test/slides.test.js` | 한 문제씩 넘기기 · Colab 섹션 나누기 · 장 덩어리 거르개 · 도입 머리 줄 |
| `test/record.test.js` · `test/checkpoints.test.js` · `test/normalize.test.js` | 📋 학습 기록 글 · Colab 점검표 값 · 크기 맞추기 |

화면 점검(브라우저)은 `npm test` 밖에 있다.

```bash
python3 -m http.server 8822 &          # 저장소 뿌리에서
node scripts/audit-ui.mjs              # 모든 쪽 × 모든 장(1280×720 · 1280×600 · 390×844 · 어두운 테마/움직임 줄이기 표본 · 동작)
node scripts/audit-ui.mjs --only 2-2,5-4 --verbose
node scripts/audit-ui.mjs --shots ./shots   # FINAL_SPEC §6.2 스크린숏 묶음
```
