import "dotenv/config";

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,

  JWT_SECRET: process.env.JWT_SECRET || "change_me_in_production",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "change_me_refresh_in_production",
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "change_me_32_char_key_for_aes256_",

  PORT: parseInt(process.env.PORT || "3001"),
  NODE_ENV: process.env.NODE_ENV || "development",

  VPS_HOST: process.env.VPS_HOST || "",
  VPS_PORT: parseInt(process.env.VPS_PORT || "22"),
  VPS_USER: process.env.VPS_USER || "root",
  VPS_PASSWORD: process.env.VPS_PASSWORD || "",

  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || "Finish-Him",

  GRADIO_V1_URL: process.env.GRADIO_V1_URL || "https://9db93e4f6b0e4681ff.gradio.live",
  GRADIO_V2_URL: process.env.GRADIO_V2_URL || "https://c590a2718e2cb75d24.gradio.live",
  GRADIO_CHECK_INTERVAL: parseInt(process.env.GRADIO_CHECK_INTERVAL || "5"),

  LOCAL_PROJECTS_PATH: process.env.LOCAL_PROJECTS_PATH ||
    "C:/Users/Moises e  Naiara/Desktop/pasta geral/completo/pasta de trabalho/Projetos",

  get isDev() {
    return this.NODE_ENV === "development";
  },
};
