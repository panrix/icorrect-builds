# server-config / data

Runtime data dumps from the 2026-03-24 VPS capture. 8 files. Snapshot in time — do not assume current.

## Files

- `all-listening-ports.txt` — full `ss`/`netstat` output, all listening sockets.
- `listening-ports.txt` — filtered listening-ports view.
- `crontab.txt` — `crontab -l` snapshot.
- `pm2-list.txt` — `pm2 list` output.
- `pm2-show-0.txt` — detailed `pm2 show` for process id 0.
- `running-node-processes.txt` — `ps` output filtered to node processes.
- `systemd-user-unit-files.txt` — `systemctl --user list-unit-files` snapshot.
- `systemd-user-units.txt` — `systemctl --user list-units` snapshot.
