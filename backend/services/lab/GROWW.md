# Groww market-data integration boundary

This repository has a disabled, server-side adapter for Groww **live quote reads**. It contains no order, account, position, or trading API functionality.

## Verified public documentation (reviewed 2026-10-23)

- [Authentication and published limits](https://groww.in/trade-api/docs/curl): bearer access tokens, API version header, and the live-data budget of 10 requests/second and 300/minute.
- [Live data](https://groww.in/trade-api/docs/curl/live-data): the quote endpoint documents LTP, OHLC, volume, and market depth.
- [Instruments](https://groww.in/trade-api/docs/curl/instruments): the public instrument catalogue is the source of exchange/segment/trading-symbol identifiers.
- [Historical data](https://groww.in/trade-api/docs/curl/historical-data): the documented historical candle range endpoint is marked deprecated.

## Deliberate limits

Actual Groww subscription entitlement, credentials, and live connectivity have not been supplied or tested. Consequently, `GROWW_API_ENABLED` defaults to `false`; status checks do not contact Groww; and historical-candle retrieval is blocked rather than guessed or backfilled with synthetic data.

When an account owner confirms a current entitlement and provides server-only credentials, enable the adapter with `GROWW_API_ENABLED=true` and `GROWW_ACCESS_TOKEN`. Do not expose that token to the frontend, commit it, or use this adapter for trading.
