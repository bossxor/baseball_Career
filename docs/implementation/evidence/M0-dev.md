# M0 개발 서버 실제 확인

2026-10-20 / Windows / Node24.19.0 / npm11.17.0.

`npm run dev` 출력에서 Vite `http://127.0.0.1:5173/` 및 API `http://127.0.0.1:3001` 기동을 확인했습니다. 실제 웹 주소와 웹 프록시의 `/api/health`를 HTTP 요청해 받은 결과입니다.

```json
{
  "WebStatus": 200,
  "TitlePresent": true,
  "ApiStatus": "ok",
  "RulesVersion": "1.0.0"
}
```

확인 후 Ctrl+C로 수동 종료했습니다. 종료 코드는 콘솔 중단으로1이며 시작/HTTP 실패가 아닙니다. 3001/5173 포트의 LISTEN 연결이 남지 않았음을 확인했습니다. 브라우저 렌더나 게임·계정 저장 검증은 수행하지 않았습니다.
