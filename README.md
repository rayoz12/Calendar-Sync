# Calendar Sync
This is a server that accepts Appointments / meetings as a JSON object and syncs it to a configured CalDAV server. You can continually submit the same and new meetings and this will handle updating the existing CalDAV meeting or creating a new one. 

## Appointment Structure
```ts
interface Appointment {
	id: string;
	name: string;
	time: Date;
  duration: number; // in Hours
	location: string;
	isAccepted: boolean;
}
```
## Real world use
I used this to sync IBM's email system appointments to my own self-hosted CalDAV instance.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

Powered by NestJS