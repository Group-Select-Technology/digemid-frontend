export function extractApiError(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { status?: number; data?: { message?: unknown } } }).response;
    if (res?.status === 429) {
      return 'Demasiadas solicitudes. Por favor espere unos minutos antes de volver a intentarlo.';
    }
    const data = res?.data;
    if (data) {
      const { message } = data;
      if (Array.isArray(message)) return (message as string[]).join('. ');
      if (typeof message === 'string' && message) return message;
    }
  }
  return null;
}
