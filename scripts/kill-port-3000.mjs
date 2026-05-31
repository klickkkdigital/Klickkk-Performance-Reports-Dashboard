import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";

const port = "3000";
const nextDevLockPath = ".next/dev/lock";
const pids = new Set();

try {
  const output = execFileSync("lsof", [`-tiTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  for (const pid of output.split(/\s+/).filter(Boolean)) {
    pids.add(pid);
  }
} catch {
  // No process is listening on port 3000.
}

if (existsSync(nextDevLockPath)) {
  try {
    const lock = JSON.parse(readFileSync(nextDevLockPath, "utf8"));

    if (lock.pid) {
      pids.add(String(lock.pid));
    }
  } catch (error) {
    console.warn(`Could not read ${nextDevLockPath}: ${error.message}`);
  }
}

for (const pid of pids) {
  try {
    process.kill(Number(pid), "SIGKILL");
    console.log(`Killed existing dev process ${pid}`);
  } catch (error) {
    if (error.code !== "ESRCH") {
      console.warn(`Could not kill process ${pid}: ${error.message}`);
    }
  }
}

try {
  unlinkSync(nextDevLockPath);
} catch (error) {
  if (error.code !== "ENOENT") {
    console.warn(`Could not remove ${nextDevLockPath}: ${error.message}`);
  }
}
