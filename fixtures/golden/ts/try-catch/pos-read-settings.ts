import { DEFAULTS } from './defaults';

export function readSettings(raw: string) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    report(err);
    return DEFAULTS;
  } finally {
    markRead();
  }
}
