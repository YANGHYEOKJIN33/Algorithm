# 배포 안내 — GitHub Pages

빌드 단계가 없는 정적 사이트라, 저장소 파일을 그대로 GitHub Pages에 올리면 됩니다.
`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 배포합니다.

## 처음 한 번

이 저장소는 처음에 비어 있었고, 작업은 `claude/wonderful-davinci-nsnv8q` 브랜치에 올라가 있습니다.
**`main` 브랜치에 이 내용이 들어가면** 배포가 시작됩니다. 아래 중 하나를 하세요.

1. **브랜치 이름 바꾸기(가장 간단)** — GitHub 저장소 → **Settings → General → Default branch** 옆 ✏️(또는
   **Branches** 메뉴)에서 `claude/wonderful-davinci-nsnv8q`를 `main`으로 이름을 바꿉니다.
2. **main 브랜치 만들기** — 저장소의 브랜치 선택 상자에서 `claude/wonderful-davinci-nsnv8q`를 고른 뒤
   새 브랜치 이름에 `main`을 입력해 만들고, Settings → General에서 기본 브랜치를 `main`으로 정합니다.

그다음 **Actions → Deploy to GitHub Pages → Run workflow**(main 선택)를 한 번 눌러 주세요.
워크플로가 Pages를 직접 켭니다(`enablement: true`).

조직 정책 등으로 켜지지 않아 `Get Pages site failed ... Not Found`가 나오면:
**Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꾸고 Re-run 합니다.

## 주소

```
사이트        https://yanghyeokjin33.github.io/Algorithm/
연습 사이트   https://yanghyeokjin33.github.io/Algorithm/practice/
Colab        https://colab.research.google.com/github/YANGHYEOKJIN33/Algorithm/blob/main/notebooks/01_web_crawling.ipynb
데이터        https://raw.githubusercontent.com/YANGHYEOKJIN33/Algorithm/main/data/penguins.csv
```

Colab 링크와 노트북의 데이터 주소는 **`main` 브랜치**를 가리킵니다. 저장소 이름이나 기본 브랜치를 바꾸면
`src/app/links.js`의 상수를 고친 뒤 `npm run build`로 노트북을 다시 만드세요.
(크롤링 노트북은 GitHub Pages의 연습 사이트를 읽으므로, **Pages 배포가 끝나야** 실행됩니다.)

## 고친 뒤 다시 배포

```bash
npm test          # 테스트(만들어 둔 파일이 원본과 같은지도 확인)
npm run build     # 노트북·연습 사이트·CSV 원본을 고쳤다면
git push          # main이면 자동 배포
```

## 배포가 안 될 때

| 증상 | 확인 |
|---|---|
| Actions가 실패 | Settings → Pages의 Source가 **GitHub Actions**인지 |
| `Branch "…" is not allowed to deploy to github-pages` | Settings → Environments → github-pages의 배포 브랜치에 `main`이 있는지 |
| 화면이 하얗다 | 브라우저 개발자 도구 콘솔의 모듈 경로 오류 — 경로는 모두 `./src/…` 상대 경로여야 함 |
| Colab에서 "Not Found" | main 브랜치에 notebooks/가 있는지, 저장소가 공개(public)인지 |
| 크롤링 노트북이 404 | Pages 배포가 끝났는지(연습 사이트 주소를 브라우저로 열어 보기) |
