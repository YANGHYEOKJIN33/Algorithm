/**
 * 수행평가 노트북 — 인공지능 소프트웨어 개발 · 인공지능 프로젝트([12인기04-01]~[12인기04-04])
 *
 *   10_assessment_project  학생용 — 위에서부터 질문을 차례로 풀면 평가 요소 ①~④가 채워진다.
 *   11_teacher_grading     교사용 — 학번별 조건표 · 제출 노트북 한꺼번에 점검(다시 계산·비슷한 답·빈 답) ·
 *                          현장 확인 설명지와 답 열쇠 · 점수 합계와 채점표 CSV · 교과 역량별 세특 재료
 *
 * 변별의 뼈대(docs/ASSESSMENT.md) — AI 챗봇을 써도 되지만, 점수가 AI의 성능에 좌우되지 않게
 *   ① 학번에서 만든 나만의 조건(SEED·TEST_SIZE·꼭 할 실험·확인 행) — 같은 데이터라도 숫자가 학생마다 다르다
 *   ② 실험은 가설을 먼저 적어야 돌아가고, 가설·바꾼 것·결과가 요약코드에 그대로 남는다
 *   ③ 확인 행은 (가) 답을 가린 채 손으로 따라가고 (나) 답을 보고 견준다
 *   ④ 교사용 노트북이 요약코드의 설정으로 점수를 다시 계산해 손으로 고친 결과를 찾는다
 *   ⑤ 마지막 차시의 현장 확인(AI 챗봇도 노트북도 없이 10분, 내 숫자가 담긴 설명지로 "조건을 바꾸면?" 네 문제) —
 *      그 요소의 최고 수준은 현장 확인이 ○일 때만
 * 세특 재료는 학생의 결과·📝 답·교사 확인을 인공지능 기초의 교과 역량(컴퓨팅 사고력·인공지능 소양·디지털 문화 소양)과
 * 성취기준별로 묶는다 — 생기부 생성 프롬프트에 학생 한 명의 재료를 그대로 넣는다.
 *
 * 파이썬은 세 덩어리를 두 노트북이 글자 하나 다르지 않게 함께 쓴다(test/site.test.js가 확인).
 *   CONDITION_PY  학번 → 나만의 조건 · 지문
 *   CATALOG_PY    19개 분야 공개 데이터 목록과 불러오기
 *   PIPELINE_PY   학습 목적 · 전처리(기록 남김) · 모델 만들기 · 학습 · 꼭 할 실험 설정 · 원리 보기
 *
 * notebooks.js와 같은 꼴 — { id, title, intro, check, cells }, 셀은 md(text) · code(src, explain, out).
 * 파이썬 코드는 String.raw로 적는다(역슬래시가 그대로 남는다).
 */
import { SITE_URL } from './links.js';

