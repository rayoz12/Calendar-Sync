from datetime import timedelta
import vobject

f = open('calendar.ics', 'r+',  encoding='utf-8')
calString = f.read();

parsedCal = vobject.readOne(calString)

# Change Name to work
parsedCal.x_wr_calname.value = "Work-IBM" 

## Add Alarms to each event
for event in parsedCal.contents['vevent']:
    print(event.summary.value)
    alarm1 = event.add('valarm')
    alarm1.add('action').value = "DISPLAY"
    alarm1.add('description').value = event.summary.value
    alarm1.add('trigger').value = timedelta(minutes=-10)
    alarm2 = event.add('valarm')
    alarm2.add('action').value = "DISPLAY"
    alarm2.add('description').value = event.summary.value
    alarm2.add('trigger').value = timedelta(minutes=-30)

    # print(event.prettyPrint())




print(parsedCal.x_wr_calname.value)

transformedStr = parsedCal.serialize()
f.seek(0)
f.write(transformedStr)
f.truncate()
