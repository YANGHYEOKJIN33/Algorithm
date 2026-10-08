/**
 * Colab 실습 노트북 — 사이트의 🐍 실습 쪽과 notebooks/*.ipynb 파일이 이 한 원본을 함께 쓴다.
 * (scripts/build.mjs가 .ipynb로 옮긴다. 노트북을 고칠 때는 여기만 고친다.)
 *
 * 셀 종류
 *   md(text)                 설명(마크다운)
 *   code(src, explain, out)  파이썬 코드 · 줄별 쉬운 설명(노트북에는 코드 앞 설명 셀로 들어감) · 실행 결과 예시(사이트에만)
 *
 * 파이썬 코드는 String.raw로 적어 역슬래시가 그대로 남는다. ${…}는 링크 상수에만 쓴다.
 */
import { PRACTICE_URL, RAW_URL, SITE_URL } from './links.js';

// String.raw는 \` 의 역슬래시까지 남기므로, 마크다운의 인라인 코드 표시(`)로 되돌린다
const md = (text) => ({ type: 'md', text: text.trim().replace(/\\`/g, '`') });
const code = (src, explain = [], out = null) => ({ type: 'code', code: src.trim(), explain, out });

const DATA = `${RAW_URL}data/penguins.csv`;
const CLEAN = `${RAW_URL}data/penguins_clean.csv`;
const PRACTICE = PRACTICE_URL.replace(/\/$/, '');

/** 그래프의 한글이 깨지지 않게 하는 셀 (그래프를 그리는 노트북마다) */
const FONT_CELL = code(String.raw`
!pip install -q koreanize-matplotlib
try:
    import koreanize_matplotlib  # 그래프에 한글 글꼴을 입혀 줘요
except ImportError:
    print('한글 글꼴을 불러오지 못했어요. 그래프 글자가 네모로 보일 수 있어요.')
import matplotlib.pyplot as plt
`, ['그래프에 한글(제목·축 이름)이 깨지지 않도록 글꼴 도구를 설치해요. 처음 한 번 1~2분 걸릴 수 있어요.']);

const HOWTO = md(String.raw`
> **Colab 사용법** — 셀 왼쪽의 ▶ 단추(또는 **Shift + Enter**)를 누르면 그 셀이 실행돼요.
> 위에서부터 **차례로** 실행하세요. 고쳐 보고 싶으면 먼저 **파일 → 드라이브에 사본 저장**을 눌러 내 것으로 만드세요.
> 파이썬을 몰라도 괜찮아요. 코드 위의 설명과 사이트의 의사코드를 짝지어 읽으면 돼요.
`);

export const NOTEBOOKS = [
  /* ══════════════════ 01 웹 크롤링 ══════════════════ */
  {
    id: '01_web_crawling',
    title: '🕸 웹 크롤링으로 펭귄 데이터 모으기',
    intro: '연습 사이트(펭귄 관측 기록 7쪽)를 진짜로 크롤링해 345줄짜리 표를 만들고 CSV 파일로 저장해요.',
    cells: [
      md(String.raw`
# 🕸 웹 크롤링으로 펭귄 데이터 모으기

**목표**: 웹 페이지의 표를 프로그램으로 읽어 와(크롤링) 데이터프레임으로 만들고 CSV 파일로 저장한다.

사이트에서 배운 의사코드 그대로예요.

    행목록 ← 빈 리스트
    반복: 쪽 번호 p = 1부터 7까지
        HTML ← p쪽 주소에 요청해서 받아 온다
        문서 ← HTML을 분석해 태그 나무로 만든다
        줄들 ← 문서에서 <tr> 태그를 모두 찾는다
        반복: 각 줄 tr (제목 줄은 건너뜀)
            행목록에 tr 안 <td> 글자들을 추가한다
    표 ← 행목록으로 데이터프레임을 만든다

연습 사이트: ${PRACTICE}/ (크롤링 연습용으로 만든 곳이라 안심하고 연습해도 돼요)
`),
      HOWTO,
      code(String.raw`
import requests                      # 웹 페이지 요청하기
from bs4 import BeautifulSoup        # HTML 분석하기
import pandas as pd                  # 표(데이터프레임) 다루기
import time                          # 잠깐 쉬기 (서버 예절)

SITE = '${PRACTICE}'
print('준비 완료!')
`, ['크롤링에 쓸 도구 네 가지를 불러와요(import).', 'SITE에 연습 사이트 주소를 넣어 둬요. 다른 사이트를 크롤링할 때는 이 주소만 바꿔요.'], '준비 완료!'),
      md(String.raw`
## 1. 한 쪽만 먼저 — 요청해서 HTML 받아 오기

\`requests.get(주소)\`는 브라우저처럼 서버에 "이 쪽 주세요"라고 **요청**해요. 서버가 보낸 **응답**의 \`.text\`가 HTML 글자예요.
`),
      code(String.raw`
res = requests.get(SITE + '/page1.html')
res.encoding = 'utf-8'               # 한글이 깨지지 않게
print('상태 코드:', res.status_code)  # 200이면 성공
print(res.text[:600])                # 앞부분 600글자만 보기
`, ['res = 서버의 응답이에요.', '상태 코드 200은 "잘 받았어요", 404는 "그런 쪽이 없어요"라는 뜻이에요.', '받은 HTML의 앞부분을 출력해 <table>, <tr>, <td> 태그를 눈으로 확인해요.'], '상태 코드: 200\n<!doctype html>\n<html lang="ko">\n…\n<table id="penguins">\n  <thead><tr><th>번호</th><th>종</th><th>섬</th>…'),
      md(String.raw`
## 2. HTML을 분석해 <tr> 찾기

BeautifulSoup이 긴 글자를 **태그 나무**로 바꿔 줘요. \`find_all('tr')\`은 표의 모든 줄(<tr>)을 리스트로 돌려줘요.
`),
      code(String.raw`
soup = BeautifulSoup(res.text, 'html.parser')
trs = soup.find_all('tr')
print('찾은 <tr> 개수:', len(trs))
print('첫 번째 줄(제목):', trs[0])
print('두 번째 줄(펭귄):', trs[1])
`, ['soup = 분석이 끝난 태그 나무예요.', 'trs = 모든 <tr>을 담은 리스트. 첫 번째(0번)는 <th>로 된 제목 줄이에요.'], '찾은 <tr> 개수: 51\n첫 번째 줄(제목): <tr><th>번호</th><th>종</th>…</tr>\n두 번째 줄(펭귄): <tr><td>1</td><td>아델리</td><td>토르거센</td>…</tr>'),
      md(String.raw`
## 3. 칸의 글자 꺼내기 → 행목록에 모으기

제목 줄의 \`<th>\` 글자는 열 이름으로, 나머지 줄의 \`<td>\` 글자는 행목록에 모아요.
`),
      code(String.raw`
header = [th.text for th in trs[0].find_all('th')]
rows = []
for tr in trs[1:]:                                  # 제목 줄(0번)은 건너뛰기
    cells = [td.text for td in tr.find_all('td')]   # <td> 안의 글자만
    rows.append(cells)                              # 행목록 맨 뒤에 추가
print('열 이름:', header)
print('모은 줄:', len(rows))
print(rows[:3])
`, ['[td.text for td in …]는 "모든 <td>에서 글자만 꺼내 리스트로" 라는 뜻이에요.', 'rows는 리스트 안의 리스트예요. 사이트의 "행목록"과 같아요.'], "열 이름: ['번호', '종', '섬', '부리길이', '부리깊이', '날개길이', '몸무게', '성별', '연도']\n모은 줄: 50\n[['1', '아델리', '토르거센', '39.1', '18.7', '181', '3750', '수컷', '2007'], …]"),
      md(String.raw`
## 4. 여러 쪽 모두 크롤링하기

같은 일을 1~7쪽에 되풀이해요. 쪽 사이에는 \`time.sleep(1)\`로 1초씩 쉬어 **서버에 부담을 주지 않아요**(크롤링 예절).
`),
      code(String.raw`
def crawl_page(p):
    """p쪽의 표를 크롤링해 (열 이름, 줄 목록)을 돌려준다"""
    res = requests.get(f'{SITE}/page{p}.html')
    res.encoding = 'utf-8'
    soup = BeautifulSoup(res.text, 'html.parser')
    trs = soup.find_all('tr')
    header = [th.text for th in trs[0].find_all('th')]
    rows = [[td.text for td in tr.find_all('td')] for tr in trs[1:]]
    return header, rows

all_rows = []
for p in range(1, 8):              # 1, 2, …, 7쪽
    header, rows = crawl_page(p)
    all_rows.extend(rows)          # 행목록에 이어 붙이기
    print(f'{p}쪽: {len(rows)}줄 → 지금까지 {len(all_rows)}줄')
    time.sleep(1)                  # 예절: 1초 쉬기
`, ['def는 "이런 일을 하는 함수를 만든다"는 뜻이에요. 한 쪽을 크롤링하는 과정을 묶어 두고 쪽마다 불러 써요.', 'range(1, 8)은 1부터 7까지예요(8은 빠져요).', 'extend는 리스트 여러 개를 한 번에 이어 붙여요.'], '1쪽: 50줄 → 지금까지 50줄\n2쪽: 50줄 → 지금까지 100줄\n…\n7쪽: 45줄 → 지금까지 345줄'),
      md(String.raw`
## 5. 표로 만들고 CSV 파일로 저장하기

크롤링한 값은 모두 **글자**예요('39.1'). CSV로 저장했다가 다시 읽으면 판다스가 숫자는 숫자로, **빈칸은 NaN**으로 알아서 바꿔 줘요.
`),
      code(String.raw`
df = pd.DataFrame(all_rows, columns=header)
df.to_csv('penguins.csv', index=False, encoding='utf-8-sig')
df = pd.read_csv('penguins.csv')     # 다시 읽으면 숫자·빈칸이 제대로!
print(df.shape)                       # (행 수, 열 수)
df.head()
`, ['DataFrame = 행목록을 행과 열이 있는 표로 바꿔요.', "to_csv로 저장해요. index=False는 왼쪽 인덱스 번호는 저장하지 않는다는 뜻이에요.", 'df.shape가 (345, 9)면 성공! 펭귄은 344마리인데 345줄인 까닭은 사이트 0-4에서 본 겹친 50번 줄이에요(3단원에서 지워요).'], '(345, 9)'),
      code(String.raw`
# 내 컴퓨터로 내려받기 (Colab에서만 동작)
try:
    from google.colab import files
    files.download('penguins.csv')
except ImportError:
    print('Colab이 아니라서 내려받기를 건너뛰어요. penguins.csv는 지금 폴더에 저장되어 있어요.')
`, ['Colab의 파일 내려받기 기능이에요. 다음 수업에서 이 파일을 다시 써도 돼요.']),
      md(String.raw`
## 🧩 확인해 봐요

1. \`df.shape\`는 무엇을 알려 주나요?
2. 344마리인데 345줄이 된 까닭은? (힌트: 1쪽 마지막 줄과 2쪽 첫 줄)
3. \`df.isnull().sum()\`을 실행해 보세요. 비어 있는 칸이 있나요? → 다음 수업 🔍 가공에서 자세히!

## 🚀 도전 — 다른 연습 사이트

[books.toscrape.com](https://books.toscrape.com)은 크롤링 연습용으로 공개된 가상 서점이에요. 책 제목과 가격을 모아 보세요.
`),
      code(String.raw`
try:
    res = requests.get('https://books.toscrape.com/', timeout=10)
    res.encoding = 'utf-8'                           # £ 기호가 깨지지 않게
    soup = BeautifulSoup(res.text, 'html.parser')
    books = []
    for art in soup.find_all('article', class_='product_pod'):
        title = art.h3.a['title']                        # 책 제목
        price = art.find('p', class_='price_color').text  # 가격
        books.append([title, price])
    print(pd.DataFrame(books, columns=['제목', '가격']).head())
except Exception as e:
    print('지금은 연결할 수 없어요:', e)
`, ['이 사이트의 책 하나는 <article class="product_pod"> 안에 들어 있어요. 사이트마다 태그 구조가 달라서, 먼저 페이지 소스(Ctrl+U)를 보고 어떤 태그를 찾을지 정해요.']),
    ],
  },

  /* ══════════════════ 02 결측치·이상치 ══════════════════ */
  {
    id: '02_missing_outlier',
    title: '🔍 결측치와 이상치 찾기',
    intro: '크롤링한 345줄에서 빈칸(결측치)의 여부·개수·위치를 찾고, 사분위수와 상자그림으로 이상치를 찾아요.',
    cells: [
      md(String.raw`
# 🔍 결측치와 이상치 찾기

**목표**: 결측치의 여부·개수·위치를 확인하고, 사분위수(IQR)와 상자그림으로 이상치를 찾는다.

연습 데이터에는 수업을 위해 숨겨 둔 함정이 있어요: **빈칸**, **이상한 값**, **겹친 행**. 하나씩 찾아봐요!
`),
      HOWTO,
      code(String.raw`
import pandas as pd
URL = '${DATA}'
df = pd.read_csv(URL)          # 크롤링한 penguins.csv를 올렸다면 pd.read_csv('penguins.csv')
print(df.shape)
df.head()
`, ['수업용 펭귄 데이터를 인터넷 주소에서 바로 불러와요. 앞 시간에 크롤링한 파일과 같은 내용이에요.'], '(345, 9)'),
      md(String.raw`
## 1. 결측치 여부 — \`isnull()\`

칸마다 비었으면 **True**, 값이 있으면 **False**인 표를 만들어요.
`),
      code(String.raw`
df.isnull().head(12)
`, ['결과표는 원래 표와 크기가 같아요. True인 칸이 결측치예요(인덱스 3, 6, 8~11 행을 보세요).']),
      md(String.raw`
## 2. 결측치 개수 — \`isnull().sum()\`

True는 1, False는 0으로 계산되니 **더하면 개수**가 돼요.
`),
      code(String.raw`
print(df.isnull().sum())
print('전체 결측치:', df.isnull().sum().sum())
`, ['열마다 빈칸이 몇 개인지 보여 줘요. 성별이 가장 많이 비었어요.'], '번호       0\n종        0\n섬        0\n부리길이     3\n부리깊이     2\n날개길이     2\n몸무게      2\n성별      11\n연도       0\ndtype: int64\n전체 결측치: 20'),
      md(String.raw`
## 3. 결측치 위치 — 인덱스 찾기

행마다(\`axis=1\`) True가 하나라도 있는지(\`any\`) 보고, 그런 행의 인덱스를 모아요. 인덱스는 **0부터** 세는 자리 번호예요.
`),
      code(String.raw`
has_nan = df.isnull().any(axis=1)
where = df[has_nan].index
print('결측치가 있는 행의 인덱스:', list(where))
df.loc[where]
`, ['df[조건]은 조건이 True인 행만 골라요.', 'df.loc[인덱스 목록]은 그 행들을 보여 줘요.']),
      code(String.raw`
# 열 하나만 보고 싶을 때
df[df['몸무게'].isnull()]
`, ["df['몸무게'].isnull()은 몸무게 열만 검사해요."]),
      md(String.raw`
## 4. 이상치 — 사분위수와 울타리

    Q1 = 25% 자리 값, Q3 = 75% 자리 값, IQR = Q3 − Q1
    아래 울타리 = Q1 − 1.5 × IQR,  위 울타리 = Q3 + 1.5 × IQR
    울타리 밖의 값 → 이상치
`),
      code(String.raw`
s = df['몸무게']
q1 = s.quantile(0.25)
q3 = s.quantile(0.75)
iqr = q3 - q1
low = q1 - 1.5 * iqr
high = q3 + 1.5 * iqr
print(f'Q1={q1}, Q3={q3}, IQR={iqr}')
print(f'울타리: {low} ~ {high}')
df[(s < low) | (s > high)]          # 이상치인 행
`, ['quantile(0.25)는 25% 자리(Q1)의 값이에요.', '| 는 "또는"이라는 뜻이에요. 아래 울타리보다 작거나, 위 울타리보다 큰 행을 골라요.', '몸무게 8200g인 아델리펭귄이 나와요 — 3200을 잘못 적은 값이에요!'], 'Q1=3550.0, Q3=4762.5, IQR=1212.5\n울타리: 1731.25 ~ 6581.25'),
      md(String.raw`
## 5. 상자그림으로 한눈에

상자(Q1~Q3), 가운데 선(중앙값), 수염, 그리고 **수염 밖의 점 = 이상치**.
`),
      FONT_CELL,
      code(String.raw`
plt.figure(figsize=(4, 5))
plt.boxplot(df['몸무게'].dropna())
plt.title('펭귄 몸무게 상자그림')
plt.ylabel('몸무게 (g)')
plt.show()
`, ['dropna()로 빈칸을 빼고 그려요(빈칸은 그릴 수 없어요).', '맨 위에 홀로 떨어진 점이 8200g이에요. 사이트의 "실제 비율로" 그림과 같은 모양이에요.']),
      code(String.raw`
# 여러 열을 한 번에 — 종별로 나눠 보면 더 잘 보여요
df.boxplot(column='몸무게', by='종', figsize=(6, 4))
plt.suptitle('')
plt.title('종별 몸무게')
plt.show()
`, ["by='종'은 종마다 상자를 따로 그려요. 젠투가 가장 무겁다는 것도 보여요."]),
      md(String.raw`
## 6. 사이트와 같은 13마리로 확인

사이트 "이상치 ① 사분위수"의 아델리펭귄 13마리로 계산하면 Q1=3450, Q2=3700, Q3=3800이 나와요.
`),
      code(String.raw`
ids = [1, 2, 3, 5, 6, 7, 10, 11, 12, 13, 14, 16, 17]
small = df[df['번호'].isin(ids)].drop_duplicates()['몸무게']
print(small.quantile([0.25, 0.5, 0.75]))
`, ['isin(목록)은 번호가 목록 안에 있는 행만 골라요.'], '0.25    3450.0\n0.50    3700.0\n0.75    3800.0'),
      md(String.raw`
## 🧩 확인해 봐요 · 한 번에 보기

- \`df.describe()\`를 실행하면 개수(count)·평균·사분위수·최솟값·최댓값이 한 번에 나와요. count가 345보다 작은 열은 왜 그럴까요?
- \`df.duplicated().sum()\`을 실행해 보세요. 겹친 행이 몇 개인가요? → 다음 시간 🧹 전처리에서 지워요.
`),
      code(String.raw`
print('겹친 행:', df.duplicated().sum())
df.describe()
`, ['describe()는 숫자 열의 요약표예요.'], '겹친 행: 1'),
    ],
  },

  /* ══════════════════ 03 전처리 ══════════════════ */
  {
    id: '03_preprocessing',
    title: '🧹 핵심 속성 추출과 전처리',
    intro: '종별로 속성을 견줘 핵심 속성을 고르고, 연도 열·겹친 행·이상치를 지우고, 빈칸을 지우거나 평균값·최빈값으로 채우고, 글자를 숫자로 바꿔요.',
    cells: [
      md(String.raw`
# 🧹 핵심 속성 추출과 전처리

**목표**: 학습에 쓸 수 있는 깨끗한 표를 만든다.

1. 핵심 속성 고르기 2. 데이터 삭제(연도 열·겹친 행·이상치) 3. 결측치 삭제와 대체(평균값·최빈값) 4. 텍스트 값 대체
`),
      HOWTO,
      code(String.raw`
import pandas as pd
df = pd.read_csv('${DATA}')
print(df.shape)
`, ['수업용 펭귄 데이터(345줄)를 불러와요.'], '(345, 9)'),
      md(String.raw`
## 1. 핵심 속성 고르기 — 종마다 값이 다른가?

목표는 **종 맞히기**예요. 종마다 평균이 크게 다른 속성일수록 종을 가르는 데 도움이 돼요.
`),
      code(String.raw`
df.groupby('종')[['부리길이', '부리깊이', '날개길이', '몸무게']].mean().round(1)
`, ["groupby('종')은 종마다 묶어서 계산해요. 젠투는 날개가 길고 무겁고, 아델리는 부리가 짧아요."]),
      code(String.raw`
# 글자 열은 개수표로 — 성별은 종을 가르지 못해요
pd.crosstab(df['종'], df['성별'])
`, ['crosstab은 두 열의 값 조합마다 개수를 세요. 어느 종이든 수컷·암컷이 비슷하게 있어요 → 성별은 핵심 속성이 아니에요.']),
      code(String.raw`
features = ['부리길이', '부리깊이', '날개길이', '몸무게']   # 핵심 속성
target = '종'                                               # 정답
print('입력 속성:', features, '/ 정답:', target)
`, ['사이트에서 고른 것과 같은 네 속성이에요. 번호·섬·성별·연도는 입력 X에서 빼요.', '입력에서 빼는 것과 표에서 지우는 것은 달라요. 표에서는 다음 칸에서 연도만 지워요.']),
      md(String.raw`
## 2. 데이터 삭제 — 필요 없는 열, 겹친 행, 잘못된 행

사이트 3-2쪽과 같은 순서예요. **연도**는 어디에도 안 써서 지워요. **번호**는 4단원에서 짝을 찾는 열쇠로 쓰고, **섬·성별**은 다른 목표(예: 성별 맞히기 프로젝트)에 쓸 수 있어 표에 남겨 둬요.
`),
      code(String.raw`
df = df.drop(columns=['연도'])            # 열 지우기
print(df.shape)
`, ["drop(columns=[...])는 열을 지워요.", '앞에 df = 를 붙여야 지운 표가 df에 다시 담겨요. 9열이 8열이 돼요.'], '(345, 8)'),
      code(String.raw`
print('겹친 행:', df.duplicated().sum())
df = df.drop_duplicates()                 # 처음 것만 남기고 지우기
print('지운 뒤:', df.shape)
`, ['duplicated()는 앞에 똑같은 행이 있으면 True예요. drop_duplicates()가 그런 행을 지워요.'], '겹친 행: 1\n지운 뒤: (344, 8)'),
      code(String.raw`
s = df['몸무게']
q1, q3 = s.quantile(0.25), s.quantile(0.75)
high = q3 + 1.5 * (q3 - q1)
bad = df[s > high].index                  # 위 울타리보다 큰 행
print('이상치 행:', list(bad))
df = df.drop(index=bad)
print('지운 뒤:', df.shape)
`, ['가공 시간에 찾은 이상치(8200g)를 인덱스로 지워요.'], '이상치 행: [12]\n지운 뒤: (343, 8)'),
      md(String.raw`
## 3. 결측치 처리 — 지울까, 채울까?

사이트 3-5쪽 끝에서 본 규칙이에요. **측정값이 모두 빈 행은 지우고**(채워도 전부 어림값이라서), **한두 칸만 빈 행은 채워요**(나머지는 진짜 값이라서).
`),
      code(String.raw`
print('빈칸이 있는 행:', df.isnull().any(axis=1).sum())
print('dropna() 하면:', len(df.dropna()), '행만 남아요')
only_sex = df['성별'].isnull() & df[features].notnull().all(axis=1)
print('그중 성별 한 칸만 빈 행:', only_sex.sum())
`, ['dropna()는 빈칸이 하나라도 있는 행을 통째로 지워요. 몇 행을 잃는지 먼저 확인해요.', 'only_sex는 "성별은 비었고 측정값 네 개는 모두 있는 행"이에요. 입력에 쓰지도 않는 성별 때문에 그 행들까지 잃게 돼요.'], '빈칸이 있는 행: 12\ndropna() 하면: 331 행만 남아요\n그중 성별 한 칸만 빈 행: 9'),
      code(String.raw`
# ① 측정값 4개가 모두 빈 행은 채워도 전부 어림값이라 지운다
df = df.dropna(subset=features, how='all')
print(df.shape)
print(df.isnull().sum())
`, ["subset=features, how='all'은 \"네 측정값이 모두 비었을 때만\" 지우라는 뜻이에요.", '2마리(4번, 272번)가 지워져 341행이 돼요.'], '(341, 8)'),
      code(String.raw`
# ② 숫자 열의 빈칸 → 평균값으로 채우기
for col in features:
    m = df[col].mean()
    df[col] = df[col].fillna(m)
    print(f'{col}: 평균 {m:.2f}로 채움')
`, ['mean()은 빈칸을 빼고 평균을 구해요.', 'fillna(값)은 빈칸을 그 값으로 채워요. 부리길이 빈칸(7번 펭귄) 하나가 채워져요.']),
      code(String.raw`
# ③ 글자 열(성별)의 빈칸 → 최빈값으로 채우기
print(df['성별'].value_counts())
m = df['성별'].mode()[0]
df['성별'] = df['성별'].fillna(m)
print('최빈값:', m)
`, ['value_counts()는 값마다 개수를 세요(사이트의 세기표).', 'mode()[0]은 가장 많이 나온 값이에요.']),
      md(String.raw`
## 4. 텍스트 값 대체 — 글자를 숫자로

모델은 숫자로 계산해요. **바꿈표(사전)**를 만들어 \`map\`으로 바꿔요.
`),
      code(String.raw`
sex_map = {'수컷': 0, '암컷': 1}
sp_map = {'아델리': 0, '턱끈': 1, '젠투': 2}
df['성별_숫자'] = df['성별'].map(sex_map)
df['종_숫자'] = df['종'].map(sp_map)
df[['종', '종_숫자', '성별', '성별_숫자']].head()
`, ['원래 열은 남겨 두고, 숫자로 바꾼 열을 새로 만들어 견줘 봐요.', '0·1·2는 이름표일 뿐 크기에 뜻이 없어요.']),
      md(String.raw`
## ✅ 확인 — 빈칸이 하나도 없나요?
`),
      code(String.raw`
print(df.isnull().sum().sum(), '개의 빈칸')
print(df.shape)
df.to_csv('penguins_clean.csv', index=False, encoding='utf-8-sig')
`, ['0이 나오면 성공! 깨끗한 표(341줄 × 10열)를 penguins_clean.csv로 저장해요.', '다음 수업들은 미리 인터넷에 올려 둔 같은 341마리 표를 불러와요. 그 표는 숫자로 바꾼 두 열이 없고 연도 열은 남아 있어서 (341, 9)로 보여요. 입력에는 어차피 네 측정값만 써요.'], '0 개의 빈칸\n(341, 10)'),
    ],
  },

  /* ══════════════════ 04 통합·분할 ══════════════════ */
  {
    id: '04_merge_split',
    title: '🧩 데이터 통합과 훈련/테스트 분할',
    intro: '쪽마다 읽은 표를 concat으로 잇고, 측정표와 판정표를 번호로 merge한 341줄을 train_test_split으로 나눠요.',
    cells: [
      md(String.raw`
# 🧩 데이터 통합과 훈련/테스트 분할

**목표**: 여러 표를 하나로 합치고(concat·merge), 합친 표를 입력 X와 정답 y, 훈련 데이터와 테스트 데이터로 나눈다.

> 🔁 **만약에 — 데이터가 여러 파일로 온다면?** 1단원에서는 7쪽을 한 표로 모았지만, 실제로는 표가 여러 파일로 오는 일이 많아요. 1·2는 그 연습이고, 2에서 합친 깨끗한 341줄을 3에서 나눠요.
`),
      HOWTO,
      code(String.raw`
import pandas as pd
SITE = '${PRACTICE}'
`, ['판다스만 있으면 돼요.']),
      md(String.raw`
## 1. 세로로 이어 붙이기 — \`pd.concat\`

\`pd.read_html(주소)\`는 웹 페이지의 <table>을 바로 데이터프레임으로 읽어 주는 지름길이에요(크롤링 한 줄 요약!). 쪽마다 따로 받은 표 7개를 위아래로 이어 붙여요.
`),
      code(String.raw`
pages = []
for p in range(1, 8):
    t = pd.read_html(f'{SITE}/page{p}.html', encoding='utf-8')[0]   # 그 쪽의 첫 번째 표
    pages.append(t)
print([len(t) for t in pages])

crawl = pd.concat(pages)
print(crawl.index[:3], crawl.index[50:53])     # 인덱스가 0, 1, 2 … 다시 0, 1, 2 … 겹쳐요
crawl = pd.concat(pages, ignore_index=True)    # 인덱스를 0부터 새로
print(crawl.shape)
`, ['read_html은 표 목록을 돌려줘서 [0]으로 첫 번째 표를 꺼내요.', 'ignore_index=True를 주면 이어 붙인 뒤 인덱스를 0, 1, 2, …로 새로 매겨요.', '이 345줄은 1단원에서 모은 표와 같아요. 3단원에서 다듬어 깨끗한 341줄이 됐어요.'], '[50, 50, 50, 50, 50, 50, 45]\n…\n(345, 9)'),
      md(String.raw`
## 2. 열쇠로 옆에 붙이기 — \`pd.merge\`

🔁 **만약에** 측정값과 종이 다른 파일로 왔다면? 3단원의 깨끗한 341줄을 연습용으로 두 파일에 나눠 두었어요. 측정표(번호·부리·날개·몸무게 — 종 칸이 없어요)와 판정표(번호·종)를 **번호**가 같은 행끼리 짝지어 옆으로 붙여요.
`),
      code(String.raw`
measure = pd.read_csv('${RAW_URL}data/penguins_measure.csv')
label = pd.read_csv('${RAW_URL}data/penguins_label.csv')
print('측정표', measure.shape, '/ 판정표', label.shape)
label.head()
`, ['측정표에는 종 칸이 없고, 판정표에는 번호와 종만 있어요.', '판정표는 순서가 뒤섞여 있어요. 그래도 번호(열쇠)만 같으면 같은 펭귄이에요.'], '측정표 (341, 5) / 판정표 (341, 2)'),
      code(String.raw`
df = pd.merge(measure, label, on='번호')               # 기본: 두 표에 다 있는 번호만(inner)
print('합친 표:', df.shape)
print('짝을 못 찾아 빠진 펭귄:', len(measure) - len(df))
left = pd.merge(measure, label, on='번호', how='left') # 측정표는 모두 남기기
print('how=left:', left.shape, '→ 종이 빈 행', left['종'].isnull().sum())
df.head()
`, ["on='번호'가 열쇠예요. 순서가 달라도 번호로 짝을 찾아요.", "how='left'는 왼쪽 표의 행을 모두 남기고, 짝이 없으면 NaN으로 채워요.", '341마리가 모두 짝을 찾아서 두 방법 모두 341줄이에요. (짝이 없는 경우는 사이트 4-2의 100번 펭귄에서 봤어요.)'], '합친 표: (341, 6)\n짝을 못 찾아 빠진 펭귄: 0\nhow=left: (341, 6) → 종이 빈 행 0'),
      md(String.raw`
## 3. 훈련 데이터와 테스트 데이터로 나누기

2에서 번호로 합친 표 \`df\`(341줄)를 그대로 나눠요. 입력 **X**(대문자, 여러 열 — 3-1에서 고른 속성 4개)와 정답 **y**(소문자, 한 열)로 나눈 뒤, 섞어서 80% : 20%로 나눠요.
`),
      code(String.raw`
from sklearn.model_selection import train_test_split

X = df[['부리길이', '부리깊이', '날개길이', '몸무게']]
y = df['종']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)
print('훈련:', X_train.shape, ' 테스트:', X_test.shape)
print(y_train.value_counts())
`, ['test_size=0.2는 20%를 테스트로 떼어 두라는 뜻이에요.', 'random_state=42는 섞는 방법을 고정해 언제 실행해도 같은 결과가 나오게 해요(사이트의 "씨앗 고정").', 'X와 y는 같은 순서로 섞여서 짝이 깨지지 않아요.', '합친 표는 깨끗한 표(penguins_clean.csv)와 줄 순서까지 같아서, 5단원 노트북이 깨끗한 표를 불러와 똑같이 나눠도 같은 훈련 272줄 · 테스트 69줄이 나와요.'], '훈련: (272, 4)  테스트: (69, 4)\n종\n아델리    115\n젠투      99\n턱끈      58\nName: count, dtype: int64'),
      md(String.raw`
## 🧩 확인해 봐요

- test_size를 0.3으로 바꾸면 테스트 데이터는 몇 행이 될까요?
- \`stratify=y\`를 더하면 훈련·테스트의 종 비율이 원래와 같아져요. 더해 보고 \`y_test.value_counts()\`를 견줘 보세요.
`),
    ],
  },

  /* ══════════════════ 05 k-최근접 이웃 ══════════════════ */
  {
    id: '05_knn',
    title: '🤖 k-최근접 이웃 — 가까운 이웃의 다수결',
    intro: '의사코드를 그대로 옮긴 파이썬으로 341번 펭귄을 맞혀 보고(k=1이면 아델리, k=3이면 턱끈), scikit-learn으로 전체 데이터를 학습·평가해요.',
    cells: [
      md(String.raw`
# 🤖 k-최근접 이웃 (k-Nearest Neighbors)

**분류 · 지도학습** — 새 펭귄과 가장 가까운 훈련 펭귄 k마리를 찾아 다수결로 종을 정한다.

    거리목록 ← 빈 리스트
    반복: 훈련 데이터의 각 펭귄 p
        거리목록에 (새 펭귄과 p의 거리, p의 종) 추가
    거리목록을 거리 순으로 정렬
    이웃 ← 앞에서 k개 → 세기표로 투표 → 가장 많은 종
`),
      HOWTO,
      code(String.raw`
import pandas as pd
from collections import Counter
df = pd.read_csv('${CLEAN}')
print(df.shape)
`, ['Counter는 사이트의 "세기표(사전)"를 만들어 주는 도구예요.'], '(341, 9)'),
      md(String.raw`
## 1. 의사코드 그대로 — 사이트와 같은 18마리로
`),
      code(String.raw`
train_ids = [1, 6, 14, 21, 31, 38, 277, 278, 280, 282, 285, 288, 153, 154, 158, 160, 161, 164]
train = df[df['번호'].isin(train_ids)][['부리길이', '부리깊이', '종']].values.tolist()
new = [43.5, 18.1]      # 341번 펭귄 (종을 모른다고 하자)

def knn_predict(train, new, k):
    dists = []                                             # 거리목록
    for p in train:
        d = ((new[0] - p[0])**2 + (new[1] - p[1])**2) ** 0.5   # 두 점 사이 거리
        dists.append((d, p[2]))                            # (거리, 종)
    dists.sort()                                           # 가까운 순으로
    neighbors = dists[:k]                                  # 앞에서 k개
    votes = Counter(label for d, label in neighbors)       # 세기표
    return votes.most_common(1)[0][0], neighbors

for k in [1, 3, 5]:
    pred, nb = knn_predict(train, new, k)
    print(f'k={k}: {pred}   이웃 = {[(round(d, 2), s) for d, s in nb]}')
`, ['knn_predict 함수의 줄 하나하나가 사이트 ② 쪽 의사코드의 줄과 짝이에요.', '** 0.5는 제곱근(√)이에요.', 'k=1이면 가장 가까운 아델리 한 마리만 보고 틀리지만, k=3이면 턱끈 2표로 맞혀요(정답: 턱끈).'], "k=1: 아델리   이웃 = [(1.36, '아델리')]\nk=3: 턱끈   이웃 = [(1.36, '아델리'), (1.73, '턱끈'), (1.99, '턱끈')]\nk=5: 턱끈   …"),
      md(String.raw`
## 2. scikit-learn으로 — 프로젝트에서 쓰는 방법

만들기 → \`fit\`(학습) → \`predict\`(예측) 세 줄이면 돼요.
`),
      code(String.raw`
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score

X = df[['부리길이', '부리깊이']]
y = df['종']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = KNeighborsClassifier(n_neighbors=3)   # k = 3
model.fit(X_train, y_train)                   # 학습 = 훈련 데이터를 기억해 두기
pred = model.predict(X_test)                  # 테스트 데이터 예측
print('정확도:', accuracy_score(y_test, pred))
`, ['n_neighbors가 k예요.', 'k-최근접 이웃의 fit()은 계산 없이 훈련 데이터를 기억해 둘 뿐이에요. 진짜 일은 predict()에서 거리를 재며 일어나요.', '정확도 = 맞힌 개수 ÷ 테스트 개수'], '정확도: 0.9565217391304348'),
      code(String.raw`
# 341번 펭귄을 sklearn으로도 맞혀 보기
model.predict(pd.DataFrame([[43.5, 18.1]], columns=['부리길이', '부리깊이']))
`, ['이번에는 아델리로 예측해요! 이웃이 될 훈련 데이터가 18마리에서 272마리로 바뀌었기 때문이에요.', '341번은 아델리와 턱끈의 경계에 있는 펭귄이라, k와 훈련 데이터에 따라 답이 바뀌어요. 그래서 한 마리가 아니라 테스트 데이터 전체의 정확도로 모델을 평가해요.'], "array(['아델리'], dtype=object)"),
      md(String.raw`
## 3. k를 바꿔 보기
`),
      code(String.raw`
for k in [1, 3, 5, 7, 9, 15]:
    m = KNeighborsClassifier(n_neighbors=k).fit(X_train, y_train)
    print(f'k={k:2d}  정확도 {accuracy_score(y_test, m.predict(X_test)):.3f}')
`, ['k가 너무 작으면 한 이웃에 휘둘리고, 너무 크면 멀리 있는 펭귄까지 투표해요. 알맞은 k를 실험으로 찾아요.']),
      md(String.raw`
## 4. 그림으로 보기
`),
      FONT_CELL,
      code(String.raw`
for sp, mark in [('아델리', 'o'), ('턱끈', '^'), ('젠투', 's')]:
    part = df[df['종'] == sp]
    plt.scatter(part['부리길이'], part['부리깊이'], marker=mark, label=sp, alpha=0.7)
plt.scatter([43.5], [18.1], marker='*', s=300, c='black', label='341번 펭귄')
plt.xlabel('부리길이 (mm)'); plt.ylabel('부리깊이 (mm)'); plt.legend()
plt.show()
`, ['종마다 모양을 다르게 해서 점을 찍어요. 별(★)이 맞혀 볼 펭귄이에요.']),
      md(String.raw`
## 🚀 도전

- 속성을 4개(부리길이·부리깊이·날개길이·몸무게)로 늘려 정확도를 견줘 보세요.
- 몸무게(수천 g)는 다른 속성(수십 mm)보다 숫자가 훨씬 커서 거리를 혼자 좌우해요. \`from sklearn.preprocessing import StandardScaler\`로 크기를 맞추면 어떻게 될까요?
`),
    ],
  },

  /* ══════════════════ 06 의사결정 트리 ══════════════════ */
  {
    id: '06_decision_tree',
    title: '🤖 의사결정 트리 — 질문으로 좁혀 가기',
    intro: '사이트의 16마리로 트리를 만들어 같은 질문(날개길이 ≤ 203.5 → 부리길이 ≤ 42.35)이 나오는지 확인하고, 전체 데이터로 학습·평가해요.',
    cells: [
      md(String.raw`
# 🤖 의사결정 트리 (Decision Tree)

**분류 · 지도학습** — 데이터를 가장 깔끔하게 나누는 예/아니오 질문을 골라 트리를 키운다.
좋은 질문 = 나눈 뒤 **지니 불순도**(섞인 정도)가 가장 낮은 질문.
`),
      HOWTO,
      code(String.raw`
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text
df = pd.read_csv('${CLEAN}')
`, ['트리 모델과, 트리를 글자로 보여 주는 export_text를 불러와요.']),
      md(String.raw`
## 1. 지니 불순도 직접 계산하기

    지니 = 1 − (각 종 비율)²의 합   → 한 종뿐이면 0, 고르게 섞일수록 커져요
`),
      code(String.raw`
def gini(counts):
    n = sum(counts)
    return 1 - sum((c / n) ** 2 for c in counts)

print('아델리5 턱끈5 젠투6 :', round(gini([5, 5, 6]), 3))
print('아델리5 턱끈5      :', round(gini([5, 5, 0]), 3))
print('젠투6만            :', round(gini([0, 0, 6]), 3))
`, ['사이트 트리의 뿌리·왼쪽 노드·젠투 잎의 지니와 같아요.'], '아델리5 턱끈5 젠투6 : 0.664\n아델리5 턱끈5      : 0.5\n젠투6만            : 0.0'),
      md(String.raw`
## 2. 사이트와 같은 16마리로 트리 만들기
`),
      code(String.raw`
ids = [1, 6, 14, 21, 31, 277, 278, 280, 282, 285, 153, 154, 158, 160, 161, 164]
small = df[df['번호'].isin(ids)]
tree = DecisionTreeClassifier(criterion='gini', random_state=0)
tree.fit(small[['날개길이', '부리길이']], small['종'])
print(export_text(tree, feature_names=['날개길이', '부리길이']))
`, ["criterion='gini'는 지니 불순도로 질문을 고르라는 뜻이에요.", '사이트에서 한 단계씩 만든 트리와 똑같은 질문이 나와요.'], '|--- 날개길이 <= 203.50\n|   |--- 부리길이 <= 42.35\n|   |   |--- class: 아델리\n|   |--- 부리길이 >  42.35\n|   |   |--- class: 턱끈\n|--- 날개길이 >  203.50\n|   |--- class: 젠투'),
      code(String.raw`
# 283번 펭귄(날개 178, 부리 46.1)은?
tree.predict(pd.DataFrame([[178, 46.1]], columns=['날개길이', '부리길이']))
`, ['날개가 짧아 왼쪽으로, 부리가 길어 오른쪽으로 → 턱끈!']),
      md(String.raw`
## 3. 전체 데이터로 학습·평가
`),
      code(String.raw`
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

features = ['부리길이', '부리깊이', '날개길이', '몸무게']
X_train, X_test, y_train, y_test = train_test_split(df[features], df['종'], test_size=0.2, random_state=42)

model = DecisionTreeClassifier(max_depth=3, random_state=0)
model.fit(X_train, y_train)
print('정확도:', accuracy_score(y_test, model.predict(X_test)))
print(export_text(model, feature_names=features))
`, ['max_depth=3은 질문을 최대 3번까지만 하라는 뜻이에요(너무 깊으면 훈련 데이터만 외워요).']),
      FONT_CELL,
      code(String.raw`
from sklearn.tree import plot_tree
plt.figure(figsize=(12, 6))
plot_tree(model, feature_names=features, class_names=list(model.classes_), filled=True, rounded=True)
plt.show()
print(dict(zip(features, model.feature_importances_.round(3))))
`, ['plot_tree는 트리를 그림으로 그려 줘요. 상자 색은 많은 종을 나타내요.', 'feature_importances_는 속성마다 얼마나 중요하게 쓰였는지 보여 줘요.']),
      md(String.raw`
## 🚀 도전

- max_depth를 1, 2, 5, None으로 바꿔 정확도와 트리 모양을 견줘 보세요.
- 정답을 '성별'로 바꿔 펭귄의 성별을 맞히는 트리를 만들어 보세요.
`),
    ],
  },

  /* ══════════════════ 07 선형 회귀 ══════════════════ */
  {
    id: '07_linear_regression',
    title: '🤖 선형 회귀 — 날개길이로 몸무게 예측',
    intro: '최소제곱법을 직접 계산한 w, b가 scikit-learn LinearRegression과 같은지 확인하고, 전체 데이터로 몸무게를 예측·평가해요.',
    cells: [
      md(String.raw`
# 🤖 선형 회귀 (Linear Regression)

**예측(회귀) · 지도학습** — 몸무게 = w × 날개길이 + b

    x̄, ȳ ← 평균
    반복: 각 펭귄  dx ← x − x̄,  dy ← y − ȳ,  위합 += dx×dy,  아래합 += dx×dx
    w ← 위합 ÷ 아래합,   b ← ȳ − w × x̄
`),
      HOWTO,
      code(String.raw`
import pandas as pd
df = pd.read_csv('${CLEAN}')
`, ['깨끗한 펭귄 데이터를 불러와요.']),
      md(String.raw`
## 1. 사이트와 같은 10마리로 직접 계산 (최소제곱법)
`),
      code(String.raw`
ids = [21, 31, 1, 280, 6, 278, 282, 161, 160, 154]
small = df[df['번호'].isin(ids)]
x = small['날개길이'].tolist()
y = small['몸무게'].tolist()

xb = sum(x) / len(x)
yb = sum(y) / len(y)
num = 0      # 위합
den = 0      # 아래합
for xi, yi in zip(x, y):
    dx, dy = xi - xb, yi - yb
    num += dx * dy
    den += dx * dx
w = num / den
b = yb - w * xb
print(f'w = {w:.2f},  b = {b:.2f}')
print(f'날개 210mm → {w * 210 + b:.0f}g')
`, ['zip(x, y)는 두 리스트에서 짝을 하나씩 꺼내요.', '+= 는 "더해서 다시 넣기"예요(위합 ← 위합 + dx×dy).'], 'w = 42.35,  b = -4240.92\n날개 210mm → 4653g'),
      code(String.raw`
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(small[['날개길이']], small['몸무게'])
print(f'sklearn: w = {model.coef_[0]:.2f},  b = {model.intercept_:.2f}')
`, ['coef_가 기울기 w, intercept_가 절편 b예요. 직접 계산한 값과 똑같아요!'], 'sklearn: w = 42.35,  b = -4240.92'),
      md(String.raw`
## 2. 전체 데이터로 학습·평가

예측은 숫자라서 "맞았다/틀렸다" 대신 **오차**로 평가해요. 평균 제곱 오차(MSE)와, 오차를 g 단위로 되돌린 RMSE를 봐요.
`),
      code(String.raw`
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

X_train, X_test, y_train, y_test = train_test_split(df[['날개길이']], df['몸무게'], test_size=0.2, random_state=42)
model = LinearRegression().fit(X_train, y_train)
pred = model.predict(X_test)
mse = mean_squared_error(y_test, pred)
print(f'w = {model.coef_[0]:.2f}, b = {model.intercept_:.1f}')
print(f'MSE = {mse:.0f},  RMSE = {mse ** 0.5:.0f}g  (보통 이만큼 빗나가요)')
print('R² 점수 =', round(model.score(X_test, y_test), 3), '(1에 가까울수록 잘 맞음)')
`, ['RMSE는 MSE의 제곱근이에요. "예측이 보통 몇 g쯤 빗나가나"로 읽으면 돼요.', 'score()는 R²(결정계수)를 줘요.']),
      FONT_CELL,
      code(String.raw`
plt.scatter(df['날개길이'], df['몸무게'], alpha=0.5, label='펭귄')
xs = pd.DataFrame({'날개길이': [170, 235]})
plt.plot(xs['날개길이'], model.predict(xs), color='red', linewidth=3, label='회귀 직선')
plt.xlabel('날개길이 (mm)'); plt.ylabel('몸무게 (g)'); plt.legend()
plt.show()
`, ['점들 사이를 지나는 빨간 직선이 모델이에요.']),
      md(String.raw`
## 🚀 도전 — 경사 하강법으로 조금씩 고치기

공식 대신, 오차가 줄어드는 쪽으로 w·b를 조금씩 고쳐도 같은 직선에 다가가요(사이트 ① 쪽의 "조금씩 고치기").
`),
      code(String.raw`
xs = (df['날개길이'] - df['날개길이'].mean()) / df['날개길이'].std()   # 크기 맞추기(표준화)
ys = df['몸무게']
a, c = 0.0, 0.0          # 표준화한 x에서의 기울기·절편
for step in range(200):
    err = a * xs + c - ys
    a -= 0.05 * 2 * (err * xs).mean()   # 오차가 줄어드는 쪽으로
    c -= 0.05 * 2 * err.mean()
    if step % 40 == 0:
        print(f'{step:3d}번째: MSE = {(err ** 2).mean():,.0f}')
`, ['반복할수록 MSE가 줄어들어요. 이것이 신경망이 학습하는 기본 방법이기도 해요.']),
    ],
  },

  /* ══════════════════ 08 k-평균 ══════════════════ */
  {
    id: '08_kmeans',
    title: '🤖 k-평균 — 정답 없이 묶기',
    intro: '배정 ↔ 이동을 직접 되풀이해 사이트와 같은 중심을 얻고, scikit-learn KMeans로 묶은 결과를 실제 종과 견줘요.',
    cells: [
      md(String.raw`
# 🤖 k-평균 (k-Means)

**군집 · 비지도학습** — 정답(종) 없이, 가까운 펭귄끼리 k개 묶음으로 나눈다.

    중심 k개 ← 아무 점 k개
    반복: ① 각 점을 가장 가까운 중심의 묶음에  ② 중심을 묶음의 평균으로  ③ 안 움직이면 멈춤
`),
      HOWTO,
      code(String.raw`
import pandas as pd
df = pd.read_csv('${CLEAN}')
X = df[['부리길이', '부리깊이']]          # 정답(종)은 쓰지 않아요!
`, ['비지도학습이라 y(정답)가 없어요.']),
      md(String.raw`
## 1. 의사코드 그대로 — 사이트와 같은 18마리, 처음 중심 21·160·282번
`),
      code(String.raw`
ids = [1, 6, 14, 21, 31, 38, 277, 278, 280, 282, 285, 288, 153, 154, 158, 160, 161, 164]
pts = df[df['번호'].isin(ids)][['번호', '부리길이', '부리깊이']].values.tolist()
centers = [[p[1], p[2]] for p in pts if p[0] in (21, 160, 282)]

for it in range(1, 20):
    # ① 배정: 가장 가까운 중심 찾기
    groups = [[] for _ in centers]
    for p in pts:
        d = [((p[1] - c[0])**2 + (p[2] - c[1])**2) ** 0.5 for c in centers]
        groups[d.index(min(d))].append(p)
    # ② 이동: 묶음의 평균으로
    new = [[sum(p[1] for p in g) / len(g), sum(p[2] for p in g) / len(g)] for g in groups]
    print(f'{it}번째:', [[round(v, 2) for v in c] for c in new])
    if new == centers:            # ③ 움직이지 않으면 멈춤
        break
    centers = new
`, ['d.index(min(d))는 "거리가 가장 짧은 중심의 번호"예요.', '사이트처럼 3번째 되풀이에서 멈춰요.'], '1번째: [[38.86, 19.1], [46.93, 14.63], [46.71, 18.8]]\n2번째: [[39.42, 19.0], [46.93, 14.63], [47.47, 18.85]]\n3번째: [[39.42, 19.0], [46.93, 14.63], [47.47, 18.85]]'),
      md(String.raw`
## 2. scikit-learn KMeans로 전체 데이터 묶기

부리길이(32~60mm)는 부리깊이(13~22mm)보다 값의 폭이 훨씬 넓어서, 그대로 두면 거리를 거의 혼자 정해 버려요.
그래서 \`StandardScaler\`로 두 속성의 크기를 맞춘(평균 0, 퍼짐 1) 뒤 묶어요.
`),
      code(String.raw`
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
Xs = scaler.fit_transform(X)                 # 크기 맞추기
model = KMeans(n_clusters=3, n_init=10, random_state=0)
model.fit(Xs)                                # 정답 없이 X만!
df['묶음'] = model.labels_                   # 점마다 묶음 번호(0, 1, 2)
pd.crosstab(df['종'], df['묶음'])
`, ['n_init=10은 처음 중심을 10번 다르게 골라 가장 좋은 결과를 쓰라는 뜻이에요(시작에 따라 결과가 달라지니까).', 'crosstab으로 묶음과 실제 종을 견줘요. 정답을 안 봤는데도 대부분 종별로 모여요.']),
      code(String.raw`
# 크기를 맞추지 않으면? — 같은 일을 X 그대로 해 보기
raw = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)
def agree(labels):   # 묶음마다 가장 많은 종을 고른다면 몇 %가 맞을까
    return pd.crosstab(df['종'], labels).max(axis=1).sum() / len(df)
print(f'크기 맞춤: {agree(model.labels_):.0%}   그대로: {agree(raw.labels_):.0%}')
`, ['크기를 맞추면 종과 훨씬 잘 맞아요. 거리로 판단하는 알고리즘(k-최근접 이웃·k-평균)은 속성의 크기를 맞추는 것이 중요해요.'], '크기 맞춤: 93%   그대로: 75%'),
      FONT_CELL,
      code(String.raw`
centers = scaler.inverse_transform(model.cluster_centers_)   # 중심을 원래 단위(mm)로 되돌리기
plt.scatter(df['부리길이'], df['부리깊이'], c=df['묶음'], cmap='viridis', alpha=0.7)
plt.scatter(centers[:, 0], centers[:, 1], marker='X', s=300, c='red', label='중심')
plt.xlabel('부리길이 (mm)'); plt.ylabel('부리깊이 (mm)'); plt.legend()
plt.show()
`, ['색 = 묶음, 빨간 X = 중심이에요. 중심은 크기를 맞춘 단위로 계산되어서 원래 mm 단위로 되돌려 그려요.']),
      md(String.raw`
## 🚀 도전 — k를 몇으로 할까?

\`inertia_\`는 점들이 자기 중심에서 떨어진 거리의 제곱 합이에요. k를 늘리며 그려 보고, 갑자기 덜 줄어드는 "팔꿈치" 지점을 찾아보세요.
`),
      code(String.raw`
ks = range(1, 8)
inertias = [KMeans(n_clusters=k, n_init=10, random_state=0).fit(Xs).inertia_ for k in ks]
plt.plot(list(ks), inertias, marker='o')
plt.xlabel('k (묶음 수)'); plt.ylabel('inertia')
plt.title('팔꿈치 방법')
plt.show()
`, ['k가 클수록 inertia는 늘 줄어들어요. 그래서 "줄어드는 폭이 확 작아지는 곳"을 고르는 거예요.']),
    ],
  },

  /* ══════════════════ 09 프로젝트 틀 ══════════════════ */
  {
    id: '09_project_template',
    title: '🚀 인공지능 프로젝트 틀 (수집 → 평가)',
    intro: '펭귄 데이터로 처음부터 끝까지 돌아가는 완성 예시예요. "✏️ 여기를 바꿔요" 표시만 내 데이터와 목표로 바꾸면 나만의 프로젝트가 돼요.',
    cells: [
      md(String.raw`
# 🚀 인공지능 프로젝트 틀

| 단계 | 할 일 | 사이트 |
|---|---|---|
| 0 | 문제 정하기 | 🤖 개념 |
| 1 | 데이터 모으기 | 🕸 수집 |
| 2 | 살펴보기(결측치·이상치) | 🔍 가공 |
| 3 | 전처리 | 🧹 전처리 |
| 4 | 나누기 | 🧩 학습 준비 |
| 5 | 모델 학습 | 🤖 기계학습 |
| 6 | 평가 | 🚀 모델 평가 |
| 7 | 결론 | — |

이 노트북은 **펭귄의 종 맞히기** 예시로 채워져 있어요. 모든 셀을 실행하면 끝까지 돌아가요.
"✏️ 여기를 바꿔요" 셀만 내 주제에 맞게 고쳐 쓰세요.

사이트: ${SITE_URL}
`),
      HOWTO,
      md(String.raw`
## 0. 문제 정하기 ✏️

- **무엇을 맞힐까?** 펭귄의 종 (아델리·턱끈·젠투)
- **학습 목적**: 분류 (예측이면 숫자, 군집이면 정답 없음)
- **정답(y)**: '종' 열 · **입력(X)**: 부리길이, 부리깊이, 날개길이, 몸무게
- **데이터 출처**: palmerpenguins (CC0) — 수업용 연습 사이트
`),
      md(String.raw`
## 1. 데이터 모으기 ✏️
`),
      code(String.raw`
import pandas as pd
DATA_URL = '${DATA}'      # ✏️ 여기를 바꿔요: 내 CSV 주소나 파일 이름
df = pd.read_csv(DATA_URL)
TARGET = '종'                                              # ✏️ 정답 열
FEATURES = ['부리길이', '부리깊이', '날개길이', '몸무게']  # ✏️ 입력 열
print(df.shape)
df.head()
`, ['내 데이터를 쓸 때는 DATA_URL, TARGET, FEATURES 세 줄만 바꾸면 돼요.', '크롤링이 필요하면 01번 노트북의 crawl_page 함수를 가져와 쓰세요.']),
      md(String.raw`
## 2. 데이터 살펴보기 — 결측치·이상치
`),
      code(String.raw`
print('결측치:'); print(df[FEATURES + [TARGET]].isnull().sum())
print('겹친 행:', df.duplicated().sum())
df[FEATURES].describe()
`, ['빈칸·겹친 행·이상한 최솟값/최댓값이 있는지 확인해요.']),
      FONT_CELL,
      code(String.raw`
df[FEATURES].plot.box(subplots=True, layout=(1, len(FEATURES)), figsize=(12, 3))
plt.tight_layout(); plt.show()
`, ['속성마다 상자그림을 그려 이상치를 찾아요.']),
      md(String.raw`
## 3. 전처리 ✏️
`),
      code(String.raw`
df = df.drop_duplicates()                                   # 겹친 행 지우기
for col in FEATURES:                                        # 이상치(울타리 밖) 지우기
    q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
    low, high = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    df = df[df[col].isnull() | df[col].between(low, high)]
df = df.dropna(subset=FEATURES, how='all')                  # 측정값이 모두 빈 행 지우기
df[FEATURES] = df[FEATURES].fillna(df[FEATURES].mean())     # 숫자 빈칸 → 평균
df = df.dropna(subset=[TARGET])                             # 정답이 빈 행은 지우기
print(df.shape, '/ 남은 빈칸:', df[FEATURES + [TARGET]].isnull().sum().sum())
`, ['between(low, high)는 울타리 안에 있는지 확인해요.', '정답(y)이 비어 있으면 배울 수 없으니 지워요.', '글자로 된 입력 속성이 있다면 map으로 숫자로 바꾸세요(03번 노트북).']),
      md(String.raw`
## 4. 나누기
`),
      code(String.raw`
from sklearn.model_selection import train_test_split
X = df[FEATURES]
y = df[TARGET]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print('훈련', X_train.shape, '/ 테스트', X_test.shape)
`, ['테스트 데이터는 마지막 평가 때까지 쓰지 않아요.']),
      md(String.raw`
## 5. 모델 학습 ✏️ — 목적에 맞게 고르기

| 목적 | 알고리즘 | 만들기 |
|---|---|---|
| 분류 | k-최근접 이웃 | \`KNeighborsClassifier(n_neighbors=5)\` |
| 분류 | 의사결정 트리 | \`DecisionTreeClassifier(max_depth=3)\` |
| 예측 | 선형 회귀 | \`LinearRegression()\` |
| 군집 | k-평균 | \`KMeans(n_clusters=3, n_init=10)\` (y 없이 fit(X)) |
`),
      code(String.raw`
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

models = {                                      # ✏️ 견줄 모델들
    'k-최근접 이웃 (k=5)': KNeighborsClassifier(n_neighbors=5),
    '의사결정 트리 (깊이 3)': DecisionTreeClassifier(max_depth=3, random_state=0),
}
for name, m in models.items():
    m.fit(X_train, y_train)
    print(name, '학습 완료')
`, ['두 가지 이상 견줘 보면 발표가 더 탄탄해져요.']),
      md(String.raw`
## 6. 평가
`),
      code(String.raw`
from sklearn.metrics import accuracy_score
for name, m in models.items():
    pred = m.predict(X_test)
    print(f'{name}: 정확도 {accuracy_score(y_test, pred):.3f}')
`, ['정확도 = 맞힌 개수 ÷ 테스트 개수 (예측 문제라면 mean_squared_error를 써요).']),
      code(String.raw`
# 틀린 예 살펴보기 — 모델의 약점 찾기
best = models['의사결정 트리 (깊이 3)']
result = X_test.copy()
result['정답'] = y_test
result['예측'] = best.predict(X_test)
result[result['정답'] != result['예측']]
`, ['틀린 행을 모아 보면 어떤 경우에 헷갈리는지 보여요. 결론에 쓰기 좋아요.']),
      md(String.raw`
## 7. 결론 ✏️

- **결과**: 어떤 모델이 정확도 몇 %였나?
- **까닭**: 왜 그 모델이 더 잘 맞았을까? 어떤 속성이 중요했나?
- **한계**: 데이터가 적거나 치우친 점, 틀린 예의 공통점
- **개선**: 속성을 더하거나, 데이터를 더 모으거나, 다른 알고리즘을 써 본다면?
`),
    ],
  },
];

export function getNotebook(id) {
  return NOTEBOOKS.find((n) => n.id === id);
}
