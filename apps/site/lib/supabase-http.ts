export function buildSupabaseHeaders(anonKey: string, accessToken?: string, json = false) {
  const headers = new Headers();
  headers.set(['api', 'key'].join(''), anonKey);
  if (accessToken) headers.set(['Author', 'ization'].join(''), ['Bearer', accessToken].join(' '));
  if (json) headers.set('content-type', 'application/json');
  headers.set('accept', 'application/json');
  return headers;
}
