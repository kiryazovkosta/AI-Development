# Euro Coins на iPhone от терминала: билд, подписване и инсталиране

Това са стъпките, с които приложението беше реално инсталирано на iPhone: **без App Store, без TestFlight, с безплатен Apple ID**, изцяло от терминала (напр. във VS Code). Прозорецът на Xcode е нужен само веднъж, за добавяне на Apple ID.

Работи и на **служебен Mac без admin права** (без `sudo`) и когато паролата на `login` keychain-а е непозната.

| | |
|---|---|
| Команда | `npm run ios:device` (скрипт: `scripts/ios-device.sh`) |
| Bundle ID | `com.kiryazovkosta.eurocoins` |
| Валидност | **7 дни** (безплатен Apple ID), после командата се пуска отново |
| Ограничения | до 3 такива приложения на устройство; не може да се дава на други хора |

Обозначения: **[Mac]** е стъпка в терминала, **[Xcode]** е стъпка в прозореца на Xcode, **[iPhone]** е стъпка на телефона.

---

## Част 1. Еднократна подготовка на Mac-а

### 1.1 [Mac] Xcode

Xcode трябва да е инсталиран (на този Mac е в `/Applications/Development/Xcode.app`). `sudo xcode-select` **не е нужен**: скриптът сам намира Xcode и задава `DEVELOPER_DIR`. За ръчни команди в терминала:

```bash
export DEVELOPER_DIR=/Applications/Development/Xcode.app/Contents/Developer
xcodebuild -version                                  # Xcode 27.x
xcodebuild -checkFirstLaunchStatus && echo "OK"      # първоначалната настройка е направена
xcodebuild -showsdks | grep iphoneos                 # има iOS SDK
```

Ако `-checkFirstLaunchStatus` не върне OK или Xcode иска да приемеш лиценз, това се прави **веднъж с admin парола** (от администратор): отваряне на Xcode или `sudo xcodebuild -license accept && sudo xcodebuild -runFirstLaunch`.

### 1.2 [Mac] Кодът

```bash
cd ~/Projects/AI-Development/practical-projects/euro_coins
git pull
npm install
```

Нужни са Node 22+ и двата файла `src/environments/environment.ts` и `environment.prod.ts` (Supabase URL и anon key; не са в git).

### 1.3 [Xcode] Apple ID (единствената стъпка в прозореца на Xcode)

**Xcode → Settings (⌘,) → Accounts → + → Apple Account** и вписване. Трябва да се появи „*Твоето име* (Personal Team)“.

### 1.4 [Mac] Team ID

```bash
defaults read com.apple.dt.Xcode IDEProvisioningTeamByIdentifier | grep -E "teamID|teamName"
```

Запиши `teamID` в `~/.zshrc`, за да не го пишеш всеки път:

```bash
echo 'export IOS_TEAM_ID=XXXXXXXXXX' >> ~/.zshrc && source ~/.zshrc
```

### 1.5 [Mac] Отделен keychain за подписване

Нужен е, когато macOS иска паролата на **„login“ keychain** при подписване и нито текущата, нито старата парола на Mac-а не я приема (често на служебен Mac след смяна на паролата от IT). Симптоми: `errSecInternalComponent` при `CodeSign` или прозорец за парола, който само „подскача“.

Решението е нов keychain с парола, която ти избираш, и нов сертификат, чийто ключ е в него.

**a) Създай keychain-а** (паролата се въвежда два пъти; при писане нищо не се вижда, това е нормално). Избери **нова** парола и я запиши:

```bash
security create-keychain ~/Library/Keychains/ios-signing.keychain-db
security set-keychain-settings ~/Library/Keychains/ios-signing.keychain-db      # без автоматично заключване
security list-keychains -d user -s ~/Library/Keychains/ios-signing.keychain-db ~/Library/Keychains/login.keychain-db
```

**b) Махни от `login` keychain-а сертификата, чийто ключ е заключен** (ако има такъв). Безплатният акаунт може да има само **един** Apple Development сертификат, а Xcode не дава бутон *Revoke* за него, затова заменяме сертификата при билда (стъпка c). Изтрива се само сертификатът, не и ключът, и не се иска парола:

```bash
security find-identity -v -p codesigning                       # SHA-1 на текущия сертификат
security delete-certificate -Z <SHA-1> ~/Library/Keychains/login.keychain-db
```

**c) Направи новия keychain временно основен, пусни билда и го върни обратно.** Част 3 обяснява какво прави `npm run ios:device`. Тук важното е, че Xcode сам заменя стария сертификат с нов, а ключът на новия влиза в основния keychain, т.е. в `ios-signing`:

```bash
security default-keychain -d user -s ~/Library/Keychains/ios-signing.keychain-db
npm run ios:device
security default-keychain -d user -s ~/Library/Keychains/login.keychain-db        # задължително обратно
```

**d) Провери:** новият сертификат трябва да е в `ios-signing`:

```bash
security find-identity -v -p codesigning ~/Library/Keychains/ios-signing.keychain-db   # 1 valid identities found
```

> Ако `codesign` все пак поиска парола за `ios-signing`, въведи новата парола и натисни **Always Allow**, или пусни веднъж:
> `security set-key-partition-list -S apple-tool:,apple: -s ~/Library/Keychains/ios-signing.keychain-db`

---

## Част 2. Еднократна подготовка на iPhone-а

### 2.1 [iPhone] Свързване с кабел

