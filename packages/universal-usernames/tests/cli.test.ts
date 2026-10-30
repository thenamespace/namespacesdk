import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { checkEndpoint } from '../src/check-endpoint';
import { runCli } from '../src/cli';
import { createUsernameHandler, defineUsernameProfile, PROFILE_LIMITS } from '../src';
import type { EndpointValidationReport, UsernameProfileV1 } from '../src';

const ETH = '0x1111111111111111111111111111111111111111';
const TOKEN = 's3cret-token';

const profiles: Record<string, UsernameProfileV1> = {
  happy: defineUsernameProfile({ username: 'happy', texts: { name: 'Happy' }, addresses: { eth: ETH } }),
  broken: defineUsernameProfile({ username: 'broken', texts: { name: 'Broken' }, addresses: { eth: ETH, btc: 'nope' } }),
};
const lookup = async (username: string) => profiles[username] ?? null;
const securedHandler = createUsernameHandler(lookup, { basePath: '/secured', bearerToken: TOKEN });
const openHandler = createUsernameHandler(lookup, { basePath: '/open' });

const requests: IncomingMessage[] = [];

async function serveFetchHandler(handler: (request: Request) => Promise<Response>, req: IncomingMessage, res: ServerResponse) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value);
  const response = await handler(new Request(`http://localhost${req.url}`, { method: req.method, headers }));
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

function route(req: IncomingMessage, res: ServerResponse): void {
  requests.push(req);
  const [, area] = (req.url ?? '').split('/');
  const json = { 'content-type': 'application/json' };
  switch (area) {
    case 'secured':
      void serveFetchHandler(securedHandler, req, res);
      return;
    case 'open':
      void serveFetchHandler(openHandler, req, res);
      return;
    case 'redirect':
      res.writeHead(302, { location: '/open/happy' }).end();
      return;
    case 'text':
      res.writeHead(200, { 'content-type': 'text/plain' }).end(JSON.stringify(profiles.happy));
      return;
    case 'charset':
      res.writeHead(200, { 'content-type': 'Application/JSON; charset=utf-8' }).end(JSON.stringify(profiles.happy));
      return;
    case 'large':
      res.writeHead(200, json).end(' '.repeat(PROFILE_LIMITS.maxBytes + 1));
      return;
    case 'bad-utf8':
      res.writeHead(200, json).end(Buffer.from([0x7b, 0xff, 0x7d]));
      return;
    case 'server-error':
      res.writeHead(500, json).end('{}');
      return;
    case 'rate-limited':
      res.writeHead(429, json).end('{}');
      return;
    case 'hang':
      return; // never answers
    case 'slow-body':
      res.writeHead(200, json);
      res.write('{"version":1,');
      return; // never finishes the body
    default:
      res.writeHead(500).end();
  }
}

let server: Server;
let origin: string;

beforeAll(async () => {
  server = createServer(route);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  requests.length = 0;
});

async function cli(args: string[], env: Record<string, string> = { UUN_ALLOW_INSECURE_ENDPOINTS: 'true' }) {
  let stdout = '';
  let stderr = '';
  const code = await runCli(args, {
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
    env,
  });
  return { code, stdout, stderr, report: stdout.startsWith('{') ? (JSON.parse(stdout) as EndpointValidationReport) : null };
}

const codes = (report: EndpointValidationReport | null) => report?.issues.map((issue) => issue.code);

