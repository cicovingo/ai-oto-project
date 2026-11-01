# AI Ajan Otomasyonu — Ürün ve Teknik Gereksinimler

## 1. Proje Özeti

**Proje adı:** AI Ajan Otomasyonu — Görsel İş Akışı ve Metrik Platformu

**Ürün tanımı:** Kullanıcıların AI ajanlarını ve değerlendirme iş akışlarını kod yazmadan görsel olarak oluşturduğu, yapılandırdığı, çalıştırdığı ve sonuçlarını izlediği web platformu.

**Temel değer:** Ajan, metrik, koşul ve aksiyonları sürükle-bırak yöntemiyle bir araya getirmek; iş akışlarını kontrollü biçimde test edip ölçülebilir sonuçlar elde etmek.

**Hedef kullanıcılar:** AI/ML ekipleri, yazılım geliştiricileri, ürün ekipleri ve tekrarlanabilir AI değerlendirme süreçlerine ihtiyaç duyan işletmeler.

## 2. Vizyon, Hedefler ve Başarı Ölçütleri

### Vizyon

AI süreçlerini teknik olmayan kullanıcıların da anlayıp yönetebileceği, güvenli ve genişletilebilir bir görsel platform sunmak.

### Ürün hedefleri

- Kullanıcıların bir iş akışını görsel olarak oluşturup doğrulayabilmesi.
- Metrik ve düğüm parametrelerinin açıklayıcı ve kontrollü biçimde yapılandırılabilmesi.
- Bir iş akışının örnek veriyle test edilip çalıştırma sonuçlarının incelenebilmesi.
- Çalıştırmaların, metrik sonuçlarının ve hata kayıtlarının izlenebilmesi.
- İş akışlarının kaydedilmesi, sürümlenmesi ve yetkili kullanıcılarla paylaşılması.

### İlk sürüm için ölçülebilir başarı ölçütleri

- Yeni kullanıcı, onboarding adımlarından sonra örnek iş akışını tamamlayabilmeli.
- Kullanıcı, iş akışını geçersiz bağlantılar veya eksik zorunlu parametrelerle çalıştıramamalı; arayüz ilgili hataları göstermeli.
- Tamamlanan çalıştırmalar sonuç, süre ve hata durumu ile geçmişte görüntülenebilmeli.
- Kullanıcı, yetkisi olmayan başka bir çalışma alanının verilerine erişememeli.

## 3. Kullanıcılar ve Ana Senaryolar

### 3.1 Kayıt ve onboarding

Kullanıcı hesap oluşturur, çalışma alanına katılır veya bir çalışma alanı oluşturur ve kısa bir ürün tanıtımını tamamlar.

**Kabul kriterleri**

- Kayıt ve giriş formları alan doğrulaması ve anlaşılır hata mesajları sunar.
- İlk girişte temel adımlar ve örnek bir iş akışı gösterilir.
- Kullanıcı onboarding'i daha sonra tekrar açabilir veya atlayabilir.

### 3.2 İş akışı oluşturma ve düzenleme

Kullanıcı, düğüm kütüphanesinden ajan, metrik, koşul ve aksiyon düğümlerini çalışma alanına ekler; bağlantıları ve parametreleri düzenler.

**Kabul kriterleri**

- Düğüm ekleme, silme, taşıma, bağlama ve bağlantıyı kaldırma desteklenir.
- Geçersiz bağlantı ve eksik parametreler çalışma sırasında değil, mümkün olduğunca düzenleme anında belirtilir.
- Değişiklikler kaydedilebilir ve kaydedilmemiş değişiklik durumu görünür olur.
- İş akışı yeniden açıldığında kaydedilmiş düğüm konumları, bağlantılar ve parametreler korunur.

### 3.3 Metrik seçimi ve yapılandırma

Kullanıcı, metrik kütüphanesinden metrik seçer; gerekli parametreleri düzenleyip önizler.

**Kabul kriterleri**

- Kütüphane kategoriye göre filtrelenebilir ve aranabilir.
- Her metrik; açıklama, zorunlu parametreler, türler ve varsayılan değerlerle sunulur.
- Parametre alanları türüne uygun kontroller kullanır (metin, sayı, seçim, aralık vb.).
- Hatalı veya eksik değerler kullanıcıya gösterilir.

