<p align="center">
  <img src="src-tauri/icons/128x128.png" alt="icon" width="100" />
</p>

# CodeLive

Lightweight live code runner written in **React** and **Tauri**.

---

## Screenshots

| NodeJS | PHP | Python |
|--------|-----|--------|
| [![NodeJS runner](assets/screenshot-nodejs.png)](assets/screenshot-nodejs.png) | [![PHP runner](assets/screenshot-php.png)](assets/screenshot-php.png) | [![Python runner](assets/screenshot-python.png)](assets/screenshot-python.png) |


---

## Download

Get the latest release:  
[https://github.com/mhs003/codelive/releases](https://github.com/mhs003/codelive/releases)

Or build from source:

### Prerequisites

- Node.js 16+ (npm, pnpm, or yarn)  
- Rust toolchain (stable) and cargo
- [See all prerequisites](https://tauri.app/start/prerequisites/) of tauri

### Install & Run (Frontend Dev)

```bash
npm install       # install JS dependencies
````

### Run the App with Tauri (Dev)

```bash
npm run tauri dev
```

### Build Production Bundle

```bash
npm run tauri build   # produce native build and installers
```

## License

CodeLive is released under the [MIT License](https://opensource.org/licenses/MIT).
