# Euro Coins за iPhone / iPad: билд и инсталиране

Нативният iOS проект е в папка `ios/` и се отваря с Xcode. Използва Swift Package Manager, така че **не е нужен CocoaPods**.

- Bundle ID: `com.kiryazovkosta.eurocoins`
- Минимална версия: iOS 15

## Важно преди да започнеш

1. **Нужен е Mac.** Apple позволява билд на iOS приложения само с Xcode, а Xcode работи само на macOS. От Windows това не може да стане локално.
2. **Безплатен Apple ID е достатъчен** за инсталиране на твоя собствен iPhone, но с ограничения:
   - приложението **спира да се отваря след 7 дни**. Тогава свързваш iPhone-а към Mac-а и натискаш Run в Xcode отново (данните ти са в Supabase, нищо не се губи);
   - най-много 3 такива приложения на едно устройство;
   - не можеш да го дадеш на други хора (TestFlight и App Store искат платения Apple Developer Program, $99/год).
3. С платен акаунт приложението важи 1 година и може да се разпространява през TestFlight.

## 1. Какво трябва да имаш (еднократно)

| Инструмент | Версия | Бележка |
|---|---|---|
| macOS | актуална версия, която поддържа Xcode 26 | |
| Xcode | **26 или по-нов** | От App Store. След инсталиране го отвори веднъж, за да довърши компонентите. |
| Xcode Command Line Tools | | `xcode-select --install` в Terminal |
| Node.js | **22 или по-нова** | `node -v`; препоръчвам `brew install node` или nvm |
| iPhone | iOS 15+ | и USB кабел |

Ако преди Xcode на Mac-а са били инсталирани само Command Line Tools, насочи командните инструменти към Xcode, иначе `xcodebuild` няма да работи:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcode-select -p   # трябва да покаже /Applications/Xcode.app/Contents/Developer
```

## 2. Подготовка на кода

```bash
git clone https://github.com/kiryazovkosta/AI-Development.git
cd AI-Development/practical-projects/euro_coins
git checkout feature/capacitor-mobile-app   # или main, след като е слят
npm install
```

Копирай на Mac-а и двата файла `src/environments/environment.ts` и `src/environments/environment.prod.ts` (с Supabase URL и anon key). Те не са в git. Без тях билдът няма да мине.

Ако репото и двата environment файла вече са на Mac-а, стига `git pull` и `npm install` в папката `euro_coins`.

## 3. Билд и отваряне в Xcode

```bash
npm run ios
```

Това прави production билд на Angular, `npx cap sync ios` и отваря `ios/App/App.xcodeproj` в Xcode. При първото отваряне Xcode сваля Swift пакетите на Capacitor (вижда се горе в лентата). Изчакай да приключи.

## 4. Подписване с твоя Apple ID (еднократно)

1. **Xcode → Settings → Accounts → +** → Apple ID → впиши се.
2. В лявата колона избери проекта **App** → target **App** → таб **Signing & Capabilities**.
3. Отметни **Automatically manage signing**.
4. **Team:** избери „*Твоето име* (Personal Team)“.
5. Ако Xcode се оплаче, че Bundle Identifier е зает, смени го на нещо уникално, напр. `com.kiryazovkosta.eurocoins.dev`. (Промяната е само за iOS и не засяга Android.)

> Изборът на Team и смяната на Bundle Identifier се записват в `ios/App/App.xcodeproj/project.pbxproj`, който е в git. Team ID не е тайна, но е личен: преди commit виж `git diff ios/` и реши съзнателно дали да го включиш. Ако не искаш, просто не добавяй този файл в commit-а.

## 5. Инсталирай на iPhone

1. Свържи iPhone-а с кабел и отключи го. Натисни **Trust This Computer**.
2. Включи **Developer Mode** на iPhone-а: **Settings → Privacy & Security → Developer Mode → On**. Телефонът ще се рестартира. (Опцията се появява чак след като Xcode е видял телефона веднъж. Developer Mode има само в iOS 16 и по-нови; на iOS 15 тази стъпка се пропуска.)
3. В Xcode горе избери iPhone-а като устройство и натисни **Run ▶** (⌘R).
4. Първия път iPhone-ът ще откаже да стартира приложението („Untrusted Developer“). Отиди на **Settings → General → VPN & Device Management**, избери своя Apple ID → **Trust**.
5. Натисни Run ▶ отново. Приложението **Euro Coins** е на началния екран.

## 6. След промяна в кода или след 7 дни

```bash
npm run ios
```

и **Run ▶** в Xcode с включен iPhone. Ако само са минали 7-те дни, без промени в кода, достатъчно е да отвориш Xcode и да натиснеш Run ▶.

За нова версия смени **Version** (напр. 1.1) и **Build** (напр. 2) в таб *General* на target App.

## 7. Иконa и splash екран

Генерират се от същите картинки в `assets/` като за Android:

```bash
npm run cap:assets
```

## 8. Без Mac

Локално не става. Възможни варианти, ако някой ден потрябва:

- облачен Mac (MacinCloud, AWS EC2 Mac) с горните стъпки;
- облачен билд (Codemagic, GitHub Actions с macOS runner), но за подписан `.ipa` и инсталиране на устройство там на практика трябва платеният Apple Developer акаунт.

Дотогава на iPhone може да ползваш уеб версията във Vercel чрез Safari → Share → **Add to Home Screen** (бутонът „Install App“ в приложението показва точно тези стъпки).

## 9. Чести проблеми

| Симптом | Решение |
|---|---|
| `No profiles for 'com.kiryazovkosta.eurocoins' were found` | Не е избран Team в Signing & Capabilities (т. 4). |
| „Untrusted Developer“ на iPhone | Settings → General → VPN & Device Management → Trust (т. 5). |
| Приложението не се отваря след седмица | Изтекъл е 7-дневният профил на безплатния акаунт. Run ▶ отново от Xcode. |
| Бял екран | Пусни `npm run ios` (билд + sync), не само отваряне на Xcode. Провери `environment.prod.ts`. |
| Xcode не намира Capacitor пакетите | File → Packages → Reset Package Caches, после Product → Clean Build Folder. |
| `xcodebuild` пише „requires Xcode, but active developer directory … is a command line tools instance“ | `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` (т. 1). |