### 3.4 Test ve çalıştırma

Kullanıcı, iş akışını örnek girdiyle doğrular veya çalıştırır; adım durumlarını ve çıktıları inceler.

**Kabul kriterleri**

- Çalıştırmadan önce iş akışı ve girdi doğrulanır.
- Çalıştırma durumu (bekliyor, çalışıyor, tamamlandı, başarısız, iptal edildi) görünür.
- Kullanıcı yetkili olduğu bir çalıştırmayı iptal edebilir.
- Düğüm bazında çıktı, süre ve güvenli hata bilgisi incelenebilir.
- Gizli anahtarlar, erişim belirteçleri ve hassas girdi değerleri loglarda gösterilmez.

### 3.5 Dashboard ve raporlama

Kullanıcı çalıştırma geçmişini ve performans sonuçlarını tablo ve grafiklerle inceler; rapor dışa aktarır.

**Kabul kriterleri**

- Tarih, iş akışı ve durum filtreleri uygulanabilir.
- Grafiklerde kullanılan metrik, zaman aralığı ve veri kaynağı belirtilir.
- Rapor dışa aktarma işleminin durumu kullanıcıya gösterilir.
- Dışa aktarılan dosya yalnızca kullanıcının erişim yetkisi olan verileri içerir.

### 3.6 İş birliği

Çalışma alanı üyeleri rol ve izinlerine göre iş akışlarını görüntüler veya düzenler.

**Kabul kriterleri**

- En az yönetici ve üye rolleri bulunur.
- Aynı iş akışında eş zamanlı değişiklik çakışmaları sessizce birbirinin üzerine yazılmaz.
- Gerçek zamanlı bağlantı kesilirse kullanıcı durumu görür; yeniden bağlanma sonrası güncel veri sunucudan alınır.

## 4. Ürün Kapsamı

### 4.1 İlk sürüm (MVP)

- Kimlik doğrulama ve çalışma alanı üyeliği.
- İş akışı listeleme, oluşturma, düzenleme, kaydetme ve silme.
- Temel düğüm kütüphanesi: başlangıç/girdi, AI ajanı, metrik, koşul ve bitiş/çıktı.
- İşlevine göre ayrı ajan düğümleri: genel AI ajanı, web arama, web scraping ve onaylı alan adlarıyla sınırlı Computer Use.
- Ajan ayarlarında sağlayıcı/model seçimi ile temperature, maksimum çıktı tokenı ve top-p parametreleri; web ajanlarında ilgili yetenek ayarları.
- Computer Use görevlerinde izin verilen alan adı listesi ve işlem öncesi kullanıcı onayı varsayılanı.
- Sürükle-bırak görsel editör ve parametre paneli.
- İş akışı doğrulama ve kontrollü test çalıştırması.
- Çalıştırma geçmişi, adım durumları, sonuç ve hata görünümü.
- Temel dashboard, filtreleme ve CSV dışa aktarma.
- Rol tabanlı çalışma alanı erişimi ve denetim kayıtlarının temel altyapısı.

### 4.2 Sonraki sürümlere bırakılabilecekler

- Aynı anda çok kullanıcılı, imleç seviyesinde ortak düzenleme.
- Özel metrik veya düğüm eklentileri.
- PDF ve Excel raporları, zamanlanmış raporlama.
- Gelişmiş iş akışı sürüm karşılaştırma ve geri alma.
- Harici veri kaynakları ve üçüncü taraf analitik entegrasyonları.
- Gelişmiş planlama, kuyruk ve ölçeklendirme politikaları.

### 4.3 İlk sürüm kapsamı dışında

- Kullanıcının platform sunucusunda serbest kod çalıştırması.
- Yönetici onayı olmadan herkese açık iş akışı paylaşımı.
- Tüm harici AI sağlayıcılarının ilk sürümde desteklenmesi.

## 5. Teknik Gereksinimler

### 5.1 Teknoloji yığını