describe('universal-usernames validate', () => {
  it('exits 0 and prints a report with a preview for a valid endpoint', async () => {
    const { code, report } = await cli(['validate', `${origin}/open`, '--username', 'Happy']);
    expect(code).toBe(0);
    expect(report).toMatchObject({
      ok: true,
      username: 'happy',
      requestUrl: `${origin}/open/happy`,
      httpStatus: 200,
      issues: [],
      preview: { texts: { name: 'Happy' }, addresses: { '60': ETH }, contenthash: null },
    });
    expect(report!.latencyMs).toEqual(expect.any(Number));
    expect(new Date(report!.checkedAt).toISOString()).toBe(report!.checkedAt);
  });

  it('sends the same headers Namespace sends', async () => {
    await cli(['validate', `${origin}/open`, '--username', 'happy']);
    expect(requests[0].headers).toMatchObject({
      accept: 'application/json',
      'user-agent': 'Namespace-UniversalUsernames/1',
    });
    expect(requests[0].headers.authorization).toBeUndefined();
  });

  it('exits 1 and previews the valid records when one record is invalid', async () => {
    const { code, report } = await cli(['validate', `${origin}/open`, '--username', 'broken']);
    expect(code).toBe(1);
    expect(codes(report)).toEqual(['ADDRESS_INVALID']);
    expect(report!.preview).toEqual({ texts: { name: 'Broken' }, addresses: { '60': ETH }, contenthash: null });
  });

  it('reports a missing sample username as USERNAME_NOT_FOUND', async () => {
    const { code, report } = await cli(['validate', `${origin}/open`, '--username', 'nobody']);
    expect(code).toBe(1);
    expect(report).toMatchObject({ httpStatus: 404, preview: null });
    expect(codes(report)).toEqual(['USERNAME_NOT_FOUND']);
  });

  it('sends --token as a bearer token and never prints it', async () => {
    const accepted = await cli(['validate', `${origin}/secured`, '--username', 'happy', '--token', TOKEN]);
    expect(accepted.code).toBe(0);
    expect(requests[0].headers.authorization).toBe(`Bearer ${TOKEN}`);
    expect(accepted.stdout).not.toContain(TOKEN);

    const rejected = await cli(['validate', `${origin}/secured`, '--username', 'happy', '--token', 'wrong']);
    expect(rejected.code).toBe(1);
    expect(codes(rejected.report)).toEqual(['UNAUTHORIZED']);

    const missing = await cli(['validate', `${origin}/secured`, '--username', 'happy']);
    expect(codes(missing.report)).toEqual(['UNAUTHORIZED']);
  });

  it('never follows redirects', async () => {
    const { report } = await cli(['validate', `${origin}/redirect`, '--username', 'happy']);
    expect(report).toMatchObject({ httpStatus: 302 });
    expect(codes(report)).toEqual(['HTTP_REDIRECT']);
    expect(requests.map((request) => request.url)).toEqual(['/redirect/happy']);
  });

  it.each([
    ['text', 'CONTENT_TYPE_INVALID'],
    ['large', 'RESPONSE_TOO_LARGE'],
    ['bad-utf8', 'INVALID_JSON'],
    ['server-error', 'HTTP_ERROR_STATUS'],
    ['rate-limited', 'RATE_LIMITED'],
  ])('reports /%s as %s', async (area, code) => {
    const { report } = await cli(['validate', `${origin}/${area}`, '--username', 'happy']);
    expect(codes(report)).toEqual([code]);
    expect(report!.preview).toBeNull();
  });

  it('accepts application/json with parameters, in any case', async () => {
    const { code } = await cli(['validate', `${origin}/charset`, '--username', 'happy']);
    expect(code).toBe(0);
  });

  it('refuses http endpoints unless UUN_ALLOW_INSECURE_ENDPOINTS=true', async () => {
    const { code, report } = await cli(['validate', `${origin}/open`, '--username', 'happy'], {});
    expect(code).toBe(1);
    expect(codes(report)).toEqual(['INVALID_URL']);
    expect(report!.requestUrl).toBe('');
    expect(requests).toHaveLength(0);
  });

  it('reports connection failures as NETWORK_ERROR', async () => {
    const closed = createServer();
    await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve));
    const port = (closed.address() as AddressInfo).port;
    await new Promise((resolve) => closed.close(resolve));

    const { report } = await cli(['validate', `http://127.0.0.1:${port}`, '--username', 'happy']);
    expect(codes(report)).toEqual(['NETWORK_ERROR']);
  });

  it.each([
    [[], 'Unknown command'],
    [['validate', 'https://api.brand.example'], '--username is required'],
    [['validate', '--username', 'happy'], 'exactly one endpoint URL'],
    [['validate', 'https://api.brand.example', '--username', 'happy', '--nope'], "Unknown option '--nope'"],
  ])('exits 1 with usage for %p', async (args, message) => {
    const { code, stderr, stdout } = await cli(args);
    expect(code).toBe(1);
    expect(stderr).toContain(message);
    expect(stderr).toContain('Usage: universal-usernames validate');
    expect(stdout).toBe('');
  });

  it('exits 1 for an invalid --username', async () => {
    const { code, stderr } = await cli(['validate', 'https://api.brand.example', '--username', 'happy.eth']);
    expect(code).toBe(1);
    expect(stderr).toContain('Invalid --username');
  });

  it('prints usage for --help and exits 0', async () => {
    const { code, stdout } = await cli(['--help']);
    expect(code).toBe(0);
    expect(stdout).toContain('Usage: universal-usernames validate');
  });
});

describe('checkEndpoint deadline', () => {
  it('times out when the endpoint never answers', async () => {
    const report = await checkEndpoint({ endpointUrl: `${origin}/hang`, username: 'happy', allowInsecure: true, timeoutMs: 200 });
    expect(codes(report)).toEqual(['HTTP_TIMEOUT']);
    expect(report.httpStatus).toBeNull();
  });

  it('times out when the body never finishes, keeping the status', async () => {
    const report = await checkEndpoint({ endpointUrl: `${origin}/slow-body`, username: 'happy', allowInsecure: true, timeoutMs: 200 });
    expect(codes(report)).toEqual(['HTTP_TIMEOUT']);
    expect(report.httpStatus).toBe(200);
  });
});
