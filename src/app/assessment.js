/**
 * 수행평가 노트북 — 인공지능 소프트웨어 개발 · 인공지능 프로젝트([12인기04-01]~[12인기04-04])
 *
 *   10_assessment_project  학생용 — 위에서부터 질문을 차례로 풀면 평가 요소 ①~④가 채워진다.
 *   11_teacher_grading     교사용 — 학번별 나만의 조건 · 요약코드(지문) 확인 · 점수 합계와 채점표 CSV
 *
 * 변별의 뼈대(docs/ASSESSMENT.md) — 인공지능을 써도 되지만, 점수는 인공지능의 성능이 아니라
 *   ① 학번에서 만든 나만의 조건(SEED·TEST_SIZE·꼭 할 실험·확인 행) — 같은 데이터라도 숫자가 학생마다 다르다
 *   ② 내 실행 결과의 숫자로 근거 대기 · 실험은 실행 전에 가설부터(가설이 비면 실행되지 않는다)
 *   ③ 확인 행으로 원리 설명 · 🤖 AI 활용 기록(무엇을 확인하고 고쳤나)
 *   ④ 제출 요약의 요약코드·지문 — 선생님이 "모두 실행"으로 다시 돌리면 같은 지문이 나와야 한다
 *   ⑤ 수업 중 구술 확인(교사 관찰 및 기록)
 * 에서 갈린다.
 *
 * notebooks.js와 같은 꼴 — { id, title, intro, check, cells }, 셀은 md(text) · code(src, explain, out).
 * 파이썬 코드는 String.raw로 적는다(역슬래시가 그대로 남는다).
 */
import { SITE_URL } from './links.js';

