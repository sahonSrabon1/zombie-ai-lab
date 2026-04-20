// ─── ZombieCoder Logger ──────────────────────────────────────────────────────
// Production logging utility with severity levels and structured output.
// No external dependencies. All output goes to stdout/stderr.

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  error?: Error;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  fatal: '\x1b[35m', // magenta
};

const RESET = '\x1b[0m';

class Logger {
  private module: string;
  private minLevel: LogLevel;

  constructor(module: string, minLevel: LogLevel = 'info') {
    this.module = module;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel] &&
           LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private format(entry: LogEntry): string {
    const ts = entry.timestamp.toISOString();
    const levelStr = entry.level.toUpperCase().padEnd(5);
    const color = LOG_COLORS[entry.level];
    const prefix = `${color}[${ts}] [${levelStr}] [${entry.module}]${RESET}`;

    if (entry.error) {
      return `${prefix} ${entry.message}\n${entry.error.stack || entry.error.message}`;
    }
    if (entry.data !== undefined) {
      return `${prefix} ${entry.message} ${JSON.stringify(entry.data)}`;
    }
    return `${prefix} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) return;
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      module: this.module,
      message,
      data,
      error,
    };

    const formatted = this.format(entry);
    if (level === 'error' || level === 'fatal') {
      process.stderr.write(formatted + '\n');
    } else {
      process.stdout.write(formatted + '\n');
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: unknown): void {
    this.log('error', message, data, error);
  }

  fatal(message: string, error?: Error, data?: unknown): void {
    this.log('fatal', message, data, error);
  }

  /** Create child logger with submodule name */
  child(submodule: string): Logger {
    return new Logger(`${this.module}:${submodule}`);
  }
}

/** Create a new logger instance for a module */
export function createLogger(module: string, minLevel?: LogLevel): Logger {
  return new Logger(module, minLevel);
}

export { Logger };
export type { LogLevel };
