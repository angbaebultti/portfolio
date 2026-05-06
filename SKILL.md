# Portfolio Project — 작업 기록

## 최초 세팅 (2026-05-06)

### 프로젝트 초기화

Vite + React + TypeScript 템플릿을 기반으로 수동 구성 (create-vite CLI 비대화형 환경 미지원으로 직접 파일 생성)

---

## 설치 패키지

### dependencies
| 패키지 | 버전 | 용도 |
|--------|------|------|
| react | ^18.3.1 | UI 라이브러리 |
| react-dom | ^18.3.1 | React DOM 렌더링 |

### devDependencies
| 패키지 | 버전 | 용도 |
|--------|------|------|
| vite | ^5.4.10 | 빌드 도구 |
| @vitejs/plugin-react | ^4.3.3 | Vite React 플러그인 |
| typescript | ~5.6.2 | TypeScript 컴파일러 |
| @types/react | ^18.3.12 | React 타입 정의 |
| @types/react-dom | ^18.3.1 | React DOM 타입 정의 |
| @types/node | ^22.9.0 | Node.js 타입 (path 모듈 등) |
| eslint | ^9.13.0 | 코드 린터 |
| @eslint/js | ^9.13.0 | ESLint JS 규칙 |
| typescript-eslint | ^8.11.0 | TypeScript ESLint 통합 |
| eslint-plugin-react-hooks | ^5.0.0 | React Hooks 린트 규칙 |
| eslint-plugin-react-refresh | ^0.4.14 | React Refresh 린트 규칙 |
| eslint-config-prettier | ^9.1.0 | ESLint-Prettier 충돌 방지 |
| prettier | ^3.3.3 | 코드 포매터 |
| globals | ^15.11.0 | 전역 변수 정의 |

---

## 폴더 구조

```
portfolio0506/
├── public/
├── src/
│   ├── assets/          # 이미지, 폰트 등 정적 자원
│   ├── components/      # 재사용 가능한 컴포넌트
│   ├── hooks/           # 커스텀 훅
│   ├── pages/           # 페이지 컴포넌트
│   ├── styles/
│   │   └── index.css    # Reset CSS + 전역 스타일
│   ├── types/           # TypeScript 타입 정의
│   ├── utils/           # 유틸리티 함수
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .gitignore
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 설정 변경 사항

### 절대경로 import (tsconfig.app.json + vite.config.ts)

`tsconfig.app.json`의 `paths`와 `vite.config.ts`의 `resolve.alias`를 동기화하여 절대경로 import 지원.

| 별칭 | 실제 경로 |
|------|----------|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@pages/*` | `src/pages/*` |
| `@styles/*` | `src/styles/*` |
| `@assets/*` | `src/assets/*` |
| `@hooks/*` | `src/hooks/*` |
| `@utils/*` | `src/utils/*` |
| `@types/*` | `src/types/*` |

**사용 예시:**
```tsx
import Button from '@components/Button'
import { useScroll } from '@hooks/useScroll'
import '@styles/index.css'
```

### ESLint 설정 (eslint.config.js)

- TypeScript ESLint 추천 규칙 적용
- React Hooks 규칙 적용
- Prettier 충돌 규칙 비활성화 (`eslint-config-prettier`)
- `@typescript-eslint/no-unused-vars`: 에러 수준, `_` 접두사 매개변수 허용

### Prettier 설정 (.prettierrc)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### index.css (Reset CSS)

Josh W. Comeau의 Modern CSS Reset 기반:
- `box-sizing: border-box` 전역 적용
- 마진/패딩 초기화
- 이미지 `display: block`
- 폼 요소 폰트 상속
- 링크 기본 스타일 제거
- 리스트 스타일 제거
- 버튼 기본 스타일 제거

---

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 포맷 |

---

## 작업 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-06 | 프로젝트 초기 세팅 (Vite + React + TS, ESLint, Prettier, 절대경로, Reset CSS) |
| 2026-05-06 | three, gsap, @types/three 패키지 설치 |
| 2026-05-06 | IntroSequence 구현: ErrorScreen(CSS 타이핑) → BrokenLCD(Canvas 글리치) → SpaceScene(Three.js + GSAP ScrollTrigger) |
| 2026-05-06 | .gitignore에 .claude 추가 |