| Katman | Teknoloji | Kullanım |
|---|---|---|
| Frontend | Next.js, App Router, React, TypeScript | Web uygulaması, sayfa yönlendirme ve sunucu/istemci bileşenleri |
| UI | shadcn/ui, Tailwind CSS | Erişilebilir ve özelleştirilebilir arayüz bileşenleri |
| İstemci durumu | Redux Toolkit | Editörün geçici ve etkileşimli iş akışı durumu |
| API istemcisi | RTK Query (Redux Toolkit) | HTTP istekleri, sunucu verisi önbelleği ve yeniden yükleme |
| Backend | Python, FastAPI | REST API, doğrulama, kimlik/yetki kontrolleri ve çalıştırma koordinasyonu |
| Kalıcı veri | PostgreSQL (öneri) | Kullanıcı, çalışma alanı, iş akışı ve çalıştırma metadata'sı |
| Gerçek zamanlı iletişim | FastAPI WebSocket | Çalıştırma durumu ve iş birliği olayları |
| Şema/migrasyon | SQLAlchemy ve Alembic (öneri) | Veri erişimi ve veritabanı şema değişiklikleri |
| Test | Vitest/React Testing Library, pytest | Frontend birim testleri ve backend birim/API testleri |

> PostgreSQL, SQLAlchemy/Alembic ve RTK Query bu dokümanda başlangıç önerisidir; uygulamaya başlamadan önce ekip kararıyla kesinleştirilmelidir. Editör kütüphanesi (ör. React Flow) ve AI sağlayıcıları da seçim gerektirir.

### 5.2 Mimari ilkeler

- Frontend ve backend ayrı uygulamalar olarak geliştirilir; aralarındaki sözleşme sürümlenmiş API şemasıyla tanımlanır.
- Next.js arayüzü API'ye HTTP üzerinden bağlanır. Tarayıcı AI sağlayıcılarına doğrudan gizli anahtarla bağlanmaz.
- FastAPI, kimlik ve yetki kontrollerini her korumalı istekte sunucu tarafında uygular.
- API katmanı, iş kuralları ve veri erişim katmanı birbirinden ayrılır.
- Uzun süren iş akışı çalıştırmaları HTTP isteğinin ömrüne bağlanmaz; görev modeli ve kuyruk altyapısı yük ve ihtiyaç netleşince seçilir.
- İş akışlarının sürümlenebilir, doğrulanabilir JSON tanımı tutulur; çalıştırma, hangi iş akışı sürümüyle yapıldığını kaydeder.
- Redux, istemci etkileşimi ve editör durumunu yönetir. Backend'den gelen kalıcı verinin tek doğruluk kaynağı backend'dir; RTK Query önbelleği Redux içinde tutulur.
- Sunucu bileşenleri ve istemci bileşenleri gereken yerde kullanılır; tarayıcı etkileşimi olmayan sayfalarda gereksiz istemci JavaScript'i yüklenmez.

### 5.3 Redux durum sınırları

**Redux Toolkit'te tutulacaklar**

- Aktif editörün seçili düğümü, panel durumu ve geçici düzenlemeleri.
- Kaydedilmemiş iş akışı taslağı, undo/redo geçmişi gerekiyorsa editör geçmişi.
- Kullanıcı arayüzü tercihleri ve geçici filtreler.

**RTK Query/API üzerinden yönetilecekler**

- İş akışı listesi ve sunucudaki kayıtlı iş akışları.
- Çalıştırma geçmişi, kullanıcı/çalışma alanı bilgisi ve dashboard verileri.
- API'den gelen verilerin yüklenme, hata ve önbellek durumu.

Parolalar, erişim belirteçleri veya sağlayıcı anahtarları Redux state'inde ya da tarayıcı kalıcı depolamasında saklanmamalıdır.

## 6. İşlevsel Gereksinimler

### 6.1 Görsel editör ve düğüm kütüphanesi

- Düğüm tipleri, girdi/çıktı bağlantı noktaları ve parametre şemaları backend/API tarafından tanımlanabilir olmalıdır.
- Bağlantı kuralları düğüm tipine göre doğrulanmalıdır.
- İş akışı döngüsü, erişilemeyen düğüm ve eksik giriş gibi durumlar belirtilmelidir.
- Klavye ile erişilebilir temel alternatifler sağlanmalı; sürükle-bırak tek etkileşim yöntemi olmamalıdır.