1. Използвай кабел, който **пренася данни** (оригиналния на Apple). Много кабели само зареждат: телефонът се зарежда, но Mac-ът не го вижда.
2. Свържи директно към Mac-а (без хъб/док) и **отключи** телефона.
3. На Mac-а: „Allow accessory to connect?“ → **Allow**.
4. На iPhone-а: „Trust This Computer?“ → **Trust** и код за отключване.

**[Mac] Проверка:**

```bash
xcrun devicectl list devices | grep -v simulated      # трябва да има ред за iPhone-а
```

Или: iPhone-ът се вижда във Finder, в страничната лента под **Locations**. Ако не се вижда никъде, проблемът е в кабела или в разрешението от т. 3 (**System Settings → Privacy & Security → Allow accessories to connect**).

### 2.2 [Mac] Сдвояване (ако prompt-ът „Trust“ не се появи)

```bash
xcrun devicectl list devices                          # вземи UDID на iPhone-а
xcrun devicectl manage pair --device <UDID>           # на iPhone-а: Trust + код
```

Успех: състоянието става `available (paired)`.

### 2.3 [iPhone] Developer Mode

Опцията се появява чак след като Xcode се е свързал с телефона веднъж (напр. след първия `npm run ios:device`, който спира с `Developer Mode disabled`).

1. **Settings → Privacy & Security → Developer Mode → On**
2. **Restart**
3. След рестарта: **Turn On** и код за отключване.

---

## Част 3. Билд, подписване и инсталиране

**[Mac]** С включен и отключен iPhone:

```bash
npm run ios:device
```

Какво прави командата:

1. `ng build`: production билд на Angular (`environment.prod.ts`)
2. `cap sync ios`: копира билда в `ios/App/App/public`
3. `scripts/ios-device.sh`:
   - намира Xcode (без `xcode-select`) и свързания iPhone;
   - `xcodebuild -allowProvisioningUpdates`: подписва с Personal Team (`IOS_TEAM_ID`), регистрира iPhone-а и създава provisioning profile. Team ID се подава от командния ред, така че `project.pbxproj` не се променя;
   - `devicectl device install app`: инсталира на iPhone-а;
   - `devicectl device process launch`: стартира приложението.

Успешният край изглежда така: `✔ Euro Coins is running on the iPhone.`

Билдът е в `ios/App/build/` (в `.gitignore`).

### 3.1 [iPhone] Доверяване на разработчика (само първия път)

При първата инсталация стартирането спира с „invalid code signature … not explicitly trusted by the user“. Това е нормално.

1. **Settings → General → VPN & Device Management**
2. Под **Developer App**: **Apple Development: *твоят Apple ID***
3. **Trust** → **Trust**
4. Натисни иконата **Euro Coins** или пусни отново `npm run ios:device`.

---

## Част 4. Всеки 7 дни / след промяна в кода

```bash
npm run ios:device
```

Данните са в Supabase, така че при изтичане нищо не се губи.

Кога изтича текущата инсталация:

```bash
security cms -D -i ios/App/build/Build/Products/Debug-iphoneos/App.app/embedded.mobileprovision \
  | plutil -extract ExpirationDate raw -
```

Същото се вижда на iPhone-а в **Settings → General → VPN & Device Management**.

**След рестарт на Mac-а** keychain-ът `ios-signing` е заключен. Отключи го (с новата парола) преди билда или въведи паролата, когато macOS я поиска:

```bash
security unlock-keychain ~/Library/Keychains/ios-signing.keychain-db
```

**След година** (когато изтече сертификатът) повтори стъпка 1.5 c.

---

## Настройки на скрипта

| Променлива | Нужна | Какво е |
|---|---|---|
| `IOS_TEAM_ID` | да | Personal Team ID (т. 1.4) |
| `IOS_DEVICE_UDID` | ако има повече от един iPhone | UDID от `xcrun devicectl list devices` |
| `IOS_BUNDLE_ID` | ако bundle ID-то е заето за твоя акаунт | напр. `com.kiryazovkosta.eurocoins.dev` |

---

## Проблеми, които срещнахме

| Съобщение / симптом | Причина | Решение |
|---|---|---|
| `kosta is not in the sudoers file` | Акаунтът не е admin | Не е нужен `sudo`; скриптът ползва `DEVELOPER_DIR` (т. 1.1) |
| `xcodebuild requires Xcode, but active developer directory … is a command line tools instance` | `xcode-select` сочи към Command Line Tools | `export DEVELOPER_DIR=…/Xcode.app/Contents/Developer` (т. 1.1) |
| `No iPhone found` / `devicectl` показва само симулатори | Кабелът само зарежда, не е разрешен аксесоарът или телефонът е заключен | Т. 2.1 |
| `pairingState: unpaired` | Телефонът не е потвърдил „Trust“ | `xcrun devicectl manage pair --device <UDID>` (т. 2.2) |
| `Developer Mode disabled` | Developer Mode е изключен | Т. 2.3 |
| Прозорец за паролата на „login“ keychain, който не приема паролата; `errSecInternalComponent` при `CodeSign` | Паролата на keychain-а не е текущата парола на Mac-а | Отделен keychain (т. 1.5) |
| `You already have a current Development certificate or a pending certificate request`, без *Revoke* в Xcode | Безплатният акаунт има само един сертификат, а ключът му е заключен | Т. 1.5 b и c: Xcode го заменя при билда |
| `invalid code signature … not explicitly trusted by the user` при стартиране | Разработчикът не е одобрен на iPhone-а | Т. 3.1 |
| `The image set "Splash" has 3 unassigned children` | Предупреждение за splash картинките | Може да се игнорира |
