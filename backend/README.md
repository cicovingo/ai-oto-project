# Flowmind Backend

Flowmind frontend ile aynı API yollarını kullanan FastAPI uygulaması. Workflow
ve çalıştırma kayıtları SQLite veritabanında saklanır. Agno ile yapılandırılmış
model sağlayıcısında AI ajanları gerçek olarak çalıştırılır.

## Kurulum ve çalıştırma

PowerShell'de `backend/` klasörüne geçtikten sonra:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --env-file .env
```

API varsayılan olarak `http://localhost:8000` üzerinde çalışır. OpenAPI arayüzü
`http://localhost:8000/docs` adresindedir.

## Ücretsiz model sağlayıcıları

- **Ollama (yerel):** Model bilgisayarda çalışır, API anahtarı veya bulut
  hesabı gerekmez. Ollama uygulamasını kurup `ollama pull llama3.2` veya
  `ollama pull qwen2.5:3b` komutuyla bir model indirin. Makine kaynakları
  gerekir; kullanılabilir hız donanıma bağlıdır.
- **Groq:** Ücretsiz kullanım kotası vardır; sunucuda `GROQ_API_KEY`
  tanımlanmalıdır. Anahtar [Groq Console](https://console.groq.com/keys)
  üzerinden alınır. Model erişimi ve kota sağlayıcının güncel şartlarına
  bağlıdır.
- **DeepSeek API:** Sunucuda `DEEPSEEK_API_KEY` tanımlanmalıdır. API ücretsiz
  değildir; girdi/çıktı tokenları üzerinden ücretlendirilir. Daha düşük maliyet
  için `deepseek-flash`, daha güçlü işler için `deepseek-v4-pro` seçin.
  Güncel fiyatı ve hesabınızdaki bakiyeyi [DeepSeek fiyatlandırma sayfasından](https://api-docs.deepseek.com/quick_start/pricing)
  kontrol edin. DeepSeek seçildiğinde prompt ve proje kaynakları (tespit edilen
  sırlar maskelendikten sonra) sağlayıcıya gönderilir.
- **Google Gemini API:** `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`) ile çalışır.
  Google AI Studio'da uygun modeller için ücretsiz kota bulunabilir; model,
  bölge ve hesap limitleri değişebilir. Basit işlerde Flash-Lite, orta işlerde
  Flash, karmaşık işlerde Pro'ya yükseltme yapılır. Pro/preview model
  kullanımları ücret doğurabilir; [güncel resmi fiyat ve kotayı](https://ai.google.dev/gemini-api/docs/pricing)
  kontrol edin. Büyük proje kaynakları, gizli değerler maskelendikten sonra
  seçtiğiniz sağlayıcıya gönderilebilir.

Örnek değişkenleri `.env.example` dosyasındadır. Gerçek anahtarları kaynak
koda veya frontend ortam değişkenlerine koymayın; backend sürecine ortam
değişkeni olarak verin.

## API uç noktaları

- `GET /api/v1/health`
- `GET /api/v1/models` — ücretsiz seçenekler ve API anahtarı gereksinimi.
- `POST /api/v1/agents/run` — seçilen Agno modeliyle prompt çalıştırma.
- `GET /api/v1/workspaces/{workspace_id}/project-tasks/config` — izin verilen proje kökü.
- `GET|POST /api/v1/workspaces/{workspace_id}/project-tasks` — prompt görevi oluşturma ve listeleme.
- `GET /api/v1/workspaces/{workspace_id}/project-tasks/{task_id}` — görev planı, ilerleme ve teslim sonucu.
- `GET|POST /api/v1/workspaces/{workspace_id}/workflows`
- `POST /api/v1/workspaces/{workspace_id}/workflows/generate` — prompttan kaydedilmiş çoklu ajan taslak akışı üretir.
- `GET|PUT|DELETE /api/v1/workspaces/{workspace_id}/workflows/{workflow_id}`
- `POST /api/v1/workspaces/{workspace_id}/workflows/{workflow_id}/runs`
- `GET /api/v1/workspaces/{workspace_id}/runs`
- `GET /api/v1/workspaces/{workspace_id}/runs/{run_id}`
- `POST /api/v1/workspaces/{workspace_id}/workflows/{workflow_id}/runs/{run_id}/cancel`

`FLOWMIND_DB_PATH` ile SQLite dosya yolunu değiştirebilirsiniz. Varsayılan
dosya `backend/flowmind.sqlite3` konumundadır. Bağımsız DAG düğümleri aynı
katmanda eşzamanlı çalışır; bağımlı katmanlar sırayla yürütülür. Run adımları,
durumlar ve çıktılar API üzerinden izlenebilir.

`/workflows` ekranındaki prompt oluşturucu 2–3 uzman ajan ve bir koordinatör
içeren kaydedilmiş bir taslak akış üretir; akış doğrudan görsel editörde açılır,
düzenlenebilir ve kullanıcı ayrıca **Test et** ile çalıştırabilir. Bulut
sağlayıcıya prompt gönderimi için açık onay gerekir. `/project-tasks` ise proje
dosyaları üzerinde sınırlı değişiklik akışıdır; iki özellik farklı kullanım
içindir.

Yeni bir iş akışı, çalıştırılabilir çoklu ajan örneğiyle açılır: araştırma,
ürün stratejisi ve risk ajanları aynı girdide paralel çalışır; ardından
koordinatör ajan yanıtları birleştirir. Yerel denemede Ollama'yı başlatıp
`ollama pull llama3.2` çalıştırın. Groq kullanacaksanız `.env` içindeki
`GROQ_API_KEY`, DeepSeek için `DEEPSEEK_API_KEY` veya Gemini için
`GEMINI_API_KEY` değerini doldurup backend'i yeniden başlatın. Önce küçük bir görev ve 4.096 token
bütçesiyle deneyin; uygulamanın token göstergesi yaklaşık tahmindir ve gerçek
API ücretini garanti etmez. Frontend editörü
sağlayıcı yapılandırma durumunu gösterir; test girdisi Girdi düğümünün örnek
değerinden değiştirilebilir.

Gerçek run desteği input, agent, web-search (Tavily), metric, condition ve output
düğümlerini kapsar. Ajan prompt şablonlarında `{{json}}`, `{{input}}`,
`{{input.field}}` ve `{{node:node-id.field}}` kullanılarak gelen veri aktarılır.
Metrikler metin uzunluğu, kelime sayısı, sayısal değer, metin içerme ve JSON
geçerliliğini ölçer. Koşul düğümü güvenli alan karşılaştırmalarını yapar;
`Evet`/`Hayır` çıkışları sırasıyla `true`/`false` source handle'ları üzerinden
dallanır ve seçilmeyen dal atlanır.

Tavily araması için düğüm ayarlarında harici sorgu onayını ayrıca verin.
`TAVILY_API_KEY` backend `.env` içinde yoksa web-search düğümü açık hata ile
durur; arama için sahte sonuç üretilmez. Ollama dışındaki model sağlayıcılarına
görev verisi gönderilmesi de çalıştırma başına ayrı onay gerektirir. Web
scraper ve Computer Use düğümleri editörde düzenlenebilir, ancak yürütücüde
henüz desteklenmez; çalıştırma başlatılmaz ve eksik entegrasyon bildirimi
verilir. Döngü, zamanlayıcı/webhook tetikleyicileri, retry/credential
yönetimi ve görsel akışta kullanıcı müdahalesi henüz n8n kapsamıyla eşdeğer
değildir.

## Prompt ile proje görevi

Frontend'deki `/project-tasks` ekranından proje klasörünü ve kapsamlı hedefi
girin. Sistem isteği yazılım geliştirme, oyun geliştirme, makale yazımı, canlı web
araştırması, görsel üretimi veya ses üretimi olarak sınıflandırır. Makale görevi tek yazım
ajanı ve bağımsız içerik incelemesiyle `generated-content/` altına Markdown
dosyası oluşturur; canlı web araştırması kaynak bağlantıları içeren raporu
`generated-research/` altına kaydeder. Yazılım ve oyun işlerinde hedef uzunluğu, mimari/güvenlik gibi
zorluk sinyalleri ve proje envanter büyüklüğü basit/orta/karmaşık seviyeyi
belirler. Basit işte tek uygulama ajanı; orta işte en fazla iki; karmaşık işte
en fazla üç bağımsız ajan çalışır. Ollama seçildiğinde uygun yüklü modellerden
basit iş için en küçük, karmaşık iş için en büyük model seçilir; Groq seçildiyse
otomatik olarak başka sağlayıcıya geçilmez.

Canlı web araştırması Tavily Search, görsel üretimi OpenAI Images API, ses
üretimi OpenAI TTS API üzerinden
çalışır. `TAVILY_API_KEY` yoksa görev seçilen AI modelinin mevcut bilgisiyle
yedek yanıt üretir; canlı web kullanmadığını ve kaynakların doğrulanmadığını
çıktıda belirtir, uydurma kaynak eklemez. `OPENAI_API_KEY` yoksa görsel ve ses
üretimi çalışmaz; arayüz eksik yapılandırmayı gösterir. API anahtarlarını
`backend/.env` içine koyun; sohbete, frontend koduna veya frontend ortam
değişkenlerine koymayın. Görsel üretimi `OPENAI_IMAGE_MODEL` ile seçilir
(varsayılan `gpt-image-2.5-flare`), tek düşük kaliteli 1024×1024 PNG üretip
projedeki `generated-assets/` klasörüne kaydeder. Bu işlem ücret oluşturabilir.
Seslendirme `OPENAI_TTS_MODEL` (varsayılan `gpt-4o-mini-tts`) ve
`OPENAI_TTS_VOICE` (varsayılan `coral`) ile yapılandırılır; en fazla 4.000
karakterlik istek MP3 olarak `generated-audio/` klasörüne kaydedilir. Bu işlem
ücret oluşturabilir. Video üretimi henüz desteklenmez; video istekleri yazılım
görevine dönüştürülmeden eksik entegrasyon bildirimiyle durdurulur. Uzman API çağrıları formdaki açık onay kutusu işaretlenmeden
yapılmaz; arama sorgusu Tavily'e, görsel prompt'u veya seslendirme metni OpenAI'e
gönderilir. Web sonuçları
güvenilmeyen veri kabul edilir ve özet kaynak URL'lerini içerir.
Tavily API'nin ücretsiz kredileri olsa bile API çağrısı için hesapta
`TAVILY_API_KEY` bulunmalıdır; bu anahtarsız anonim erişim değildir. Kredi ve
kullanım limitlerini Tavily hesabından doğrulayın.
Planlayıcı işi en fazla üç, dosya sahipliği çakışmayan göreve böler;
uygulama ajanları paralel çalışır. Değişiklikler sınırlı metin yamalarıdır,
seçilen projedeki uygun testler çalıştırılır ve ayrı bir inceleme ajanı sonucu
kabul etmezse değişiklikler geri alınır. `FLOWMIND_PROJECT_ROOT`, bu özelliğin
erişebileceği üst klasörü belirler; boş bırakılırsa Flowmind depo kökü kullanılır.
Proje yolu bu kökün dışında olamaz.

Çalışma envanterinden `.env`, anahtar dosyaları ve credential/secret isimli
dosyalar dışlanır; kaynaklardaki yaygın anahtar/parola atamaları modele
iletilmeden maskelenir. Yine de otomatik test çalıştırmak seçilen projenin
kodunu çalıştırır; yalnızca güvendiğiniz projelerde kullanın. Uygulama ajanları
shell komutu çalıştıramaz, dosya silemez veya bağımlılık yükleyemez. Testler ve
son inceleme geçmezse değişiklikler geri alınır. Görev durumu SQLite'ta saklanır,
ancak backend yeniden başlatılırsa devam eden görev otomatik sürdürülmez.

Token bütçesi planlama, uygulama ve inceleme aşamalarına bölünür; her aşamada
bağlam için yaklaşık pay düşüldükten sonra yanıt sınırı uygulanır.
Arayüzdeki tüketim karakter uzunluğundan türetilen yaklaşık bir tahmindir;
sağlayıcı tokenizer'ı ve gerçek faturalandırma ölçümüyle birebir aynı olmayabilir.
Yerel Ollama API anahtarı olmadan kullanılabilir. Groq için `GROQ_API_KEY`
DeepSeek için `DEEPSEEK_API_KEY`, Gemini için `GEMINI_API_KEY` (veya
`GOOGLE_API_KEY`) backend ortamında tanımlanmalıdır.

## Test

```powershell
pytest
```

## Klasör yapısı

```text
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/   # HTTP route tanımları
│   │   └── api.py       # v1 router birleştirme noktası
│   ├── schemas/         # İstek/yanıt veri modelleri
│   ├── services/        # İş kuralları ve veri erişim sınırı
│   └── main.py          # FastAPI uygulaması ve middleware
├── tests/
├── requirements.txt
└── requirements-dev.txt
```
