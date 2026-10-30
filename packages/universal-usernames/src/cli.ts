#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { checkEndpoint } from './check-endpoint';
import { UsernameError } from './index';

const USAGE = `Usage: universal-usernames validate <endpointUrl> --username <label> [--token <bearer>]

Requests <endpointUrl>/<label> the way Namespace does and prints a JSON
validation report. Exits 0 when the endpoint passes, 1 otherwise.`;

export interface CliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  env: Record<string, string | undefined>;
}

type CliCommand =
  | { kind: 'help' }
  | { kind: 'usage-error'; message: string }
  | { kind: 'validate'; endpointUrl: string; username: string; token?: string };

function parseCommand(argv: string[]): CliCommand {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        username: { type: 'string' },
        token: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (err) {
    return { kind: 'usage-error', message: err instanceof Error ? err.message : String(err) };
  }

  const { values, positionals } = parsed;
  if (values.help) return { kind: 'help' };
  if (positionals[0] !== 'validate') return { kind: 'usage-error', message: 'Unknown command' };
  if (positionals.length !== 2) return { kind: 'usage-error', message: 'validate takes exactly one endpoint URL' };
  if (!values.username) return { kind: 'usage-error', message: '--username is required' };
  return { kind: 'validate', endpointUrl: positionals[1], username: values.username, token: values.token };
}

/** Runs the CLI and returns the exit code. */
export async function runCli(argv: string[], io: CliIo): Promise<number> {
  const command = parseCommand(argv);
  if (command.kind === 'help') {
    io.stdout(USAGE);
    return 0;
  }
  if (command.kind === 'usage-error') {
    io.stderr(`${command.message}\n\n${USAGE}`);
    return 1;
  }

  try {
    const report = await checkEndpoint({
      endpointUrl: command.endpointUrl,
      username: command.username,
      bearerToken: command.token,
      // Same flag as the gateway: lets tests point at a local http server.
      allowInsecure: io.env.UUN_ALLOW_INSECURE_ENDPOINTS === 'true',
    });
    io.stdout(JSON.stringify(report, null, 2));
    return report.ok ? 0 : 1;
  } catch (err) {
    if (err instanceof UsernameError) {
      io.stderr(`Invalid --username: ${err.message}`);
      return 1;
    }
    throw err;
  }
}

if (require.main === module) {
  runCli(process.argv.slice(2), {
    stdout: (text) => process.stdout.write(`${text}\n`),
    stderr: (text) => process.stderr.write(`${text}\n`),
    env: process.env,
  }).then(
    (code) => {
      process.exitCode = code;
    },
    (err: unknown) => {
      process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
      process.exitCode = 1;
    }
  );
}
