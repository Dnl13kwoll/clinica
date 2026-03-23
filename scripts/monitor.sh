#!/bin/bash
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
RAM=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
DISK=$(df / | tail -1 | awk '{print $5}' | cut -d% -f1)
if [ "$CPU" -gt 70 ] || [ "$RAM" -gt 80 ] || [ "$DISK" -gt 85 ]; then
  echo "CPU=${CPU}% RAM=${RAM}% DISCO=${DISK}%" | mail -s "[SalusMetrics] Alerta servidor" voce@gmail.com
fi