### 6.2 İş akışı yönetimi

- İş akışı adı, açıklaması, sahibi, çalışma alanı, oluşturulma/güncellenme zamanı ve sürümü bulunmalıdır.
- Kaydetme işlemi doğrulama hatalarında başarısız olmalı ve hangi alanın hatalı olduğunu bildirmelidir.
- İş akışı silme ve paylaşma işlemleri yetki kontrolünden geçmelidir.
- Bir çalıştırmanın bağlı olduğu iş akışı tanımı sonradan değiştirilse bile çalıştırma geçmişi tutarlı kalmalıdır.

### 6.3 Metrikler

- İlk metrikler: doğruluk, precision, recall ve F1; kullanılabilirlikleri veri türü ve görev tipine göre açıklanmalıdır.
- Metrik parametreleri tip, zorunluluk, sınır ve varsayılan değer bilgisi taşımalıdır.
- Metrik sonucu; değer, birim/format, durum ve gerekirse açıklama içermelidir.
- Karşılaştırma için aynı metrik tanımı ve girdi kümesi kullanılmalıdır.

### 6.4 Çalıştırma, test ve gözlemlenebilirlik

- Her çalıştırmaya benzersiz kimlik verilir; başlangıç/bitiş zamanı ve tetikleyen kullanıcı kaydedilir.
- Çalıştırma adımları korelasyon kimliğiyle loglanır.
- Hata yanıtları kullanıcıya güvenli ve anlaşılır mesaj, operatöre ise erişim kontrollü tanılama bilgisi sağlar.
- Tekrarlanan isteklerin yanlışlıkla birden fazla çalıştırma başlatmasını önlemek için idempotency yaklaşımı değerlendirilmelidir.
- Çalıştırma zaman aşımı, iptal ve yeniden deneme davranışları tanımlanmalıdır.

### 6.5 Raporlama

- MVP'de CSV dışa aktarma desteklenir.
- PDF/Excel, kullanım ihtiyacı ve kütüphane seçimi netleştiğinde sonraki sürüm kapsamına alınır.
- Dışa aktarma büyük veri kümelerinde arka plan işi olarak yürütülebilecek şekilde tasarlanır.

## 7. API ve İletişim Sözleşmesi

### 7.1 API ilkeleri

- REST API JSON kullanır ve `/api/v1` altında sürümlenir.
- OpenAPI şeması FastAPI tarafından üretilir ve frontend istemcisiyle tutarlı tutulur.
- Hatalar kararlı bir yapı ile döner: hata kodu, kullanıcıya gösterilebilir mesaj, alan hataları ve istek korelasyon kimliği.
- Liste uçları sayfalama, sıralama ve izin verilen filtreleri destekler.
- Tüm uçlar çalışma alanı kapsamını sunucu tarafında doğrular.