const md = (text) => ({ type: 'md', text: text.trim().replace(/\\`/g, '`') });
const code = (src, explain = [], out = null) => ({ type: 'code', code: src.trim(), explain, out });

/** 6-4 쪽의 데이터 고르기 카드 — 학생용 노트북 1-1의 데이터_목록과 코드가 같아야 한다(test/site.test.js) */
export const ASSESS_DATASETS = [
  { code: 'penguins', icon: '🐧', field: '생명과학·환경', desc: '남극 펭귄 344마리의 몸 측정값', example: '종 분류 · 몸무게 회귀' },
  { code: 'iris', icon: '🌸', field: '생명과학·농업', desc: '붓꽃 150송이의 꽃잎·꽃받침 크기', example: '품종 분류' },
  { code: 'wine', icon: '🍷', field: '화학·식품', desc: '와인 178병의 화학 성분 13가지', example: '품종 분류' },
  { code: 'breast_cancer', icon: '🩺', field: '의학·보건', desc: '종양 569개의 세포핵 측정값과 진단', example: '악성·양성 분류' },
  { code: 'diabetes', icon: '💊', field: '의학·약학·간호', desc: '당뇨 환자 442명의 검사값', example: '1년 뒤 진행 정도 회귀' },
  { code: 'tips', icon: '🍽', field: '경영·서비스', desc: '식당 계산서 244장과 팁', example: '팁 회귀 · 점심/저녁 분류' },
  { code: 'diamonds', icon: '💎', field: '경제·디자인', desc: '다이아몬드 53,940개의 품질과 가격', example: '가격 회귀' },
  { code: 'mpg', icon: '🚗', field: '기계·자동차 공학', desc: '자동차 398대의 엔진·무게·연비', example: '연비 회귀 · 생산 지역 분류' },
  { code: 'taxis', icon: '🚕', field: '교통·도시', desc: '뉴욕 택시 6,433번의 운행 기록', example: '요금 회귀 · 결제 수단 분류' },
  { code: 'titanic', icon: '🚢', field: '역사·사회', desc: '타이타닉호 승객 891명', example: '생존 분류' },
  { code: 'geyser', icon: '🌋', field: '지구과학', desc: '간헐천의 분출 272번', example: '분출 종류 분류 · 기다린 시간 회귀' },
  { code: 'planets', icon: '🪐', field: '천문·우주', desc: '발견된 외계 행성 1,035개', example: '발견 방법 분류' },
  { code: 'healthexp', icon: '🏥', field: '보건 정책·국제', desc: '6개 나라의 의료비와 기대수명', example: '기대수명 회귀' },
  { code: 'digits', icon: '🔢', field: '컴퓨터·인공지능', desc: '8×8 손글씨 숫자 그림 1,797장', example: '숫자(0~9) 분류' },
  { code: 'car_crashes', icon: '🚦', field: '법·사회 안전', desc: '미국 51개 주의 교통사고와 원인', example: '사고율 회귀' },
];

/** 학번 → 나만의 조건. 학생용·교사용 노트북이 글자 하나 다르지 않게 같은 함수를 쓴다 */
export const CONDITION_PY = String.raw`
import hashlib, json

실험과제_목록 = [
    '입력 속성 하나를 빼고 다시 학습해, 그 속성이 성능에 얼마나 도움이 되는지 비교하기',
    '하이퍼파라미터(knn은 k, tree는 max_depth)를 세 가지 값으로 바꿔 성능 비교하기',
    '정규화(StandardScaler)를 하기 전과 한 뒤의 성능 비교하기',
    '훈련 데이터를 절반만 써서 학습해 성능 비교하기',
    '다른 알고리즘 하나로 바꿔 성능 비교하기',
]

def 나만의_조건(학번):
    h = int(hashlib.sha256(('ai-project:' + str(학번).strip()).encode('utf-8')).hexdigest(), 16)
    return {
        'SEED': h % 10000,
        'TEST_SIZE': [0.2, 0.25, 0.3][(h // 1000) % 3],
        '실험과제': 실험과제_목록[(h // 3000) % len(실험과제_목록)],
        '확인행': (h // 15000) % 5,
    }

def 지문_만들기(요약):
    글 = json.dumps(요약, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(글.encode('utf-8')).hexdigest()[:8]
`;

/* ══════════════════ 학생용 ══════════════════ */

export const ASSESS_STUDENT = {
  id: '10_assessment_project',
  title: '🧪 인공지능 프로젝트 수행평가 (질문을 차례로 풀면 완성)',
  intro: '내 진로와 이어지는 데이터를 골라, 평가 요소 ①~④의 질문을 위에서부터 차례로 풀면 인공지능 프로젝트가 완성돼요. 인공지능(챗봇)을 써도 되지만 🤖 AI 활용 기록에 남겨요.',
  check: '①~④ 📝 답을 모두 채우고 제출 요약(요약코드·지문)이 나옴',
  cells: [
    md(String.raw`
# 🧪 인공지능 프로젝트 수행평가

**영역** 인공지능 소프트웨어 개발 · **과제** 인공지능 프로젝트 · **성취기준** [12인기04-01] ~ [12인기04-04]

| 순서 | 평가 요소 | 배점 | 이 노트북에서 할 일 |
|---|---|---|---|
| ① | 문제 정의 및 개발 계획 수립 | 30 | 데이터 고르기 · 해결할 문제 · 목적·기능·사용 대상 · 성공 기준 · 개발 계획표 |
| ② | 데이터 준비 및 인공지능 기능 구현 | 30 | 결측치·이상치 살피기 · 전처리 · 나누기와 학습 · 새 입력으로 작동 확인 |
| ③ | 성능 점검 및 개선 방안 | 25 | 성능 재기 · 틀린 예 분석 · 실험 3개(가설 → 결과 → 해석) · 한계와 개선 방안 |
| ④ | 결과 표현 및 개발 과정 설명 | 15 | 그래프·표 · 확인 행으로 원리 설명 · 개발 과정 · 🤖 AI 활용 기록 |

### 이렇게 해요
1. **파일 → 드라이브에 사본 저장**부터 눌러 내 사본을 만들어요. (사본이 아니면 고친 내용이 저장되지 않아요.)
2. 맨 위 셀부터 **차례로** ▶ 실행해요. 코드는 **✏️ 표시가 있는 줄만** 고쳐요.
3. **📝 답** 칸(글 셀)은 두 번 눌러 내 말로 채워요. 답에는 **내 실행 결과에 나온 숫자**를 꼭 넣어요.
4. 인공지능(챗봇)을 써도 돼요. 대신 쓸 때마다 맨 아래 **🤖 AI 활용 기록**에 남겨요.
5. 다 했으면 **런타임 → 모두 실행**을 한 번 하고, 맨 아래 **제출 요약**이 오류 없이 나오는지 확인한 뒤 선생님이 알려 준 방법으로 내요.

> ⚖️ **이렇게 채점해요** — 글을 얼마나 매끄럽게 썼는지가 아니라, **내 데이터·내 숫자로 근거를 댔는지**, **실험의 가설과 결과가 앞뒤가 맞는지**, **내가 직접 설명할 수 있는지**를 봐요.
> 선생님이 수업 중에 노트북을 보며 몇 가지를 물어봐요(구술 확인). 내가 설명하지 못하는 내용은 점수로 인정받기 어려워요.

수업 사이트: ${SITE_URL}
`),
    md(String.raw`
## 0. 나의 정보와 나만의 조건

학번으로 **나만의 조건**을 만들어요. 친구와 같은 데이터를 골라도 훈련/테스트로 나뉘는 펭귄(행)이 달라서 숫자가 다르게 나와요. 끝까지 이 조건을 그대로 써요.
`),
    code(String.raw`
학번 = ''   # ✏️ 예: '20315' (학년·반·번호)
이름 = ''   # ✏️ 예: '김펭귄'

import warnings
warnings.filterwarnings('ignore')
import numpy as np
import pandas as pd
pd.set_option('display.max_columns', 40)
${CONDITION_PY}
if not str(학번).strip():
    print('⚠️ 학번을 먼저 적고 다시 실행해요! 학번이 없으면 나만의 조건이 모두 같아져요.')
조건 = 나만의_조건(학번)
SEED, TEST_SIZE = 조건['SEED'], 조건['TEST_SIZE']
print(f'👤 {학번} {이름}')
print('🔑 나만의 조건 (끝까지 그대로 써요)')
print(f'  · 나누기: SEED = {SEED}, TEST_SIZE = {TEST_SIZE}')
print(f'  · 꼭 할 실험: {조건["실험과제"]}')
print(f'  · 원리를 설명할 확인 행: 테스트 데이터의 {조건["확인행"]}번 행')
`, ['학번과 이름을 적고 실행하면 나만의 조건 네 가지가 나와요. 이 조건은 학번에서 만들어서 선생님도 똑같이 다시 만들어 볼 수 있어요.'],
    "👤 10101 김펭귄\n🔑 나만의 조건 (끝까지 그대로 써요)\n  · 나누기: SEED = 7490, TEST_SIZE = 0.25\n  · 꼭 할 실험: 정규화(StandardScaler)를 하기 전과 한 뒤의 성능 비교하기\n  · 원리를 설명할 확인 행: 테스트 데이터의 3번 행"),

    md(String.raw`
---
## ① 문제 정의 및 개발 계획 수립 (30점)

### 1-1 데이터 고르기 — 내 진로와 이어지는 분야
아래 셀을 실행하면 고를 수 있는 데이터 목록이 나와요. 내 진로·관심과 가까운 분야를 골라요.
목록에 없는 데이터(공공데이터포털 등)를 쓰고 싶으면 선생님께 먼저 확인받은 뒤 \`DATASET = 'my_csv'\`로 써요. **개인정보가 들어 있는 데이터는 쓸 수 없어요.**
`),
    code(String.raw`
import seaborn as sns
from sklearn import datasets as skd

def _사이킷런(이름):
    return getattr(skd, 이름)(as_frame=True).frame

데이터_목록 = {
    'penguins': dict(분야='생명과학·환경', 설명='남극 펭귄 344마리의 몸 측정값', 불러오기=lambda: sns.load_dataset('penguins'),
        TARGET='species', FEATURES=['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g'], 예시='종 분류 · 몸무게 회귀',
        열={'species': '종(Adelie·Chinstrap·Gentoo)', 'island': '사는 섬', 'bill_length_mm': '부리길이(mm)', 'bill_depth_mm': '부리깊이(mm)',
           'flipper_length_mm': '날개길이(mm)', 'body_mass_g': '몸무게(g)', 'sex': '성별'}),
    'iris': dict(분야='생명과학·농업', 설명='붓꽃 150송이의 꽃잎·꽃받침 크기', 불러오기=lambda: sns.load_dataset('iris'),
        TARGET='species', FEATURES=['sepal_length', 'sepal_width', 'petal_length', 'petal_width'], 예시='품종 분류',
        열={'sepal_length': '꽃받침 길이(cm)', 'sepal_width': '꽃받침 너비(cm)', 'petal_length': '꽃잎 길이(cm)', 'petal_width': '꽃잎 너비(cm)', 'species': '품종'}),
    'wine': dict(분야='화학·식품', 설명='와인 178병의 화학 성분 13가지와 품종', 불러오기=lambda: _사이킷런('load_wine'),
        TARGET='target', FEATURES=['alcohol', 'flavanoids', 'color_intensity', 'proline'], 예시='품종(0·1·2) 분류',
        열={'target': '품종(0·1·2)', 'alcohol': '알코올 도수', 'malic_acid': '사과산', 'flavanoids': '플라보노이드',
           'color_intensity': '색의 진하기', 'hue': '색조', 'proline': '프롤린(아미노산)', 'total_phenols': '페놀 총량'}),
    'breast_cancer': dict(분야='의학·보건', 설명='유방 종양 569개의 세포핵 측정값 30가지와 진단', 불러오기=lambda: _사이킷런('load_breast_cancer'),
        TARGET='target', FEATURES=['mean radius', 'mean texture', 'mean smoothness', 'mean concave points'], 예시='악성(0)·양성(1) 분류',
        열={'target': '진단(0 악성 · 1 양성)', 'mean radius': '세포핵 반지름 평균', 'mean texture': '표면 질감(명암 차이) 평균',
           'mean smoothness': '테두리 매끄러움 평균', 'mean concave points': '테두리의 오목한 곳 수 평균'}),
    'diabetes': dict(분야='의학·약학·간호', 설명='당뇨 환자 442명의 검사값과 1년 뒤 병의 진행 정도', 불러오기=lambda: _사이킷런('load_diabetes'),
        TARGET='target', FEATURES=['bmi', 'bp', 's5', 'age'], 예시='진행 정도(숫자) 회귀',
        열={'target': '1년 뒤 병의 진행 정도(클수록 나빠짐)', 'age': '나이(크기를 맞춘 값)', 'sex': '성별(크기를 맞춘 값)',
           'bmi': '체질량지수(크기를 맞춘 값)', 'bp': '평균 혈압(크기를 맞춘 값)', 's1': '혈액 검사 1 (총콜레스테롤)', 's5': '혈액 검사 5 (중성지방 관련)'}),
    'tips': dict(분야='경영·서비스', 설명='식당 계산서 244장과 손님이 낸 팁', 불러오기=lambda: sns.load_dataset('tips'),
        TARGET='tip', FEATURES=['total_bill', 'size', 'time', 'smoker'], 예시='팁 금액 회귀 · 점심/저녁 분류',
        열={'total_bill': '계산서 금액(달러)', 'tip': '팁(달러)', 'sex': '계산한 사람 성별', 'smoker': '흡연석 여부',
           'day': '요일', 'time': '점심·저녁', 'size': '일행 수'}),
    'diamonds': dict(분야='경제·디자인', 설명='다이아몬드 53,940개의 크기·품질과 가격', 불러오기=lambda: sns.load_dataset('diamonds'),
        TARGET='price', FEATURES=['carat', 'cut', 'color', 'clarity'], 예시='가격 회귀 · 커팅 등급 분류',
        열={'carat': '무게(캐럿)', 'cut': '커팅 등급', 'color': '색 등급(D가 가장 좋음)', 'clarity': '투명도 등급',
           'depth': '깊이 비율(%)', 'table': '윗면 비율(%)', 'price': '가격(달러)', 'x': '길이(mm)', 'y': '너비(mm)', 'z': '높이(mm)'}),
    'mpg': dict(분야='기계·자동차 공학', 설명='자동차 398대의 엔진·무게와 연비', 불러오기=lambda: sns.load_dataset('mpg'),
        TARGET='mpg', FEATURES=['weight', 'horsepower', 'cylinders', 'model_year'], 예시='연비 회귀 · 생산 지역 분류',
        열={'mpg': '연비(마일/갤런)', 'cylinders': '실린더 수', 'displacement': '배기량', 'horsepower': '마력', 'weight': '무게(파운드)',
           'acceleration': '0→60마일 가속 시간(초)', 'model_year': '연식(70 = 1970년)', 'origin': '생산 지역', 'name': '차 이름'}),
    'taxis': dict(분야='교통·도시', 설명='뉴욕 택시 6,433번의 운행 기록', 불러오기=lambda: sns.load_dataset('taxis'),
        TARGET='fare', FEATURES=['distance', 'passengers', 'pickup_borough'], 예시='요금 회귀 · 결제 수단 분류',
        열={'passengers': '승객 수', 'distance': '거리(마일)', 'fare': '요금(달러)', 'tip': '팁', 'tolls': '통행료', 'total': '총액',
           'color': '택시 색', 'payment': '결제 수단', 'pickup_borough': '탄 구역', 'dropoff_borough': '내린 구역'}),
    'titanic': dict(분야='역사·사회', 설명='타이타닉호 승객 891명의 정보와 생존 여부', 불러오기=lambda: sns.load_dataset('titanic'),
        TARGET='survived', FEATURES=['pclass', 'sex', 'age', 'fare'], 예시='생존(0·1) 분류',
        열={'survived': '생존(1)·사망(0)', 'pclass': '객실 등급(1·2·3)', 'sex': '성별', 'age': '나이', 'sibsp': '함께 탄 형제·배우자 수',
           'parch': '함께 탄 부모·자녀 수', 'fare': '요금', 'embarked': '탄 항구'}),
    'geyser': dict(분야='지구과학', 설명='옐로스톤 간헐천의 분출 272번', 불러오기=lambda: sns.load_dataset('geyser'),
        TARGET='kind', FEATURES=['duration', 'waiting'], 예시='분출 종류 분류 · 기다린 시간 회귀',
        열={'duration': '분출 시간(분)', 'waiting': '분출 전에 기다린 시간(분)', 'kind': '분출 종류(long·short)'}),
    'planets': dict(분야='천문·우주', 설명='지금까지 발견된 외계 행성 1,035개', 불러오기=lambda: sns.load_dataset('planets'),
        TARGET='method', FEATURES=['orbital_period', 'distance', 'year', 'number'], 예시='발견 방법 분류',
        열={'method': '발견 방법', 'number': '그 별에 있는 행성 수', 'orbital_period': '공전 주기(일)',
           'mass': '질량(목성 = 1)', 'distance': '지구에서의 거리(파섹)', 'year': '발견 연도'}),
    'healthexp': dict(분야='보건 정책·국제', 설명='6개 나라의 해마다 의료비와 기대수명', 불러오기=lambda: sns.load_dataset('healthexp'),
        TARGET='Life_Expectancy', FEATURES=['Spending_USD', 'Year', 'Country'], 예시='기대수명 회귀',
        열={'Year': '연도', 'Country': '나라', 'Spending_USD': '1인당 의료비(달러)', 'Life_Expectancy': '기대수명(세)'}),
    'digits': dict(분야='컴퓨터·인공지능', 설명='8×8 손글씨 숫자 그림 1,797장', 불러오기=lambda: _사이킷런('load_digits'),
        TARGET='target', FEATURES='pixel', 예시='숫자(0~9) 분류',
        열={'target': '쓴 숫자(0~9)', 'pixel_0_0 ~ pixel_7_7': '8×8 칸마다의 진하기(0~16)'}),
    'car_crashes': dict(분야='법·사회 안전', 설명='미국 51개 주의 교통사고와 그 원인', 불러오기=lambda: sns.load_dataset('car_crashes'),
        TARGET='total', FEATURES=['speeding', 'alcohol', 'not_distracted', 'no_previous'], 예시='사고율 회귀',
        열={'total': '운전자 10억 마일당 사고 사망 운전자 수', 'speeding': '그중 과속', 'alcohol': '그중 음주',
           'not_distracted': '그중 한눈팔지 않음', 'no_previous': '그중 사고 이력 없음', 'ins_premium': '보험료', 'ins_losses': '보험금 지급'}),
}

print(f'{"코드":<14}{"분야":<14}설명 — 예시')
for 코드, d in 데이터_목록.items():
    print(f'{코드:<14}{d["분야"]:<14}{d["설명"]} — {d["예시"]}')
`, ['이 셀은 고치지 않아요. 실행만 하면 고를 수 있는 데이터 15가지가 나와요.', '데이터는 seaborn과 사이킷런에 들어 있는 공개 데이터라 인터넷만 되면 바로 불러올 수 있어요.'],
    "코드            분야            설명 — 예시\npenguins      생명과학·환경       남극 펭귄 344마리의 몸 측정값 — 종 분류 · 몸무게 회귀\niris          생명과학·농업       붓꽃 150송이의 꽃잎·꽃받침 크기 — 품종 분류\nwine          화학·식품         와인 178병의 화학 성분 13가지와 품종 — 품종(0·1·2) 분류\nbreast_cancer 의학·보건         유방 종양 569개의 세포핵 측정값 30가지와 진단 — 악성(0)·양성(1) 분류\n… (모두 15가지)"),
    code(String.raw`
DATASET = 'penguins'   # ✏️ 위 목록의 코드를 적어요 (내 CSV는 'my_csv')
MY_CSV = ''            # ✏️ 'my_csv'일 때만: CSV 주소나 Colab에 올린 파일 이름

if DATASET == 'my_csv':
    df_raw = pd.read_csv(MY_CSV)
    추천 = {}
else:
    추천 = 데이터_목록[DATASET]
    df_raw = 추천['불러오기']()
print(f'📦 {DATASET}: {df_raw.shape[0]}행 × {df_raw.shape[1]}열')
for 열이름, 뜻 in 추천.get('열', {}).items():
    print(f'  · {열이름}: {뜻}')
df_raw.head()
`, ['DATASET에 고른 데이터의 코드를 적고 실행해요. 열마다 무슨 뜻인지도 함께 나와요.'],
    "📦 penguins: 344행 × 7열\n  · species: 종(Adelie·Chinstrap·Gentoo)\n  · island: 사는 섬\n  · bill_length_mm: 부리길이(mm)\n  · bill_depth_mm: 부리깊이(mm)\n  · flipper_length_mm: 날개길이(mm)\n  · body_mass_g: 몸무게(g)\n  · sex: 성별\n  species     island  bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g     sex\n0  Adelie  Torgersen            39.1           18.7              181.0       3750.0    Male\n1  Adelie  Torgersen            39.5           17.4              186.0       3800.0  Female\n…"),
    md(String.raw`
📝 **1-1 답** — 이 데이터를 고른 까닭을 **내 진로(관심 분야)**와 이어서 2~3문장으로 적어요.
> (예: 나는 ○○ 쪽으로 진학하고 싶은데, 이 데이터로 ~을 미리 알 수 있으면 ~에 도움이 될 것 같아서 골랐다.)

- 고른 데이터(코드):
- 고른 까닭:
`),
    md(String.raw`
### 1-2 해결할 문제 정의
📝 **1-2 답** — 빈칸을 채워요. 위의 열 설명을 보고, **이 데이터로 정말 풀 수 있는 문제**로 정해요.

- **사용 대상** (누가 쓰나요?):
- **상황** (언제 필요한가요?):
- **해결할 문제** (무엇을 알고 싶은가요?):
- **필요한 까닭** (이 프로그램이 없으면 무엇이 불편한가요?):
`),
    md(String.raw`
### 1-3 개발 목적과 기능 설계
먼저 아래 셀에서 맞힐 열(TARGET)과 입력 열(FEATURES)을 정하고 실행해요. 추천값이 들어 있지만, 내 문제에 맞게 바꿔도 돼요.
`),
    code(String.raw`
TARGET = 추천.get('TARGET', '')       # ✏️ 맞힐 열(정답 y) — 예: TARGET = 'body_mass_g'
FEATURES = 추천.get('FEATURES', [])   # ✏️ 입력 열(X) 리스트 — 예: FEATURES = ['bill_length_mm', 'flipper_length_mm']
PURPOSE = None                        # ✏️ 자동 판단이 틀리면 '분류' 또는 '회귀'로 적어요

if FEATURES == 'pixel':
    FEATURES = [c for c in df_raw.columns if c.startswith('pixel')]
y_raw = df_raw[TARGET]
글자정답 = not pd.api.types.is_numeric_dtype(y_raw) or pd.api.types.is_bool_dtype(y_raw)
목적 = PURPOSE or ('분류' if 글자정답 or y_raw.nunique() <= 10 else '회귀')
print(f'🎯 맞힐 것(TARGET): {TARGET} — 서로 다른 값 {y_raw.nunique()}가지 → 학습 목적: {목적}')
if 목적 == '분류':
    print('   값마다 개수:', {str(k): int(v) for k, v in y_raw.value_counts().items()})
else:
    print(f'   범위: {y_raw.min()} ~ {y_raw.max()}, 평균 {y_raw.mean():.2f}')
print(f'🧩 입력(FEATURES) {len(FEATURES)}개:')
for f in FEATURES[:12]:
    종류 = '숫자' if pd.api.types.is_numeric_dtype(df_raw[f]) else '글자'
    print(f'   · {f} ({종류}, 빈칸 {df_raw[f].isnull().sum()}개)')
if len(FEATURES) > 12:
    print(f'   … 모두 {len(FEATURES)}개')
`, ['TARGET은 맞히고 싶은 열 하나, FEATURES는 그것을 맞히는 데 쓸 열들이에요.', '정답이 글자이거나 값의 종류가 10가지 이하이면 분류, 숫자이면 회귀로 판단해요. 틀리면 PURPOSE에 직접 적어요.'],
    "🎯 맞힐 것(TARGET): species — 서로 다른 값 3가지 → 학습 목적: 분류\n   값마다 개수: {'Adelie': 152, 'Gentoo': 124, 'Chinstrap': 68}\n🧩 입력(FEATURES) 4개:\n   · bill_length_mm (숫자, 빈칸 2개)\n   · bill_depth_mm (숫자, 빈칸 2개)\n   · flipper_length_mm (숫자, 빈칸 2개)\n   · body_mass_g (숫자, 빈칸 2개)"),
    md(String.raw`
📝 **1-3 답** — 위 결과를 보고 채워요.

- **맞힐 것(정답 y)**:
- **입력(X)으로 쓸 열과 고른 까닭**: (왜 이 열들이 정답과 관계가 있을까요?)
- **학습 목적(분류·회귀)과 그렇게 정한 까닭**:
- **기능 한 줄 설명**: "사용자가 ______를 넣으면 ______를 알려 주는 프로그램"
- **성공 기준(숫자로)**: (예: 정확도 0.85 이상 / 평균 오차 ___ 이하) — 그렇게 정한 까닭:
`),
    md(String.raw`
### 1-4 개발 계획
📝 **1-4 답** — 표를 내 계획으로 고쳐요. 수업이 끝날 때마다 ☐를 ☑로 바꿔요.

| 차시 | 할 일 | 결과물 | 확인 |
|---|---|---|---|
| 1 | 데이터 고르기, 문제 정의 (①) | 1-1 ~ 1-3 답 | ☐ |
| 2 | 데이터 살피기와 전처리 (② 2-1 ~ 2-2) | 전처리한 표 | ☐ |
| 3 | 나누기·학습·작동 확인 (② 2-3 ~ 2-5) | 첫 점수, 새 입력 예측 | ☐ |
| 4 | 성능 점검과 실험 (③) | 실험 기록 3개 | ☐ |
| 5 | 결과 표현과 설명 (④), 제출 | 제출 요약 | ☐ |
`),

    md(String.raw`
---
## ② 데이터 준비 및 인공지능 기능 구현 (30점)

### 2-1 데이터 살피기 — 결측치·이상치
`),
    code(String.raw`
!pip install -q koreanize-matplotlib
try:
    import koreanize_matplotlib  # 그래프에 한글 글꼴을 입혀 줘요
except ImportError:
    print('한글 글꼴을 불러오지 못했어요. 그래프 글자가 네모로 보일 수 있어요.')
import matplotlib.pyplot as plt
`, ['그래프의 한글이 깨지지 않도록 글꼴 도구를 설치해요. 처음 한 번은 1~2분쯤 걸릴 수 있어요.']),
    code(String.raw`
숫자열 = [f for f in FEATURES if pd.api.types.is_numeric_dtype(df_raw[f]) and not pd.api.types.is_bool_dtype(df_raw[f])]
print('🔍 빈칸(결측치) 개수')
print(df_raw[FEATURES + [TARGET]].isnull().sum().to_string())
print('\n🔍 이상치 개수 (상자그림 울타리 밖)')
for c in 숫자열:
    q1, q3 = df_raw[c].quantile([0.25, 0.75])
    낮은, 높은 = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    print(f'   {c}: {int(((df_raw[c] < 낮은) | (df_raw[c] > 높은)).sum())}개  (울타리 {낮은:.2f} ~ {높은:.2f})')
print('\n겹친 행:', int(df_raw.duplicated().sum()))
if 숫자열:
    보일열 = 숫자열[:8]
    df_raw[보일열].plot.box(subplots=True, layout=(1, len(보일열)), figsize=(2.4 * len(보일열), 3))
    plt.tight_layout(); plt.show()
`, ['열마다 빈칸이 몇 개인지, 상자그림의 울타리(Q1 − 1.5×IQR ~ Q3 + 1.5×IQR) 밖에 있는 값이 몇 개인지 세요.', '숫자 열은 8개까지 상자그림을 그려요.'],
    "🔍 빈칸(결측치) 개수\nbill_length_mm       2\nbill_depth_mm        2\nflipper_length_mm    2\nbody_mass_g          2\nspecies              0\n\n🔍 이상치 개수 (상자그림 울타리 밖)\n   bill_length_mm: 0개  (울타리 25.31 ~ 62.41)\n   bill_depth_mm: 0개  (울타리 10.95 ~ 23.35)\n   flipper_length_mm: 0개  (울타리 155.50 ~ 247.50)\n   body_mass_g: 0개  (울타리 1750.00 ~ 6550.00)\n\n겹친 행: 0"),
    md(String.raw`
📝 **2-1 답** — 내 결과의 숫자로 적어요.
- 결측치가 있는 열과 개수:
- 이상치가 있는 열과 개수, 그 값이 **측정 실수**일지 **진짜 드문 값**일지에 대한 내 생각:
`),
    md(String.raw`
### 2-2 전처리 — 내가 고르기
`),
    code(String.raw`
MISSING = '평균'     # ✏️ '평균'(숫자는 평균, 글자는 가장 많은 값으로 채우기) · '지우기'(빈칸 있는 행 지우기)
OUTLIER = '그대로'   # ✏️ '그대로' · '지우기'(울타리 밖 행 지우기)
SCALE = False        # ✏️ True면 StandardScaler로 크기를 맞춰요 (k-최근접 이웃에 특히 중요)

def 전처리(df, features, target):
    d = df[features + [target]].copy()
    d = d.dropna(subset=[target])                 # 정답이 빈 행은 배울 수 없어요
    d = d.dropna(subset=features, how='all')      # 입력이 모두 빈 행도 배울 것이 없어요
    d = d.drop_duplicates()
    숫자 = [c for c in features if pd.api.types.is_numeric_dtype(d[c])]
    글자 = [c for c in features if c not in 숫자]
    if OUTLIER == '지우기':
        for c in 숫자:
            if pd.api.types.is_bool_dtype(d[c]):
                continue
            q1, q3 = d[c].quantile([0.25, 0.75])
            d = d[d[c].isnull() | d[c].between(q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1))]
    if MISSING == '지우기':
        d = d.dropna(subset=features)
    else:
        for c in 숫자:
            d[c] = d[c].fillna(d[c].mean())
        for c in 글자:
            if d[c].notna().any():
                d[c] = d[c].fillna(d[c].mode()[0])
    X = pd.get_dummies(d[features], columns=글자, dtype=float).astype(float)   # 글자 → 숫자(원-핫)
    y = d[target].astype(str) if 목적 == '분류' else d[target].astype(float)
    return X, y

X, y = 전처리(df_raw, FEATURES, TARGET)
print(f'🧹 전처리 전 {len(df_raw)}행 → 전처리 뒤 {len(X)}행, 입력 열 {X.shape[1]}개')
print(f'   결측치: {MISSING} · 이상치: {OUTLIER} · 정규화: {SCALE}')
X.head()
`, ['결측치·이상치를 어떻게 처리할지, 크기를 맞출지(정규화) 직접 골라요. 고른 까닭을 2-2 답에 적어요.', '글자 열(섬, 성별 등)은 원-핫 인코딩으로 0과 1의 열로 바꿔요.'],
    "🧹 전처리 전 344행 → 전처리 뒤 342행, 입력 열 4개\n   결측치: 평균 · 이상치: 그대로 · 정규화: False\n   bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g\n0            39.1           18.7              181.0       3750.0\n1            39.5           17.4              186.0       3800.0\n2            40.3           18.0              195.0       3250.0\n4            36.7           19.3              193.0       3450.0\n…"),
    md(String.raw`
📝 **2-2 답**
- 고른 결측치 처리와 까닭:
- 고른 이상치 처리와 까닭:
- 정규화를 했나요? 까닭:
- 전처리 전후 행 수(숫자):
`),
    md(String.raw`
### 2-3 나누기와 학습
나만의 조건의 SEED와 TEST_SIZE로 나누고, 알고리즘을 골라 학습시켜요.
`),
    code(String.raw`
ALGORITHM = 'tree'   # ✏️ 'knn'(k-최근접 이웃) · 'tree'(의사결정 트리) · 'linear'(선형 회귀 — 회귀만)
PARAM = None         # ✏️ 하이퍼파라미터 — knn이면 k(예: 5), tree면 max_depth(예: 3), None이면 기본값

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import accuracy_score, mean_absolute_error, mean_squared_error

지표 = '정확도' if 목적 == '분류' else '평균 절대 오차(MAE)'

def 모델_만들기(알고리즘, 값=None):
    if 알고리즘 == 'knn':
        k = 값 or 5
        return KNeighborsClassifier(n_neighbors=k) if 목적 == '분류' else KNeighborsRegressor(n_neighbors=k)
    if 알고리즘 == 'tree':
        깊이 = 값 or 3
        틀 = DecisionTreeClassifier if 목적 == '분류' else DecisionTreeRegressor
        return 틀(max_depth=깊이, random_state=SEED)
    if 알고리즘 == 'linear':
        if 목적 == '분류':
            raise ValueError('선형 회귀는 숫자를 맞히는 회귀에만 써요. knn이나 tree를 골라요.')
        return LinearRegression()
    raise ValueError("ALGORITHM은 'knn', 'tree', 'linear' 가운데 하나예요.")

def 학습하기(속성=None, 알고리즘=None, 값=None, 정규화=None, 훈련비율=1.0):
    열 = [c for c in X.columns if 속성 is None or any(c == f or c.startswith(f + '_') for f in 속성)]
    층 = y if 목적 == '분류' and y.value_counts().min() >= 2 else None
    Xtr, Xte, ytr, yte = train_test_split(X[열], y, test_size=TEST_SIZE, random_state=SEED, stratify=층)
    if 훈련비율 < 1.0:
        Xtr = Xtr.sample(frac=훈련비율, random_state=SEED)
        ytr = ytr.loc[Xtr.index]
    맞춤 = None
    if SCALE if 정규화 is None else 정규화:
        맞춤 = StandardScaler().fit(Xtr)
        Xtr = pd.DataFrame(맞춤.transform(Xtr), index=Xtr.index, columns=열)
        Xte = pd.DataFrame(맞춤.transform(Xte), index=Xte.index, columns=열)
    모델 = 모델_만들기(알고리즘 or ALGORITHM, PARAM if 값 is None else 값).fit(Xtr, ytr)
    예측 = 모델.predict(Xte)
    점수 = accuracy_score(yte, 예측) if 목적 == '분류' else mean_absolute_error(yte, 예측)
    return dict(model=모델, scaler=맞춤, cols=열, X_train=Xtr, X_test=Xte, y_train=ytr, y_test=yte, pred=예측, 점수=점수)

결과 = 학습하기()
model, X_train, X_test, y_train, y_test = 결과['model'], 결과['X_train'], 결과['X_test'], 결과['y_train'], 결과['y_test']
첫점수 = 결과['점수']
print(f'✂️ 훈련 {len(X_train)}행 · 테스트 {len(X_test)}행 (SEED {SEED}, TEST_SIZE {TEST_SIZE})')
print(f'🤖 {ALGORITHM} 학습 완료 — {model}')
if 목적 == '분류':
    print(f'✅ 테스트 정확도: {첫점수:.3f} ({len(y_test)}개 중 {int(round(첫점수 * len(y_test)))}개 맞힘)')
else:
    print(f'✅ 테스트 평균 절대 오차(MAE): {첫점수:.3f} — 예측이 실제와 평균 {첫점수:.3f}만큼 달라요')
`, ['ALGORITHM에 쓸 알고리즘을 적어요. 5단원에서 배운 k-최근접 이웃·의사결정 트리·선형 회귀 가운데 골라요.', '나만의 조건의 SEED·TEST_SIZE로 나누므로 친구와 숫자가 달라요.', '학습하기() 함수는 ③의 실험에서 다시 써요.'],
    "✂️ 훈련 256행 · 테스트 86행 (SEED 7490, TEST_SIZE 0.25)\n🤖 tree 학습 완료 — DecisionTreeClassifier(max_depth=3, random_state=7490)\n✅ 테스트 정확도: 0.942 (86개 중 81개 맞힘)"),
    md(String.raw`
### 2-4 기능 작동 확인 — 새 입력 넣어 보기
**1-2의 사용 대상**이 실제로 넣을 만한 값을 직접 만들어 넣어 봐요.
`),
    code(String.raw`
새_입력 = {}   # ✏️ 예: {'bill_length_mm': 45, 'bill_depth_mm': 17, 'flipper_length_mm': 200, 'body_mass_g': 4200}
               #    비워 두면 테스트 데이터의 첫 행 값을 넣어 봐요

def 예측하기(입력):
    빠진 = [f for f in FEATURES if f not in 입력]
    if 빠진:
        print('⚠️ 이 열의 값도 넣어요:', 빠진)
        return None
    행 = pd.get_dummies(pd.DataFrame([입력])[FEATURES], dtype=float).reindex(columns=결과['cols'], fill_value=0.0)
    if 결과['scaler'] is not None:
        행 = pd.DataFrame(결과['scaler'].transform(행), columns=결과['cols'])
    return model.predict(행)[0]

직접_넣음 = bool(새_입력)
if not 직접_넣음:
    첫행 = next(i for i in X_test.index if df_raw.loc[i, FEATURES].notna().all())
    새_입력 = df_raw.loc[첫행, FEATURES].to_dict()
print('넣은 값:', 새_입력)
print('🤖 예측:', 예측하기(새_입력))
if not 직접_넣음:
    print('✏️ 새_입력에 사용 대상이 넣을 값을 직접 적고 다시 실행해요.')
`, ['새_입력에 열 이름과 값을 적으면, 학습한 모델이 그 값으로 예측해요. 내 프로그램이 실제로 작동하는지 확인하는 단계예요.'],
    "넣은 값: {'bill_length_mm': 45.0, 'bill_depth_mm': 17.0, 'flipper_length_mm': 200.0, 'body_mass_g': 4200.0}\n🤖 예측: Chinstrap"),
    md(String.raw`
📝 **2-4 답**
- 넣은 값과 예측 결과:
- 이 예측이 그럴듯한가요? 데이터(평균값, 비슷한 행 등)를 근거로 판단해요:

📝 **2-5 답** — 고른 알고리즘(ALGORITHM)과 그 까닭. 수업에서 배운 원리(가까운 이웃의 투표 · 예/아니오 질문 · 직선)와 **내 데이터의 특징**을 이어서 적어요.
`),

    md(String.raw`
---
## ③ 성능 점검 및 개선 방안 (25점)

### 3-1 성능 재기 — "찍기"보다 얼마나 나은가?
`),
    code(String.raw`
pred = 결과['pred']
if 목적 == '분류':
    찍기값 = y_train.mode()[0]
    찍기 = (y_test == 찍기값).mean()
    print(f'📏 정확도 {첫점수:.3f} · 가장 많은 값({찍기값})으로만 찍으면 {찍기:.3f}')
    print('\n혼동 행렬 (줄 = 실제, 칸 = 예측)')
    print(pd.crosstab(y_test, pred, rownames=['실제'], colnames=['예측']).to_string())
else:
    찍기 = mean_absolute_error(y_test, np.full(len(y_test), y_train.mean()))
    print(f'📏 평균 절대 오차(MAE) {첫점수:.3f} · 오차 제곱 평균(MSE) {mean_squared_error(y_test, pred):.3f}')
    print(f'   훈련 데이터의 평균({y_train.mean():.2f})으로만 찍으면 MAE {찍기:.3f}')
`, ['분류는 정확도와 혼동 행렬, 회귀는 평균 절대 오차(MAE)와 오차 제곱 평균(MSE)을 재요.', '아무것도 배우지 않고 "찍기"만 했을 때와 견주면 모델이 정말 배웠는지 알 수 있어요.'],
    "📏 정확도 0.942 · 가장 많은 값(Adelie)으로만 찍으면 0.442\n\n혼동 행렬 (줄 = 실제, 칸 = 예측)\n예측         Adelie  Chinstrap  Gentoo\n실제\nAdelie         36          2       0\nChinstrap       2         15       0\nGentoo          0          1      30"),
    md(String.raw`
📝 **3-1 답**
- 내 모델의 성능(숫자):
- "찍기"보다 얼마나 나은가요?(숫자):
- 1-3에서 정한 **성공 기준**을 넘었나요?:
- (분류) 혼동 행렬에서 가장 많이 헷갈린 짝:
`),
    md(String.raw`
### 3-2 틀린 예 살펴보기
`),
    code(String.raw`
원래값 = df_raw.loc[X_test.index, FEATURES]
틀린표 = 원래값.assign(실제=y_test.values, 예측=pred)
if 목적 == '분류':
    틀린표 = 틀린표[틀린표['실제'] != 틀린표['예측']]
    print(f'❌ 틀린 예 {len(틀린표)}개 (처음 10개)')
else:
    틀린표 = 틀린표.assign(오차=(틀린표['예측'] - 틀린표['실제']).abs()).sort_values('오차', ascending=False)
    print('❌ 오차가 큰 예 10개')
print(틀린표.head(10).to_string())
if 숫자열:
    print('\n📊 비교용 — 정답별 숫자 열 평균' if 목적 == '분류' else '\n📊 비교용 — 숫자 열 평균')
    print((df_raw.groupby(TARGET)[숫자열].mean() if 목적 == '분류' else df_raw[숫자열].mean()).round(2).to_string())
`, ['틀린 예(회귀는 오차가 큰 예)의 원래 값과 실제·예측을 보여 줘요. 맨 왼쪽 숫자가 행 번호예요.', '아래의 평균과 견주면 왜 틀렸는지 근거를 찾을 수 있어요.'],
    "❌ 틀린 예 5개 (처음 10개)\n     bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g         실제         예측\n318            48.4           14.4              203.0       4625.0     Gentoo  Chinstrap\n184            42.5           16.7              187.0       3350.0  Chinstrap     Adelie\n172            42.4           17.3              181.0       3600.0  Chinstrap     Adelie\n109            43.2           19.0              197.0       4775.0     Adelie  Chinstrap\n111            45.6           20.3              191.0       4600.0     Adelie  Chinstrap\n\n📊 비교용 — 정답별 숫자 열 평균\n           bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g\nspecies\nAdelie              38.79          18.35             189.95      3700.66\nChinstrap           48.83          18.42             195.82      3733.09\nGentoo              47.50          14.98             217.19      5076.02"),
    md(String.raw`
📝 **3-2 답** — 틀린 예 2개를 골라 **행 번호**를 적고, 왜 틀렸을지 **값을 근거로** 설명해요.
- 행 번호 ___ : (예: 부리길이 46.1로 턱끈 평균 48.8보다 젠투 평균 47.5에 더 가까워서 …)
- 행 번호 ___ :
`),
    md(String.raw`
### 3-3 실험 — 가설 → 결과 → 해석 (3개 이상)
실험은 **실행하기 전에 가설(어떻게 될지 예상)부터** 적어요. 가설이 비어 있으면 실행되지 않아요.
첫 실험은 **나만의 조건의 "꼭 할 실험"**이어야 해요. 나머지 두 개는 자유롭게 골라요.

| 바꿀 것 | 실험() 안에 적는 법 |
|---|---|
| 입력 속성 빼기·바꾸기 | \`속성=['bill_length_mm', 'flipper_length_mm']\` |
| 하이퍼파라미터 | \`값=7\` (knn의 k, tree의 max_depth) |
| 정규화 | \`정규화=True\` 또는 \`정규화=False\` |
| 훈련 데이터 양 | \`훈련비율=0.5\` |
| 알고리즘 | \`알고리즘='knn'\` |
`),
    code(String.raw`
실험기록 = []

def 실험(이름, 가설, **바꿀것):
    if not str(가설).strip():
        print('⚠️ 실행하기 전에 가설(어떻게 될지 예상)을 먼저 적어요.')
        return
    r = 학습하기(**바꿀것)
    차이 = r['점수'] - 첫점수
    좋아짐 = 차이 > 0 if 목적 == '분류' else 차이 < 0
    판정 = '같음' if abs(차이) < 1e-12 else ('좋아짐' if 좋아짐 else '나빠짐')
    실험기록.append({'번호': len(실험기록) + 1, '이름': 이름, '가설': 가설,
                   '바꾼 것': ', '.join(f'{k}={v}' for k, v in 바꿀것.items()) or '없음',
                   '점수': round(r['점수'], 4), '처음과 차이': round(차이, 4), '판정': 판정})
    print(f'🧪 실험 {len(실험기록)} · {이름}: {지표} {r["점수"]:.3f} (처음 {첫점수:.3f} → {판정})')

print('실험 준비 완료. 꼭 할 실험:', 조건['실험과제'])
`, ['실험(이름, 가설, 바꿀 것)으로 한 가지만 바꿔 다시 학습하고, 처음 점수와 견줘요.', '실험할 때마다 실험기록에 저절로 쌓여요. 같은 실험을 두 번 실행하면 두 번 쌓이니 조심해요.'],
    "실험 준비 완료. 꼭 할 실험: 정규화(StandardScaler)를 하기 전과 한 뒤의 성능 비교하기"),
    code(String.raw`
# 실험 1 — 나만의 조건의 "꼭 할 실험" ✏️ 가설부터 적고, 알맞은 줄 맨 앞의 #을 지운 뒤 실행해요
가설1 = ''   # ✏️ 예: '크기를 맞추면 몸무게(숫자가 큼)가 거리를 혼자 정하지 못해 정확도가 오를 것이다'

# 실험('속성 하나 빼기', 가설1, 속성=FEATURES[1:])
# 실험('하이퍼파라미터 1', 가설1, 값=1); 실험('하이퍼파라미터 2', 가설1, 값=5); 실험('하이퍼파라미터 3', 가설1, 값=9)
# 실험('정규화 하기', 가설1, 정규화=True)
# 실험('훈련 데이터 절반', 가설1, 훈련비율=0.5)
# 실험('다른 알고리즘', 가설1, 알고리즘='knn')
`, ['나만의 조건에 나온 실험에 맞는 줄 하나의 #을 지우고 실행해요. 하이퍼파라미터 실험은 세 값을 한 번에 돌려요.'],
    '🧪 실험 1 · 정규화 하기: 정확도 0.942 (처음 0.942 → 같음)'),
    code(String.raw`
# 실험 2 — 내가 고른 실험 ✏️
가설2 = ''   # ✏️
# 실험('내 실험 2', 가설2, 속성=['✏️ 열 이름', '✏️ 열 이름'])
`, ['궁금한 것을 하나 골라 가설을 세우고 실험해요.'],
    '🧪 실험 2 · 부리깊이 빼기: 정확도 0.919 (처음 0.942 → 나빠짐)'),
    code(String.raw`
# 실험 3 — 내가 고른 실험 ✏️
가설3 = ''   # ✏️
# 실험('내 실험 3', 가설3, 값=5)
`, ['앞 실험의 결과를 보고, 더 좋아질 방법을 하나 더 시험해 봐요.'],
    '🧪 실험 3 · max_depth 5: 정확도 0.977 (처음 0.942 → 좋아짐)'),
    code(String.raw`
실험표 = pd.DataFrame(실험기록)
print(f'실험 {len(실험표)}개 · 처음 {지표} {첫점수:.3f}')
실험표
`, ['지금까지 한 실험을 표로 모아 봐요. 이 표를 보고 3-3 답을 적어요.'],
    "실험 3개 · 처음 정확도 0.942\n   번호           이름                         가설               바꾼 것      점수  처음과 차이   판정\n0   1       정규화 하기  크기를 맞추면 … 오를 것이다          정규화=True  0.9419  0.0000   같음\n1   2      부리깊이 빼기  부리깊이를 빼면 … 떨어질 것이다  속성=[…3개]  0.9186 -0.0233  나빠짐\n2   3  max_depth 5  질문을 늘리면 … 잘 가릴 것이다            값=5  0.9767  0.0349  좋아짐"),
    md(String.raw`
📝 **3-3 답** — 실험마다 한 줄씩. **예상과 결과가 다르면 그 까닭**을 꼭 적어요(다른 결과가 오히려 좋은 분석거리예요).

| 번호 | 가설 (실행 전 예상) | 바꾼 것 | 결과 (숫자) | 예상과 같았나? 왜 그렇게 됐을까? |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
`),
    md(String.raw`
### 3-4 한계와 개선 방안
📝 **3-4 답** — 3-1 ~ 3-3의 **숫자를 근거로** 적어요. 개선 방안은 "무엇을 · 어떻게 · 기대 효과"까지.

- **한계 1 (데이터)**: → 개선 방안:
- **한계 2 (모델·알고리즘)**: → 개선 방안:
- **한계 3 (윤리·공정성)**: 데이터의 치우침(편향), 개인정보, 이 프로그램이 틀렸을 때 누가 어떤 피해를 볼 수 있는지 → 개선 방안:
`),

    md(String.raw`
---
## ④ 결과 표현 및 개발 과정 설명 (15점)

### 4-1 결과를 그래프로
`),
    code(String.raw`
그림, 칸 = plt.subplots(1, 2, figsize=(11, 4))
if 목적 == '분류':
    표 = pd.crosstab(y_test, pred)
    칸[0].imshow(표.values, cmap='Blues')
    칸[0].set_xticks(range(len(표.columns))); 칸[0].set_xticklabels(표.columns, rotation=45)
    칸[0].set_yticks(range(len(표.index))); 칸[0].set_yticklabels(표.index)
    for i in range(표.shape[0]):
        for j in range(표.shape[1]):
            칸[0].text(j, i, 표.values[i, j], ha='center', va='center')
    칸[0].set_title(f'혼동 행렬 (정확도 {첫점수:.3f})'); 칸[0].set_xlabel('예측'); 칸[0].set_ylabel('실제')
else:
    칸[0].scatter(y_test, pred, alpha=0.6)
    끝 = [min(y_test.min(), pred.min()), max(y_test.max(), pred.max())]
    칸[0].plot(끝, 끝, 'r--', label='예측 = 실제')
    칸[0].set_title(f'실제와 예측 (MAE {첫점수:.3f})'); 칸[0].set_xlabel('실제'); 칸[0].set_ylabel('예측'); 칸[0].legend()
이름들 = ['처음'] + [f'실험{e["번호"]}' for e in 실험기록]
점수들 = [첫점수] + [e['점수'] for e in 실험기록]
칸[1].bar(이름들, 점수들, color=['gray'] + ['tab:blue'] * len(실험기록))
칸[1].set_title(f'실험별 {지표}'); 칸[1].set_ylabel(지표)
plt.tight_layout(); plt.show()
`, ['왼쪽은 모델의 결과(분류는 혼동 행렬, 회귀는 실제와 예측), 오른쪽은 실험마다의 점수 막대예요.']),
    md(String.raw`
📝 **4-1 답** — 위 그래프 두 개가 각각 무엇을 보여 주는지, 가장 눈에 띄는 점을 숫자와 함께 2문장씩 적어요.
`),
    md(String.raw`
### 4-2 확인 행으로 원리 설명 — 내 모델은 왜 그렇게 답했을까?
나만의 조건의 **확인 행**을 내 모델이 어떻게 예측했는지 한 단계씩 보여 줘요.
`),
    code(String.raw`
i = 조건['확인행']
행 = X_test.iloc[[i]]
print(f'🔎 확인 행: 테스트 {i}번째 (행 번호 {X_test.index[i]})')
print('   원래 값:', df_raw.loc[X_test.index[i], FEATURES].to_dict())
print(f'   실제: {y_test.iloc[i]} · 예측: {pred[i]}')
if 결과['scaler'] is not None:
    print('   (정규화한 값으로 계산해요)')
if isinstance(model, (KNeighborsClassifier, KNeighborsRegressor)):
    거리, 번호 = model.kneighbors(행)
    print(f'\n📍 가장 가까운 이웃 {len(번호[0])}개')
    for d, j in zip(거리[0], 번호[0]):
        print(f'   행 {y_train.index[j]}: 거리 {d:.3f}, 정답 {y_train.iloc[j]}')
    이웃 = y_train.iloc[번호[0]]
    print('   → 투표 결과:', {str(k): int(v) for k, v in 이웃.value_counts().items()} if 목적 == '분류' else f'평균 {이웃.mean():.3f}')
elif isinstance(model, (DecisionTreeClassifier, DecisionTreeRegressor)):
    t = model.tree_
    print('\n🌳 지나간 질문')
    for 노드 in model.decision_path(행).indices:
        if t.children_left[노드] == -1:
            print(f'   → 잎에 닿음: 예측 {pred[i]}')
        else:
            열이름 = 결과['cols'][t.feature[노드]]
            기준, 값 = t.threshold[노드], 행.iloc[0][열이름]
            print(f'   {열이름} ≤ {기준:.3f}? 값 {값:.3f} → {"예" if 값 <= 기준 else "아니오"}')
else:
    print('\n📈 직선(평면) 식: 예측 = 절편 + Σ 기울기 × 값')
    합 = model.intercept_
    print(f'   절편 {model.intercept_:.3f}')
    for 열이름, w in zip(결과['cols'], model.coef_):
        값 = 행.iloc[0][열이름]
        합 += w * 값
        print(f'   + {w:.3f} × {열이름}({값:.3f}) = {w * 값:.3f}')
    print(f'   = {합:.3f}')
`, ['k-최근접 이웃이면 가까운 이웃과 투표를, 의사결정 트리면 지나간 질문을, 선형 회귀면 식에 값을 넣는 과정을 보여 줘요.'],
    "🔎 확인 행: 테스트 3번째 (행 번호 33)\n   원래 값: {'bill_length_mm': 40.9, 'bill_depth_mm': 18.9, 'flipper_length_mm': 184.0, 'body_mass_g': 3900.0}\n   실제: Adelie · 예측: Adelie\n\n🌳 지나간 질문\n   flipper_length_mm ≤ 206.000? 값 184.000 → 예\n   bill_length_mm ≤ 43.150? 값 40.900 → 예\n   bill_length_mm ≤ 42.400? 값 40.900 → 예\n   → 잎에 닿음: 예측 Adelie"),
    md(String.raw`
📝 **4-2 답** — 확인 행에서 내 모델이 왜 그 답을 냈는지, 위 출력의 **숫자를 써서** 설명해요. 알고리즘의 원리(이웃의 투표 · 질문을 따라 내려가기 · 직선 식)가 드러나게 적어요.
`),
    md(String.raw`
### 4-3 개발 과정 돌아보기
📝 **4-3 답**
- 가장 어려웠던 순간과 해결한 방법:
- 처음 계획(1-4)과 달라진 점과 그 까닭:
- 다시 한다면 바꿀 것:
`),
    md(String.raw`
### 4-4 🤖 AI 활용 기록
📝 **4-4 답** — 인공지능(챗봇 등)을 쓴 만큼 줄을 늘려요. 쓰지 않았다면 "쓰지 않음"이라고 적어요.

| 질문 번호 | AI에게 물은 것 (그대로 붙여 넣기) | AI 답을 어떻게 썼나 (그대로 · 고쳐서 · 안 씀) | 내가 확인한 방법 (실행 결과 · 자료 · 선생님) |
|---|---|---|---|
|  |  |  |  |

- **AI가 틀렸거나 내 데이터에 맞지 않았던 경우 한 가지**와 내가 고친 방법:
`),
    md(String.raw`
---
## ✅ 제출 요약
**런타임 → 모두 실행**을 한 번 한 뒤 아래 셀의 결과를 확인해요. 요약코드와 지문은 선생님이 결과를 확인할 때 써요. **손으로 고치지 마요.**
`),
    code(String.raw`
요약 = {
    '학번': str(학번).strip(), '이름': 이름, 'DATASET': DATASET, 'TARGET': TARGET,
    'FEATURES': FEATURES if len(FEATURES) <= 12 else f'{len(FEATURES)}개', '목적': 목적,
    'ALGORITHM': ALGORITHM, 'PARAM': PARAM, 'SCALE': SCALE, 'MISSING': MISSING, 'OUTLIER': OUTLIER,
    'SEED': SEED, 'TEST_SIZE': TEST_SIZE, '행수': int(len(X)), '점수': round(float(첫점수), 4),
    '실험': [[e['이름'], e['바꾼 것'], e['점수']] for e in 실험기록],
}
print('📋 제출 요약')
print(f'  {요약["학번"]} {이름} · 데이터 {DATASET} · {TARGET} {목적} · {ALGORITHM}')
print(f'  처음 {지표} {첫점수:.4f} · 실험 {len(실험기록)}개')
for e in 실험기록:
    print(f'    {e["번호"]}. {e["이름"]} ({e["바꾼 것"]}) → {e["점수"]} ({e["판정"]})')
print('\n요약코드:', json.dumps(요약, ensure_ascii=False, sort_keys=True))
print('🔏 지문:', 지문_만들기(요약))
빠진것 = []
if not 요약['학번']:
    빠진것.append('학번')
if len(실험기록) < 3:
    빠진것.append(f'실험 {3 - len(실험기록)}개 더')
if not 직접_넣음:
    빠진것.append('2-4 새_입력 직접 넣기')
print('\n' + ('⚠️ 아직 남은 것: ' + ', '.join(빠진것) if 빠진것 else '🎉 코드 부분은 모두 했어요. 📝 답 칸을 빠짐없이 채웠는지 확인해요.'))
`, ['내 프로젝트의 핵심 설정과 결과를 한눈에 모아요. 요약코드와 지문은 다시 실행하면 똑같이 나와야 해요.'],
    "📋 제출 요약\n  10101 김펭귄 · 데이터 penguins · species 분류 · tree\n  처음 정확도 0.9419 · 실험 3개\n    1. 정규화 하기 (정규화=True) → 0.9419 (같음)\n    2. 부리깊이 빼기 (속성=[…]) → 0.9186 (나빠짐)\n    3. max_depth 5 (값=5) → 0.9767 (좋아짐)\n\n요약코드: {\"ALGORITHM\": \"tree\", \"DATASET\": \"penguins\", … \"SEED\": 7490, … \"학번\": \"10101\", \"행수\": 342}\n🔏 지문: dc5d6f00\n\n🎉 코드 부분은 모두 했어요. 📝 답 칸을 빠짐없이 채웠는지 확인해요."),
  ],
};

/* ══════════════════ 교사용 ══════════════════ */

export const ASSESS_TEACHER = {
  id: '11_teacher_grading',
  title: '🧑‍🏫 수행평가 채점 도우미 (교사용)',
  intro: '학번별 나만의 조건을 미리 뽑아 두고, 학생이 낸 요약코드의 지문을 확인하고, 평가 요소별 점수를 더해 채점표 CSV로 내려받아요.',
  check: '학번별 조건표 · 지문 확인 · 채점표 CSV',
  cells: [
    md(String.raw`
# 🧑‍🏫 수행평가 채점 도우미 (교사용)

학생용 노트북(10_assessment_project)과 **같은 함수**로 나만의 조건을 만들어요. 자세한 채점 기준과 구술 확인 질문은 docs/ASSESSMENT.md에 있어요.

1. **조건표** — 학번 목록을 넣으면 학생마다의 SEED·TEST_SIZE·꼭 할 실험·확인 행이 나와요. 학생 노트북이 이 조건을 그대로 썼는지 견줘요.
2. **지문 확인** — 학생 노트북 맨 아래의 요약코드와 지문을 붙여 넣으면, 손으로 고친 흔적이 없는지와 조건이 학번과 맞는지 확인해요.
3. **점수 합계** — 평가 요소별 점수를 적으면 합계와 채점표 CSV가 만들어져요.

> 의심스러운 노트북은 학생 사본을 열어 **런타임 → 모두 실행**을 해 보세요. 같은 지문이 나오면 그 노트북의 결과가 맞아요.
`),
    code(String.raw`
import pandas as pd
${CONDITION_PY}
학번목록 = ['10101', '10102', '10103']   # ✏️ 우리 반 학번

조건표 = pd.DataFrame([{'학번': h, **나만의_조건(h)} for h in 학번목록])
조건표
`, ['학번마다의 나만의 조건을 표로 만들어요. 인쇄해 두면 순회하며 학생 화면과 바로 견줄 수 있어요.'],
    "      학번  SEED  TEST_SIZE                                   실험과제  확인행\n0  10101  7490       0.25  정규화(StandardScaler)를 하기 전과 한 뒤의 성능 비교하기    3\n1  10102  7274       0.20                   다른 알고리즘 하나로 바꿔 성능 비교하기    3\n2  10103  4579       0.30                   다른 알고리즘 하나로 바꿔 성능 비교하기    2"),
    code(String.raw`
요약코드 = ''   # ✏️ 학생 노트북의 "요약코드:" 뒤의 글을 그대로 붙여 넣어요 (중괄호 { } 까지)
지문 = ''       # ✏️ 학생 노트북의 "🔏 지문:" 뒤의 여덟 글자

if 요약코드.strip():
    요약 = json.loads(요약코드)
    맞음 = 지문_만들기(요약) == 지문.strip()
    print('🔏 지문', '✅ 일치 — 요약코드를 손으로 고치지 않았어요' if 맞음 else '⚠️ 다름 — 요약코드나 지문이 바뀌었어요. 학생 사본을 모두 실행해 확인하세요')
    기대 = 나만의_조건(요약['학번'])
    for 키 in ['SEED', 'TEST_SIZE']:
        print(f'🔑 {키}', '✅' if 요약[키] == 기대[키] else f'⚠️ 학번의 조건은 {기대[키]}인데 {요약[키]}을(를) 썼어요')
    print(f'🧪 실험 {len(요약["실험"])}개 · 꼭 할 실험: {기대["실험과제"]}')
    for e in 요약['실험']:
        print('   ·', e)
else:
    print('요약코드를 붙여 넣고 실행하세요.')
`, ['지문은 요약코드 글자에서 만들어요. 한 글자라도 바뀌면 지문이 달라져요.', '꼭 할 실험을 했는지는 실험 목록의 "바꾼 것"을 보고 판단해요.'],
    "🔏 지문 ✅ 일치 — 요약코드를 손으로 고치지 않았어요\n🔑 SEED ✅\n🔑 TEST_SIZE ✅\n🧪 실험 3개 · 꼭 할 실험: 정규화(StandardScaler)를 하기 전과 한 뒤의 성능 비교하기\n   · ['정규화 하기', '정규화=True', 0.9419]\n   · ['부리깊이 빼기', \"속성=[…]\", 0.9186]\n   · ['max_depth 5', '값=5', 0.9767]"),
    code(String.raw`
# ✏️ 한 줄에 학생 한 명: 학번, 이름, ①(30·20·10), ②(30·20·10), ③(25·15·5), ④(15·10·5), 구술(○·△·×), 메모
# 낼 뜻이 없어 내지 않은 학생은 ①~④를 None으로 두면 20점(미응시)이 돼요.
채점 = [
    ['10101', '김펭귄', 30, 20, 15, 10, '○', ''],
    ['10102', '이아델', None, None, None, None, '', '미제출'],
]

def 합계(행):
    점수 = 행[2:6]
    if any(s is None for s in 점수):
        return 20
    return sum(점수)

채점표 = pd.DataFrame(채점, columns=['학번', '이름', '①문제정의', '②데이터·구현', '③성능·개선', '④표현·설명', '구술', '메모'])
채점표['합계'] = [합계(r) for r in 채점]
채점표.to_csv('채점표.csv', index=False, encoding='utf-8-sig')
print('💾 채점표.csv를 만들었어요 (왼쪽 📁 파일에서 내려받기)')
채점표
`, ['평가 요소마다 수준별 점수(① 30·20·10, ② 30·20·10, ③ 25·15·5, ④ 15·10·5)를 적어요. 가장 낮은 수준의 합이 기본점수 30점이에요.', '구술 확인에서 ×이면 관련 요소를 한 단계 낮춰 적어요(docs/ASSESSMENT.md).'],
    "💾 채점표.csv를 만들었어요 (왼쪽 📁 파일에서 내려받기)\n      학번   이름  ①문제정의  ②데이터·구현  ③성능·개선  ④표현·설명 구술   메모  합계\n0  10101  김펭귄   30.0     20.0     15.0     10.0   ○        75\n1  10102  이아델    NaN      NaN      NaN      NaN       미제출   20"),
  ],
};
