export class VoyantApiError extends Error {
  readonly body: unknown;
  readonly requestId: string | null;
  readonly status: number;

  constructor(
    message: string,
    options: { body: unknown; requestId: string | null; status: number },
  ) {
    super(message);
    this.name = "VoyantApiError";
    this.status = options.status;
    this.requestId = options.requestId;
    this.body = options.body;
  }
}
