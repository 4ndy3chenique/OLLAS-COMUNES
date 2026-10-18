# 🍲 Ollas Comunes - Web Application

Plataforma web para la gestión, trazabilidad y optimización operativa de iniciativas de apoyo alimentario comunitario.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Azure](https://img.shields.io/badge/Azure_Static_Web_Apps-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)

---

## 📌 Descripción

Solución orientada al registro eficiente, inventario de insumos y consolidación de datos para la administración de ollas comunes, garantizando accesibilidad y alto rendimiento en dispositivos móviles y de escritorio.

## 🚀 Tecnologías

* **Frontend:** React + Vite
* **Routing:** SPA Routing con fallback HTTP
* **Hosting:** Azure Static Web Apps
* **Pipeline:** GitHub Actions CI/CD

---

## 🛠️ Instalación y Uso Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/4ndy3chenique/OLLAS-COMUNES.git
   cd OLLAS-COMUNES
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear el archivo de entorno a partir del ejemplo y ajustar la URL de la API:
   ```bash
   cp .env.example .env
   ```

4. Iniciar el servidor local de desarrollo:
   ```bash
   npm run dev
   ```

---

## 📦 Scripts del Proyecto

* `npm run dev`: Inicia el servidor de desarrollo local.
* `npm run build`: Genera los artefactos de producción en `/dist`.
* `npm run preview`: Previsualiza localmente el build de producción.

---

## ☁️ Despliegue Continuo (CI/CD)

Cada commit incorporado a la rama `main` ejecuta un flujo de trabajo automatizado en GitHub Actions que compila la aplicación y la publica en Azure Static Web Apps.

Configuración requerida en GitHub (Settings → Secrets and variables → Actions):

* **Secret** `AZURE_STATIC_WEB_APPS_API_TOKEN`: token de despliegue del recurso `stapp-ollas-web-prod`.
* **Variable** `VITE_API_BASE_URL`: URL pública de la API terminada en `/api`. El workflow falla si no existe.

Más detalle de rutas, PWA y endpoints en [PLATAFORMA_SOLICITANTE_README.md](PLATAFORMA_SOLICITANTE_README.md).
