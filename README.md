# Pogoda Fishing Assistant

Production-ready Telegram fishing assistant and Vercel-ready website foundation for Ukraine, with Kalush district defaults.

## Commands

- `npm run dev` - website/API development server
- `npm run bot` - Telegram bot polling runtime
- `npm run build` - Next.js production build
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check
- `npm run test` - unit tests

## AI priority

1. LM Studio local endpoint
2. OpenAI-compatible endpoint if configured later
3. Rule-based fishing engine fallback

The bot never blocks on AI availability.