### 7.2 Önerilen temel uçlar

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`
- `GET /api/v1/me`, `GET /api/v1/workspaces`
- `GET|POST /api/v1/workspaces/{workspace_id}/workflows`
- `GET|PATCH|DELETE /api/v1/workspaces/{workspace_id}/workflows/{workflow_id}`
- `POST /api/v1/workspaces/{workspace_id}/workflows/{workflow_id}/validate`
- `POST /api/v1/workspaces/{workspace_id}/workflows/{workflow_id}/runs`
- `GET /api/v1/workspaces/{workspace_id}/runs`, `GET /api/v1/runs/{run_id}`
- `GET /api/v1/metrics`, `GET /api/v1/node-types`
- `GET /api/v1/runs/{run_id}/events` (WebSocket veya gerektiğinde SSE; protokol kararı ayrıca verilir)

Bu uçlar başlangıç sözleşmesidir; gerçek kaynak kod ve OpenAPI şemasıyla birlikte kesinleştirilmelidir.

## 8. Veri Modeli Taslağı

- **User:** kimlik sağlayıcıya ait kullanıcı kimliği, e-posta, görünen ad, oluşturulma zamanı.
- **Workspace:** ad, sahibi, ayarlar ve zaman damgaları.
- **WorkspaceMember:** çalışma alanı, kullanıcı ve rol ilişkisi.
- **Workflow:** çalışma alanı, ad, açıklama, geçerli sürüm ve sahiplik bilgisi.
- **WorkflowVersion:** değiştirilemez sürüm numarası, düğüm/bağlantı tanımı ve oluşturulma bilgisi.
- **Run:** iş akışı sürümü, başlatan kullanıcı, durum, girdi referansı, sonuç özeti ve zaman damgaları.
- **RunStep:** çalıştırma, düğüm kimliği, durum, süre, güvenli çıktı özeti ve hata kodu.
- **AuditEvent:** aktör, çalışma alanı, eylem, hedef ve zaman damgası.

Girdi/çıktı ve log saklama süresi; kişisel veri, hassas veri ve maliyet gereksinimleri belirlendikten sonra ayrıca tanımlanmalıdır. Hassas içerikler gereksiz yere kalıcılaştırılmamalıdır.

## 9. Güvenlik ve Gizlilik Gereksinimleri

- Parolalar özel olarak tasarlanmış güvenli bir parola hash algoritmasıyla saklanmalı; düz metin olarak tutulmamalıdır.
- Oturum/kimlik doğrulama yöntemi seçilmeli; tarayıcı tabanlı kullanımda belirteçler mümkünse `HttpOnly`, `Secure`, uygun `SameSite` ayarlı çerezlerle korunmalıdır.
- Çalışma alanı ve kaynak bazlı yetkilendirme her API isteğinde sunucu tarafında uygulanmalıdır.
- AI sağlayıcı anahtarları frontend'e, Redux'a, istemci loglarına veya açık metin veritabanı alanlarına konulmamalıdır; şifreli saklama ve anahtar yönetimi çözümü belirlenmelidir.
- Rate limit, güvenli CORS, CSRF koruması (çerez tabanlı kimlik doğrulamada), girdi doğrulama ve güvenli hata mesajları uygulanmalıdır.
- Harici URL veya araç çağrıları eklendiğinde SSRF, izin listesi, ağ erişimi ve zaman aşımı kontrolleri tasarlanmalıdır.
- Kullanıcı tarafından sağlanan içerik AI ajanına aktarılırken prompt injection ve yetkisiz araç kullanımı riskleri göz önünde bulundurulmalıdır. Model çıktısı güvenilir talimat gibi kabul edilmemelidir.
- İş akışı düğümleri yalnızca izin verilen işlemleri gerçekleştirmeli; MVP'de serbest sunucu kodu çalıştırılmamalıdır.
- Denetim kayıtlarında sırlar ve gereksiz kişisel veriler bulunmamalıdır.
- Bağımlılıklar ve container imajları düzenli güvenlik taramasından geçirilmelidir.

## 10. Fonksiyonel Olmayan Gereksinimler

- **Kullanılabilirlik:** yükleniyor, boş, başarılı, bağlantı kesildi ve hata durumları tanımlı olmalıdır.
- **Erişilebilirlik:** temel akışlar klavye ile kullanılabilmeli; form etiketleri, odak görünümü ve renk kontrastı sağlanmalıdır.
- **Responsive tasarım:** dashboard ve temel iş akışı işlemleri masaüstü ve tablet ekranlarında kullanılabilir olmalıdır; karmaşık editör için mobil davranış ayrıca tasarlanmalıdır.
- **Performans:** liste uçları sayfalanmalı; grafik ve büyük loglar gereksiz yere topluca yüklenmemelidir.
- **Güvenilirlik:** çalıştırma durumu hata halinde kaybolmamalı; istemci bağlantısı kesilince durum API'den tekrar alınabilmelidir.
- **Ölçeklenebilirlik:** API sunucusu yatay ölçeklemeye uygun ve mümkün olduğunca durumsuz tasarlanmalıdır; paylaşılan gerçek zamanlı durum gerekiyorsa merkezi altyapı seçilmelidir.
- **Bakım yapılabilirlik:** TypeScript türleri ve OpenAPI sözleşmesi tutarlı olmalı; Python bağımlılıkları kilitlenmeli ve veritabanı değişiklikleri migration ile yapılmalıdır.
- **Gözlemlenebilirlik:** yapılandırılmış log, hata izleme, sağlık kontrolü ve temel çalışma metrikleri bulunmalıdır.

## 11. Test ve Kalite Planı

### Frontend

- Bileşen ve reducer testleri: düğüm düzenleme, parametre doğrulama, kaydetme ve hata durumları.
- API entegrasyon testleri: başarılı yanıt, yetkisiz erişim, sunucu hatası ve yeniden yükleme.
- E2E senaryoları: giriş, iş akışı oluşturma, kaydetme, çalıştırma ve sonucu görüntüleme.
- Erişilebilirlik ve responsive davranış için temel kontroller.

### Backend

- Birim testleri: iş akışı şeması, bağlantı kuralları, metrik parametreleri ve yetkilendirme.
- API testleri: pozitif/negatif istekler, çalışma alanı izolasyonu ve hata yanıtları.
- Veritabanı migration testleri ve gerekirse gerçek PostgreSQL ile entegrasyon testleri.
- Çalıştırma durumu, iptal, zaman aşımı ve tekrar deneme senaryoları.

### Kalite kapıları

- Pull request öncesi lint, tür kontrolü ve ilgili testler geçmelidir.
- Kritik iş kuralları ve erişim kontrolü testlerle korunmalıdır.
- Üretim yayını öncesinde migration, yedekleme ve geri dönüş yaklaşımı gözden geçirilmelidir.

## 12. Önerilen Proje Yapısı

```text
frontend/
  src/
    app/                 # Next.js App Router sayfaları ve layout'ları
    components/          # Ortak UI ve shadcn/ui bileşenleri
    features/            # İş akışı, metrik, dashboard gibi özellik alanları
    lib/                 # API istemcisi ve yardımcılar
    store/               # Redux Toolkit store ve typed hooks
