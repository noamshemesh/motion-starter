#!/bin/bash

NAME=$1
ENDS_WITH=$2
ID=$3
loc=`dirname $0`
suspect=0
for i in `seq 1 900`; do
	ping -W 1 -q -n -c 1 192.168.0.$ENDS_WITH > /dev/null
	A=$?
	ping -W 1 -q -n -c 1 192.168.1.$ENDS_WITH > /dev/null
	B=$?

	C=$(($A & $B))
	LAST=`cat $loc/$NAME.state`

	if [ $C -ne $LAST ]; then
	  if [ $C -eq 1 ]; then
            if [ $suspect -eq 310 ]; then
	      echo "`date` starting $NAME"
	      curl http://localhost:8125/start$ID
	      echo $C > $loc/$NAME.state
              suspect=0
            else
              echo "`date` suspecting $NAME"
              suspect=$(($suspect+1))
            fi
	  else
            suspect=0
	    echo "`date` stopping $NAME"
	    curl http://localhost:8125/stop$ID
	    echo $C > $loc/$NAME.state
	  fi
	fi

	sleep 2
done
