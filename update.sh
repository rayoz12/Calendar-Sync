#!/bin/bash
rm calendar.ics
wget 'https://outlook.office365.com/owa/calendar/4ffd79978cf04c469c5dcf83a16c3eff@ibm.com/75e705935072408083eba2a395b34623475859516253854388/calendar.ics'
python transform.py
curl -vvv -u 'ryan:<password>' -X PUT 'http://192.168.1.103:5232/ryan/Work' --data-binary @calendar.ics