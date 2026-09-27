# solid-tribbleSet up a development build for my Expo project and run the EAS build on my own machine.

Run `npx expo install expo-dev-client`. Check that eas-cli is installed and that I am logged in. Create an eas.json with a development profile if the project has none. For an iOS Simulator build, set `ios.simulator` to true on that profile first. Then stop and ask me: "Everything is installed. Do you want to build now?" Wait for my answer. When I say yes, run `eas build --platform <platform> --profile development --local` for the platform I name.

Install the resulting .apk or .app archive on my emulator or simulator, then start the development server with `npx expo start`. Match the package manager this project already uses, and report what you ran.

For the introduction to development builds, see https://docs.expo.dev/develop/development-builds/introduction/?buildenv=eas-cli-local.
