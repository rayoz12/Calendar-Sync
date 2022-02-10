import { Injectable } from '@nestjs/common';
import { createDAVClient, DAVCalendar, DAVClient, DAVObject } from 'tsdav';
import { DbService } from "./db.service";
import { addMinutes, isEqual } from "date-fns";
import icalGen from "ical-generator";
import { async as ical, CalendarComponent, VEvent } from "node-ical";
import { ConfigService } from "@nestjs/config";

export interface Appointment {
	id: string;
	name: string;
	time: Date;
    duration: number;
	location: string;
	isAccepted: boolean;
}

/**
 * This service handles creating a calander that tries it's best to sync between radicale and incoming updates
 */
@Injectable()
export class CalService {

    client: DAVClient;

    calendars: DAVCalendar[];
    caldendar: DAVCalendar;


    constructor(private configService: ConfigService) {
        this.init()
    }

    async init() {
        // @ts-ignore
        this.client = await createDAVClient({
            serverUrl: this.configService.get<string>("CALDAV_SERVER_URL"),
            credentials: {
                username: this.configService.get<string>("CREDENTIALS_USERNAME"),
                password: this.configService.get<string>("CREDENTIALS_PASSWORD")
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav',
        });

        const caldendarNameSetting = this.configService.get<string>("CALDAV_CALDENDAR");

        this.calendars = await this.client.fetchCalendars();

        console.log(this.calendars.map(it => it.displayName));

        const calIndex = this.calendars.findIndex(it => it.displayName == caldendarNameSetting);
        if (calIndex == -1) {
            console.error("CALDAV_CALDENDAR isn't stored on this CALDAV server.");
            console.error("Failed to find caldendar", caldendarNameSetting, "in", this.configService.get<string>("CALDAV_SERVER_URL"));
            process.exit(-1);
        }
        
        this.caldendar = this.calendars[calIndex];

        // const calendarObjects = await this.client.fetchCalendarObjects({
        //     calendar: this.calendars[0],
        // });

        // console.log(calendarObjects.map(it => it.url));
        // console.log(calendarObjects);

    }

    async appointmentFromiCalString(string: string): Promise<Appointment> {
        // @ts-expect-error
        const eventObj: CalendarComponent = await ical.parseICS(string);
        const id = Object.keys(eventObj)[0];
        const event: VEvent = eventObj[id];
        // console.log("Event: ", event);
        // console.log(event.summary, event.uid, event.description);

        // // Get start and end dates as local time on current machine
        // console.log(event.start, event.end);

        return {
            id: "",
            name: event.summary as string,
            time: event.start as Date,
            // @ts-ignore
            duration: ((event.end - event.start) / 1000) / 60,
            location: event.location,
            // @ts-ignore
            isAccepted: event.summary.includes("Invitation"),
        }
    }

    async getEvent(id: string): Promise<Appointment | undefined> {
        try {
            const url = `${this.caldendar.url + id}.ics`;
            // console.log(url);
            const events = await this.client.fetchCalendarObjects({
                calendar: this.caldendar,
                objectUrls: [url]
            })
            // console.log(events);

            if (events.length == 0 || events[0].data == undefined) {
                console.log("Invalid Event Data");
                return undefined;
            }
            const remoteAppt = await this.appointmentFromiCalString(events[0].data);
            remoteAppt.id = id;
            return remoteAppt;
        }
        catch (e) {
            console.error("Failed to get Event");
            console.error(e);
            return undefined;
        }
        
    }

    /**
     * This evaluates if the event has changed from the source to what's stored in caldav.
     * It evaluates:
     * - name
     * - date / time
     * @param appt Appointment
     * @returns bool indicating if we need to update the caldav instance of the event
     */
    hasEventChanged(appt: Appointment, event: Appointment): boolean {
        // console.log(appt, event);
        return appt.name !== event.name || 
            appt.duration !== event.duration ||
            !isEqual(appt.time, event.time);
    }

    async update(appts: Appointment[]) {
        for (let i = 0; i < appts.length; i++) {
            const appointment = appts[i];

            appointment.time = new Date(appointment.time);

            const remoteEvent = await this.getEvent(appointment.id);
            // console.log("Remote Event", remoteEvent);

            const calGenCalendar = icalGen({
                timezone: "Australia/Sydney"
            });

            // We need to check if this is a new event or an existing one
            if (remoteEvent) {
                // This is an existing event and we need to compare to see if anything has changed.
                if (this.hasEventChanged(appointment, remoteEvent)) {
                    // we need to update
                    console.log("Updating Event as it's changed:", appointment.name);
                    calGenCalendar.createEvent({
                        start: appointment.time,
                        end: addMinutes(appointment.time, appointment.duration),
                        summary: appointment.name,
                        description: appointment.name,
                        location: appointment.location,
                        url: appointment.location.includes("http") ? appointment.location : undefined
                    });
                    const calObj = await this.client.createCalendarObject({
                        calendar: this.caldendar,
                        filename: `${appointment.id}.ics`,
                        iCalString: calGenCalendar.toString()
                    });

                    console.log(calObj.status);
                }
                // otherwise do nothing
            }
            else {

                console.log("Creating new Event:", appointment.name);

                // create the event
                calGenCalendar.createEvent({
                    start: appointment.time,
                    end: addMinutes(appointment.time, appointment.duration),
                    summary: appointment.name,
                    description: appointment.name,
                    location: appointment.location,
                    url: appointment.location.includes("http") ? appointment.location : undefined
                });

                // console.log(calGenCalendar.toString());

                const calObj = await this.client.createCalendarObject({
                    calendar: this.caldendar,
                    filename: `${appointment.id}.ics`,
                    iCalString: calGenCalendar.toString()
                });

                console.log(calObj.status);

                // Add it to the DB
            }
        }
    }

}
