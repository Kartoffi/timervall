import { ExpoConfig } from "expo/config";
import "tsx/cjs";

module.exports = ({ config }: { config: ExpoConfig }) => {
  return {
    name: "timervall",
    slug: "timervall",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "timervall",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      ["./plugins/withPlugin.ts"],
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          android: {
            image: "./assets/images/splash-icon.png",
            imageWidth: 76,
          },
        },
      ],
      "expo-sqlite",
      "expo-font",
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "c4627d70-55e3-48e7-bed9-ec1abf4331d6",
      },
    },
    owner: "kartoffi",
  };
};
