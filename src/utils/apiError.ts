export function extractApiError(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: unknown } } }).response?.data;
    if (data) {
      const { message } = data;
      if (Array.isArray(message)) return (message as string[]).join('. ');
      if (typeof message === 'string' && message) return message;
    }
  }
  return null;
}
