#!/bin/bash

NAME=$1
ENDS_WITH=$2
ID=$3
loc=`dirname $0`

for i in `seq 1 5`; do
	ping -W 1 -q -n -c 1 192.168.0.$ENDS_WITH > /dev/null
	A=$?
	ping -W 1 -q -n -c 1 192.168.1.$ENDS_WITH > /dev/null
	B=$?

	C=$(($A & $B))
	LAST=`cat $loc/$NAME.state`

	echo $C > $loc/$NAME.state
	if [ $C -ne $LAST ]; then
	  if [ $C -eq 1 ]; then
	    echo "starting $NAME"
	    curl http://localhost:8125/start$ID
	  else
	    echo "stopping $NAME"
	    curl http://localhost:8125/stop$ID
	  fi
	fi

	sleep 8
done
