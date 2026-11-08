## The double-tap problem

On a fibre connection, a payment request comes back in a few hundred milliseconds. On a congested mobile network abroad, it can hang for ten seconds — long enough for a worried user to tap "Send" again, or for the app to retry on its own.

Without protection, both requests reach the API. Both look valid. Both move money.

## Keys, not hope

The fix is an `Idempotency-Key`: a unique id the client generates once per transfer intent and sends with every attempt. The server stores the first result under that key and simply replays it for any repeat.

```ts title="transfer.service.ts"
const key = crypto.randomUUID();

return this.http.post<TransferResult>(
  '/transfers', payload,
  { headers: { 'Idempotency-Key': key } }
).pipe(retry({ count: 3, delay: backoff }));
```

Because the key is created before the first attempt, every retry — automatic or human — carries the same identity.

> A retry should never be a new decision. It's the same decision, asked again.

## Typing the contract

Sharing the request and response types between Angular and NestJS meant a renamed field failed the build instead of a transfer. It also made the states explicit:

- **pending** — accepted, not settled yet
- **completed** — money moved, show the receipt
- **rejected** — nothing moved, safe to try again

## What the user sees

The button locks the moment it's tapped, and a slow response shows "Still sending — don't close this page" instead of a spinner that looks frozen.

> [!TIP]
> Tip — log the idempotency key with every error report. Support can then answer "did it go through?" in seconds.

## Takeaways

- Generate the key once per intent, before the first attempt.
- Type the states you show users, not just the payloads.
- Design the slow path: it's the one your users will remember.
