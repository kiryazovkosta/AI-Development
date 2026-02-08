# a-image-manager

> Minimal Angular 21 + .NET 10 starter for an image manager

## 🤖 AI Generation

This project was generated using: GitHub Copilot

## 📝 Description

This project provides a clean frontend and backend scaffold for an image manager.
It includes an Angular 21 client and a .NET 10 WebAPI server, with CORS and local
proxy support for development.

## ✨ Features

- Angular 21 client scaffold (standalone, routing)
- .NET 10 WebAPI scaffold
- Local dev CORS and proxy wiring

## 🛠️ Technologies Used

- Angular 21
- .NET 10 WebAPI
- C#
- Node.js
- npm

## 📋 Prerequisites

- Node.js 20+
- .NET 10 SDK

## 🚀 Installation

```bash
# Clone the repository (if standalone)
git clone https://github.com/kiryazovkosta/AI-Development.git

# Navigate to project directory
cd learning-projects/a-image-manager

# Backend dependencies
cd backend/AImageManager.Api

dotnet restore

# Frontend dependencies
cd ../../frontend

npm install
```

## 💻 Usage

```bash
# Start backend
cd learning-projects/a-image-manager/backend/AImageManager.Api

dotnet run
```

```bash
# Start frontend
cd learning-projects/a-image-manager/frontend

npm start
```

### Configuration

No configuration is required for the initial scaffold.

## 📸 Screenshots (if applicable)

Not available yet.

## 🧪 Testing

```bash
# Backend tests (none yet)

# Frontend tests
cd learning-projects/a-image-manager/frontend

npm test
```

## 📂 Project Structure

```
a-image-manager/
├── backend/
│   ├── AImageManager.Api/
│   └── AImageManager.slnx
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## 🚧 Known Limitations

- No API endpoints beyond the default template
- No persistence or storage
- No authentication

## 🔮 Future Enhancements

- Image upload and gallery endpoints
- Metadata tagging and search
- Storage integration

## 🤝 Contributing

This is part of the AI-Development repository. See the main [Contributing Guidelines](../../CONTRIBUTING.md).

## 📄 License

MIT

## 👤 Author/Client

- **Purpose**: Learning
- **Client**: N/A
- **Date**: 2026-02-08

## 🙏 Acknowledgments

- GitHub Copilot
- Angular CLI
- .NET templates

---

**Note**: This project was generated with AI assistance. Please review and test thoroughly before using in production.
