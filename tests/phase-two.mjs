import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:80/api';

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const text = await response.text();
  return {
    response,
    body: text ? JSON.parse(text) : undefined,
  };
}

test('Phase 2 project, contract, and test configuration flow', async () => {
  const list = await request('/projects');
  assert.equal(list.response.status, 200);
  assert.ok(Array.isArray(list.body));

  const invalidProject = await request('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Invalid project',
      description: '',
      applicationType: 'ecommerce',
      applicationUrl: 'not-a-url',
    }),
  });
  assert.equal(invalidProject.response.status, 400);

  const created = await request('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Phase 2 test project',
      description: 'Created by the API regression suite',
      applicationType: 'ecommerce',
      applicationUrl: 'https://example.com',
    }),
  });
  assert.equal(created.response.status, 201);
  const projectId = created.body.id;

  const detail = await request(`/projects/${projectId}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.id, projectId);

  const profiles = await request('/test-profiles');
  assert.equal(profiles.response.status, 200);
  assert.equal(profiles.body.length, 3);

  const invalidContract = await request(`/projects/${projectId}/contract`, {
    method: 'PUT',
    body: JSON.stringify({
      profile: 'medium',
      networkProfile: 'Fast 3G',
      imagePolicy: 'medium',
      javascriptPolicy: 'deferred',
      featurePolicy: 'normal',
      maxResourceSizeKb: 0,
      maxLcpMs: 3000,
    }),
  });
  assert.equal(invalidContract.response.status, 400);

  const savedContract = await request(`/projects/${projectId}/contract`, {
    method: 'PUT',
    body: JSON.stringify({
      profile: 'high',
      networkProfile: '4G',
      imagePolicy: 'high',
      javascriptPolicy: 'full',
      featurePolicy: 'full',
      maxResourceSizeKb: 2400,
      maxLcpMs: 2000,
    }),
  });
  assert.equal(savedContract.response.status, 200);
  assert.equal(savedContract.body.profile, 'high');

  const invalidTest = await request(`/projects/${projectId}/tests`, {
    method: 'POST',
    body: JSON.stringify({
      profile: 'medium',
      method: 'not-a-method',
    }),
  });
  assert.equal(invalidTest.response.status, 400);

  const queued = await request(`/projects/${projectId}/tests`, {
    method: 'POST',
    body: JSON.stringify({
      profile: 'high',
      method: 'performance',
      configuration: { route: '/checkout' },
    }),
  });
  assert.equal(queued.response.status, 201);
  assert.equal(queued.body.status, 'queued');

  const runs = await request(`/projects/${projectId}/tests`);
  assert.equal(runs.response.status, 200);
  assert.equal(runs.body[0].id, queued.body.id);

  const updated = await request(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'paused' }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.status, 'paused');

  const deleted = await request(`/projects/${projectId}`, { method: 'DELETE' });
  assert.equal(deleted.response.status, 204);

  const missing = await request(`/projects/${projectId}`);
  assert.equal(missing.response.status, 404);
});