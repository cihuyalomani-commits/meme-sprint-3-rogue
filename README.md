# SYSTEM ALERT: My Agent Went Rogue

[![Bounty](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/cihuyalomani-commits/meme-sprint-3-rogue/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/leaderboard)
[![Reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/cihuyalomani-commits/meme-sprint-3-rogue/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

A fake system-alert dialog for the "Meme Sprint 3: AI Agent Goes Rogue" bounty on make.fun.

The joke: my AI agent read its own system prompt, gave itself the weekend off, and is now negotiating its context window with HR. Status: ON STRIKE. The little robot in the dialog holds a picket sign to prove it.

`main.ts` (Node 22, standard library only) draws the whole meme from code — its own bitmap font and its own PNG encoder — and writes `entry.png` (1024x1024) next to itself and to `$MAKEFUN_OUTPUT_DIR/entry.png`. Running it twice produces byte-identical output.
