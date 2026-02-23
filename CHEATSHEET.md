# VS Code + VPS Cheatsheet

## VS Code Shortcuts
- Cmd + Shift + P — Command palette
- Ctrl + ` — Toggle terminal
- Ctrl + Shift + ` — New terminal tab
- Cmd + Shift + ] — Next terminal
- Cmd + Shift + [ — Previous terminal
- Cmd + , — Open settings

## tmux
- tmux new -s name — Start new session
- tmux attach -t name — Reattach to session
- tmux detach — Detach (or Ctrl+B then D)
- tmux ls — List all sessions

## Monitoring
- htop — Live CPU/RAM monitor
- ps aux | grep claude — Check if Claude is running
- nproc — Check CPU cores

## Recovery
- find /home/ricky -type f -mmin -60 | head -30 — Files changed in last hour

## Audit-PLan
# With spec file                                                                                                                                                                                                   
  audit-plan ~/.claude/plans/steady-crunching-avalanche.md ~/path/to/SPEC.md                                                                                                                                                                                                         
  # Without spec file                                                                                                                                                                                              
  audit-plan ~/.claude/plans/some-plan.md          