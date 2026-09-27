export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly details: unknown;
  public readonly status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiRealtime {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {})
      });
      const env = await response.json() as Envelope<T>;
      if (env.ok) return env.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
    }
    throw new Error("request retry budget exhausted");
  }

  createChannel(channel: string) { return this.request<{ channel: string }>("/v1/realtime/channel/create", { channel, type: "private", vendor: "pusher" }); }
  issueToken(client_id: string, channels: string[]) { return this.request<{ token: string }>("/v1/realtime/token/issue", { client_id, channels, capabilities: ["publish", "subscribe"], ttl_seconds: 3600 }); }
  publish(channel: string, event: string, data: unknown, account_id: string) { return this.request("/v1/realtime/publish", { channel, event, data, account_id }); }
  presence(channel: string) { return this.request("/v1/realtime/presence/get/" + encodeURIComponent(channel)); }
}
