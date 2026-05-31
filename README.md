# 🏷️ Nuvio Badges Studio

Welcome to the **Nuvio Badges** repository! This project hosts a fully customized, premium stream badges ruleset (`badges.json`) specifically designed to decorate your scraper streams in **NuvioMobile** with high-fidelity badges.

## 🚀 Live Badges Studio Dashboard

We have built a premium, glassmorphic visual playground where you can customize your match rules, test regular expressions, preview them in real time on a simulated mobile interface, and export your updated lists!

👉 **[Launch Nuvio Badges Studio 🎨](https://dustincos.github.io/nuvio-badges/)**

---

## 🎨 Features & What's Inside

Our unified `badges.json` includes highly optimized matching rules for:
* **🔬 12 Scraper Providers:** Auto-matching custom scrapers (`Vidlink`, `MovieBox`, `NetMirror`, `4KHDHub`, `Movix`, `NoTorrent`, `PlayImdb`, `Videasy`, `VidFastPro`, `Xpass`, `AutoEmbed`, `DahmerMovies`).
* **📐 Stremio Release-Formats:** Matches standard release formats (`Remux`, `BluRay`, `WebDL`, `SeaDex`).
* **📺 Advanced Visual Enhancements:** Glow badges for visual formats (`4K`, `1080p`, `720p`, `Dolby Vision (DV)`, `HDR10+`, `HDR10`, `HDR`, `IMAX Enhanced`, `IMAX`).
* **🔊 Audio Codecs & Channels:** Decorates audio tags (`TrueHD`, `Atmos`, `DTS:X`, `DTS-HD MA`, `DTS`, `DD+`, `DD`, `7.1`, `6.1`, `5.1`).
* **🇬🇧 Country Flags & Languages:** Fully integrates dynamic high-definition language indicators (`ENG`, `ESP`, `FRA`, `DEU`, `ITA`, `POR`, `JPN`, `KOR`, `CHI`, `HIN`, `ARA`, `RUS`, `MULTI`).

---

## 📥 How to Import to NuvioMobile

To use these badges inside your **NuvioMobile** app:

1. Copy the following raw URL:
   ```text
   https://raw.githubusercontent.com/dustincos/nuvio-badges/main/badges.json
   ```
2. Open **NuvioMobile** on your device.
3. Go to **Settings ➡️ Streams ➡️ Stream Badges**.
4. Paste the URL and click **Import / Sync**.

---

## 🛠️ Local Development & Dashboard Running

To run the customizer dashboard locally:
1. Double-click the `index.html` file or run a simple local server:
   ```bash
   npx serve .
   ```
2. Open `http://localhost:3000` in your web browser.
