Welcome! Vanellus is the Kiebitzt Typescript library that provides
all necessary functionality for building web applications based on
the Kiebitz API and data models.

**This is still a work in progress.**

# Requirements

To run this library in the browser you'll need the `buffer` package, which
implements the `Buffer` object from Node.js.

# Building

To build the distribution files, simply run

```bash
npm run build
```

# Formatting

To format files, simply run

```bash
npm run lint:fix
```

# Development

To continuously build files and watch for changes, simply run

```bash
npm run build:watch
```

# Testing

To run the unit & integration tests

```bash
npm run test
```

These tests require a running Kiebitz test instance with appointments and
storage services, as well as a readable `002_admin.json` key file in the Kiebitz
settings directory. The default directory is `testing/fixtures/keys`.

This repository also holds a `docker-compose.yml` which will spin up the services needed
for testing by simply running `docker-compose up`.

You can change the directory and service ports by setting the `KIEBITZ_SETTINGS`,
`KIEBITZ_APPOINTMENTS_ENDPOINT` and `KIEBITZ_STORAGE_ENDPOINT` environment variables.
