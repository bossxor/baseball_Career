import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { Login } from '../src/screens/Login.js';
import { ApiError, stateFromError } from '../src/errors.js';

test('Login: fields, submit disabled until filled, error announced, optional dev path', () => {
  const empty = renderToStaticMarkup(<Login />);
  assert.match(empty, /data-screen="LOGIN"/);
  assert.match(empty, /disabled=""[^>]*>로그인<\/button>/);
  assert.doesNotMatch(empty, /개발 토큰으로 계속/);
  const withDev = renderToStaticMarkup(<Login onDev={() => undefined} error="로그인에 실패했습니다." />);
  assert.match(withDev, /role="alert"[^>]*>로그인에 실패했습니다/);
  assert.match(withDev, /개발 토큰으로 계속/);
});

test('ApiError maps revision conflict to conflict state', () => {
  assert.equal(stateFromError(new ApiError('REVISION_CONFLICT', 3)), 'conflict');
  assert.equal(stateFromError(new ApiError('OFFLINE')), 'error');
  assert.equal(stateFromError(new Error('boom')), 'error');
});
