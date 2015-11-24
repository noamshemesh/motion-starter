#!/bin/bash

NAME=$1
ENDS_WITH=$2
ID=$3

while true; do
	ping -W 1 -q -n -c 1 192.168.0.$ENDS_WITH > /dev/null
	A=$?
	ping -W 1 -q -n -c 1 192.168.1.$ENDS_WITH > /dev/null
	B=$?

	C=$(($A & $B))
	LAST=`cat ./$NAME.state`

	echo $C > ./$NAME.state
	if [ $C -ne $LAST ]; then
	  if [ $C -eq 1 ]; then
	    echo "starting $NAME"
	    curl http://localhost:8125/start$ID
	  else
	    echo "stopping $NAME"
	    curl http://localhost:8125/stop$ID
	  fi
	fi

	sleep 10
done
