# Finance Tracker (AR) — Web

Angular frontend for [finance-tracker-ar](https://github.com/palomarivas/finance-tracker-ar),
a personal finance tracker built around the realities of money in Argentina
(ARS/USD, multiple dollar rates, the credit-card *dólar tarjeta* mechanic).

## Stack

| Concern | Choice |
|---|---|
| Framework | Angular 22 (standalone, signals, zoneless) |
| Styling | Tailwind CSS v4 + custom semantic tokens (no component library) |
| Overlays / a11y | Angular CDK |
| i18n | Transloco — es-AR (default) + en, runtime switch |
| Theme | Dark fintech default + light mode, `prefers-color-scheme` aware |
| Type | Geist Sans UI · Geist Mono `tabular-nums` for every amount |
| Icons | Phosphor |
| Charts | ngx-echarts *(dashboard milestone)* |

## Status

🚧 Milestone 1: scaffold + auth + shell. Login/register against the API works,
JWT guard + interceptor in place, sidebar shell (bottom bar on mobile),
es/en and dark/light toggles. Dashboard, import flow and CRUD screens follow.

## Run

```bash
# API first (see backend repo): docker compose up -d && npm run start:dev
npm install
npm start          # http://localhost:4200 against http://localhost:3000
```
