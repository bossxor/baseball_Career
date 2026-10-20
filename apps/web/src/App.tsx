import logo from '../../../docs/design/assets/brand/logo-mark.svg';

export function App() {
  return (
    <main className="welcome" aria-labelledby="app-title">
      <div className="brand"><img src={logo} alt="" width="72" height="72" /><span>AGAIN, PLAYBALL</span></div>
      <div className="copy">
        <p className="eyebrow">당신의 야구는, 다시 시작된다.</p>
        <h1 id="app-title">다시,<br />플레이볼</h1>
        <p className="description">한 선수의 시작부터,<br />구단의 새로운 역사까지.</p>
      </div>
      <aside className="notice" aria-label="개발 버전 안내">
        <span className="badge">개발 버전</span>
        <p>새로운 야구 이야기를 준비하고 있습니다.</p>
        <p className="muted">플레이와 계정 저장 기능은 순서대로 연결됩니다.</p>
      </aside>
      <footer>나만의 커리어 · 나만의 구단</footer>
    </main>
  );
}
