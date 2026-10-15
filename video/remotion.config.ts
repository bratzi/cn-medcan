import { Config } from "@remotion/cli/config";

// Pinsel-Logo liegt im Hauptprojekt unter public/marke/.
Config.setPublicDir("../public");
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
// bt709: begrenzter Farbbereich (yuv420p statt yuvj420p), wie Instagram es erwartet.
Config.setColorSpace("bt709");