backend/
  app/
    api/v1/              # FastAPI route'ları
    core/                # Ayarlar, güvenlik ve ortak altyapı
    models/              # Veritabanı modelleri
    schemas/             # İstek/yanıt şemaları
    services/            # İş kuralları
    repositories/        # Veri erişimi
  alembic/               # Veritabanı migration'ları
  tests/
```

Bu yapı başlangıç önerisidir; mevcut repository düzeniyle çakışıyorsa mevcut yapıya göre uyarlanmalıdır.

## 13. Açık Kararlar

Uygulamaya geçmeden önce aşağıdakiler ürün/ekip kararıyla netleştirilmelidir:

1. İlk sürümde desteklenecek AI sağlayıcıları ve model listesi.
2. İş akışı editöründe kullanılacak sürükle-bırak/graph kütüphanesi.
3. Kimlik doğrulama yöntemi ve varsa harici kimlik sağlayıcısı.
4. PostgreSQL, ORM ve migration aracı önerilerinin onayı.
5. Uzun süren görevler için kuyruk/worker gerekip gerekmediği ve seçilecek altyapı.
6. Dosya, girdi, çıktı ve loglar için saklama süresi ve hassas veri politikası.
7. Eş zamanlı düzenlemenin MVP'ye dahil olup olmayacağı.
8. PDF/Excel dışa aktarmanın ilk sürümde gerekli olup olmadığı.
9. Hedef dağıtım ortamı, izleme servisi ve yedekleme gereksinimleri.

## 14. Önerilen Uygulama Sırası

1. Ürün kapsamı ve açık kararları kesinleştirme.
2. Frontend/backend iskeleti, yapılandırma, lint ve test altyapısı.
3. Kimlik doğrulama, çalışma alanı ve rol tabanlı yetkilendirme.
4. İş akışı veri modeli, API sözleşmesi ve sürümleme.
5. Editör, düğüm kütüphanesi ve Redux durum yönetimi.
6. İş akışı doğrulama ve test çalıştırma altyapısı.
7. Çalıştırma geçmişi, dashboard ve CSV dışa aktarma.
8. Entegrasyon/E2E testleri, güvenlik kontrolleri ve dağıtım hazırlığı.