const md = (text) => ({ type: 'md', text: text.trim().replace(/\\`/g, '`') });
const code = (src, explain = [], out = null) => ({ type: 'code', code: src.trim(), explain, out });

/** 6-4 쪽의 데이터 고르기 카드 — 학생용 노트북 1-1의 데이터_목록과 코드·순서가 같아야 한다(test/site.test.js) */
export const ASSESS_DATASETS = [
  { code: 'penguins', icon: '🐧', field: '생명과학·환경', desc: '남극 펭귄 344마리의 몸 측정값', example: '종 분류 · 몸무게 회귀' },
  { code: 'iris', icon: '🌸', field: '생명과학·농업', desc: '붓꽃 150송이의 꽃잎·꽃받침 크기', example: '품종 분류' },
  { code: 'wine', icon: '🍷', field: '화학·식품', desc: '와인 178병의 화학 성분 13가지', example: '품종 분류' },
  { code: 'breast_cancer', icon: '🩺', field: '의학·보건', desc: '종양 569개의 세포핵 측정값과 진단', example: '악성·양성 분류' },
  { code: 'diabetes', icon: '💊', field: '의학·약학·간호', desc: '당뇨 환자 442명의 검사값', example: '1년 뒤 진행 정도 회귀' },
  { code: 'exercise', icon: '🏃', field: '체육·운동과학', desc: '식단·운동·시간에 따른 맥박 90번', example: '맥박 회귀 · 운동 종류 분류' },
  { code: 'attention', icon: '🧠', field: '심리·교육', desc: '집중 방식에 따른 문제 풀이 점수 60번', example: '점수 회귀' },
  { code: 'tips', icon: '🍽', field: '경영·서비스', desc: '식당 계산서 244장과 팁', example: '팁 회귀 · 점심/저녁 분류' },
  { code: 'diamonds', icon: '💎', field: '경제·디자인', desc: '다이아몬드 53,940개의 품질과 가격', example: '가격 회귀' },
  { code: 'california', icon: '🏘', field: '부동산·도시 계획', desc: '캘리포니아 20,640개 구역의 집값', example: '집값 회귀' },
  { code: 'mpg', icon: '🚗', field: '기계·자동차 공학', desc: '자동차 398대의 엔진·무게·연비', example: '연비 회귀 · 생산 지역 분류' },
  { code: 'taxis', icon: '🚕', field: '교통·도시', desc: '뉴욕 택시 6,433번의 운행 기록', example: '요금 회귀 · 결제 수단 분류' },
  { code: 'flights', icon: '✈️', field: '항공·관광', desc: '1949~1960년 달마다 항공 승객 수', example: '승객 수 회귀' },
  { code: 'titanic', icon: '🚢', field: '역사·사회', desc: '타이타닉호 승객 891명', example: '생존 분류' },
  { code: 'car_crashes', icon: '🚦', field: '법·사회 안전', desc: '미국 51개 주의 교통사고와 원인', example: '사고율 회귀' },
  { code: 'healthexp', icon: '🏥', field: '보건 정책·국제', desc: '6개 나라의 의료비와 기대수명', example: '기대수명 회귀' },
  { code: 'geyser', icon: '🌋', field: '지구과학', desc: '간헐천의 분출 272번', example: '기다린 시간 회귀 · 분출 종류 분류' },
  { code: 'planets', icon: '🪐', field: '천문·우주', desc: '발견된 외계 행성 1,035개', example: '발견 방법 분류' },
  { code: 'digits', icon: '🔢', field: '컴퓨터·인공지능', desc: '8×8 손글씨 숫자 그림 1,797장', example: '숫자(0~9) 분류' },
];

/** 학번 → 나만의 조건 · 요약코드의 지문 */
export const CONDITION_PY = String.raw`
import hashlib, json

실험과제_목록 = [
    '입력 속성 하나를 빼고 다시 학습해, 그 속성이 성능에 얼마나 도움이 되는지 비교하기',
    '하이퍼파라미터(knn은 k, tree는 max_depth)를 세 가지 값으로 바꿔 성능 비교하기',
    '정규화(0~1로 크기 맞추기)를 하기 전과 한 뒤의 성능 비교하기',
    '훈련 데이터를 절반만 써서 학습해 성능 비교하기',
    '다른 알고리즘 하나로 바꿔 성능 비교하기',
]

def 나만의_조건(학번):
    h = int(hashlib.sha256(('ai-project:' + str(학번).strip()).encode('utf-8')).hexdigest(), 16)
    return {
        'SEED': h % 10000,
        'TEST_SIZE': [0.2, 0.25, 0.3][(h // 1000) % 3],
        '실험과제': 실험과제_목록[(h // 3000) % len(실험과제_목록)],
        '확인행': (h // 15000) % 5,   # 테스트 데이터에서 0부터 센 자리 — 화면에는 맨 위에서 몇 번째인지(+1)로 보여요
    }

def 지문_만들기(요약):
    글 = json.dumps(요약, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(글.encode('utf-8')).hexdigest()[:8]
`;

/** 19개 분야 공개 데이터 — seaborn·사이킷런에 들어 있어 Colab에서 바로 불러온다 */
export const CATALOG_PY = String.raw`
import pandas as pd
import seaborn as sns
from sklearn import datasets as skd

def _사이킷런(이름):
    return getattr(skd, 이름)(as_frame=True).frame

def _씨본(이름):
    return sns.load_dataset(이름).drop(columns=['Unnamed: 0'], errors='ignore')

데이터_목록 = {
    'penguins': dict(분야='생명과학·환경', 설명='남극 펭귄 344마리의 몸 측정값', 불러오기=lambda: _씨본('penguins'),
        TARGET='species', FEATURES=['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g'], 예시='종 분류 · 몸무게 회귀',
        열={'species': '종(Adelie·Chinstrap·Gentoo)', 'island': '사는 섬', 'bill_length_mm': '부리길이(mm)', 'bill_depth_mm': '부리깊이(mm)',
           'flipper_length_mm': '날개길이(mm)', 'body_mass_g': '몸무게(g)', 'sex': '성별'}),
    'iris': dict(분야='생명과학·농업', 설명='붓꽃 150송이의 꽃잎·꽃받침 크기', 불러오기=lambda: _씨본('iris'),
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
    'exercise': dict(분야='체육·운동과학', 설명='식단·운동 종류·잰 때에 따른 맥박 90번', 불러오기=lambda: _씨본('exercise'),
        TARGET='pulse', FEATURES=['diet', 'kind', 'time'], 예시='맥박 회귀 · 운동 종류 분류',
        열={'id': '참가자 번호', 'diet': '식단(low fat · no fat)', 'pulse': '맥박(1분에 뛴 수)', 'time': '잰 때(운동 1·15·30분)', 'kind': '운동(rest · walking · running)'}),
    'attention': dict(분야='심리·교육', 설명='주의 집중 방식에 따른 문제 풀이 점수 60번', 불러오기=lambda: _씨본('attention'), 목적='회귀',
        TARGET='score', FEATURES=['attention', 'solutions'], 예시='점수 회귀',
        열={'subject': '참가자 번호', 'attention': '집중 방식(divided 나눠서 · focused 한 곳에)', 'solutions': '풀이 방법 수', 'score': '점수'}),
    'tips': dict(분야='경영·서비스', 설명='식당 계산서 244장과 손님이 낸 팁', 불러오기=lambda: _씨본('tips'),
        TARGET='tip', FEATURES=['total_bill', 'size', 'time', 'smoker'], 예시='팁 금액 회귀 · 점심/저녁 분류',
        열={'total_bill': '계산서 금액(달러)', 'tip': '팁(달러)', 'sex': '계산한 사람 성별', 'smoker': '흡연석 여부',
           'day': '요일', 'time': '점심·저녁', 'size': '일행 수'}),
    'diamonds': dict(분야='경제·디자인', 설명='다이아몬드 53,940개의 크기·품질과 가격', 불러오기=lambda: _씨본('diamonds'),
        TARGET='price', FEATURES=['carat', 'cut', 'color', 'clarity'], 예시='가격 회귀 · 커팅 등급 분류',
        열={'carat': '무게(캐럿)', 'cut': '커팅 등급', 'color': '색 등급(D가 가장 좋음)', 'clarity': '투명도 등급',
           'depth': '깊이 비율(%)', 'table': '윗면 비율(%)', 'price': '가격(달러)', 'x': '길이(mm)', 'y': '너비(mm)', 'z': '높이(mm)'}),
    'california': dict(분야='부동산·도시 계획', 설명='캘리포니아 20,640개 구역의 집값과 동네 정보', 불러오기=lambda: _사이킷런('fetch_california_housing'),
        TARGET='MedHouseVal', FEATURES=['MedInc', 'HouseAge', 'AveRooms', 'Latitude', 'Longitude'], 예시='집값 회귀',
        열={'MedInc': '구역 가구 소득 중앙값(만 달러)', 'HouseAge': '집 나이 중앙값(년)', 'AveRooms': '가구당 평균 방 수', 'AveBedrms': '가구당 평균 침실 수',
           'Population': '구역 인구', 'AveOccup': '가구당 평균 사람 수', 'Latitude': '위도', 'Longitude': '경도', 'MedHouseVal': '집값 중앙값(10만 달러)'}),
    'mpg': dict(분야='기계·자동차 공학', 설명='자동차 398대의 엔진·무게와 연비', 불러오기=lambda: _씨본('mpg'),
        TARGET='mpg', FEATURES=['weight', 'horsepower', 'cylinders', 'model_year'], 예시='연비 회귀 · 생산 지역 분류',
        열={'mpg': '연비(마일/갤런)', 'cylinders': '실린더 수', 'displacement': '배기량', 'horsepower': '마력', 'weight': '무게(파운드)',
           'acceleration': '0→60마일 가속 시간(초)', 'model_year': '연식(70 = 1970년)', 'origin': '생산 지역', 'name': '차 이름'}),
    'taxis': dict(분야='교통·도시', 설명='뉴욕 택시 6,433번의 운행 기록', 불러오기=lambda: _씨본('taxis'),
        TARGET='fare', FEATURES=['distance', 'passengers', 'pickup_borough'], 예시='요금 회귀 · 결제 수단 분류',
        열={'passengers': '승객 수', 'distance': '거리(마일)', 'fare': '요금(달러)', 'tip': '팁', 'tolls': '통행료', 'total': '총액',
           'color': '택시 색', 'payment': '결제 수단', 'pickup_borough': '탄 구역', 'dropoff_borough': '내린 구역'}),
    'flights': dict(분야='항공·관광', 설명='1949~1960년 달마다 항공 승객 수', 불러오기=lambda: _씨본('flights'),
        TARGET='passengers', FEATURES=['year', 'month'], 예시='승객 수 회귀',
        열={'year': '연도', 'month': '달', 'passengers': '승객 수(천 명)'}),
    'titanic': dict(분야='역사·사회', 설명='타이타닉호 승객 891명의 정보와 생존 여부', 불러오기=lambda: _씨본('titanic'),
        TARGET='survived', FEATURES=['pclass', 'sex', 'age', 'fare'], 예시='생존(0·1) 분류',
        열={'survived': '생존(1)·사망(0)', 'pclass': '객실 등급(1·2·3)', 'sex': '성별', 'age': '나이', 'sibsp': '함께 탄 형제·배우자 수',
           'parch': '함께 탄 부모·자녀 수', 'fare': '요금', 'embarked': '탄 항구'}),
    'car_crashes': dict(분야='법·사회 안전', 설명='미국 51개 주의 교통사고와 그 원인', 불러오기=lambda: _씨본('car_crashes'),
        TARGET='total', FEATURES=['speeding', 'alcohol', 'not_distracted', 'no_previous'], 예시='사고율 회귀',
        열={'total': '운전자 10억 마일당 사고 사망 운전자 수', 'speeding': '그중 과속', 'alcohol': '그중 음주',
           'not_distracted': '그중 한눈팔지 않음', 'no_previous': '그중 사고 이력 없음', 'ins_premium': '보험료', 'ins_losses': '보험금 지급'}),
    'healthexp': dict(분야='보건 정책·국제', 설명='6개 나라의 해마다 의료비와 기대수명', 불러오기=lambda: _씨본('healthexp'),
        TARGET='Life_Expectancy', FEATURES=['Spending_USD', 'Year', 'Country'], 예시='기대수명 회귀',
        열={'Year': '연도', 'Country': '나라', 'Spending_USD': '1인당 의료비(달러)', 'Life_Expectancy': '기대수명(세)'}),
    'geyser': dict(분야='지구과학', 설명='옐로스톤 간헐천의 분출 272번', 불러오기=lambda: _씨본('geyser'),
        TARGET='waiting', FEATURES=['duration', 'kind'], 예시='기다린 시간 회귀 · 분출 종류 분류',
        열={'duration': '분출 시간(분)', 'waiting': '분출 전에 기다린 시간(분)', 'kind': '분출 종류(long·short)'}),
    'planets': dict(분야='천문·우주', 설명='지금까지 발견된 외계 행성 1,035개', 불러오기=lambda: _씨본('planets'),
        TARGET='method', FEATURES=['orbital_period', 'distance', 'year', 'number'], 예시='발견 방법 분류',
        열={'method': '발견 방법', 'number': '그 별에 있는 행성 수', 'orbital_period': '공전 주기(일)',
           'mass': '질량(목성 = 1)', 'distance': '지구에서의 거리(파섹)', 'year': '발견 연도'}),
    'digits': dict(분야='컴퓨터·인공지능', 설명='8×8 손글씨 숫자 그림 1,797장', 불러오기=lambda: _사이킷런('load_digits'),
        TARGET='target', FEATURES='pixel', 예시='숫자(0~9) 분류',
        열={'target': '쓴 숫자(0~9)', 'pixel_0_0 ~ pixel_7_7': '8×8 칸마다의 진하기(0~16)'}),
}

def 데이터_불러오기(코드, my_csv=''):
    if 코드 == 'my_csv':
        return pd.read_csv(my_csv)
    return 데이터_목록[코드]['불러오기']()
`;

/** 전처리부터 원리 보기까지 — 학생은 이 함수들로 학습하고, 교사는 같은 함수로 다시 계산한다 */
export const PIPELINE_PY = String.raw`
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, export_text
from sklearn.linear_model import LinearRegression
from sklearn.metrics import accuracy_score, mean_absolute_error, mean_squared_error

def 학습_목적(y_raw, 직접=None):
    if 직접 in ('분류', '회귀'):
        return 직접
    글자 = not pd.api.types.is_numeric_dtype(y_raw) or pd.api.types.is_bool_dtype(y_raw)
    return '분류' if 글자 or y_raw.nunique() <= 10 else '회귀'

def 숫자_열(df, features):
    return [c for c in features if pd.api.types.is_numeric_dtype(df[c]) and not pd.api.types.is_bool_dtype(df[c])]

def 울타리(s):
    q1, q3 = s.quantile(0.25), s.quantile(0.75)
    return q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)

def 전처리(df, features, target, 목적, missing='평균', outlier='그대로'):
    로그 = {'처음': len(df)}
    d = df.loc[~df.duplicated()]                        # 모든 열이 똑같은 행만 겹친 행으로 봐요
    로그['겹친 행'] = len(df) - len(d)
    d = d[features + [target]].copy()
    n = len(d); d = d.dropna(subset=[target]); 로그['정답이 빈 행'] = n - len(d)
    n = len(d); d = d.dropna(subset=features, how='all'); 로그['입력이 모두 빈 행'] = n - len(d)
    숫자 = 숫자_열(d, features)
    글자 = [c for c in features if c not in 숫자]
    if outlier == '지우기':
        n = len(d)
        밖 = pd.Series(False, index=d.index)
        건너뜀 = []
        for c in 숫자:
            낮은, 높은 = 울타리(df[c])                   # 2-1과 같은 울타리(처음 데이터로 한 번만 구해요)
            if 낮은 == 높은:
                건너뜀.append(c)                        # 값이 거의 다 같아 울타리가 0이면 건너뛰어요
                continue
            밖 |= d[c].notna() & ~d[c].between(낮은, 높은)
        d = d[~밖]
        로그['이상치'] = n - len(d)
        if 건너뜀:
            로그['울타리가 0이라 건너뛴 열'] = len(건너뜀)
    if missing == '지우기':
        n = len(d); d = d.dropna(subset=features); 로그['빈칸 있는 행'] = n - len(d)
    else:
        로그['채운 빈칸'] = int(d[features].isnull().sum().sum())
        for c in 숫자:
            d[c] = d[c].fillna(d[c].mean())
        for c in 글자:
            if d[c].notna().any():
                d[c] = d[c].fillna(d[c].mode()[0])
    X = pd.get_dummies(d[features], columns=글자, dtype=float).astype(float)   # 글자 → 숫자(원-핫)
    y = d[target].astype(str) if 목적 == '분류' else d[target].astype(float)
    로그['남은 행'] = len(X)
    return X, y, 로그

def 모델_만들기(알고리즘, 목적, 값=None, seed=0):
    if 알고리즘 == 'knn':
        k = int(값 or 5)
        return KNeighborsClassifier(n_neighbors=k) if 목적 == '분류' else KNeighborsRegressor(n_neighbors=k)
    if 알고리즘 == 'tree':
        틀 = DecisionTreeClassifier if 목적 == '분류' else DecisionTreeRegressor
        return 틀(max_depth=int(값 or 3), random_state=seed)
    if 알고리즘 == 'linear':
        if 목적 == '분류':
            raise ValueError('선형 회귀는 숫자를 맞히는 회귀에만 써요. knn이나 tree를 골라요.')
        if 값 is not None:
            raise ValueError("선형 회귀에는 바꿀 하이퍼파라미터가 없어요. 알고리즘='knn'이나 'tree'와 함께 값을 바꿔 보세요.")
        return LinearRegression()
    raise ValueError("알고리즘은 'knn', 'tree', 'linear' 가운데 하나예요.")

def 학습(X, y, 설정, 속성=None, 알고리즘=None, 값=None, 정규화=None, 훈련비율=1.0, 시험비율=None):
    if 속성 is not None:
        모르는 = [f for f in 속성 if f not in 설정['FEATURES']]
        if 모르는:
            raise ValueError(f'FEATURES에 없는 열이에요: {모르는} — 새 열을 쓰려면 1-3의 FEATURES에 더하고 다시 실행해요.')
        if not 속성:
            raise ValueError('속성을 하나 이상 남겨요.')
    열 = [c for c in X.columns if 속성 is None or any(c == f or c.startswith(f + '_') for f in 속성)]
    목적 = 설정['목적']
    알고 = 알고리즘 or 설정['ALGORITHM']
    if 값 is None and 알고 == 설정['ALGORITHM']:
        값 = 설정['PARAM']
    층 = y if 목적 == '분류' and y.value_counts().min() >= 2 else None
    Xtr, Xte, ytr, yte = train_test_split(X[열], y, test_size=시험비율 or 설정['TEST_SIZE'], random_state=설정['SEED'], stratify=층)
    if 훈련비율 < 1.0:
        Xtr = Xtr.sample(frac=훈련비율, random_state=설정['SEED'])
        ytr = ytr.loc[Xtr.index]
    맞춤 = None
    if 설정['SCALE'] if 정규화 is None else 정규화:
        맞춤 = MinMaxScaler().fit(Xtr)                    # 훈련 데이터로만 최솟값·최댓값을 구해요
        Xtr = pd.DataFrame(맞춤.transform(Xtr), index=Xtr.index, columns=열)
        Xte = pd.DataFrame(맞춤.transform(Xte), index=Xte.index, columns=열)
    모델 = 모델_만들기(알고, 목적, 값, 설정['SEED']).fit(Xtr, ytr)
    예측 = 모델.predict(Xte)
    점수 = accuracy_score(yte, 예측) if 목적 == '분류' else mean_absolute_error(yte, 예측)
    return dict(model=모델, scaler=맞춤, cols=열, X_train=Xtr, X_test=Xte, y_train=ytr, y_test=yte, pred=예측, 점수=float(점수))

def 꼭할_실험_설정(실험과제, 설정, 뺄=None):
    알고 = 설정['ALGORITHM']
    if 실험과제 == 실험과제_목록[0]:
        if len(설정['FEATURES']) < 2:
            raise ValueError('입력 속성이 하나뿐이라 뺄 수 없어요. 1-3의 FEATURES에 속성을 하나 더 넣고 다시 실행해요.')
        뺄 = 뺄 or 설정['FEATURES'][0]
        return {'속성': [f for f in 설정['FEATURES'] if f != 뺄]}
    if 실험과제 == 실험과제_목록[1]:
        if 알고 == 'linear':
            return {'알고리즘': 'knn', '값': [1, 5, 15]}
        return {'값': [1, 5, 15] if 알고 == 'knn' else [2, 4, 8]}
    if 실험과제 == 실험과제_목록[2]:
        return {'정규화': not 설정['SCALE']}
    if 실험과제 == 실험과제_목록[3]:
        return {'훈련비율': 0.5}
    후보 = ['knn', 'tree'] if 설정['목적'] == '분류' else ['linear', 'knn', 'tree']
    return {'알고리즘': [a for a in 후보 if a != 알고][0]}

def 원리_설명(결과, 위치, 정답, df_raw, features, target):
    model, X_test, y_train = 결과['model'], 결과['X_test'], 결과['y_train']
    행 = X_test.iloc[[위치]]
    print(f'🔎 테스트 데이터 맨 위에서 {위치 + 1}번째 행 (행 번호 {X_test.index[위치]})')
    print('   원래 값:', {k: (v.item() if hasattr(v, 'item') else v) for k, v in df_raw.loc[X_test.index[위치], features].items()})
    if 결과['scaler'] is not None:
        print('   계산에 쓰는 값(0~1로 크기를 맞춘 값):', {c: round(float(행.iloc[0][c]), 3) for c in 결과['cols'][:12]})
    if 정답:
        print(f'   실제: {결과["y_test"].iloc[위치]} · 예측: {결과["pred"][위치]}')
    if isinstance(model, (KNeighborsClassifier, KNeighborsRegressor)):
        거리, 번호 = model.kneighbors(행)
        print(f'\n📍 가장 가까운 이웃 {len(번호[0])}개')
        for d, j in zip(거리[0], 번호[0]):
            print(f'   행 {y_train.index[j]}: 거리 {d:.3f}' + (f', 정답 {y_train.iloc[j]}' if 정답 else ''))
        if 정답:
            이웃 = y_train.iloc[번호[0]]
            print('   → 투표 결과:', {str(k): int(v) for k, v in 이웃.value_counts().items()} if isinstance(model, KNeighborsClassifier) else f'평균 {이웃.mean():.3f}')
        else:
            print(f'   ✏️ 이웃마다 정답을 df_raw.loc[행 번호, {target!r}]로 찾아 적고, 내 모델이 무엇이라고 답할지 먼저 정해요.')
    elif isinstance(model, (DecisionTreeClassifier, DecisionTreeRegressor)):
        if 정답:
            t = model.tree_
            print('\n🌳 지나간 질문')
            for 노드 in model.decision_path(행).indices:
                if t.children_left[노드] == -1:
                    print(f'   → 잎에 닿음: 예측 {결과["pred"][위치]}')
                else:
                    열이름 = 결과['cols'][t.feature[노드]]
                    기준, 값 = t.threshold[노드], 행.iloc[0][열이름]
                    print(f'   {열이름} ≤ {기준:.3f}? 값 {값:.3f} → {"예" if 값 <= 기준 else "아니오"}')
        else:
            print('\n🌳 내 트리 (위에서부터 질문을 따라 내려가요. 들여쓰기 한 칸이 한 단계예요)')
            글 = export_text(model, feature_names=결과['cols'], decimals=3).splitlines()
            print('\n'.join(글[:60]) + (f'\n   … 모두 {len(글)}줄' if len(글) > 60 else ''))
            print('   ✏️ 이 행의 값으로 질문마다 예/아니오를 정해 잎까지 따라가요.')
    else:
        print('\n📈 직선(평면) 식: 예측 = 절편 + Σ 기울기 × 값')
        print(f'   절편 {model.intercept_:.3f}')
        합 = model.intercept_
        for 열이름, w in zip(결과['cols'], model.coef_):
            값 = 행.iloc[0][열이름]
            합 += w * 값
            print(f'   기울기 {w:.3f} × {열이름}({값:.3f})' + (f' = {w * 값:.3f}' if 정답 else ''))
        if 정답:
            print(f'   합 = {합:.3f}')
        else:
            print('   ✏️ 곱해서 모두 더하면 예측이 나와요. 계산기로 직접 해 봐요.')
`;

/* ══════════════════ 학생용 ══════════════════ */

export const ASSESS_STUDENT = {
  id: '10_assessment_project',
  title: '🧪 인공지능 프로젝트 수행평가 (질문을 차례로 풀면 완성)',
  intro: '내 진로와 이어지는 데이터를 골라, 평가 요소 ①~④의 질문을 위에서부터 차례로 풀면 인공지능 프로젝트가 완성돼요. AI 챗봇을 써도 되지만, 쓸 때마다 🤖 AI 활용 기록에 남겨요.',
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
4. AI 챗봇을 써도 돼요. 대신 쓸 때마다 맨 아래 **🤖 AI 활용 기록**에 남겨요.
5. 다 했으면 **런타임 → 모두 실행**을 한 번 하고, 맨 아래 **제출 요약**이 오류 없이 나오면 **저장(Ctrl+S)** 한 뒤 선생님이 알려 준 방법으로 내요.

> ⚖️ **이렇게 채점해요** — 글을 얼마나 매끄럽게 썼는지가 아니라, **내 데이터·내 숫자로 근거를 댔는지**, **가설과 결과가 앞뒤가 맞는지**를 봐요.
> 마지막 차시에는 **현장 확인**이 있어요. AI 챗봇도 노트북도 없이 10분 동안, **내 결과가 담긴 설명지만 보며** 네 문제(평가 요소마다 하나)에 답해요.
> 현장 확인에서 설명하지 못한 요소는 노트북을 아무리 잘 썼어도 가장 높은 점수를 받을 수 없어요. AI가 써 준 것도 내가 설명할 수 있어야 내 것이에요.

수업 사이트: ${SITE_URL}
`),
    md(String.raw`
## 0. 나의 정보와 나만의 조건

학번으로 **나만의 조건**을 만들어요. 친구와 같은 데이터를 골라도 SEED·TEST_SIZE가 달라 훈련/테스트로 나뉘는 행이 달라지니, 숫자도 다르게 나와요. 끝까지 이 조건을 그대로 써요.
`),
    code(String.raw`
학번 = ''   # ✏️ 예: '20315' (학년·반·번호)
이름 = ''   # ✏️ 예: '김펭귄'

import warnings
warnings.filterwarnings('ignore')
${CONDITION_PY}
if not str(학번).strip():
    print('⚠️ 학번을 먼저 적고 다시 실행해요! 학번이 없으면 나만의 조건이 모두 같아져요.')
조건 = 나만의_조건(학번)
SEED, TEST_SIZE = 조건['SEED'], 조건['TEST_SIZE']
print(f'👤 {학번} {이름}')
print('🔑 나만의 조건 (끝까지 그대로 써요)')
print(f'  · 나누기: SEED = {SEED}, TEST_SIZE = {TEST_SIZE}')
print(f'  · 꼭 할 실험: {조건["실험과제"]}')
print(f'  · 원리를 설명할 확인 행: 테스트 데이터 맨 위에서 {조건["확인행"] + 1}번째 행 (4-2에서 행 번호도 함께 나와요)')
`, ['학번과 이름을 적고 실행하면 나만의 조건 네 가지가 나와요. 이 조건은 학번에서 만들어서 선생님도 똑같이 다시 만들어 볼 수 있어요.'],
    "👤 10101 김펭귄\n🔑 나만의 조건 (끝까지 그대로 써요)\n  · 나누기: SEED = 7490, TEST_SIZE = 0.25\n  · 꼭 할 실험: 정규화(0~1로 크기 맞추기)를 하기 전과 한 뒤의 성능 비교하기\n  · 원리를 설명할 확인 행: 테스트 데이터 맨 위에서 4번째 행 (4-2에서 행 번호도 함께 나와요)"),

    md(String.raw`
---
## ① 문제 정의 및 개발 계획 수립 (30점)

### 1-1 데이터 고르기 — 풀고 싶은 문제가 있는 데이터
아래 셀을 실행하면 고를 수 있는 데이터 목록이 나와요. 관심 있는 분야에서, **이 데이터로 정말 답할 수 있는 질문이 있는지** 따져 보고 골라요.
목록에 없는 데이터(공공데이터포털 등)를 쓰고 싶으면 선생님께 먼저 확인받은 뒤 \`DATASET = 'my_csv'\`로 써요. **개인정보가 들어 있는 데이터는 쓸 수 없어요.**
`),
    code(String.raw`
${CATALOG_PY}
print(f'{"코드":<14}{"분야":<16}설명 — 예시')
for 코드, d in 데이터_목록.items():
    print(f'{코드:<14}{d["분야"]:<16}{d["설명"]} — {d["예시"]}')
`, ['이 셀은 고치지 않아요. 실행만 하면 고를 수 있는 데이터 19가지가 나와요.', '데이터는 seaborn과 사이킷런에 들어 있는 공개 데이터라 인터넷만 되면 바로 불러올 수 있어요.'],
    "코드            분야              설명 — 예시\npenguins      생명과학·환경         남극 펭귄 344마리의 몸 측정값 — 종 분류 · 몸무게 회귀\niris          생명과학·농업         붓꽃 150송이의 꽃잎·꽃받침 크기 — 품종 분류\nwine          화학·식품           와인 178병의 화학 성분 13가지와 품종 — 품종(0·1·2) 분류\n… (모두 19가지)"),
    code(String.raw`
DATASET = 'penguins'   # ✏️ 위 목록의 코드를 적어요 (내 CSV는 'my_csv')
MY_CSV = ''            # ✏️ 'my_csv'일 때만: CSV 인터넷 주소나 드라이브 경로 — CSV 파일도 노트북과 함께 내요

df_raw = 데이터_불러오기(DATASET, MY_CSV)
추천 = 데이터_목록.get(DATASET, {})
print(f'📦 {DATASET}: {df_raw.shape[0]}행 × {df_raw.shape[1]}열')
for 열이름, 뜻 in 추천.get('열', {}).items():
    print(f'  · {열이름}: {뜻}')
df_raw.head()
`, ['DATASET에 고른 데이터의 코드를 적고 실행해요. 열마다 무슨 뜻인지도 함께 나와요.'],
    "📦 penguins: 344행 × 7열\n  · species: 종(Adelie·Chinstrap·Gentoo)\n  · island: 사는 섬\n  · bill_length_mm: 부리길이(mm)\n  · bill_depth_mm: 부리깊이(mm)\n  · flipper_length_mm: 날개길이(mm)\n  · body_mass_g: 몸무게(g)\n  · sex: 성별\n  species     island  bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g     sex\n0  Adelie  Torgersen            39.1           18.7              181.0       3750.0    Male\n1  Adelie  Torgersen            39.5           17.4              186.0       3800.0  Female\n…"),
    md(String.raw`
📝 **1-1 답** — 이 데이터로 어떤 질문에 답할 수 있는지 **열 이름을 들어** 적어요.

- 고른 데이터(코드):
- 이 데이터로 답할 수 있는 질문 (예: species 열을 맞히는 데 bill_length_mm 같은 측정값을 쓸 수 있다):
- 고른 까닭 (관심 분야와 이어져도 좋아요):
`),
    md(String.raw`
### 1-2 해결할 문제 정의
위의 열 설명을 보고, **이 데이터로 정말 풀 수 있는 문제**로 정해요.
`),
    md(String.raw`
📝 **1-2 답** — 빈칸을 채워요.

- **사용 대상** (누가 쓰나요?):
- **상황** (언제 필요한가요?):
- **해결할 문제** (무엇을 알고 싶은가요?):
- **필요한 까닭** (이 프로그램이 없으면 무엇이 불편한가요?):
- **관련된 지속가능발전목표(SDGs)와 그 까닭** (예: 3 건강과 웰빙 · 4 양질의 교육 · 11 지속가능한 도시와 공동체 · 13 기후 행동 · 14 해양 생태계 · 15 육상 생태계 — 없으면 "없음"과 그 까닭):
`),
    md(String.raw`
### 1-3 개발 목적과 기능 설계
먼저 아래 셀에서 맞힐 열(TARGET)과 입력 열(FEATURES)을 정하고 실행해요. 추천값이 들어 있지만, 내 문제에 맞게 바꿔도 돼요.
`),
    code(String.raw`
${PIPELINE_PY}
TARGET = 추천.get('TARGET', '')       # ✏️ 맞힐 열(정답 y) — 예: TARGET = 'body_mass_g' (그러면 아래 FEATURES에서 'body_mass_g'를 꼭 빼요)
FEATURES = 추천.get('FEATURES', [])   # ✏️ 입력 열(X) 리스트 — 예: FEATURES = ['bill_length_mm', 'flipper_length_mm']
PURPOSE = None                        # ✏️ 자동 판단이 틀리면 '분류' 또는 '회귀'로 적어요

if FEATURES == 'pixel':
    FEATURES = [c for c in df_raw.columns if c.startswith('pixel')]
if TARGET in FEATURES:
    FEATURES = [f for f in FEATURES if f != TARGET]
    print(f'⚠️ 맞힐 열 {TARGET}은(는) 입력에서 뺐어요. 정답을 입력으로 주면 안 되니까요.')
if not FEATURES:
    raise ValueError('입력 열(FEATURES)을 하나 이상 적어요.')
목적 = 학습_목적(df_raw[TARGET], PURPOSE or (추천.get('목적') if TARGET == 추천.get('TARGET') else None))
print(f'🎯 맞힐 것(TARGET): {TARGET} — 서로 다른 값 {df_raw[TARGET].nunique()}가지 → 학습 목적: {목적}')
if 목적 == '분류':
    print('   값마다 개수:', {str(k): int(v) for k, v in df_raw[TARGET].value_counts().items()})
else:
    print(f'   범위: {df_raw[TARGET].min()} ~ {df_raw[TARGET].max()}, 평균 {df_raw[TARGET].mean():.2f}')
print(f'🧩 입력(FEATURES) {len(FEATURES)}개:')
for f in FEATURES[:12]:
    종류 = '숫자' if f in 숫자_열(df_raw, [f]) else '글자'
    print(f'   · {f} ({종류}, 빈칸 {df_raw[f].isnull().sum()}개)')
if len(FEATURES) > 12:
    print(f'   … 모두 {len(FEATURES)}개')
`, ['TARGET은 맞히고 싶은 열 하나, FEATURES는 그것을 맞히는 데 쓸 열들이에요.', '정답이 글자이거나 값의 종류가 10가지 이하이면 분류, 값의 종류가 그보다 많은 숫자이면 회귀로 판단해요. 틀리면 PURPOSE에 직접 적어요.', '맨 위의 긴 코드는 앞으로 쓸 함수들(전처리·학습·원리 보기)이에요. 고치지 않아요.'],
    "🎯 맞힐 것(TARGET): species — 서로 다른 값 3가지 → 학습 목적: 분류\n   값마다 개수: {'Adelie': 152, 'Gentoo': 124, 'Chinstrap': 68}\n🧩 입력(FEATURES) 4개:\n   · bill_length_mm (숫자, 빈칸 2개)\n   · bill_depth_mm (숫자, 빈칸 2개)\n   · flipper_length_mm (숫자, 빈칸 2개)\n   · body_mass_g (숫자, 빈칸 2개)"),
    md(String.raw`
📝 **1-3 답** — 위 결과를 보고 채워요.

- **맞힐 것(정답 y)**:
- **입력(X)으로 쓸 열과 고른 까닭**: (왜 이 열들이 정답과 관계가 있을까요?)
- **학습 목적(분류·회귀)과 그렇게 정한 까닭**:
- **기능 한 줄 설명**: "사용자가 ______를 넣으면 ______를 알려 주는 프로그램"
- **성공 기준(숫자로)**: (예: 정확도 0.85 이상 / 평균 절대 오차 ___ 이하) — 그렇게 정한 까닭:
`),
    md(String.raw`
### 1-4 개발 계획
`),
    md(String.raw`
📝 **1-4 답** — **처음 계획** 칸은 1차시에 적고 고치지 않아요. **실제로 한 일** 칸은 수업이 끝날 때마다 적어요(4-3에서 둘을 견줘요).

| 차시 | 처음 계획 (1차시에 적고 고치지 않아요) | 실제로 한 일 (차시마다 적어요) |
|---|---|---|
| 1 | (예: 데이터 고르기, ① 1-1 ~ 1-3) |  |
| 2 |  |  |
| 3 |  |  |
| 4 |  |  |
| 5 |  |  |
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
숫자열 = 숫자_열(df_raw, FEATURES)
print('🔍 빈칸(결측치) 개수')
print(df_raw[FEATURES + [TARGET]].isnull().sum().to_string())
print('\n🔍 이상치 개수 (상자그림 울타리 밖)')
for c in 숫자열:
    낮은, 높은 = 울타리(df_raw[c])
    print(f'   {c}: {int(((df_raw[c] < 낮은) | (df_raw[c] > 높은)).sum())}개  (울타리 {낮은:.2f} ~ {높은:.2f})')
print('\n겹친 행(모든 열이 똑같은 행):', int(df_raw.duplicated().sum()))
if 숫자열:
    보일열 = 숫자열[:8]
    df_raw[보일열].plot.box(subplots=True, layout=(1, len(보일열)), figsize=(2.4 * len(보일열), 3))
    plt.tight_layout(); plt.show()
`, ['열마다 빈칸이 몇 개인지, 상자그림의 울타리(Q1 − 1.5×IQR ~ Q3 + 1.5×IQR) 밖에 있는 값이 몇 개인지 세요.', '숫자 열은 8개까지 상자그림을 그려요.'],
    "🔍 빈칸(결측치) 개수\nbill_length_mm       2\nbill_depth_mm        2\nflipper_length_mm    2\nbody_mass_g          2\nspecies              0\n\n🔍 이상치 개수 (상자그림 울타리 밖)\n   bill_length_mm: 0개  (울타리 25.31 ~ 62.41)\n   bill_depth_mm: 0개  (울타리 10.95 ~ 23.35)\n   flipper_length_mm: 0개  (울타리 155.50 ~ 247.50)\n   body_mass_g: 0개  (울타리 1750.00 ~ 6550.00)\n\n겹친 행(모든 열이 똑같은 행): 0"),
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
SCALE = False        # ✏️ True면 3-7처럼 열마다 0~1로 크기를 맞춰요(정규화) — k-최근접 이웃에 특히 중요

X, y, 전처리_기록 = 전처리(df_raw, FEATURES, TARGET, 목적, MISSING, OUTLIER)
print(f'🧹 전처리 — 결측치: {MISSING} · 이상치: {OUTLIER} · 정규화: {SCALE}')
for 무엇, 몇 in 전처리_기록.items():
    print(f'   {무엇}: {몇}')
print(f'   → 입력 열 {X.shape[1]}개 (글자 열은 0과 1의 열로 바꿨어요)')
X.head()
`, ['결측치·이상치를 어떻게 처리할지, 크기를 맞출지(정규화) 직접 골라요. 고른 까닭을 2-2 답에 적어요.', '전처리 기록에 단계마다 몇 행이 빠졌는지 나와요. 2-2 답과 현장 확인에서 이 숫자로 설명해요.'],
    "🧹 전처리 — 결측치: 평균 · 이상치: 그대로 · 정규화: False\n   처음: 344\n   겹친 행: 0\n   정답이 빈 행: 0\n   입력이 모두 빈 행: 2\n   채운 빈칸: 0\n   남은 행: 342\n   → 입력 열 4개 (글자 열은 0과 1의 열로 바꿨어요)\n   bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g\n0            39.1           18.7              181.0       3750.0\n…"),
    md(String.raw`
📝 **2-2 답**
- 고른 결측치 처리와 까닭:
- 고른 이상치 처리와 까닭:
- 정규화를 했나요? 까닭:
- 전처리 기록의 숫자로: 처음 ___행 → 남은 ___행, 빠진 까닭:
`),
    md(String.raw`
### 2-3 나누기와 학습
나만의 조건의 SEED와 TEST_SIZE로 나누고, 알고리즘을 골라 학습시켜요.
`),
    code(String.raw`
ALGORITHM = 'tree'   # ✏️ 'knn'(k-최근접 이웃) · 'tree'(의사결정 트리) · 'linear'(선형 회귀 — 회귀만)
PARAM = None         # ✏️ 하이퍼파라미터 — knn이면 k(예: 5), tree면 max_depth(예: 3), None이면 기본값

설정 = dict(목적=목적, FEATURES=FEATURES, SEED=SEED, TEST_SIZE=TEST_SIZE, SCALE=SCALE, ALGORITHM=ALGORITHM, PARAM=PARAM)
지표 = '정확도' if 목적 == '분류' else '평균 절대 오차(MAE)'

def 학습하기(**바꿀것):
    return 학습(X, y, 설정, **바꿀것)

결과 = 학습하기()
model, X_train, X_test, y_train, y_test = 결과['model'], 결과['X_train'], 결과['X_test'], 결과['y_train'], 결과['y_test']
첫점수 = 결과['점수']
print(f'✂️ 훈련 {len(X_train)}행 · 테스트 {len(X_test)}행 (SEED {SEED}, TEST_SIZE {TEST_SIZE})')
print(f'🤖 {ALGORITHM} 학습 완료 — {model}')
if 목적 == '분류':
    print(f'✅ 테스트 정확도: {첫점수:.3f} ({len(y_test)}개 중 {int(round(첫점수 * len(y_test)))}개 맞힘)')
else:
    print(f'✅ 테스트 평균 절대 오차(MAE): {첫점수:.3f} — 예측이 실제와 평균 {첫점수:.3f}만큼 달라요')
`, ['ALGORITHM에 쓸 알고리즘을 적어요. 5단원에서 배운 k-최근접 이웃·의사결정 트리·선형 회귀 가운데 골라요.', '나만의 조건의 SEED·TEST_SIZE로 나누므로 친구와 숫자가 달라요. 설정은 여기서 한 번 정해 두고, ③의 실험도 이 설정에서 한 가지씩만 바꿔요.'],
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
    글자열 = [c for c in FEATURES if c not in 숫자_열(df_raw, FEATURES)]   # 전처리와 똑같이 글자·참거짓 열을 0과 1로
    행 = pd.get_dummies(pd.DataFrame([입력])[FEATURES], columns=글자열, dtype=float).reindex(columns=결과['cols'], fill_value=0.0)
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
    "넣은 값: {'bill_length_mm': 45, 'bill_depth_mm': 17, 'flipper_length_mm': 200, 'body_mass_g': 4200}\n🤖 예측: Chinstrap"),
    md(String.raw`
📝 **2-4 답**
- 넣은 값과 예측 결과:
- 이 예측이 그럴듯한가요? 데이터(평균값, 비슷한 행 등)를 근거로 판단해요:
`),
    md(String.raw`
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
    print('\n혼동 행렬 (행 = 실제, 열 = 예측)')
    print(pd.crosstab(y_test, pred, rownames=['실제'], colnames=['예측']).to_string())
else:
    찍기 = mean_absolute_error(y_test, np.full(len(y_test), y_train.mean()))
    print(f'📏 평균 절대 오차(MAE) {첫점수:.3f} · 평균 제곱 오차(MSE) {mean_squared_error(y_test, pred):.3f}')
    print(f'   훈련 데이터의 평균({y_train.mean():.2f})으로만 찍으면 MAE {찍기:.3f}')
`, ['분류는 정확도와 혼동 행렬(실제 정답마다 무엇으로 예측했는지 센 표 — 왼쪽 위에서 오른쪽 아래로 가는 대각선이 맞힌 개수)을 봐요.', '회귀는 평균 절대 오차(MAE: 예측과 실제의 차이를 부호 없이 평균 낸 값, 작을수록 좋아요)와 평균 제곱 오차(MSE)를 재요.', '아무것도 배우지 않고 "찍기"만 했을 때와 견주면 모델이 정말 배웠는지 알 수 있어요.'],
    "📏 정확도 0.942 · 가장 많은 값(Adelie)으로만 찍으면 0.442\n\n혼동 행렬 (행 = 실제, 열 = 예측)\n예측         Adelie  Chinstrap  Gentoo\n실제\nAdelie         36          2       0\nChinstrap       2         15       0\nGentoo          0          1      30"),
    md(String.raw`
📝 **3-1 답**
- 내 모델의 성능(숫자):
- "찍기"보다 얼마나 나은가요?(숫자):
- 1-3에서 정한 **성공 기준**을 달성했나요? (정확도는 기준 이상, 평균 절대 오차는 기준 이하면 달성):
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
    print(틀린표.head(10).to_string())
    if len(틀린표) < 2:
        확신 = model.predict_proba(X_test).max(axis=1)
        print('\n틀린 예가 2개보다 적어요 → 가장 아슬아슬하게 답한 예(확신이 낮은 예) 5개')
        print(원래값.assign(실제=y_test.values, 예측=pred, 확신=확신.round(3)).sort_values('확신').head(5).to_string())
else:
    틀린표 = 틀린표.assign(오차=(틀린표['예측'] - 틀린표['실제']).abs()).sort_values('오차', ascending=False)
    print('❌ 오차가 큰 예 10개')
    print(틀린표.head(10).to_string())
if 숫자열:
    print('\n📊 비교용 — 정답별 숫자 열 평균' if 목적 == '분류' else '\n📊 비교용 — 숫자 열 평균')
    print((df_raw.groupby(TARGET)[숫자열].mean() if 목적 == '분류' else df_raw[숫자열].mean()).round(2).to_string())
`, ['틀린 예(회귀는 오차가 큰 예)의 원래 값과 실제·예측을 보여 줘요. 맨 왼쪽 숫자가 행 번호예요.', '틀린 예가 2개보다 적으면, 모델이 가장 자신 없게 답한 예를 대신 보여 줘요.', '아래의 평균과 견주면 왜 틀렸는지 근거를 찾을 수 있어요.'],
    "❌ 틀린 예 5개 (처음 10개)\n     bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g         실제         예측\n318            48.4           14.4              203.0       4625.0     Gentoo  Chinstrap\n184            42.5           16.7              187.0       3350.0  Chinstrap     Adelie\n…\n\n📊 비교용 — 정답별 숫자 열 평균\n           bill_length_mm  bill_depth_mm  flipper_length_mm  body_mass_g\nspecies\nAdelie              38.79          18.35             189.95      3700.66\nChinstrap           48.83          18.42             195.82      3733.09\nGentoo              47.50          14.98             217.19      5076.02"),
    md(String.raw`
📝 **3-2 답** — 틀린 예 2개(틀린 예가 2개보다 적으면 확신이 가장 낮은 예)를 골라 **행 번호**를 적고, 왜 틀렸을지(또는 아슬아슬했을지) **값을 근거로** 설명해요.
- 행 번호 ___ : (예: 부리길이 46.1로 턱끈 평균 48.8보다 젠투 평균 47.5에 더 가까워서 …)
- 행 번호 ___ :
`),
    md(String.raw`
### 3-3 실험 — 가설 → 결과 → 해석 (3개)
실험은 **실행하기 전에 가설(어떻게 될지와 그 까닭)부터** 적어요. 가설이 비어 있으면 실행되지 않고, 가설은 제출 요약에 그대로 남아요.
첫 실험은 반드시 **나만의 조건에 나온 "꼭 할 실험"으로** 해요. 나머지 두 개는 자유롭게 골라요.

| 바꿀 것 | 실험() 안에 적는 법 |
|---|---|
| 입력 속성 빼기 | \`속성=['bill_length_mm', 'flipper_length_mm']\` (FEATURES 안에서 고르기) |
| 하이퍼파라미터 | \`값=7\` 또는 세 값을 한 번에 \`값=[1, 5, 15]\` (knn의 k, tree의 max_depth) |
| 정규화 | \`정규화=True\` 또는 \`정규화=False\` |
| 훈련 데이터 양 | \`훈련비율=0.5\` |
| 알고리즘 | \`알고리즘='knn'\` |
`),
    code(String.raw`
실험기록 = []

def 실험(이름, 가설, 꼭할=False, **바꿀것):
    if len(str(가설).strip()) < 5:
        print('⚠️ 실행하기 전에 가설(어떻게 될지와 그 까닭)을 한 문장으로 먼저 적어요.')
        return
    값들 = 바꿀것.get('값')
    if isinstance(값들, (list, tuple)):
        점수 = [학습하기(**{**바꿀것, '값': v})['점수'] for v in 값들]
    else:
        점수 = 학습하기(**바꿀것)['점수']
    판정 = lambda s: '같음' if abs(s - 첫점수) < 1e-12 else ('좋아짐' if (s > 첫점수) == (목적 == '분류') else '나빠짐')
    기록 = {'번호': 0, '이름': 이름, '가설': str(가설).strip(), '바꿀것': 바꿀것, '꼭할': 꼭할,
           '점수': [round(s, 4) for s in 점수] if isinstance(점수, list) else round(점수, 4),
           '판정': ' · '.join(판정(s) for s in 점수) if isinstance(점수, list) else 판정(점수)}
    같은것 = [i for i, e in enumerate(실험기록) if e['이름'] == 이름 and e['바꿀것'] == 바꿀것]
    if 같은것:
        이전 = 실험기록[같은것[0]]
        기록['이전 가설'] = 이전.get('이전 가설', []) + ([이전['가설']] if 이전['가설'] != 기록['가설'] else [])
        실험기록[같은것[0]] = 기록       # 같은 실험을 다시 실행하면 새로 고쳐 적어요(가설을 바꿨다면 이전 가설도 남아요)
    else:
        실험기록.append(기록)
    for i, e in enumerate(실험기록):
        e['번호'] = i + 1
    보기 = ', '.join(f'{v}→{s:.3f}' for v, s in zip(값들, 점수)) if isinstance(점수, list) else f'{점수:.3f}'
    print(f'🧪 실험 {실험기록.index(기록) + 1} · {이름}: {지표} {보기} (처음 {첫점수:.3f} → {기록["판정"]})')

def 꼭할_실험(가설, 뺄=None):
    바꿀것 = 꼭할_실험_설정(조건['실험과제'], 설정, 뺄)
    print('🔑 꼭 할 실험:', 조건['실험과제'])
    print('   바꾸는 것:', 바꿀것)
    if 바꿀것.get('정규화') is not None and ALGORITHM != 'knn':
        print('   💡 tree·linear는 결과가 같게 나올 수 있어요. 같다면 "왜 같은지"가 3-3 해석의 핵심이에요.')
    실험('꼭 할 실험', 가설, 꼭할=True, **바꿀것)

print('실험 준비 완료. 꼭 할 실험:', 조건['실험과제'])
`, ['실험(이름, 가설, 바꿀 것)으로 한 가지만 바꿔 다시 학습하고, 처음 점수와 견줘요.', '같은 이름·같은 바꿀 것으로 다시 실행하면 기록을 새로 고쳐 적어요. 결과를 본 뒤 가설을 바꾸면 이전 가설도 함께 남아요. 서로 다른 실험 3개가 되게 해요.'],
    "실험 준비 완료. 꼭 할 실험: 정규화(0~1로 크기 맞추기)를 하기 전과 한 뒤의 성능 비교하기"),
    code(String.raw`
# 실험 1 — 나만의 조건의 "꼭 할 실험" (무엇을 바꿀지는 저절로 정해져요)
가설1 = ''   # ✏️ 예: '크기를 맞추면 몸무게(숫자가 큼)가 거리를 혼자 정하지 못해 정확도가 오를 것이다'
꼭할_실험(가설1)   # 속성 빼기 과제라면 꼭할_실험(가설1, 뺄='뺄 열 이름')으로 뺄 속성을 골라도 돼요
`, ['가설1만 적고 실행해요. 무엇을 바꿀지는 나만의 조건과 2-3의 설정에 맞게 저절로 정해져요.'],
    "🔑 꼭 할 실험: 정규화(0~1로 크기 맞추기)를 하기 전과 한 뒤의 성능 비교하기\n   바꾸는 것: {'정규화': True}\n   💡 tree·linear는 결과가 같게 나올 수 있어요. 같다면 \"왜 같은지\"가 3-3 해석의 핵심이에요.\n🧪 실험 1 · 꼭 할 실험: 정확도 0.942 (처음 0.942 → 같음)"),
    code(String.raw`
# 실험 2 — 내가 고른 실험 ✏️ 가설부터 적고, 위 표를 보고 바꿀 것 하나를 적어요
가설2 = ''   # ✏️
실험('내 실험 2', 가설2, 속성=FEATURES[:-1])   # ✏️ 바꿀 것을 내 실험에 맞게 고쳐요
`, ['궁금한 것을 하나 골라 가설을 세우고 실험해요.'],
    "🧪 실험 2 · 내 실험 2: 정확도 0.942 (처음 0.942 → 같음)"),
    code(String.raw`
# 실험 3 — 내가 고른 실험 ✏️ 앞 실험의 결과를 보고, 더 좋아질 방법을 하나 더 시험해요
가설3 = ''   # ✏️
실험('내 실험 3', 가설3, 훈련비율=0.7)   # ✏️ 바꿀 것을 내 실험에 맞게 고쳐요 (세 값을 한 번에: 값=[2, 4, 8])
`, ['꼭 할 실험·실험 2와 다른 것을 바꿔요. 세 값을 한 번에 견주는 실험도 기록은 하나로 남아요.'],
    "🧪 실험 3 · 내 실험 3: 정확도 2→0.930, 4→0.988, 8→0.988 (처음 0.942 → 나빠짐 · 좋아짐 · 좋아짐)"),
    code(String.raw`
실험표 = pd.DataFrame(실험기록, columns=['번호', '이름', '가설', '바꿀것', '점수', '판정'])
print(f'실험 {len(실험표)}개 · 처음 {지표} {첫점수:.3f}')
실험표
`, ['지금까지 한 실험을 표로 모아 봐요. 이 표를 보고 3-3 답을 적어요.'],
    "실험 3개 · 처음 정확도 0.942\n   번호      이름                        가설                 바꿀것                        점수               판정\n0   1  꼭 할 실험  크기를 맞추면 … 오를 것이다          {'정규화': True}                    0.9419               같음\n1   2  내 실험 2  몸무게를 빼면 … 떨어질 것이다  {'속성': ['bill_length_mm', …]}                    0.9419               같음\n2   3  내 실험 3  질문을 늘리면 … 잘 가릴 것이다        {'값': [2, 4, 8]}  [0.9302, 0.9884, 0.9884]  나빠짐 · 좋아짐 · 좋아짐"),
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
`),
    md(String.raw`
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
이름들, 점수들 = ['처음'], [첫점수]
for e in 실험기록:
    if isinstance(e['점수'], list):
        for v, s in zip(e['바꿀것']['값'], e['점수']):
            이름들.append(f'실험{e["번호"]}\n값={v}'); 점수들.append(s)
    else:
        이름들.append(f'실험{e["번호"]}'); 점수들.append(e['점수'])
칸[1].bar(이름들, 점수들, color=['gray'] + ['tab:blue'] * (len(이름들) - 1))
칸[1].set_title(f'실험별 {지표}'); 칸[1].set_ylabel(지표)
plt.tight_layout(); plt.show()
`, ['왼쪽은 모델의 결과(분류는 혼동 행렬, 회귀는 실제와 예측), 오른쪽은 실험마다의 점수 막대예요.']),
    md(String.raw`
📝 **4-1 답** — 위 그래프 두 개가 각각 무엇을 보여 주는지, 가장 눈에 띄는 점을 숫자와 함께 2문장씩 적어요.
`),
    md(String.raw`
### 4-1(나) 사용 대상에게 보여 줄 결과 한 장 — 직접 만들기
1-2의 사용 대상이 이 프로그램을 쓴다면 무엇을 보여 줄지 **직접 골라 만들어요**(그래프·표·안내 문장 가운데 하나, AI 챗봇 도움 가능).
`),
    code(String.raw`
# ✏️ 사용 대상에게 보여 줄 결과를 직접 만들어요. 아래는 예시 — 지우고 내 것으로 바꿔요
# print(f'입력하신 값으로 예측하면 {예측하기(새_입력)}입니다. 이 프로그램은 테스트에서 {첫점수:.0%} 맞혔어요.')
`, ['그래프든 표든 안내 문장이든 좋아요. 왜 그 사용 대상에게 알맞은지 4-1(나) 답에 적어요.']),
    md(String.raw`
📝 **4-1(나) 답** — 무엇을 만들었고, 왜 그 사용 대상에게 알맞은가요?
`),
    md(String.raw`
### 4-2 확인 행으로 원리 설명 — 내 모델은 왜 그렇게 답했을까?
**(가)** 먼저 답을 가린 채 보여 줘요. 내 모델이 확인 행을 어떻게 판단할지 **손으로 따라가 먼저 적고**, **(나)** 에서 답을 보고 견줘요.
`),
    code(String.raw`
def 원리_보기(위치, 정답=False):
    원리_설명(결과, 위치, 정답, df_raw, FEATURES, TARGET)

원리_보기(조건['확인행'])   # (가) 답을 가린 채
`, ['k-최근접 이웃이면 가까운 이웃의 거리를, 의사결정 트리면 내 트리 전체를, 선형 회귀면 기울기와 값을 보여 줘요. 답(정답·예측)은 아직 보여 주지 않아요.'],
    "🔎 테스트 데이터 맨 위에서 4번째 행 (행 번호 33)\n   원래 값: {'bill_length_mm': 40.9, 'bill_depth_mm': 18.9, 'flipper_length_mm': 184.0, 'body_mass_g': 3900.0}\n\n🌳 내 트리 (위에서부터 질문을 따라 내려가요. 들여쓰기 한 칸이 한 단계예요)\n|--- flipper_length_mm <= 206.000\n|   |--- bill_length_mm <= 43.150\n|   |   |--- bill_length_mm <= 42.400\n|   |   |   |--- class: Adelie\n|   |   |--- bill_length_mm >  42.400\n|   |   |   |--- class: Adelie\n|   |--- bill_length_mm >  43.150\n…\n|--- flipper_length_mm >  206.000\n|   |--- bill_depth_mm <= 17.650\n|   |   |--- class: Gentoo\n…\n   ✏️ 이 행의 값으로 질문마다 예/아니오를 정해 잎까지 따라가요."),
    md(String.raw`
📝 **4-2(가) 답** — 답을 보기 전에: 내 모델이 이 행을 무엇이라고 답할지, 어떤 과정(지나는 질문 · 이웃의 투표 · 식의 계산)으로 그렇게 되는지 적어요.
`),
    code(String.raw`
원리_보기(조건['확인행'], 정답=True)   # (나) 답을 보며 견주기
`, ['이제 실제 정답과 모델의 예측, 지나간 질문(또는 이웃의 투표, 식의 합)이 함께 나와요.'],
    "🔎 테스트 데이터 맨 위에서 4번째 행 (행 번호 33)\n   원래 값: {'bill_length_mm': 40.9, 'bill_depth_mm': 18.9, 'flipper_length_mm': 184.0, 'body_mass_g': 3900.0}\n   실제: Adelie · 예측: Adelie\n\n🌳 지나간 질문\n   flipper_length_mm ≤ 206.000? 값 184.000 → 예\n   bill_length_mm ≤ 43.150? 값 40.900 → 예\n   bill_length_mm ≤ 42.400? 값 40.900 → 예\n   → 잎에 닿음: 예측 Adelie"),
    md(String.raw`
📝 **4-2(나) 답** — (가)에서 내가 따라간 것과 (나)가 같았나요? 다르면 어디서 갈렸고 왜 그런지, 위 출력의 **숫자를 써서** 설명해요.
`),
    md(String.raw`
### 4-3 개발 과정 돌아보기
`),
    md(String.raw`
📝 **4-3 답**
- 가장 어려웠던 순간과 해결한 방법:
- 1-4의 처음 계획과 실제로 한 일이 달라진 점과 그 까닭:
- 다시 한다면 바꿀 것:
`),
    md(String.raw`
### 4-4 🤖 AI 활용 기록
`),
    md(String.raw`
📝 **4-4 답** — AI 챗봇을 쓴 만큼 줄을 늘려요. 쓰지 않았다면 "쓰지 않음"이라고 적어요.

| 질문 번호 | AI에게 물은 것 (그대로 붙여 넣기) | AI 답을 어떻게 썼나 (그대로 · 고쳐서 · 안 씀) | 내가 확인한 방법 (실행 결과 · 자료 · 선생님) |
|---|---|---|---|
|  |  |  |  |

- **AI를 썼다면** — AI가 틀렸거나 내 데이터에 맞지 않았던 경우 한 가지와 내가 고친 방법 (실행해 봤다면 숫자로 — 예: AI 답대로 0.91 → 내 방법 0.95):
- **AI를 쓰지 않았다면** — 내가 스스로 찾아 고친 오류 한 가지와 확인한 방법:
`),
    md(String.raw`
### 4-5 배우고 달라진 점
`),
    md(String.raw`
📝 **4-5 답** — 이 프로젝트로 배운 것을 **내 결과의 숫자를 예로 들어** 적어요.

- **새로 이해한 인공지능의 원리나 개념 하나** (예: "트리는 거리를 쓰지 않아서 정규화를 해도 정확도가 0.942로 같았다"):
- **처음 생각과 달라진 점** — 데이터, 성능 평가, 인공지능 활용 가운데 하나:
`),
    md(String.raw`
---
## ✅ 제출 요약
**런타임 → 모두 실행**을 한 번 한 뒤 아래 셀의 결과를 확인하고 **저장(Ctrl+S)** 해요. 요약코드는 선생님이 결과를 다시 계산해 볼 때 써요. **손으로 고치지 마요.**
`),
    code(String.raw`
요약 = {
    '학번': str(학번).strip(), '이름': 이름, 'DATASET': DATASET, 'MY_CSV': MY_CSV, 'TARGET': TARGET, 'FEATURES': FEATURES,
    '목적': 목적, 'MISSING': MISSING, 'OUTLIER': OUTLIER, 'SCALE': SCALE, 'ALGORITHM': ALGORITHM, 'PARAM': PARAM,
    'SEED': SEED, 'TEST_SIZE': TEST_SIZE, '확인행': 조건['확인행'], '처음행수': 전처리_기록['처음'], '행수': int(len(X)),
    '점수': round(float(첫점수), 4), '새입력': 직접_넣음,
    '실험': [{k: e.get(k, []) for k in ('이름', '가설', '이전 가설', '바꿀것', '꼭할', '점수')} for e in 실험기록],
}
print('📋 제출 요약')
print(f'  {요약["학번"]} {이름} · 데이터 {DATASET} · {TARGET} {목적} · {ALGORITHM}')
print(f'  처음 {지표} {첫점수:.4f} · 실험 {len(실험기록)}개')
for e in 실험기록:
    print(f'    {e["번호"]}. {e["이름"]} {e["바꿀것"]} → {e["점수"]} ({e["판정"]})')
print('\n요약코드:', json.dumps(요약, ensure_ascii=False, sort_keys=True))
print('🔏 지문:', 지문_만들기(요약))
빠진것 = []
if not 요약['학번']:
    빠진것.append('학번')
다른실험 = len({json.dumps(e['바꿀것'], ensure_ascii=False, sort_keys=True) for e in 실험기록})
if 다른실험 < 3:
    빠진것.append(f'서로 다른 실험 {3 - 다른실험}개 더')
if not any(e['꼭할'] for e in 실험기록):
    빠진것.append('꼭 할 실험')
if not 직접_넣음:
    빠진것.append('2-4 새_입력 직접 넣기')
print('\n' + ('⚠️ 아직 남은 것: ' + ', '.join(빠진것) if 빠진것 else '🎉 코드 부분은 모두 했어요. 📝 답 칸을 빠짐없이 채웠는지 확인하고 저장(Ctrl+S)해요.'))
`, ['내 프로젝트의 설정과 결과, 실험의 가설까지 한눈에 모아요. 선생님은 요약코드의 설정으로 점수를 다시 계산해 봐요.'],
    "📋 제출 요약\n  10101 김펭귄 · 데이터 penguins · species 분류 · tree\n  처음 정확도 0.9419 · 실험 3개\n    1. 꼭 할 실험 {'정규화': True} → 0.9419 (같음)\n    2. 내 실험 2 {'속성': ['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm']} → 0.9419 (같음)\n    3. 내 실험 3 {'값': [2, 4, 8]} → [0.9302, 0.9884, 0.9884] (나빠짐 · 좋아짐 · 좋아짐)\n\n요약코드: {\"ALGORITHM\": \"tree\", \"DATASET\": \"penguins\", … \"SEED\": 7490, … \"학번\": \"10101\", \"행수\": 342, \"확인행\": 3}\n🔏 지문: d399b44b\n\n🎉 코드 부분은 모두 했어요. 📝 답 칸을 빠짐없이 채웠는지 확인하고 저장(Ctrl+S)해요."),
  ],
};

/** 학생용 노트북의 📝 답 칸 원래 글 — 교사용 노트북이 빈 답과 학생이 더한 글을 가려낼 때 쓴다 */
export const ANSWER_TEMPLATES = Object.fromEntries(ASSESS_STUDENT.cells
  .filter((c) => c.type === 'md' && c.text.startsWith('📝 **'))
  .map((c) => [c.text.match(/^📝 \*\*(.+?) 답\*\*/)[1], c.text]));


/* ══════════════════ 교사용 ══════════════════ */

export const ASSESS_TEACHER = {
  id: '11_teacher_grading',
  title: '🧑‍🏫 수행평가 채점 도우미 (교사용)',
  intro: '학번별 조건표를 뽑고, 제출된 노트북을 한꺼번에 점검(다시 계산·비슷한 답·빈 답)하고, 현장 확인 설명지와 답 열쇠, 채점표, 세특 재료를 만들어요.',
  check: '조건표 · 점검표 · 현장 설명지 · 채점표 · 세특 재료',
  cells: [
    md(String.raw`
# 🧑‍🏫 수행평가 채점 도우미 (교사용)

학생용 노트북(10_assessment_project)과 **같은 함수**로 조건을 만들고 결과를 다시 계산해요. 자세한 채점 기준과 운영 방법은 docs/ASSESSMENT.md에 있어요.

1. **명단과 조건표** — 우리 반 명단을 넣으면 학생마다의 SEED·TEST_SIZE·꼭 할 실험·확인 행이 나와요.
2. **제출 노트북 한꺼번에 점검** — 학생들이 낸 .ipynb를 한 폴더에 모으면, 요약코드로 점수를 **다시 계산**하고 명단·꼭 할 실험·빈 답·**비슷한 답**·가설을 고친 흔적·답 속 숫자 근거를 표 하나(점검표.csv)로 보여 줘요. ⚠️ 표시가 있는 학생만 자세히 보면 돼요.
3. **현장 확인 설명지와 답 열쇠** — 노트북 없이 풀도록, 학생마다의 숫자와 문제를 담은 설명지(현장설명지.md)와 답 열쇠(현장답열쇠.md)를 만들어요.
4. **점수 합계** — 노트북 수준과 현장 확인(○·△·×)을 적으면, 현장 확인으로 상한을 둔 최종 점수와 채점표 CSV가 나와요.
5. **세특 재료** — 학생의 실행 결과·📝 답·현장 확인 결과를 인공지능 기초의 교과 역량별로 묶은 글(세특재료.md)을 만들어요. 생기부 생성 프롬프트에 학생 한 명의 재료를 그대로 넣으면 돼요.
`),
    code(String.raw`
import warnings
warnings.filterwarnings('ignore')
${CONDITION_PY}
${CATALOG_PY}
${PIPELINE_PY}
명단_글 = '''
10101 김펭귄
10102 이아델
10103 박젠투
'''   # ✏️ 한 줄에 "학번 이름" — 우리 반 명단을 붙여 넣어요

명단 = dict(줄.split(maxsplit=1) for 줄 in 명단_글.strip().splitlines() if 줄.strip())
조건표 = pd.DataFrame([{'학번': h, '이름': n, **나만의_조건(h)} for h, n in 명단.items()])
조건표['확인행'] = 조건표['확인행'] + 1   # 학생 화면처럼 "맨 위에서 몇 번째"로
조건표
`, ['명단을 붙여 넣고 실행하면 학번마다의 나만의 조건이 나와요. 확인행은 학생 화면과 같이 "테스트 데이터 맨 위에서 몇 번째 행"이에요.'],
    "      학번   이름  SEED  TEST_SIZE                               실험과제  확인행\n0  10101  김펭귄  7490       0.25  정규화(0~1로 크기 맞추기)를 하기 전과 한 뒤의 성능 비교하기    4\n1  10102  이아델  7274       0.20          다른 알고리즘 하나로 바꿔 성능 비교하기    4\n2  10103  박젠투  4579       0.30          다른 알고리즘 하나로 바꿔 성능 비교하기    3"),
    md(String.raw`
## 2. 제출 노트북 한꺼번에 점검
학생들이 낸 노트북(.ipynb)을 구글 드라이브의 한 폴더에 모아요(클래스룸에서 제출물을 내려받아 드라이브에 올리기). 학생에게는 **모두 실행 → 저장(Ctrl+S) 뒤에 내라**고 알려 주세요. 실행 결과가 저장되어 있어야 요약코드를 읽을 수 있어요. 직접 구한 CSV(my_csv)를 쓴 학생은 CSV 파일도 함께 내게 하고 같은 폴더에 두면 돼요.
`),
    code(String.raw`
FOLDER = '/content/drive/MyDrive/수행평가'   # ✏️ 학생 노트북을 모아 둔 폴더
CSV_폴더 = FOLDER                            # ✏️ my_csv를 쓴 학생의 CSV 파일을 모아 둔 폴더
try:
    from google.colab import drive
    drive.mount('/content/drive')
except Exception:
    print('Colab이 아니면 FOLDER에 이 컴퓨터의 폴더를 적어요.')

import os, re, difflib
템플릿 = json.loads(r'''${JSON.stringify(ANSWER_TEMPLATES)}''')
설정키 = ('목적', 'FEATURES', 'SEED', 'TEST_SIZE', 'SCALE', 'ALGORITHM', 'PARAM')

def _글(셀):
    s = 셀.get('source', '')
    return ''.join(s) if isinstance(s, list) else s

def _출력(셀):
    글 = []
    for o in 셀.get('outputs', []):
        t = o.get('text')
        if t is None:
            t = o.get('data', {}).get('text/plain', '')
        글.append(''.join(t) if isinstance(t, list) else str(t))
    return '\n'.join(글)

def _넣은글(키, 글):
    # 학생이 템플릿에 더한 글자만 — 빈 답·비슷한 답을 가릴 때 써요
    sm = difflib.SequenceMatcher(None, 템플릿.get(키, ''), 글, autojunk=False)
    return '\n'.join(글[j1:j2].strip() for t, i1, i2, j1, j2 in sm.get_opcodes() if t in ('insert', 'replace') and 글[j1:j2].strip())

def _머리(r):
    # 템플릿 줄의 항목 이름 — 괄호 밖의 첫 콜론까지("- **이름**:" · "- 이름 (예: …):")
    깊이 = 0
    for i, c in enumerate(r):
        깊이 += (c == '(') - (c == ')')
        if c == ':' and 깊이 == 0:
            return r[:i + 1]
    return None

def _안내뗌(글, 원래줄):
    # 템플릿 줄에 있던 안내 괄호 · 빈칸 예시 따옴표를 학생 글에서 떼요(학생이 쓴 괄호는 그대로)
    for 안내 in re.findall(r'\([^()]*\)|"[^"]*_{3,}[^"]*"', 원래줄):
        글 = 글.replace(안내, '')
    return re.sub(r'\s+', ' ', 글).strip()

def _이름(글):
    return re.sub(r'\s*\([^()]*\)', '', 글.replace('**', '')).lstrip('- ').rstrip(':').strip()

def _칸(줄):
    return [c.strip() for c in 줄.strip().strip('|').split('|')]

def _답줄(키, 글, 빈칸=False):
    # 세특 재료용 — 학생이 채운 줄을 "항목: 내용"으로(안내 괄호 · 빈칸 예시 · 굵은 글씨 표시는 떼고, 표는 머리글과 짝지어요)
    # 빈칸=True면 학생이 비운 항목을 "(비어 있음)"으로 남겨요
    원래 = [줄.strip() for 줄 in 템플릿.get(키, '').splitlines() if 줄.strip()]
    머리들 = [(h, r, _안내뗌(r[len(h):], r)) for r in 원래 if r.startswith('-') for h in [_머리(r)] if h]
    표 = [_칸(r) for r in 원래 if r.startswith('|') and not set(r) <= set('|-: ')]
    표머리 = [_이름(c) for c in 표[0]] if 표 else []
    남은 = []
    for 줄 in 글.splitlines():
        t = 줄.strip()
        if not t or t.startswith('📝') or set(t) <= set('|-: ') or (t in 원래 and not 빈칸):
            continue
        if t.startswith('|') and 표머리:
            칸 = _칸(t)
            if [_이름(c) for c in 칸] == 표머리:
                continue
            본 = [next((r[i] for r in 표[1:] if i < len(r) and r[0] == 칸[0] and r[i]), None) for i in range(len(칸))]
            값 = 칸[:1] + ['' if c == b else c for c, b in zip(칸[1:], 본[1:])]
            if any(값[1:]):
                남은.append(f'{표머리[0]} {값[0]} — ' + ' · '.join(f'{m}: {c or "(비어 있음)"}' for m, c in zip(표머리[1:], 값[1:])))
            continue
        h, r, 안내 = next(((h, r, g) for h, r, g in 머리들 if t.startswith(h)), (None, '', ''))
        if h:
            값 = _안내뗌(t[len(h):], r)
            if 안내 and 값.startswith(안내):
                값 = 값[len(안내):]
            값 = 값.strip(' —')
            if 값 and 값 != 안내.strip(' —'):
                남은.append(f'{_이름(h)}: {값}')
            elif 빈칸 and '___' not in h and not h.startswith('- ('):   # "(분류) …" · "행 번호 ___"처럼 골라 쓰는 칸은 빼요
                남은.append(f'{_이름(h)}: (비어 있음)')
        elif t not in 원래:
            남은.append(t.lstrip('-> ').replace('**', '').strip(' |').replace(' | ', ' / '))
    return 남은

def _조각(글):
    # 줄(학생이 채운 한 덩어리)마다 네 글자 조각 — 덩어리 사이를 잇는 조각은 만들지 않아요(순서를 바꿔도 같게)
    조각 = set()
    for 덩어리 in re.split(r'\n|\s{2,}', 글):
        t = re.sub(r'[\s\d\W_]+', '', 덩어리)
        조각 |= {t[i:i + 4] for i in range(len(t) - 3)}
    return 조각

def _겹침(a, b):
    A, B = _조각(a), _조각(b)
    return len(A & B) / min(len(A), len(B)) if min(len(A), len(B)) >= 20 else 0.0

def _숫자들(글):
    return re.findall(r'-?\d+(?:\.\d+)?', 글)

def 노트북_읽기(경로):
    nb = json.load(open(경로, encoding='utf-8'))
    답, 출력, 소스 = {}, '', ''
    for 셀 in nb.get('cells', []):
        글 = _글(셀)
        if 셀.get('cell_type') == 'markdown':
            m = re.match(r'📝 \*\*(.+?) 답\*\*', 글)
            if m:
                답[m.group(1)] = 글
        elif 셀.get('cell_type') == 'code':
            소스 += 글 + '\n'
            출력 += _출력(셀) + '\n'
    m = re.search(r'^요약코드: (\{.*\})\s*$', 출력, re.M)
    지문 = re.search(r'🔏 지문: ([0-9a-f]{8})', 출력)
    학번_ = re.search(r"^학번 = ['\"](.*?)['\"]", 소스, re.M)
    이름_ = re.search(r"^이름 = ['\"](.*?)['\"]", 소스, re.M)
    return dict(파일=os.path.basename(경로), 요약=json.loads(m.group(1)) if m else None, 지문=지문.group(1) if 지문 else '',
                답=답, 출력=출력, 학번=학번_.group(1) if 학번_ else '', 이름=이름_.group(1) if 이름_ else '')

def _불러오기(요약):
    if 요약['DATASET'] != 'my_csv':
        return 데이터_불러오기(요약['DATASET'])
    for 후보 in (요약.get('MY_CSV', ''), os.path.join(CSV_폴더, os.path.basename(요약.get('MY_CSV', '')))):
        try:
            return pd.read_csv(후보)
        except Exception:
            pass
    raise FileNotFoundError(f"학생의 CSV({요약.get('MY_CSV')})를 CSV_폴더에 넣어요")

def 다시_계산(요약):
    df = _불러오기(요약)
    X, y, 기록 = 전처리(df, 요약['FEATURES'], 요약['TARGET'], 요약['목적'], 요약['MISSING'], 요약['OUTLIER'])
    설정 = {k: 요약[k] for k in 설정키}
    결과 = 학습(X, y, 설정)
    실험점수 = []
    for e in 요약['실험']:
        바꿀것 = e['바꿀것']
        if isinstance(바꿀것.get('값'), list):
            실험점수.append([round(학습(X, y, 설정, **{**바꿀것, '값': v})['점수'], 4) for v in 바꿀것['값']])
        else:
            실험점수.append(round(학습(X, y, 설정, **바꿀것)['점수'], 4))
    ytr, yte = 결과['y_train'], 결과['y_test']
    찍기 = (yte == ytr.mode()[0]).mean() if 설정['목적'] == '분류' else mean_absolute_error(yte, np.full(len(yte), ytr.mean()))
    return dict(df=df, X=X, y=y, 기록=기록, 설정=설정, 결과=결과, 행수=len(X), 점수=round(결과['점수'], 4), 실험점수=실험점수, 찍기=round(float(찍기), 4))

def 꼭할_맞나(요약):
    try:
        기대 = 꼭할_실험_설정(나만의_조건(요약['학번'])['실험과제'], {k: 요약[k] for k in 설정키})
    except Exception:
        return False
    꼭 = [e for e in 요약['실험'] if e.get('꼭할')]
    if not 꼭:
        return False
    바꿀것 = 꼭[0]['바꿀것']
    if '속성' in 기대:
        속성 = 바꿀것.get('속성', [])
        return set(바꿀것) == {'속성'} and len(set(속성)) == len(속성) == len(요약['FEATURES']) - 1 and set(속성) <= set(요약['FEATURES'])
    return 바꿀것 == 기대

점검 = []
파일들 = sorted(os.path.join(FOLDER, f) for f in os.listdir(FOLDER) if f.lower().endswith('.ipynb')) if os.path.isdir(FOLDER) else []
for 경로 in 파일들:
    줄 = {'파일': os.path.basename(경로), '학번': '', '이름': '', '⚠️': []}
    r = {'답': {}, '요약': None, '출력': ''}
    try:
        r = 노트북_읽기(경로)
        s = r['요약']
        줄['학번'], 줄['이름'] = (s['학번'], s['이름']) if s else (r['학번'], r['이름'])
        if not s:
            줄['⚠️'].append('요약코드 없음(모두 실행·저장 뒤 다시 내기)')
        else:
            if s['학번'] not in 명단:
                줄['⚠️'].append('명단에 없는 학번')
            elif 명단[s['학번']] != s['이름']:
                줄['⚠️'].append(f'이름이 명단과 다름({명단[s["학번"]]})')
            if 지문_만들기(s) != r['지문']:
                줄['⚠️'].append('지문이 요약코드와 다름(출력을 손으로 고침?)')
            기대 = 나만의_조건(s['학번'])
            if (s['SEED'], s['TEST_SIZE']) != (기대['SEED'], 기대['TEST_SIZE']):
                줄['⚠️'].append('SEED·TEST_SIZE가 학번의 조건과 다름')
            if not 꼭할_맞나(s):
                줄['⚠️'].append('꼭 할 실험을 하지 않았거나 다르게 함')
            다른실험 = len({json.dumps(e['바꿀것'], ensure_ascii=False, sort_keys=True) for e in s['실험']})
            if 다른실험 < 3:
                줄['⚠️'].append(f'서로 다른 실험 {다른실험}개')
            for e in s['실험']:
                if e.get('이전 가설'):
                    줄['⚠️'].append(f'"{e["이름"]}" 가설을 결과를 본 뒤 고침(이전 가설 {len(e["이전 가설"])}개 — 확인)')
            try:
                재 = 다시_계산(s)
                같음 = 재['행수'] == s['행수'] and abs(재['점수'] - s['점수']) < 1e-4 and 재['실험점수'] == [e['점수'] for e in s['실험']]
                줄['다시 계산'] = '✅ 같음' if 같음 else f'⚠️ 다름(행 {재["행수"]}, 점수 {재["점수"]}, 실험 {재["실험점수"]})'
                if not 같음:
                    줄['⚠️'].append('다시 계산한 결과가 다름(코드나 결과를 고침?)')
                r['다시'] = 재
            except Exception as 오류:
                줄['다시 계산'] = '못 함'
                줄['⚠️'].append(f'다시 계산 못 함({type(오류).__name__}: {str(오류)[:50]}) — 노트북을 직접 확인')
        빈답 = [k for k in 템플릿 if not _넣은글(k, r['답'].get(k, 템플릿[k]))]
        줄['빈 답'] = len(빈답)
        if 빈답:
            줄['⚠️'].append('빈 답: ' + ', '.join(빈답))
        답숫자 = [n for k, 글 in r['답'].items() for n in _숫자들(' '.join(_답줄(k, 글)))]
        출력숫자 = set(_숫자들(r['출력']))
        맞는숫자 = [n for n in 답숫자 if n in 출력숫자 or any(o.startswith(n) for o in 출력숫자 if '.' in n)]
        줄['답 속 숫자(출력에 있는 것/전체)'] = f'{len(맞는숫자)}/{len(답숫자)}'
    except Exception as 오류:
        줄['⚠️'].append(f'노트북을 읽지 못함({type(오류).__name__}) — 파일을 다시 받기')
    점검.append(dict(줄, 읽은것=r))

# 비슷한 답 — 학생이 더한 글끼리 네 글자 조각이 60% 넘게 겹치면(순서를 바꾸거나 덧붙여도) 표시해요
for i in range(len(점검)):
    for j in range(i + 1, len(점검)):
        a, b = 점검[i]['읽은것']['답'], 점검[j]['읽은것']['답']
        for 키 in 템플릿:
            if 키 in a and 키 in b and _겹침(_넣은글(키, a[키]), _넣은글(키, b[키])) > 0.6:
                점검[i]['⚠️'].append(f'{키} 답이 {점검[j]["학번"]}와 비슷함')
                점검[j]['⚠️'].append(f'{키} 답이 {점검[i]["학번"]}와 비슷함')
학번들 = [z['학번'] for z in 점검]
for z in 점검:
    if z['학번'] and 학번들.count(z['학번']) > 1:
        z['⚠️'].append('같은 학번 노트북이 둘 이상')
for h, n in 명단.items():
    if h not in 학번들:
        점검.append({'파일': '', '학번': h, '이름': n, '⚠️': ['제출 노트북 없음(미제출이면 20점)'], '읽은것': {'답': {}, '요약': None, '출력': ''}})

점검표 = pd.DataFrame([{k: (' / '.join(v) if k == '⚠️' else v) for k, v in z.items() if k != '읽은것'} for z in 점검])
if len(점검표):
    점검표.to_csv('점검표.csv', index=False, encoding='utf-8-sig')
    print(f'📋 노트북 {len(파일들)}개를 점검했어요. ⚠️가 있는 학생 {sum(1 for z in 점검 if z["⚠️"])}명 — 점검표.csv(왼쪽 📁 파일)에도 저장했어요.')
else:
    print('FOLDER에 .ipynb 파일이 없어요. 폴더 위치를 확인해요.')
점검표
`, ['요약코드의 설정으로 전처리와 학습을 다시 해서 행 수·점수·실험 점수가 학생 노트북과 같은지 봐요. 코드를 몰래 고쳐 점수를 바꾸면 여기서 드러나요. 다시 계산을 못 한 노트북도 ⚠️로 알려 줘요.', '📝 답에서 학생이 더한 글만 떼어 빈 답과 비슷한 답(순서를 바꾸거나 덧붙여도 네 글자 조각이 60% 넘게 겹침)을 찾아요.', '"답 속 숫자"는 학생이 답에 쓴 숫자 가운데 실행 결과에 실제로 나온 숫자의 수예요. 명단에 있는데 노트북이 없는 학생도 한 줄로 나와요.'],
    "📋 노트북 3개를 점검했어요. ⚠️가 있는 학생 2명 — 점검표.csv(왼쪽 📁 파일)에도 저장했어요.\n                 파일     학번   이름                                   ⚠️ 다시 계산  빈 답 답 속 숫자(출력에 있는 것/전체)\n0  10101_김펭귄.ipynb  10101  김펭귄                                        ✅ 같음     0             9/10\n1  10102_이아델.ipynb  10102  이아델           다시 계산한 결과가 다름(코드나 결과를 고침?)  ⚠️ 다름(…)     0             6/7\n2  10103_박젠투.ipynb  10103  박젠투  빈 답: 3-4, 4-3 / 1-2 답이 10101와 비슷함      ✅ 같음     2             3/8"),
    md(String.raw`
## 3. 현장 확인 설명지와 답 열쇠
마지막 차시에 **AI 챗봇도 노트북도 없이 10분**, 학생은 설명지만 보며 평가 요소마다 한 문제씩 답해요. 설명지에는 그 학생의 숫자와 문제가 다 들어 있고, 노트북에 이미 적은 답을 옮겨 쓰는 문제가 아니라 **조건을 바꾸면 어떻게 될지** 묻는 문제예요. ④의 행은 비밀 낱말로 고르니 미리 알 수 없어요.
`),
    code(String.raw`
비밀 = '✏️ 선생님만 아는 낱말'   # ✏️ 해마다 바꿔요 — 학생마다의 ④ 행을 고를 때 써요
if 비밀.startswith('✏️') or len(비밀.strip()) < 4:
    raise ValueError('비밀 낱말을 선생님만 아는 낱말(4글자 이상)로 바꾸고 다시 실행해요.')

import io, contextlib
알고이름 = {'knn': 'k-최근접 이웃', 'tree': '의사결정 트리', 'linear': '선형 회귀'}

def _찍어(함수, *a, **k):
    글 = io.StringIO()
    with contextlib.redirect_stdout(글):
        함수(*a, **k)
    return 글.getvalue().rstrip()

def 현장_행(학번, 테스트수, 확인행):
    h = int(hashlib.sha256((비밀 + ':' + str(학번)).encode('utf-8')).hexdigest(), 16)
    후보 = [i for i in range(테스트수) if i != 확인행]
    return 후보[h % len(후보)]

def _바꾼말(바꿀것, features):
    말 = []
    for k, v in 바꿀것.items():
        if k == '속성':
            말.append('입력에서 ' + ', '.join(f for f in features if f not in v) + ' 빼기')
        elif k == '값':
            말.append('하이퍼파라미터 ' + ('·'.join(map(str, v)) if isinstance(v, list) else str(v)))
        elif k == '정규화':
            말.append('0~1 정규화 ' + ('하기' if v else '하지 않기'))
        elif k == '훈련비율':
            말.append(f'훈련 데이터 {int(v * 100)}%만 쓰기')
        elif k == '알고리즘':
            말.append(f'알고리즘을 {알고이름.get(v, v)}(으)로')
    return ', '.join(말)

def 다른_조건(s, 재):
    # ③ — 꼭 할 실험과 같은 종류에서 한 걸음 더 바꾼 조건(학생은 예상하고, 답 열쇠는 계산한 결과)
    과제 = 나만의_조건(s['학번'])['실험과제']
    설정, 알고 = 재['설정'], 재['설정']['ALGORITHM']
    꼭 = next((e for e in s['실험'] if e.get('꼭할')), {'바꿀것': {}})
    if 과제 == 실험과제_목록[0]:
        남김 = 꼭['바꿀것'].get('속성', s['FEATURES'][1:])
        다른 = next((f for f in 남김 if len(s['FEATURES']) > 1), None)
        return ({'속성': [f for f in s['FEATURES'] if f != 다른]}, f"입력에서 '{다른}'을(를) 빼면") if 다른 else ({'훈련비율': 0.25}, '훈련 데이터를 4분의 1만 쓰면')
    if 과제 == 실험과제_목록[1]:
        if 알고 == 'tree':
            return {'값': 1}, '트리의 max_depth를 1(질문 한 번)로 하면'
        k = max(1, len(재['결과']['y_train']) // 2)
        return {'알고리즘': 'knn', '값': k}, f'k-최근접 이웃의 k를 {k}(훈련 데이터의 절반)로 하면'
    if 과제 == 실험과제_목록[2]:
        다른 = 'tree' if 알고 == 'knn' else 'knn'
        return {'알고리즘': 다른, '정규화': not 설정['SCALE']}, f"알고리즘을 {알고이름[다른]}(으)로 바꾸고 정규화를 {'하면' if not 설정['SCALE'] else '하지 않으면'}"
    if 과제 == 실험과제_목록[3]:
        return {'훈련비율': 0.25}, '훈련 데이터를 4분의 1만 쓰면'
    후보 = ['knn', 'tree'] if 설정['목적'] == '분류' else ['linear', 'knn', 'tree']
    남은 = [a for a in 후보 if a != 알고 and {'알고리즘': a} != 꼭['바꿀것']]
    return ({'알고리즘': 남은[0]}, f'알고리즘을 {알고이름[남은[0]]}(으)로 바꾸면') if 남은 else ({'알고리즘': 'knn', '값': 1}, 'k-최근접 이웃의 k를 1로 하면')

def _현장_보기(재, 위치, s):
    결과 = 재['결과']
    if isinstance(결과['model'], (KNeighborsClassifier, KNeighborsRegressor)):
        거리, 번호 = 결과['model'].kneighbors(결과['X_test'].iloc[[위치]])
        줄 = [f"테스트 데이터 맨 위에서 {위치 + 1}번째 행 — 원래 값 {재['df'].loc[결과['X_test'].index[위치], s['FEATURES']].to_dict()}",
             f'가장 가까운 이웃 {len(번호[0])}개(거리 · 정답):']
        줄 += [f"   거리 {d:.3f} · {결과['y_train'].iloc[j]}" for d, j in zip(거리[0], 번호[0])]
        return '\n'.join(줄)
    return _찍어(원리_설명, 결과, 위치, False, 재['df'], s['FEATURES'], s['TARGET']).replace('   ✏️ ', '   ')

설명지, 열쇠, 못만듦, 현장물음 = [], [], [], {}
for z in 점검:
    s, 재 = z['읽은것'].get('요약'), z['읽은것'].get('다시')
    if not s:
        continue
    지표_ = '정확도' if s['목적'] == '분류' else '평균 절대 오차(MAE)'
    머리 = f'## 현장 설명지 — {s["학번"]} {s["이름"]}  (AI 챗봇·노트북·검색·대화 없이 10분)'
    if not 재:
        못만듦.append(s['학번'])
        설명지.append(f'{머리}\n(다시 계산을 못 해 설명지를 만들지 못했어요 — 학생의 노트북을 함께 보며 선생님이 직접 물어봐요)\n')
        continue
    찍기말 = '가장 많은 값으로만 찍기' if s['목적'] == '분류' else '훈련 데이터의 평균으로만 찍기'
    빈칸 = int(재['df'][s['FEATURES']].isnull().sum().sum())
    if 빈칸:
        바꾼전처리 = dict(missing='지우기' if s['MISSING'] == '평균' else '평균', outlier=s['OUTLIER'])
        전처리말 = f"결측치 처리를 '{바꾼전처리['missing']}'(으)로 바꾸면"
    else:
        바꾼전처리 = dict(missing=s['MISSING'], outlier='그대로' if s['OUTLIER'] == '지우기' else '지우기')
        전처리말 = f"이상치 처리를 '{바꾼전처리['outlier']}'(으)로 바꾸면"
    _, _, 바뀐기록 = 전처리(재['df'], s['FEATURES'], s['TARGET'], s['목적'], 바꾼전처리['missing'], 바꾼전처리['outlier'])
    꼭 = next((e for e in s['실험'] if e.get('꼭할')), None)
    다른바꿀것, 다른말 = 다른_조건(s, 재)
    다른점수 = round(학습(재['X'], 재['y'], 재['설정'], **다른바꿀것)['점수'], 4)
    위치 = 현장_행(s['학번'], len(재['결과']['X_test']), s['확인행'])
    현장물음[s['학번']] = [f'성공 기준이 기준 {지표_} {재["찍기"]}(학습 없이 {찍기말})와 견주어 알맞은지',
                       f'{전처리말} 남는 행이 어떻게 달라지는지',
                       f'{다른말} 성능이 어떻게 될지 배운 원리로 예측하기',
                       '처음 보는 테스트 데이터 한 행에서 모델의 판단 과정을 손으로 따라가기']
    설명지.append('\n'.join([
        머리,
        f'내 프로젝트: {s["TARGET"]} {s["목적"]} · {알고이름.get(s["ALGORITHM"], s["ALGORITHM"])} · 테스트 {지표_} {s["점수"]}',
        f'① 아무것도 배우지 않고 {찍기말}만 해도 {지표_}가 {재["찍기"]}예요. 1-3에서 정한 내 성공 기준은 이것과 견주어 알맞았나요? 그 까닭과 함께 적어요.',
        f'② 내 전처리는 처음 {재["기록"]["처음"]}행 → 남은 {재["행수"]}행이었어요. {전처리말} 남는 행은 늘까 줄까, 어느 단계가 왜 달라질지 적어요.',
        f'③ 꼭 할 실험({_바꾼말(꼭["바꿀것"], s["FEATURES"]) if 꼭 else "—"})의 결과는 {꼭["점수"] if 꼭 else "—"}였어요(처음 {s["점수"]}). {다른말} {지표_}는 처음보다 좋아질까 나빠질까? 배운 원리로 까닭을 적어요.',
        f'④ 아래는 내 모델이 테스트 데이터의 한 행을 판단할 때 쓰는 정보예요(답은 가렸어요). 내 모델이 무엇이라고 답할지, 어떤 과정으로 그렇게 되는지 따라가 적어요.',
        chr(96) * 3, _현장_보기(재, 위치, s), chr(96) * 3, '']))
    열쇠.append('\n'.join([
        f'## 답 열쇠 — {s["학번"]} {s["이름"]}',
        f'① 찍기 {재["찍기"]} · 학생 모델 {s["점수"]} (성공 기준이 찍기보다 낮거나 같으면 의미가 없다는 점을 짚는지)',
        f'② 바꾼 전처리의 기록: {바뀐기록} (지금: {재["기록"]})',
        f'③ {다른말} → {지표_} {다른점수} (처음 {s["점수"]}) — 결과와 방향이 달라도 원리에 맞는 까닭이면 ○',
        f'④ 테스트 맨 위에서 {위치 + 1}번째 행',
        _찍어(원리_설명, 재['결과'], 위치, True, 재['df'], s['FEATURES'], s['TARGET']), '']))

open('현장설명지.md', 'w', encoding='utf-8').write('\n'.join(설명지))
open('현장답열쇠.md', 'w', encoding='utf-8').write('\n'.join(열쇠))
print(f'📝 현장 설명지 {len(설명지)}장 · 답 열쇠 {len(열쇠)}장을 만들었어요 (왼쪽 📁 파일에서 내려받아 인쇄).')
if 못만듦:
    print('⚠️ 다시 계산을 못 해 설명지를 직접 만들어야 하는 학생:', ', '.join(못만듦))
print(설명지[0] if 설명지 else '')
`, ['학생마다 그 학생의 숫자가 들어간 설명지를 만들어요. ②③은 조건을 바꾸면 어떻게 될지 묻고, 답 열쇠에는 실제로 계산한 결과가 들어가요.', '④는 비밀 낱말로 고른 행을, 답을 가린 채 설명지에 그대로 실어요. 학생은 노트북 없이 설명지만 보고 따라가요.'],
    "📝 현장 설명지 3장 · 답 열쇠 3장을 만들었어요 (왼쪽 📁 파일에서 내려받아 인쇄).\n## 현장 설명지 — 10101 김펭귄  (AI 챗봇·노트북·검색·대화 없이 10분)\n내 프로젝트: species 분류 · 의사결정 트리 · 테스트 정확도 0.9419\n① 아무것도 배우지 않고 가장 많은 값으로만 찍기만 해도 정확도가 0.4419예요. 1-3에서 정한 내 성공 기준은 이것과 견주어 알맞았나요? 그 까닭과 함께 적어요.\n② 내 전처리는 처음 344행 → 남은 342행이었어요. 결측치 처리를 '지우기'(으)로 바꾸면 남는 행은 늘까 줄까, 어느 단계가 왜 달라질지 적어요.\n③ 꼭 할 실험(0~1 정규화 하기)의 결과는 0.9419였어요(처음 0.9419). 알고리즘을 k-최근접 이웃(으)로 바꾸고 정규화를 하면 정확도는 처음보다 좋아질까 나빠질까? 배운 원리로 까닭을 적어요.\n④ 아래는 내 모델이 테스트 데이터의 한 행을 판단할 때 쓰는 정보예요(답은 가렸어요). …"),
    md(String.raw`
## 4. 점수 합계 — 현장 확인으로 상한 두기
노트북에서 정한 수준과 현장 확인 결과를 적어요. 현장 확인이 **○면 노트북 수준 그대로**, **△면 중간 수준까지**, **×면 가장 낮은 수준**이에요. 현장 확인은 ○·△·×(또는 O·X)로 적어요.
`),
    code(String.raw`
# ✏️ 한 줄에 학생 한 명: 학번, 이름, 노트북 수준 ①②③④, 현장 확인 ①②③④(○·△·×), 메모
# 메모에 현장 확인에서 학생이 스스로 설명한 핵심을 ①~④ 번호와 함께 적어 두면 세특 재료의 그 영역에 ★ 근거로 들어가요
# (예: '① 기준 정확도 0.44보다 높아야 의미가 있다고 설명 ④ 날개 길이 질문에서 갈려 젠투로 따라감').
# 낼 뜻이 없어 내지 않은 학생은 노트북 수준을 모두 None으로 두면 20점(미응시)이 돼요.
채점 = [
    ['10101', '김펭귄', 30, 20, 25, 15, '○', '○', '△', '○', ''],
    ['10102', '이아델', None, None, None, None, '', '', '', '', '미제출'],
]

수준 = [(30, 20, 10), (30, 20, 10), (25, 15, 5), (15, 10, 5)]   # 요소마다 (상, 중, 하)
표준 = {'○': '○', 'O': '○', 'o': '○', '◯': '○', '△': '△', '▲': '△', '×': '×', 'X': '×', 'x': '×', '✕': '×'}

def 최종(점수, 현장, 단계):
    상, 중, 하 = 단계
    return 하 if 현장 == '×' else min(점수, 중) if 현장 == '△' else 점수

표, 현장기록 = [], {}
for 줄 in 채점:
    학번_, 이름_, 노트북, 현장 = 줄[0], 줄[1], 줄[2:6], 줄[6:10]
    if all(s is None for s in 노트북):
        표.append([학번_, 이름_, *[None] * 4, 20, 줄[10]])
        현장기록[학번_] = dict(노트북=None, 현장=None, 최종=None, 합계=20, 메모=줄[10])
        continue
    if any(s is None for s in 노트북):
        raise ValueError(f'{학번_}: 아직 비어 있는 요소가 있어요')
    for s, 단계 in zip(노트북, 수준):
        if s not in 단계:
            raise ValueError(f'{학번_}: {s}는 허용된 점수가 아니에요 {단계}')
    현장 = [표준.get(str(h).strip()) for h in 현장]
    if None in 현장:
        raise ValueError(f'{학번_}: 현장 확인은 ○·△·×로 적어요(현장 확인을 못 했으면 다음 시간에 하고 적어요)')
    끝 = [최종(s, h, 단계) for s, h, 단계 in zip(노트북, 현장, 수준)]
    표.append([학번_, 이름_, *끝, sum(끝), 줄[10]])
    현장기록[학번_] = dict(노트북=노트북, 현장=현장, 최종=끝, 합계=sum(끝), 메모=줄[10])

채점표 = pd.DataFrame(표, columns=['학번', '이름', '①문제정의', '②데이터·구현', '③성능·개선', '④표현·설명', '합계', '메모'])
채점표.to_csv('채점표.csv', index=False, encoding='utf-8-sig')
print('💾 채점표.csv를 만들었어요 (왼쪽 📁 파일에서 내려받기)')
채점표
`, ['노트북 수준(① 30·20·10, ② 30·20·10, ③ 25·15·5, ④ 15·10·5)과 현장 확인(○·△·×)을 적어요. 가장 낮은 수준의 합이 기본점수 30점이에요.', '허용되지 않은 점수, 비어 있는 요소, ○·△·×가 아닌 현장 확인은 오류로 알려 줘요(O·X는 ○·×로 읽어요).'],
    "💾 채점표.csv를 만들었어요 (왼쪽 📁 파일에서 내려받기)\n      학번   이름  ①문제정의  ②데이터·구현  ③성능·개선  ④표현·설명  합계   메모\n0  10101  김펭귄   30.0     20.0     15.0     15.0  80\n1  10102  이아델    NaN      NaN      NaN      NaN  20  미제출"),
    md(String.raw`
## 5. 세특 재료 — 생기부 생성 프롬프트에 그대로 넣기
학생의 실행 결과, 📝 답, 교사 확인(다시 계산·현장 확인)을 **인공지능 기초의 교과 역량별로** 묶어요. 학생 한 명의 재료(### 부터 다음 ### 전까지)를 생기부 생성 프롬프트에 그대로 붙여 넣으면 돼요.
- 진로보다 **교과 역량**(컴퓨팅 사고력 · 인공지능 소양 · 디지털 문화 소양)과 성취기준이 드러나게 묶었어요.
- 현장 확인이 ○인 영역은 "확인됨", △는 "일부 확인(배우는 과정으로만)", ×는 내용을 싣지 않고 "쓰지 않기"로 나와요. 3·4번 셀을 먼저 실행해요.
- **[코드 계산]**은 프로그램이 낸 값(학생의 판단이 아님), 따옴표와 "항목: 내용"은 학생이 쓴 말, **★**은 현장에서 노트북 없이 다룬 내용과 교사 메모예요. 점수·점검 결과는 재료 밖(맨 아래 교사용 참고)에 따로 두었어요.
`),
    code(String.raw`
from collections import Counter

상태말 = {'○': '확인됨', '△': '일부 확인', '×': '확인 안 됨', None: '현장 확인 전'}
상태풀이 = {'○': '중심으로 쓰기',
          '△': '이룬 성과(~함·~확인함)로 쓰지 말고 "~을 시도하며 ~을 알아 가고 있음"처럼 배우는 과정으로 한 구절만',
          '×': '쓰지 않기',
          None: '현장 확인 뒤에 쓰기'}
기본물음 = ['성공 기준을 학습 없이 찍은 기준 성능과 견주기', '전처리를 바꾸면 남는 행이 어떻게 달라지는지',
          '실험 조건을 한 걸음 더 바꾸면 성능이 어떻게 될지 원리로 예측하기', '처음 보는 한 행에서 모델의 판단 과정을 손으로 따라가기']
쓰는법 = ('쓰는 법: 아래의 사실과 학생 자신의 말만 근거로 쓰고 부풀리지 않는다. 진로보다 인공지능 기초의 교과 역량'
       '(컴퓨팅 사고력·인공지능 소양·디지털 문화 소양)이 드러나게, 학생이 무엇을 근거로 판단하고 어떻게 검증·개선했는지 중심으로 쓴다. '
       '영역마다 붙은 상태를 따른다 — "확인됨"은 중심으로, "일부 확인"은 이룬 성과가 아니라 배우는 과정으로 한 구절만, "확인 안 됨"과 "(비어 있음)"은 쓰지 않는다. '
       '★ 줄(현장 확인에서 노트북 없이 다룬 내용과 교사 메모)을 가장 믿을 만한 근거로 삼는다. '
       '확인된 영역이 적으면 글자 수를 채우려 일반론·교사의 점검·노트북 기본값을 문장으로 만들지 말고 짧게 쓴다. '
       '[코드 계산]은 프로그램이 자동으로 낸 값이라 학생의 판단이나 활동으로 쓰지 않는다. '
       '학생이 "실행해 확인했다"고 쓴 결과는 실험 줄이나 [코드 계산]에 같은 방향의 숫자가 있을 때만 사실로 쓰고, 없거나 반대면 결과는 빼고 학생의 판단(까닭)만 쓴다. '
       '노트북 기본값을 그대로 둔 설정은 학생이 까닭을 적었을 때만 판단으로 쓴다. 〔AI 도움〕이 붙은 답은 표현을 옮기지 말고 사실과 숫자 중심으로 쓴다. '
       '영어 열 이름·코드 이름은 "열 이름 풀이"대로 우리말로, "찍기"는 "기준 성능"으로 쓰고, 오차(작을수록 좋음)는 "기준을 넘음"이 아니라 "기준을 달성함"으로 쓴다. '
       '학생 이름과 상호명·제품명(코딩 환경, AI 챗봇, 라이브러리 이름)은 쓰지 않는다.')
기본값 = dict(DATASET='penguins', MISSING='평균', OUTLIER='그대로', SCALE=False, ALGORITHM='tree', PARAM=None)

def _AI도움(r):
    # 4-4 표에서 학생이 생성형 AI를 썼다고 밝힌 질문 번호(전체면 모든 답)
    곳 = set()
    for 줄 in r['답'].get('4-4', '').splitlines():
        t = 줄.strip()
        if not t.startswith('|') or set(t) <= set('|-: '):
            continue
        칸 = _칸(t) + ['', '', '']
        if 칸[0] and 칸[0] != '질문 번호' and 칸[1] and '안 씀' not in 칸[2]:
            곳 |= set(re.findall(r'\d-\d(?:\([가나]\))?', 칸[0])) | ({'전체'} if '전체' in 칸[0] else set())
    return 곳

def _바꾼설정(s):
    추천_ = 데이터_목록.get(s['DATASET'], {})
    바꿈 = []
    if s['DATASET'] != 기본값['DATASET']:
        바꿈.append('데이터')
    if s['TARGET'] != 추천_.get('TARGET'):
        바꿈.append('맞힐 열')
    if sorted(s['FEATURES']) != sorted(추천_.get('FEATURES', [])):
        바꿈.append('입력 열')
    이름 = dict(MISSING='결측치 처리', OUTLIER='이상치 처리', SCALE='정규화', ALGORITHM='알고리즘', PARAM='하이퍼파라미터')
    바꿈 += [말 for k, 말 in 이름.items() if s.get(k) != 기본값[k]]
    그대로 = [말 for k, 말 in 이름.items() if s.get(k) == 기본값[k]]
    return (', '.join(바꿈) or '없음') + (f" · 기본값 그대로: {', '.join(그대로)}" if 그대로 else '')

def _헷갈림(재, 분류):
    yt = np.asarray(재['결과']['y_test'])
    yp = np.asarray(재['결과']['pred'])
    if not 분류:
        오차 = np.abs(yt.astype(float) - yp.astype(float))
        i = int(오차.argmax())
        return f'가장 크게 틀린 예: 실제 {float(yt[i]):.4g}, 예측 {float(yp[i]):.4g}(오차 {오차[i]:.3g})'
    yt, yp = yt.astype(str), yp.astype(str)
    부분 = [f"실제 '{c}' {n}개 중 {k}개 맞힘(재현율 {k / n:.2f})" for c in sorted(set(yt))[:6] for n, k in [(int((yt == c).sum()), int(((yt == c) & (yp == c)).sum()))]]
    짝 = Counter((a, b) for a, b in zip(yt, yp) if a != b).most_common(1)
    return ' · '.join(부분) + (f" · 가장 많이 헷갈린 짝: 실제 '{짝[0][0][0]}'을(를) '{짝[0][0][1]}'(으)로 {짝[0][1]}개" if 짝 else ' · 틀린 것 없음')

def _울타리밖(df, 열들):
    말 = []
    for c in 숫자_열(df, 열들):
        낮은, 높은 = 울타리(df[c])
        n = 0 if 낮은 == 높은 else int((df[c].notna() & ~df[c].between(낮은, 높은)).sum())
        if n:
            말.append(f'{c} {n}개')
    return ', '.join(말) or '없음'

def _다른설정(s, 재):
    # 학생이 "해 봤더니 ~했다"고 쓴 말을 확인할 때만 — 정규화·이상치 처리를 반대로 했을 때의 결과
    말 = []
    try:
        말.append(f"정규화를 {'하지 않으면' if s['SCALE'] else '하면'} {round(학습(재['X'], 재['y'], 재['설정'], 정규화=not s['SCALE'])['점수'], 4)}")
    except Exception:
        pass
    try:
        반대 = '그대로' if s['OUTLIER'] == '지우기' else '지우기'
        X2, y2, 기록2 = 전처리(재['df'], s['FEATURES'], s['TARGET'], s['목적'], s['MISSING'], 반대)
        if 기록2['남은 행'] != 재['행수']:
            차이 = 재['y'].value_counts().sub(y2.value_counts(), fill_value=0).abs()
            반별 = ' · '.join(f"'{k}' {int(v)}개" for k, v in 차이.items() if v) if s['목적'] == '분류' else ''
            말.append(f"이상치를 {'지우면' if 반대 == '지우기' else '그대로 두면'} {round(학습(X2, y2, 재['설정'])['점수'], 4)}"
                     f"(남은 {기록2['남은 행']}행{' — 달라진 행: ' + 반별 if 반별 else ''} · 테스트 데이터도 바뀌어 점수만으로 견주기 어려움)")
    except Exception:
        pass
    return ' · '.join(말)

def _기준점검(r, 분류, 점수):
    # 1-3 성공 기준 줄에서 첫 숫자를 읽어 달성 여부를 봐요(정확도는 이상, 오차는 이하면 달성)
    줄 = next((줄 for 줄 in (_답줄('1-3', r['답']['1-3']) if '1-3' in r['답'] else []) if 줄.startswith('성공 기준')), '')
    m = re.search(r'\d+(?:\.\d+)?', 줄.split(':', 1)[-1])
    if not m:
        return '학생의 성공 기준에서 숫자를 읽지 못함'
    n = float(m.group())
    n = n / 100 if 분류 and 1 < n <= 100 else n
    return f"학생 기준 {n:g} · 모델 {점수} → {'달성' if (점수 >= n if 분류 else 점수 <= n) else '미달'}"

def _실험해석(r):
    # 3-3 표에서 번호마다 마지막 칸(예상과 같았나? 왜?)
    해석 = {}
    for 줄 in r['답'].get('3-3', '').splitlines():
        칸 = _칸(줄) if 줄.strip().startswith('|') else []
        if 칸 and 칸[0].isdigit() and any(칸[1:]):
            해석[int(칸[0])] = 칸[-1]
    return 해석

def 세특_재료(z):
    r, s, 재 = z['읽은것'], z['읽은것'].get('요약'), z['읽은것'].get('다시')
    if not s:
        return None
    기록 = 현장기록.get(s['학번'], {})
    현장 = 기록.get('현장') or [None] * 4
    물음 = globals().get('현장물음', {}).get(s['학번'], 기본물음)
    AI = _AI도움(r)
    분류 = s['목적'] == '분류'
    지표_ = '정확도' if 분류 else '평균 절대 오차'
    d = 데이터_목록.get(s['DATASET'], {})
    메모 = {}
    for 조각 in re.split(r'(?=[①②③④])', str(기록.get('메모') or '')):
        조각 = 조각.strip(' ·,/')
        if 조각:
            메모['①②③④'.index(조각[0]) if 조각[0] in '①②③④' else None] = 조각.lstrip('①②③④').strip(' ·:')

    def 별(i, 글):
        # 현장 확인에서 노트북 없이 다룬 내용 — 가장 믿을 만한 근거
        return 글.replace('- ', '- ★ ', 1) if 현장[i] in ('○', '△') else 글

    def 말(키, 줄수=6, 글자=320, 빈칸=True, 뺄=()):
        줄들 = [줄 for 줄 in _답줄(키, r['답'][키], 빈칸) if not 줄.startswith(뺄)] if 키 in r['답'] else []
        if all(줄.endswith('(비어 있음)') for 줄 in 줄들):
            return '(비어 있음 — 쓰지 않기)'
        글 = ' / '.join(줄들[:줄수])
        return (글[:글자] + '…' if len(글) > 글자 else 글) + (' 〔AI 도움〕' if AI & {키, '전체'} else '')

    def 영역(제목, i, 줄들, 메모도=True):
        h = 현장[i]
        머리 = f'#### {제목} · 현장 {"①②③④"[i]} · 상태: {상태말[h]} — {상태풀이[h]}'
        if h == '×':
            return [머리, '- (현장 확인에서 스스로 설명하지 못한 영역이라 내용을 싣지 않았어요)', '']
        return [머리, *([f'- 현장에서 노트북 없이 다룬 물음: {물음[i]}'] if h else []),
                *([f'- ★ 현장에서 학생이 한 설명(교사 메모): {메모[i]}'] if 메모도 and i in 메모 else []), *줄들, '']

    def 한줄(i, 글):
        h = 현장[i]
        return None if h == '×' else f'{글} · 상태: {상태말[h]} — {상태풀이[h]}'

    알고 = 알고이름.get(s['ALGORITHM'], s['ALGORITHM'])
    하이퍼 = f" (k = {s['PARAM'] or 5})" if s['ALGORITHM'] == 'knn' else f" (최대 깊이 {s['PARAM'] or 3})" if s['ALGORITHM'] == 'tree' else ''
    입력 = ', '.join(s['FEATURES'][:8]) + (f' 외 {len(s["FEATURES"]) - 8}개' if len(s['FEATURES']) > 8 else '')
    데이터말 = f"{d['분야']} 분야의 공개 데이터 「{d['설명']}」" if d else f"학생이 직접 구한 데이터({os.path.basename(s.get('MY_CSV', ''))})"
    한글 = d.get('열', {})
    풀이 = ', '.join(f'{c} = {한글[c]}' for c in [s['TARGET'], *s['FEATURES']] if c in 한글) or '(직접 구한 데이터 — 학생 답을 보고 우리말로 풀어 쓰기)'

    처음 = 재['점수'] if 재 else s['점수']
    기준말, 전처리말, 다른말, 헷갈림 = '—', '—', '', ''
    if 재:
        ytr = 재['결과']['y_train']
        기준말 = (f"학습 없이 훈련 데이터에서 가장 많은 값 '{ytr.mode()[0]}'(으)로만 답하면 정확도 {재['찍기']}" if 분류
                 else f"학습 없이 훈련 데이터의 평균 {float(ytr.mean()):.4g}(으)로만 답하면 평균 절대 오차 {재['찍기']}")
        기 = 재['기록']
        자동 = [f'{k} {기[k]}' for k in ('겹친 행', '정답이 빈 행', '입력이 모두 빈 행') if 기.get(k)]
        빈칸수 = 기.get('채운 빈칸', 기.get('빈칸 있는 행', 0))
        결측 = ('처리할 빈칸이 없어 결측치 설정은 결과에 영향 없음' if not 빈칸수
               else f'빈칸 {빈칸수}개를 평균(글자 열은 가장 많은 값)으로 채움' if s['MISSING'] == '평균' else f'빈칸 있는 행 {빈칸수}개를 지움')
        이상 = f"울타리 밖 행 {기.get('이상치', 0)}개를 지움" if s['OUTLIER'] == '지우기' else '그대로 둠'
        전처리말 = (f"처음 {기['처음']}행 → 남은 {재['행수']}행"
                 + (f" · 코드가 자동으로 뺀 행(학생의 판단 아님): {', '.join(자동)}" if 자동 else '')
                 + f" · 결측치: {결측} · 이상치: {이상} · 0~1 정규화: {'함' if s['SCALE'] else '하지 않음'}"
                 + f" · 울타리 밖 값: {_울타리밖(재['df'], s['FEATURES'])}")
        다른말 = _다른설정(s, 재)
        헷갈림 = _헷갈림(재, 분류)

    점수들 = 재['실험점수'] if 재 else [e['점수'] for e in s['실험']]
    판정 = lambda v: '같음' if abs(v - 처음) < 1e-9 else ('좋아짐' if (v > 처음) == 분류 else '나빠짐')
    변화 = [max(abs(x - 처음) for x in v) if isinstance(v, list) else abs(v - 처음) for v in 점수들]
    가장 = 변화.index(max(변화)) if 변화 and max(변화) > 0 else None
    실험줄, 해석 = [], _실험해석(r)
    for i, (e, v) in enumerate(zip(s['실험'], 점수들)):
        누가 = '교사가 학번으로 정해 준 실험' if e.get('꼭할') else '학생이 스스로 고른 실험'
        결과 = (', '.join(f'{값} → {x}({판정(x)})' for 값, x in zip(e['바꿀것'].get('값', []), v)) if isinstance(v, list)
                else f'{v}(처음 {처음}보다 {판정(v)})')
        고침 = f" · 결과를 본 뒤 가설을 고친 적 있음({len(e['이전 가설'])}번)" if e.get('이전 가설') else ''
        실험줄.append(f"  {i + 1}. {누가} — 실행 전 가설(학생의 말): \"{e['가설']}\"{고침} → 바꾼 것: {_바꾼말(e['바꿀것'], s['FEATURES'])}"
                    f" → [코드 계산] {지표_} {결과}" + (' · 실험 가운데 변화가 가장 큼' if 가장 == i else '')
                    + f" → 학생의 해석(3-3): {해석.get(i + 1) or '(비어 있음)'}")
    남은해석 = sorted(set(해석) - set(range(1, len(s['실험']) + 1)))

    한계 = _답줄('3-4', r['답']['3-4']) if '3-4' in r['답'] else []
    윤리 = [줄 for 줄 in 한계 if 줄.startswith('한계 3')]
    네넷 = _답줄('4-4', r['답']['4-4']) if '4-4' in r['답'] else []
    AI씀 = bool(AI) or any(줄.startswith('AI를 썼다면') for 줄 in 네넷)
    다섯 = [한줄(2, f"- 윤리·공정성 한계와 개선(3-4 한계 3): {' / '.join(윤리)[:320] if 윤리 else '(비어 있음 — 쓰지 않기)'}"),
           한줄(3, f"- {'생성형 AI를 쓰고 검증한 기록' if AI씀 else '생성형 AI 없이 스스로 찾아 고친 오류'}(4-4): {' / '.join(네넷)[:420] if 네넷 else '(비어 있음 — 쓰지 않기)'}")]
    다섯 = [줄 for 줄 in 다섯 if 줄]
    상태들 = {i + 1: 현장[j] for i, j in enumerate([0, 1, 3, 2, None, 3]) if j is not None}
    요약 = ' · '.join(f"{상태말[h]} → {', '.join(str(k) for k, v in 상태들.items() if v == h)}" for h in ['○', '△', '×', None] if h in 상태들.values())
    검증 = z.get('다시 계산', '')
    return '\n'.join([
        f"### 세특 재료 — {s['학번']} {s['이름']} (이름은 세특에 쓰지 않아요)",
        '- 과목·활동: 인공지능 기초 · 인공지능 프로젝트 수행평가(인공지능 소프트웨어 개발) · 성취기준 [12인기04-01]~[12인기04-04]',
        f'- {쓰는법}',
        f'- 상태 요약: {요약} (5는 줄마다 표시)',
        '- 숫자 검증: ' + ('교사가 학생의 설정으로 다시 실행해 같은 결과를 얻음 — [코드 계산] 값은 사실임' if 검증.startswith('✅')
                       else f'다시 실행한 결과가 학생 노트북과 다르거나 확인하지 못함 — 숫자는 쓰지 않기'),
        *([f"- ★ 현장 확인 메모(교사가 들은 학생의 설명): {메모[None]}"] if None in 메모 else []),
        *([f"- 〔AI 도움〕: 학생이 4-4에서 생성형 AI의 도움을 받았다고 밝힌 답 — {', '.join(sorted(AI))}"] if AI else []),
        f'- 데이터: {데이터말}, {s["처음행수"]}행',
        f'- 열 이름 풀이(세특에는 우리말로): {풀이}',
        f'- 노트북 기본값에서 학생이 바꾼 설정: {_바꾼설정(s)}',
        '',
        *영역('1. 문제 발견과 개발 계획 — [12인기04-01]·[12인기04-02] · 컴퓨팅 사고력(문제 분석·추상화)', 0, [
            f'- 데이터로 답할 수 있는 질문과 고른 까닭(1-1): {말("1-1", 뺄=("고른 데이터",))}',
            f'- 정의한 문제 · 사용 대상 · 지속가능발전목표(1-2): {말("1-2")}',
            f'- 기능 설계: 입력 {입력} → 출력 {s["TARGET"]} ({s["목적"]})',
            별(0, f'- 목적·기능·성공 기준(1-3): {말("1-3")}'),
            별(0, f'- [코드 계산] 기준 성능: {기준말} — 학생의 성공 기준과 견줘 읽기'),
            f'- [코드 계산] 성공 기준 점검: {_기준점검(r, 분류, 처음)}',
            f'- 개발 계획과 실제(1-4): {말("1-4", 6, 400, False)}']),
        *영역('2. 데이터 준비와 인공지능 기능 구현 — [12인기02-01]·[12인기02-02]·[12인기04-03] · 인공지능 소양(데이터 이해)·컴퓨팅 사고력(구현)', 1, [
            별(1, f'- [코드 계산] 전처리 기록: {전처리말}'),
            별(1, f'- 결측치·이상치를 살핀 결과와 판단(2-1): {말("2-1")}'),
            별(1, f'- 전처리를 고른 까닭(2-2): {말("2-2")}'),
            f'- 새 입력으로 작동 확인(2-4): {말("2-4")}' + ('' if s.get('새입력') else ' (직접 만든 입력이 아님)'),
            *([f'- [코드 계산 — 학생의 말을 확인할 때만 쓰기] 설정을 반대로 하면: {다른말}'] if 다른말 else [])]),
        *영역('3. 알고리즘 선택과 원리 이해 — [12인기02-03] · 인공지능 소양(기계학습 원리)', 3, [
            f'- 알고리즘: {알고}{하이퍼}',
            f'- 고른 까닭(2-5): {말("2-5")}',
            별(3, f'- 확인 행을 답을 보기 전에 따라간 과정(4-2 가): {말("4-2(가)")}'),
            별(3, f'- 실제 결과와 견준 설명(4-2 나): {말("4-2(나)")}')]),
        *영역('4. 성능 점검과 개선 — [12인기02-04]·[12인기04-04] · 컴퓨팅 사고력(평가·일반화)', 2, [
            f'- [코드 계산] 테스트 {지표_}: {처음} · 기준 성능: {재["찍기"] if 재 else "—"}' + (f' · {헷갈림}' if 헷갈림 else ''),
            f'- 성능 해석(3-1): {말("3-1")}',
            f'- 오류 분석(3-2): {말("3-2")}',
            별(2, '- 가설을 먼저 세운 실험(숫자는 다시 실행해 맞춘 값):'), *실험줄,
            *([f"- 실험 해석(3-3)의 다른 줄: {' / '.join(f'{k}: {해석[k]}' for k in 남은해석)[:300]}"] if 남은해석 else []),
            f"- 한계와 개선 방안(3-4): {' / '.join(줄 for 줄 in 한계 if not 줄.startswith('한계 3'))[:400] or '(비어 있음 — 쓰지 않기)'}"]),
        f"#### 5. 인공지능의 사회적 영향과 책임 있는 활용 — [12인기04-04] · 디지털 문화 소양·인공지능 소양 · 상태: {'줄마다 표시' if 다섯 else '확인 안 됨 — 쓰지 않기'}",
        *(다섯 or ['- (현장 확인에서 스스로 설명하지 못한 영역이라 내용을 싣지 않았어요)']),
        '',
        *영역('6. 결과 표현과 배우고 달라진 점 · 인공지능 소양', 3, [
            f'- 결과 표현(4-1): {말("4-1")}',
            f'- 사용 대상에게 보여 줄 결과(4-1 나): {말("4-1(나)")}',
            f'- 개발 과정 돌아보기(4-3): {말("4-3")}',
            f'- 새로 이해한 원리와 달라진 생각(4-5): {말("4-5")}'], 메모도=False),
    ])

def _참고(z):
    기록 = 현장기록.get(z['학번'], {})
    return (f"노트북 수준 {기록.get('노트북')} · 현장 확인 {기록.get('현장')} · 최종 {기록.get('최종')} · 합계 {기록.get('합계')}"
            f" · 다시 계산 {z.get('다시 계산', '—')} · 점검 ⚠️ {' / '.join(z['⚠️']) or '없음'}")

재료 = [(z['학번'], z['이름'], 세특_재료(z), _참고(z)) for z in 점검]
재료 = [m for m in 재료 if m[2]]
open('세특재료.md', 'w', encoding='utf-8').write('\n'.join(m[2] for m in 재료)
    + '\n## 교사용 참고 — 생기부 프롬프트에 넣지 않아요\n' + '\n'.join(f'- {m[0]} {m[1]}: {m[3]}' for m in 재료) + '\n')
pd.DataFrame(재료, columns=['학번', '이름', '세특재료', '참고']).to_csv('세특재료.csv', index=False, encoding='utf-8-sig')
print(f'📄 세특 재료 {len(재료)}명을 세특재료.md와 세특재료.csv로 만들었어요 (왼쪽 📁 파일에서 내려받기).\n')
print(재료[0][2] if 재료 else '')
`, ['학생 한 명의 재료는 "### 세특 재료"부터 다음 "###" 전까지예요. 이 부분을 생기부 생성 프롬프트에 그대로 붙여 넣어요. 점수와 점검 결과는 맨 아래 "교사용 참고"에만 있어요.', '학생이 쓴 말은 템플릿의 안내 글을 떼고 "항목: 내용"으로, 표는 머리글과 짝지어 옮겨요. 비운 칸은 "(비어 있음)"으로 남아요.', '[코드 계산]은 다시 실행해 얻은 값이에요. 현장 확인이 ×인 영역은 내용을 싣지 않아요.'],
    "📄 세특 재료 3명을 세특재료.md와 세특재료.csv로 만들었어요 (왼쪽 📁 파일에서 내려받기).\n\n### 세특 재료 — 10101 김펭귄 (이름은 세특에 쓰지 않아요)\n- 과목·활동: 인공지능 기초 · 인공지능 프로젝트 수행평가(인공지능 소프트웨어 개발) · 성취기준 [12인기04-01]~[12인기04-04]\n- 쓰는 법: …\n- 상태 요약: 확인됨 → 1, 2, 3, 6 · 일부 확인 → 4 (5는 줄마다 표시)\n…\n#### 1. 문제 발견과 개발 계획 — [12인기04-01]·[12인기04-02] · 컴퓨팅 사고력(문제 분석·추상화) · 현장 ① · 상태: 확인됨 — 중심으로 쓰기\n- 현장에서 노트북 없이 다룬 물음: 성공 기준이 기준 정확도 0.4419(학습 없이 가장 많은 값으로만 찍기)와 견주어 알맞은지\n…"),
  ],
};
