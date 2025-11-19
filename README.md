# 🤖 WhatsApp Bot - Grupo Semjo

Bot de WhatsApp automatizado para gestionar consultas de reclutamiento e información general de Grupo Semjo.

## 📋 Características

- ✅ **Menú interactivo** con opciones de reclutamiento e información
- ✅ **Navegación inteligente** con comandos "atrás" y "menu"
- ✅ **Validación de entrada** con mensajes de error en español
- ✅ **Filtrado de mensajes** (ignora grupos, broadcasts y mensajes propios)
- ✅ **Monitoreo de salud** automático con reconexión
- ✅ **Limpieza automática** de memorias de chat al cerrar el bot
- ✅ **Modo de prueba** offline para testing sin WhatsApp

## 🚀 Instalación

### Requisitos Previos

- **Node.js** (versión 14 o superior) - [Descargar aquí](https://nodejs.org/)
- **Git** (opcional, para clonar el repositorio) - [Descargar aquí](https://git-scm.com/)
- Una cuenta de **WhatsApp** activa

### Pasos de Instalación

1. **Clonar el repositorio** (o descargar el ZIP):
   ```bash
   git clone https://github.com/TU-USUARIO/whatsapp-bot.git
   cd whatsapp-bot
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **¡Listo!** El bot está preparado para funcionar.

## ▶️ Uso

### Método 1: Scripts de Windows (Más Fácil)

**Para ejecutar el bot principal:**
- Doble clic en `INICIAR-BOT.bat`

**Para ejecutar el modo de prueba:**
- Doble clic en `INICIAR-PRUEBA.bat`

### Método 2: Línea de Comandos

**Iniciar el bot principal:**
```bash
npm start
```

**Iniciar en modo de prueba (sin WhatsApp):**
```bash
npm test
```

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

## 📱 Primera Ejecución

1. Ejecuta el bot con `INICIAR-BOT.bat` o `npm start`
2. Aparecerá un **código QR** en la terminal
3. Abre WhatsApp en tu teléfono
4. Ve a **Configuración > Dispositivos vinculados**
5. Escanea el código QR mostrado en la terminal
6. ¡El bot estará listo! Verás el mensaje: `✓ Bot de WhatsApp listo!`

## 📖 Estructura del Menú

### Menú Principal
```
1. Proceso de Reclutamiento
2. Información General
```

### Proceso de Reclutamiento
- Muestra información sobre cómo aplicar a vacantes
- Link al formulario de aplicación

### Información General
```
1. ¿Dónde están ubicados?
2. Más información sobre la empresa
3. Horarios de atención
4. Política de inclusión
5. Beneficios que ofrecemos
```

### Comandos de Navegación
- `atrás` / `atras` / `back` - Volver al menú anterior
- `menu` - Volver al menú principal

## 🧪 Modo de Prueba

El modo de prueba (`test-offline.js`) permite probar el bot sin necesidad de conectar WhatsApp:

```bash
npm test
```

- Simula conversaciones en la terminal
- Mismo comportamiento que el bot real
- Útil para desarrollo y testing
- Escribe `salir` o `exit` para terminar

## 🛠️ Archivos del Proyecto

```
whatsapp-bot/
├── bot.js                  # Bot principal de WhatsApp
├── test-offline.js         # Bot de prueba offline
├── package.json            # Dependencias y scripts
├── GUIA-USO.md            # Guía detallada en español
├── INICIAR-BOT.bat        # Script para iniciar el bot (Windows)
├── INICIAR-PRUEBA.bat     # Script para modo prueba (Windows)
├── .gitignore             # Archivos ignorados por Git
└── README.md              # Este archivo
```

## 🔧 Configuración

### Cambiar el Comportamiento

Puedes modificar `bot.js` para personalizar:

- **Mensajes del menú**: Métodos `getMainMenu()`, `getRecruitmentMenu()`, `getInformationMenu()`
- **Opciones de menú**: Métodos `handleMainMenu()`, `handleInformationMenu()`
- **Validación**: Palabras clave aceptadas en cada condición

## 🔒 Seguridad y Privacidad

- ✅ Las sesiones de WhatsApp se almacenan localmente en `./sessions`
- ✅ El historial de chat se limpia automáticamente al cerrar el bot
- ✅ Los datos sensibles están excluidos de Git (ver `.gitignore`)
- ⚠️ **NUNCA** compartas la carpeta `sessions/` - contiene tu autenticación

## 📝 Logs y Monitoreo

El bot muestra información útil en la consola:

```
✓ Bot de WhatsApp listo!
✓ Monitoreo de salud activado
[14:30:25] Message from 123456789@c.us: "hola"
[Health Check] Estado: CONNECTED | Último mensaje hace: 45s
```

## 🐛 Solución de Problemas

### El QR no aparece
- Verifica que Node.js esté instalado: `node --version`
- Asegúrate de haber ejecutado `npm install`
- Revisa que el puerto no esté bloqueado por firewall

### Error: "Cannot find module"
```bash
npm install
```

### El bot no responde a mensajes
- Verifica que esté conectado: busca `✓ Bot de WhatsApp listo!`
- Revisa que no estés en un grupo (el bot solo responde mensajes individuales)
- Asegúrate de no estar escribiendo desde el número vinculado

### Error de permisos en carpeta sessions
- Cierra el bot completamente
- Elimina manualmente la carpeta `sessions/`
- Vuelve a iniciar el bot y escanea el QR

## 🔄 Actualizaciones

Para actualizar el bot con cambios del repositorio:

```bash
git pull origin main
npm install
```

## 🤝 Contribuir

Si deseas contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 💡 Soporte

Para más información detallada, consulta `GUIA-USO.md`.

---

**Desarrollado para Grupo Semjo** 🛡️
