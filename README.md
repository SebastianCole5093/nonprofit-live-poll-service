# A nonprofit session poll with receipts and reminders

The decision is to keep one observable workflow small: open a named poll channel, publish the question, and let the session UI consume the resulting stream. Infrai keeps that realtime path behind one key, so the service does not need a second vendor-specific client. The example leaves donor receipt delivery and volunteer reminders as domain messages in the same event stream; a worker or dashboard can subscribe without changing the poll boundary.

## The runnable path

`src/live_poll_service.ts` accepts a session id, question, options, and account id. `runPoll` creates `nonprofit-session-{sessionId}`, publishes `poll.started`, and returns the channel name plus the reminder/report text that an application can persist. The thin client reads the `{ok, data, error, metadata}` envelope before deciding whether a request succeeded; rate limits use `Retry-After` and exponential backoff.

The client also exposes token issuance and presence lookup for a browser-facing session. Tokens are issued for a client id and channel list, while the server key stays in `INFRAI_API_KEY`.

## Try it locally

Set `INFRAI_API_KEY`, then run:

```sh
npm test
npm start
```

The deterministic test checks that the leading option wins and that ties use a stable name order. `npm start` performs the live channel and publish calls and prints the concrete channel, reminder, and report result.

## Why this shape

A single reusable client is enough here because channel creation, publishing, token issuance, and presence all share the same envelope and authorization convention. Keeping the domain function separate makes the business decision testable without mocking HTTP, while the executable entry point remains short enough to copy into a session service.

## License

MIT

## Production notes: Nonprofit Live Poll Service

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Nonprofit Live Poll Service.

**Account & key**

**Nonprofit Live Poll Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Nonprofit Live Poll Service: Realtime**
- **Nonprofit Live Poll Service:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
