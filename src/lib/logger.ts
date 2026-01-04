type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'STORE' | 'API' | 'GEMINI' | 'GAME' | 'UI';

interface LogOptions {
  truncate?: number;
  timing?: number;
}

const COLORS: Record<LogCategory, string> = {
  STORE: '#3b82f6',   // blue
  API: '#22c55e',     // green
  GEMINI: '#a855f7',  // purple
  GAME: '#f97316',    // orange
  UI: '#06b6d4',      // cyan
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #6b7280',
  info: 'color: #ffffff',
  warn: 'color: #eab308',
  error: 'color: #ef4444; font-weight: bold',
};

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function truncateValue(value: unknown, maxLength: number = 100): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}... (${str.length} chars)`;
}

function formatData(data: Record<string, unknown>, options: LogOptions = {}): string[] {
  const lines: string[] = [];
  const entries = Object.entries(data);
  const maxLength = options.truncate ?? 100;

  entries.forEach(([key, value], index) => {
    const isLast = index === entries.length - 1;
    const prefix = isLast ? '└──' : '├──';
    const displayValue = truncateValue(value, maxLength);
    lines.push(`  ${prefix} ${key}: ${displayValue}`);
  });

  return lines;
}

function createLogger() {
  const isDev = typeof window !== 'undefined' 
    ? true // Always log in browser during dev
    : process.env.NODE_ENV !== 'production';

  const isEnabled = isDev;

  function log(
    level: LogLevel,
    category: LogCategory,
    context: string,
    message: string,
    data?: Record<string, unknown>,
    options: LogOptions = {}
  ) {
    if (!isEnabled && level === 'debug') return;

    const timestamp = getTimestamp();
    const color = COLORS[category];
    const levelStyle = LEVEL_STYLES[level];

    const header = `[${timestamp}] [${category}] ${context}${message ? ` - ${message}` : ''}`;

    if (typeof window !== 'undefined') {
      // Browser logging with colors
      const timingStr = options.timing ? ` (${options.timing}ms)` : '';
      console.log(
        `%c${header}${timingStr}`,
        `color: ${color}; font-weight: bold`
      );

      if (data && Object.keys(data).length > 0) {
        const lines = formatData(data, options);
        lines.forEach((line) => {
          console.log(`%c${line}`, levelStyle);
        });
      }
    } else {
      // Server logging (plain text)
      const timingStr = options.timing ? ` (${options.timing}ms)` : '';
      console.log(`${header}${timingStr}`);
      
      if (data && Object.keys(data).length > 0) {
        const lines = formatData(data, options);
        lines.forEach((line) => console.log(line));
      }
    }
  }

  return {
    // Store actions
    store(action: string, data?: Record<string, unknown>) {
      log('info', 'STORE', action, '', data);
    },

    // API calls
    api(
      method: string,
      endpoint: string,
      phase: 'request' | 'response' | 'error',
      data?: Record<string, unknown>,
      timing?: number
    ) {
      const message = phase.charAt(0).toUpperCase() + phase.slice(1);
      log(
        phase === 'error' ? 'error' : 'info',
        'API',
        `${method} ${endpoint}`,
        message,
        data,
        { timing }
      );
    },

    // Gemini SDK calls
    gemini(
      fn: string,
      phase: 'request' | 'response' | 'error',
      data?: Record<string, unknown>,
      timing?: number
    ) {
      const message = phase.charAt(0).toUpperCase() + phase.slice(1);
      log(
        phase === 'error' ? 'error' : 'info',
        'GEMINI',
        fn,
        message,
        data,
        { timing, truncate: 150 }
      );
    },

    // Game events
    game(event: string, data?: Record<string, unknown>) {
      log('info', 'GAME', event, '', data);
    },

    // UI interactions
    ui(component: string, event: string, data?: Record<string, unknown>) {
      log('debug', 'UI', component, event, data);
    },

    // Generic debug
    debug(context: string, message: string, data?: Record<string, unknown>) {
      log('debug', 'GAME', context, message, data);
    },

    // Warnings
    warn(context: string, message: string, data?: Record<string, unknown>) {
      log('warn', 'GAME', context, message, data);
    },

    // Errors
    error(context: string, message: string, data?: Record<string, unknown>) {
      log('error', 'GAME', context, message, data);
    },

    // Group logging for complex operations
    group(category: LogCategory, label: string) {
      if (typeof window !== 'undefined') {
        const timestamp = getTimestamp();
        const color = COLORS[category];
        console.group(`%c[${timestamp}] [${category}] ${label}`, `color: ${color}; font-weight: bold`);
      } else {
        console.log(`--- ${label} ---`);
      }
    },

    groupEnd() {
      if (typeof window !== 'undefined') {
        console.groupEnd();
      }
    },
  };
}

export const logger = createLogger();
