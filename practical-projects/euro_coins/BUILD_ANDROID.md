# Euro Coins за Android: билд и инсталиране

Приложението е обвито с [Capacitor 8](https://capacitorjs.com/). Angular кодът е същият като в уеб версията, а Capacitor го пакетира като истинско Android приложение (APK), което се инсталира от файл, без Google Play.

- Име на приложението: **Euro Coins**
- Android package (appId): `com.kiryazovkosta.eurocoins`
- Минимална версия: Android 7.0 (API 24), target API 36
- Нативният проект е в папка `android/` и се отваря с Android Studio.

## 1. Какво трябва да имаш (еднократно)

| Инструмент | Версия | Бележка |
|---|---|---|
| Node.js | **22 или по-нова** | Capacitor 8 не тръгва на Node 20. Провери с `node -v`. |
| Android Studio | последната стабилна (Otter или по-нова) | Изтегли от https://developer.android.com/studio. Включва JDK 21, не е нужна отделна Java. |
| Android SDK | Platform 36 + Build-Tools | Android Studio ги предлага при първото пускане (Setup Wizard → Standard). |
| Телефон | Android 7+ | За инсталиране през USB: включен „USB debugging“ (виж т. 5). |

След инсталирането на Android Studio отвори **Settings → Languages & Frameworks → Android SDK** (на macOS: **Android Studio → Settings… → Languages & Frameworks → Android SDK**) и провери, че е отметнат **Android 16 (API 36)** в таб *SDK Platforms*.

## 2. Подготовка на кода

```bash
cd practical-projects/euro_coins
git checkout feature/capacitor-mobile-app   # или main, след като е слят
git pull
npm install
```

**Важно: Supabase настройките.** Файловете `src/environments/environment.ts` и `src/environments/environment.prod.ts` не са в git. Трябва да ги имаш локално (същите, с които деплойваш във Vercel). Мобилният билд ползва `environment.prod.ts`. Ако липсват, билдът ще гръмне, а ако са с грешни ключове, приложението ще се отвори, но вписването няма да работи.

Не е нужна никаква промяна в Supabase: вписването е с имейл и парола, без redirect линкове, а Edge Function `create-user` позволява заявки от всеки origin.

## 3. Билд и отваряне в Android Studio

Една команда прави всичко (Angular production билд → копиране в `android/` → отваряне на Android Studio):

```bash
npm run android
```

Същото на стъпки:

```bash
npm run build            # ng build (production)
npx cap sync android     # копира dist/euro_coins/browser в android/ и обновява плъгините
npx cap open android     # отваря android/ в Android Studio
```

При първото отваряне Android Studio сваля Gradle и зависимостите. Това отнема няколко минути. Изчакай лентата долу да спре („Gradle sync finished“).

> Ако `npx cap open android` не намери Android Studio:
> - **Windows:** `setx CAPACITOR_ANDROID_STUDIO_PATH "C:\Program Files\Android\Android Studio\bin\studio64.exe"` и отвори нов терминал.
> - **macOS:** Capacitor го търси в `/Applications/Android Studio.app`. Ако е на друго място, добави в `~/.zshrc` ред `export CAPACITOR_ANDROID_STUDIO_PATH="/път/до/Android Studio.app"` и отвори нов терминал.
>
> Или просто отвори папката `android/` ръчно от Android Studio (File → Open).

## 4. Направи APK файл

### Вариант А: debug APK (най-бързо, за себе си)

В Android Studio: **Build → Generate App Bundles or APKs → Generate APKs**.

Или от терминала:

```bash
cd android
gradlew.bat assembleDebug        # Windows
./gradlew assembleDebug          # macOS / Linux
```

Файлът се появява в:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Debug APK-то е подписано с автоматичен тестов ключ. Работи нормално, просто не е за Google Play.

### Вариант Б: подписан release APK (за дълготрайно ползване)

1. **Build → Generate Signed App Bundle or APK → APK → Next**.
2. *Key store path → Create new…* Избери място **извън репото** (напр. `C:\Users\kosta\keys\eurocoins.jks` на Windows или `~/keys/eurocoins.jks` на macOS), сложи пароли и попълни името си.
3. Избери **release** → *Create*.
4. Файлът е в `android/app/release/app-release.apk`. Цялата папка `android/app/release/` е в `.gitignore`, така че нищо от нея не отива в git.

Пази `.jks` файла и паролите. Всяка следваща версия трябва да е подписана със **същия** ключ, иначе Android няма да я приеме като ъпдейт и ще трябва да деинсталираш старата (с което се губят локалните данни; колекцията ти е в Supabase, така че тя остава). В `.gitignore` вече има правило `*.jks` / `*.keystore`, за да не се качи ключ в GitHub по погрешка.

## 5. Инсталирай на телефона

### Начин 1: директно от Android Studio през USB (препоръчвам при разработка)

1. На телефона: **Settings → About phone → Software information** и натисни 7 пъти **Build number**. Появява се „Developer options“.
2. **Settings → Developer options → USB debugging** → включи.
3. Свържи телефона с USB кабел и потвърди „Allow USB debugging“ на екрана.
4. В Android Studio избери телефона в падащото меню горе и натисни зеления бутон **Run ▶**.

Приложението се инсталира и стартира. Всеки следващ Run го обновява.

### Начин 2: копирай APK файла

1. Прехвърли `app-debug.apk` (или `app-release.apk`) на телефона: USB кабел, Google Drive, имейл до себе си и т.н.
2. Отвори файла от **My Files** (Samsung) → **Downloads**.
3. Android ще поиска разрешение „Install unknown apps“ за приложението, от което го отваряш (My Files, Chrome, Drive). Разреши го.
4. Ако се появи Google Play Protect с предупреждение „Unsafe app blocked“, натисни **More details → Install anyway**. Това е нормално за приложения извън Play Store.

Иконата **Euro Coins** (златната монета) се появява в менюто с приложения като истинско приложение, не като пряк път на Chrome.

## 6. След промяна в кода

```bash
npm run android      # пак билд + sync + отваряне
```

След това **Run ▶** в Android Studio или нов APK по т. 4. Ако правиш нова версия за инсталиране от файл, вдигни версията в `android/app/build.gradle`:

```gradle
versionCode 2          // цяло число, винаги +1
versionName "1.1"      // това вижда потребителят
```

## 7. Иконa и splash екран

Изходните картинки са в `assets/` (монетата от PWA иконата върху синия фон `#1a5f7a`):

- `icon-only.png`, `icon-foreground.png`, `icon-background.png` за иконата
- `splash.png`, `splash-dark.png` за началния екран

Ако ги смениш, генерирай наново всички размери за Android и iOS:

```bash
npm run cap:assets
```

## 8. Какво е различно спрямо уеб версията

- **Service worker (PWA) е изключен** в мобилното приложение. Всички файлове са вътре в APK-то, а service worker само би показвал стара версия след ъпдейт. Във Vercel PWA-то работи както досега.
- **Бутонът „Install App“ е скрит** в мобилното приложение, защото то вече е инсталирано.
- Бутонът „Назад“ на Android първо затваря отворения прозорец с монета. Иначе връща към предишния екран, а на началните екрани (колекцията и вписването) излиза от приложението (`src/app/services/native-back-button.service.ts`).
- Приложението има нужда от интернет, за да чете и записва колекцията в Supabase (както уеб версията).

## 9. Чести проблеми

| Симптом | Решение |
|---|---|
| `npx cap ...` пише, че Node е стар | Инсталирай Node 22 LTS или по-нов. |
| `SDK location not found` | Отвори проекта веднъж в Android Studio, той създава `android/local.properties`. Или създай файла ръчно: на Windows `sdk.dir=C\:\\Users\\kosta\\AppData\\Local\\Android\\Sdk`, на macOS `sdk.dir=/Users/<потребител>/Library/Android/sdk`. |
| Бял екран след стартиране | Не си пуснал `npm run build` преди `npx cap sync`, или липсва `environment.prod.ts`. Пусни `npm run android` отново. |
| Вписването не работи | Провери Supabase URL и anon key в `src/environments/environment.prod.ts`. |
| „App not installed“ при инсталиране на нов APK | Новият APK е подписан с друг ключ от стария. Деинсталирай старото приложение и инсталирай отново. |
| Промените не се виждат | Забравен `npx cap sync android` след `npm run build`. |
