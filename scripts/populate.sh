# #!/bin/bash

process_ids=()
echo_color_red='\033[0;31m'
echo_color_reset='\033[0m'

if [ $# -eq 0 ]; then
  echo "${echo_color_red}ERROR: expected 1+ argument(s), received 0.${echo_color_reset}"
  exit 1
fi

for database in "$@"; do
  if [ ! -e "./databases/$database.js" ]; then
    echo "${echo_color_red}ERROR: database \"$database\" is not supported.${echo_color_reset}"
    exit 1
  fi
done

for database in "$@"; do
  node ./databases/$database.js populate & process_ids+=($!)
done

kill_all_process_ids() {
    echo "${echo_color_red}Received SIGINT. Killing all running processes...${echo_color_reset}"

    for pid in "${process_ids[@]}"; do
        kill "$pid" &>/dev/null
    done

    wait
    exit 0
}

trap kill_all_process_ids SIGINT

wait
