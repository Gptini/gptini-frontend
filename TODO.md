# GPTini Frontend TODO

## 1. 프로젝트 초기 설정
- [x] Vite + React + TypeScript 프로젝트 생성
- [x] 의존성 설치 (react-router-dom, axios, @stomp/stompjs, zustand)
- [x] 폴더 구조 생성
- [x] 환경변수 설정 (.env)

## 2. 기본 설정
- [x] API 클라이언트 설정 (axios interceptor)
- [x] 라우터 설정
- [x] 전역 스타일 설정

## 3. 인증 기능
- [x] AuthContext/Store 구현 (zustand)
- [x] 로그인 페이지
- [x] 회원가입 페이지
- [x] 토큰 관리 (localStorage)
- [x] PrivateRoute 구현

## 4. WebSocket 설정
- [x] STOMP 클라이언트 생성 (createStompClient)
- [x] 연결/해제 훅 (useWebSocket)
- [x] 메시지 구독/발행 로직

## 5. 채팅방 목록
- [x] 채팅방 목록 페이지
- [x] 채팅방 생성 모달
- [x] 안 읽은 메시지 수 표시
- [x] 최신 메시지 시간순 정렬

## 6. 채팅방 상세
- [x] 채팅방 컴포넌트
- [x] 메시지 목록 (무한 스크롤 - 위로)
- [x] 메시지 입력 (Enter/클릭 전송)
- [x] 읽음 처리 (안 읽은 사람 수)
- [x] 파일 첨부 (이미지, PDF 등)
- [x] 클립보드 붙여넣기

## 7. 친구 기능
- [x] 친구 API 서비스 (friendApi)
- [x] 친구 페이지 (FriendsPage)
- [x] 친구 추가 모달 (AddFriendModal)
- [x] 친구 목록/요청 컴포넌트
- [x] 하단 네비게이션 (채팅/친구 탭)

## 8. 공통 컴포넌트
- [x] Button
- [x] Input
- [x] Modal
- [ ] Loading/Spinner
- [ ] Toast/Alert

## 9. 마무리
- [ ] 에러 핸들링
- [ ] 반응형 스타일
- [ ] 테스트
