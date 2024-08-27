import { execa } from "execa-cjs";

export async function $stdout(
  cmd: [string, ...string[]],
  options: {
    cwd?: string;
  },
): Promise<string> {
  const [command, ...args] = cmd;

  const process = await execa(command, args, {
    cwd: options.cwd,
  });
  return process.stdout;
}

export async function $lines(
  cmd: [string, ...string[]],
  options: {
    cwd?: string;
  },
): Promise<string[]> {
  const stdout = await $stdout(cmd, options);
  return stdout.split("\n");
}
