export type ModelCapability = "text" | "vision" | "tool_use";

export type CatalogModel = {
  id: string;
  name: string;
  capabilities: ModelCapability[];
};

export type ModelProvider = {
  id: string;
  name: string;
  isConfigured: boolean;
  isFree: boolean;
  requiresApiKey: boolean;
  accessNote: string;
  models: CatalogModel[];
};

export const fallbackModelCatalog: ModelProvider[] = [
  {
    id: "ollama",
    name: "Ollama (Yerel)",
    isConfigured: false,
    isFree: true,
    requiresApiKey: false,
    accessNote:
      "API anahtarı gerekmez. Ollama'yı kurup seçtiğin modeli bilgisayarına indirmen gerekir.",
    models: [
      { id: "llama3.2", name: "Llama 3.2", capabilities: ["text", "tool_use"] },
      { id: "qwen2.5:3b", name: "Qwen 2.5 3B", capabilities: ["text", "tool_use"] },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    isConfigured: false,
    isFree: true,
    requiresApiKey: true,
    accessNote:
      "Ücretsiz kullanım kotası için GROQ_API_KEY gerekir. Kota ve model erişimi sağlayıcı tarafından değiştirilebilir.",
    models: [
      { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", capabilities: ["text", "tool_use"] },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    isConfigured: false,
    isFree: false,
    requiresApiKey: true,
    accessNote:
      "DEEPSEEK_API_KEY gerekir. API token bazında ücretlidir; düşük maliyet için DeepSeek Flash kullanın ve güncel fiyatı sağlayıcıda kontrol edin.",
    models: [
      { id: "deepseek-flash", name: "DeepSeek Flash (ekonomik)", capabilities: ["text", "tool_use"] },
      { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro (güçlü)", capabilities: ["text", "tool_use"] },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    isConfigured: false,
    isFree: false,
    requiresApiKey: true,
    accessNote:
      "GEMINI_API_KEY gerekir. Ücretsiz kota model ve hesap uygunluğuna bağlı; karmaşık görevler Gemini Pro'ya yönlendirilip ücret oluşturabilir.",
    models: [
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite (ekonomik)", capabilities: ["text", "tool_use", "vision"] },
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (hızlı)", capabilities: ["text", "tool_use", "vision"] },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (karmaşık işler)", capabilities: ["text", "tool_use", "vision"] },
    ],
  },
];
