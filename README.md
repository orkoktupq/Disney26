# Disney & Universal Itinerary 2026 - Web App & macOS App

¡Bienvenidos a bordo, Juanma y Sofi! Esta es la aplicación web para administrar su itinerario de viaje a Disney y Universal (del 17/7 al 31/7).

La aplicación cuenta con una estética premium y minimalista inspirada en el sistema operativo iOS de Apple, optimizada para la visualización en un iPhone 17 Pro Max (con vista adaptada de teléfono para pantallas grandes y 100% responsive en celulares).

## 🚀 Archivos del Proyecto

* **`index.html`**: La interfaz SPA (Single Page Application) que contiene la barra de pestañas superior e inferior, el widget de clima, la pantalla de bloqueo y los modales interactivos.
* **`style.css`**: Hoja de estilos basada en **Glassmorphism** y adaptabilidad automática a modo claro/oscuro (siguiendo las preferencias del sistema).
* **`app.js`**: Lógica de funcionamiento de la app, control de sesión de usuario (clave `1315`), base de datos local y sincronización en segundo plano con Supabase.
* **`supabase_setup.sql`**: Script de inicialización de la base de datos de Supabase con datos y tips de ejemplo realistas.
* **`processed_app_icon.png`**: Icono de la app de alta calidad con el castillo de Disney y un avión, estilo Apple.
* **`create_mac_app.sh`**: Script para compilar el atajo nativo para el Dock de macOS.

## 🛠️ Instrucciones de Uso

### 1. Iniciar localmente
Simplemente abre el archivo `index.html` en tu navegador web de preferencia, o haz doble clic para iniciar.

### 2. Generar el Atajo de macOS para tu Dock
El atajo ya ha sido compilado durante el desarrollo y está listo para usarse. Puedes encontrar el archivo en la carpeta del proyecto:
👉 **`Disney2026.app`**

* **Para usarlo**:
  1. Arrastra `Disney2026.app` a tu carpeta de **`Aplicaciones`** en tu Mac.
  2. Arrástralo directamente a tu **`Dock`** de macOS para tener acceso instantáneo en cualquier momento.
  3. *Nota*: Al ser una app local compilada, no requiere conexión a internet para iniciar y conservará tus datos localmente gracias al almacenamiento integrado.

* Si realizas cambios en el diseño o deseas recompilar la app nativa, abre una terminal en esta carpeta y ejecuta:
  ```bash
  ./create_mac_app.sh
  ```

### 3. Conexión de Supabase (Sincronización en la nube)
Para sincronizar y compartir los datos entre tu teléfono y tu Mac:
1. Crea un proyecto gratuito en [Supabase](https://supabase.com/).
2. Copia el contenido de `supabase_setup.sql` y ejecútalo en la consola de tu base de datos (sección **SQL Editor**).
3. Abre el archivo `app.js` y edita la configuración de cabecera con tus credenciales:
   ```javascript
   const SUPABASE_CONFIG = {
       url: "INGRESA_TU_URL_DE_SUPABASE",
       anonKey: "INGRESA_TU_CLAVE_ANON_DE_SUPABASE"
   };
   ```
4. ¡Listo! La app se sincronizará automáticamente cada vez que realices cambios estando online.

### 4. Preparado para GitHub y Vercel
Este proyecto no tiene dependencias de construcción (build), lo que significa que subirlo a GitHub y desplegarlo en Vercel es sumamente sencillo:
1. Sube esta carpeta a tu repositorio de GitHub.
2. Inicia sesión en [Vercel](https://vercel.com/) y crea un nuevo proyecto apuntando a tu repositorio de GitHub.
3. Vercel detectará que es un sitio estático y lo desplegará al instante. Tendrás un enlace público en segundos para cargarlo en el Safari de tu iPhone.
