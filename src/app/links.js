/**
 * 바깥 주소를 한 곳에 모은다 — 저장소 이름이나 기본 브랜치가 바뀌면 여기만 고친다.
 *
 *   사이트(GitHub Pages)  https://yanghyeokjin33.github.io/Algorithm/
 *   크롤링 연습 쪽         …/practice/page1.html ~ page7.html
 *   Colab 노트북           저장소 notebooks/*.ipynb 를 Colab이 GitHub에서 바로 연다
 */
export const OWNER = 'YANGHYEOKJIN33';
export const REPO = 'Algorithm';
export const BRANCH = 'main';

export const SITE_URL = `https://${OWNER.toLowerCase()}.github.io/${REPO}/`;
export const PRACTICE_URL = `${SITE_URL}practice/`;
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;
export const DATA_CSV_URL = `${RAW_URL}data/penguins.csv`;

/** 노트북 이름 → Colab에서 여는 주소 */
export function colabUrl(notebook) {
  return `https://colab.research.google.com/github/${OWNER}/${REPO}/blob/${BRANCH}/notebooks/${notebook}.ipynb`;
}

/** 노트북 이름 → 저장소에서 보는 주소(내려받기용) */
export function notebookUrl(notebook) {
  return `${REPO_URL}/blob/${BRANCH}/notebooks/${notebook}.ipynb`;
}
