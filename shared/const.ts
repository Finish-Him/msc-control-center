import type { ServiceType } from "./types.js";

export const SERVICE_TYPES: Record<ServiceType, { label: string; color: string; docsUrl: string }> = {
  anthropic:   { label: "Anthropic",    color: "#CC785C", docsUrl: "https://console.anthropic.com" },
  openai:      { label: "OpenAI",       color: "#74AA9C", docsUrl: "https://platform.openai.com" },
  openrouter:  { label: "OpenRouter",   color: "#6C5CE7", docsUrl: "https://openrouter.ai" },
  elevenlabs:  { label: "ElevenLabs",   color: "#FFCC02", docsUrl: "https://elevenlabs.io" },
  huggingface: { label: "HuggingFace",  color: "#FFD21E", docsUrl: "https://huggingface.co" },
  github:      { label: "GitHub",       color: "#ffffff", docsUrl: "https://github.com" },
  trello:      { label: "Trello",       color: "#0052CC", docsUrl: "https://trello.com" },
  supabase:    { label: "Supabase",     color: "#3ECF8E", docsUrl: "https://supabase.com" },
  vercel:      { label: "Vercel",       color: "#ffffff", docsUrl: "https://vercel.com" },
};

export const DOCKER_STATES = {
  running: { label: "Running",  color: "text-emerald-400" },
  exited:  { label: "Exited",   color: "text-red-400" },
  paused:  { label: "Paused",   color: "text-yellow-400" },
  created: { label: "Created",  color: "text-blue-400" },
} as const;

export const GRADIO_STATUS_COLORS = {
  ok:      "text-emerald-400",
  warn:    "text-yellow-400",
  fail:    "text-red-400",
  unknown: "text-gray-400",
} as const;

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python:  "#3572A5",
  Rust:       "#dea584", Go:          "#00ADD8", CSS:     "#563d7c",
  HTML:       "#e34c26",
};

export const HF_SPACES = [
  // TTS
  { id: "suno-bark",             name: "Bark (Suno)",                category: "tts",       hfUrl: "https://huggingface.co/spaces/suno/bark",                         appUrl: "https://suno-bark.hf.space",                                     description: "TTS generativa com emoções e efeitos sonoros" },
  { id: "mrfakename-melotts",    name: "MeloTTS",                    category: "tts",       hfUrl: "https://huggingface.co/spaces/mrfakename/MeloTTS",                appUrl: "https://mrfakename-melotts.hf.space",                            description: "TTS multilíngue de alta qualidade" },
  // Image
  { id: "flux-schnell",          name: "FLUX.1-schnell",             category: "image",     hfUrl: "https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell", appUrl: "https://black-forest-labs-flux-1-schnell.hf.space",             description: "Geração de imagens de alta qualidade" },
  { id: "stable-cascade",        name: "Stable Cascade",             category: "image",     hfUrl: "https://huggingface.co/spaces/multimodalart/stable-cascade",     appUrl: "https://multimodalart-stable-cascade.hf.space",                 description: "Geração de imagens em cascata" },
  // Video
  { id: "wan2-t2v",              name: "Wan2.1 T2V",                 category: "video",     hfUrl: "https://huggingface.co/spaces/Wan-AI/Wan2.1-T2V-14B",            appUrl: "https://wan-ai-wan2-1-t2v-14b.hf.space",                        description: "Geração de vídeo texto-para-vídeo 14B" },
  { id: "instant-video",         name: "Instant Video",              category: "video",     hfUrl: "https://huggingface.co/spaces/KingNish/Instant-Video",            appUrl: "https://kingnish-instant-video.hf.space",                       description: "Geração de vídeo instantânea" },
  // Coding
  { id: "qwen-coder",            name: "Qwen2.5-Coder-7B",           category: "coding",    hfUrl: "https://huggingface.co/spaces/Qwen/Qwen2.5-Coder-7B-Instruct",  appUrl: "https://qwen-qwen2-5-coder-7b-instruct.hf.space",              description: "Assistente de código Qwen 2.5" },
  { id: "starcoder2",            name: "StarCoder2-15B",              category: "coding",    hfUrl: "https://huggingface.co/spaces/bigcode/starcoder2-15b-instruct-v0.1", appUrl: "https://bigcode-starcoder2-15b-instruct-v0-1.hf.space",    description: "Modelo de código open-source 15B" },
  // Embedding
  { id: "paraphrase-multilingual", name: "Paraphrase Multilingual",  category: "embedding", hfUrl: "https://huggingface.co/spaces/sentence-transformers/paraphrase-multilingual", appUrl: "https://sentence-transformers-paraphrase-multilingual.hf.space", description: "Embeddings multilíngues para similaridade" },
  { id: "mteb-leaderboard",      name: "MTEB Leaderboard",           category: "embedding", hfUrl: "https://huggingface.co/spaces/mteb/leaderboard",                  appUrl: "https://mteb-leaderboard.hf.space",                             description: "Ranking de modelos de embedding" },
  // RAG
  { id: "haystack-demos",        name: "Haystack Demos",             category: "rag",       hfUrl: "https://huggingface.co/spaces/deepset/haystack-demos",            appUrl: "https://deepset-haystack-demos.hf.space",                       description: "Pipeline RAG com Haystack" },
  { id: "llm-coder",             name: "LLM Coder (RAG)",            category: "rag",       hfUrl: "https://huggingface.co/spaces/gradio/llm-coder",                  appUrl: "https://gradio-llm-coder.hf.space",                             description: "RAG para assistência em código" },
] as const satisfies import("./types.js").SpaceCard[];
