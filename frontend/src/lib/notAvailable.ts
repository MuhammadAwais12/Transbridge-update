/**
 * Thrown in place of calls to backend routes that don't exist yet, so the UI can show a clear
 * message instead of a silent 404. No request is sent. `route` names the missing endpoint.
 */
export class NotAvailableError extends Error {
  readonly route: string;

  constructor(feature: string, route: string) {
    super(`${feature} is not available yet.`);
    this.name = 'NotAvailableError';
    this.route = route;
  }
}

export function notAvailable(feature: string, route: string): never {
  throw new NotAvailableError(feature, route);
}
