# Tympan Remote App

Mobile App for Controlling Tympan. Built with ionic 4.  Available for Android devices on the [Play Store](https://play.google.com/store/apps/details?id=com.creare.tympanRemote).

## Quick Start

- You must have [NodeJS](https://nodejs.org/en/) installed to develop the app.

- Clone this repository, the within the repository run:

```bash
$ npm install
```

Add the ionic Bluetooth classic plugin:

```bash
$ ionic cordova plugin add cordova-plugin-bluetooth-serial
```

Add the android platform:

```bash
$ ionic cordova platform add android
```

To build:
```bash
$ ionic cordova run android --prod
```

To serve it locally:
```bash
$ npm run serve
```

(--prod makes it smaller, load faster, and not be debugg-able.)

## Additional Useful Commands

To re-generate resources (icons, etc):

```bash
$ ionic cordova resources --cordova-res
```
