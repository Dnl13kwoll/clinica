#!/bin/bash
set -e
DATA=$(date +%Y%m%d_%H%M)
TEMP="/tmp/backup-$DATA.sql.gz"
echo "=== Backup $DATA ==="
docker exec nutriapp-db pg_dumpall -U postgres | gzip > $TEMP
rclone copy $TEMP gdrive:nutriapp-backup/
echo "Google Drive OK"
mountpoint -q /mnt/hd-externo && cp $TEMP /mnt/hd-externo/backup/ && echo "HD Externo OK" || true
rclone copy $TEMP nextcloud:backup/ 2>/dev/null && echo "Nextcloud OK" || true
rclone delete gdrive:nutriapp-backup/ --min-age 30d
rm $TEMP
echo "=== Concluido! ==="
