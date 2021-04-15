# Tympan Remote App

Mobile App for Controlling Tympan. Built with ionic 5.  Available for Android devices on the [Play Store](https://play.google.com/store/apps/details?id=com.creare.tympanRemote) and iOS devices on the App Store (soon).

## Quick Start

- You must have [NodeJS](https://nodejs.org/en/) installed to develop the app.  This has been tested with node 14.4; problems may exist with earlier versions of node.

- You must have the Android SDK, which can be gotten by installing [Android Studio](https://developer.android.com/studio).

- Clone this repository, then within the repository run:

```bash
$ npm install
```

To run build for android:

```bash
$ npm run ionic.prepare.android
$ npm run ionic.build.android
```

For iOS:

```bash
$ npm run ionic.prepare.ios
$ npm run ionic.build.ios
```

To serve it locally:
```bash
$ npm run serve
```

## Additional Useful Commands

To re-generate resources (icons, etc):

```bash
$ npm run resources
```
