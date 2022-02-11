import { Body, Controller, Get, Post, Response } from '@nestjs/common';
import { Response as ResponseExpress } from "express";
import { Appointment, CalService } from "./cal.service";

@Controller()
export class AppController {
  constructor(private readonly calService: CalService) {}

  @Get("/health")
  healthCheck(@Response() res: ResponseExpress) {
    res.status(200).end();
  }

  @Post()
  updateCal(@Body() body: Appointment[]) {
    for (let i = 0; i < body.length; i++) {
      const appt = body[i];
      appt.time = new Date(appt.time);
    }
    console.log("Recieved the following Appointments", body.map(it => [it.name, it.time]));
    this.calService.update(body)
  }
}
