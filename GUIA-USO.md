# Guía Completa - Bot de WhatsApp para Reclutamiento

## Índice
1. [¿Qué es este bot?](#qué-es-este-bot)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Cómo iniciar el bot](#cómo-iniciar-el-bot)
5. [Cómo usar el bot](#cómo-usar-el-bot)
6. [Estructura de menús](#estructura-de-menús)
7. [Solución de problemas](#solución-de-problemas)

---

## ¿Qué es este bot?

Este es un bot automatizado de WhatsApp para Grupo Semjo que ayuda con:
- Proceso de reclutamiento
- Información general de la empresa
- Respuestas automáticas 24/7

**Características:**
- ✓ Responde automáticamente a mensajes
- ✓ Maneja múltiples usuarios simultáneamente
- ✓ Guarda historial de conversaciones
- ✓ Navegación intuitiva con menús
- ✓ Solo responde a chats individuales (no grupos)

---

## Requisitos

Antes de comenzar, necesitas:

1. **Node.js** instalado (versión 14 o superior)
   - Descarga: https://nodejs.org/

2. **Un teléfono con WhatsApp** para escanear el código QR

3. **Conexión a internet estable**

---

## Instalación

### Paso 1: Verificar que Node.js está instalado
1. Abre el símbolo del sistema (CMD)
2. Escribe: `node --version`
3. Deberías ver algo como: `v18.x.x`

### Paso 2: Instalar dependencias (Solo la primera vez)
1. Abre el símbolo del sistema
2. Ve a la carpeta del proyecto:
   ```
   cd C:\Users\Usuario\whatsapp-bot
   ```
3. Instala las dependencias:
   ```
   npm install
   ```

---

## Cómo iniciar el bot

### Método 1: Usando los scripts de inicio (MÁS FÁCIL)

#### Para iniciar el bot principal:
1. Ve a la carpeta: `C:\Users\Usuario\whatsapp-bot`
2. Haz doble clic en: **`INICIAR-BOT.bat`**
3. Se abrirá una ventana negra con un código QR

#### Para iniciar el bot de prueba:
1. Ve a la carpeta: `C:\Users\Usuario\whatsapp-bot`
2. Haz doble clic en: **`INICIAR-PRUEBA.bat`**
3. Se abrirá una ventana donde puedes probar el bot

### Método 2: Usando el terminal

#### Bot principal:
```bash
cd C:\Users\Usuario\whatsapp-bot
node bot.js
```

#### Bot de prueba:
```bash
cd C:\Users\Usuario\whatsapp-bot
node test-offline.js
```

---

## Primera vez: Conectar WhatsApp

### Paso 1: Iniciar el bot
- Usa cualquiera de los métodos de arriba
- Verás un código QR en la pantalla

### Paso 2: Escanear el código QR
1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** > **Dispositivos vinculados**
3. Toca **"Vincular un dispositivo"**
4. Escanea el código QR que aparece en la pantalla

### Paso 3: Bot conectado
- Verás el mensaje: "Bot de WhatsApp listo!"
- El bot ya está funcionando y responderá automáticamente

---

## Cómo usar el bot

### Para usuarios que escriben al bot:

1. **Envía un mensaje al número del bot**
   - Ejemplo: "Hola"

2. **Recibirás el menú principal:**
   ```
   Hola! Bienvenido

   1. Proceso de Reclutamiento
   2. Información General
   ```

3. **Escribe el número de la opción**
   - Ejemplo: "1" o "2"

4. **Navega usando comandos:**
   - `atrás` - Volver al menú anterior
   - `menu` - Ir al menú principal

---

## Estructura de menús

### Menú Principal
```
1. Proceso de Reclutamiento
   └─ Muestra información sobre cómo aplicar a vacantes

2. Información General
   ├─ 1. ¿Dónde están ubicados?
   ├─ 2. Más información sobre la empresa
   ├─ 3. Horarios de atención
   ├─ 4. Política de inclusión
   └─ 5. Beneficios que ofrecemos
```

### Navegación

| Comando | Función |
|---------|---------|
| `1`, `2`, `3`, etc. | Seleccionar opción |
| `atrás` | Volver al menú anterior |
| `menu` | Ir al menú principal |

**Palabras clave alternativas:**
- `reclutamiento`, `proceso`, `trabajo` → Abre el menú de reclutamiento
- `información`, `info`, `empresa` → Abre información general

---

## Archivos importantes

```
whatsapp-bot/
│
├── bot.js                      # Bot principal (producción)
├── test-offline.js             # Bot de prueba (testing)
│
├── INICIAR-BOT.bat            # Iniciar bot fácilmente
├── INICIAR-PRUEBA.bat         # Iniciar prueba fácilmente
│
├── sessions/                   # Sesión de WhatsApp guardada
├── chat-sessions.json         # Historial de conversaciones
└── test-chat-sessions.json    # Historial de pruebas
```

---

## Solución de problemas

### Problema: El código QR no aparece
**Solución:**
1. Cierra el bot (Ctrl + C)
2. Elimina la carpeta `sessions`
3. Vuelve a iniciar el bot
4. Escanea el nuevo código QR

### Problema: El bot no responde
**Verificar:**
1. ¿El bot está en ejecución? (La ventana debe estar abierta)
2. ¿Estás escribiendo desde un chat individual? (No funciona en grupos)
3. ¿El teléfono tiene conexión a internet?

**Solución:**
- Reinicia el bot (cierra y vuelve a abrir)
- Verifica la consola por errores en rojo

### Problema: "Error: Module not found"
**Solución:**
```bash
cd C:\Users\Usuario\whatsapp-bot
npm install
```

### Problema: El bot responde a todos (no solo al que envía mensaje)
**Verificar:**
1. Revisa la consola - deberías ver:
   ```
   Message from 1234567890@c.us: "hola"
   Replying to 1234567890@c.us
   ```
2. Si el bot está en un grupo, sácalo - solo funciona en chats individuales

### Problema: La navegación "atrás" no funciona
**Esto es normal si:**
- Acabas de seleccionar una opción
- Presiona "atrás" para volver al menú
- Presiona "atrás" otra vez para ir al menú principal

---

## Modo de prueba

### ¿Cuándo usar el modo de prueba?
- Para probar el bot sin WhatsApp
- Para revisar los menús y respuestas
- Para verificar cambios antes de publicar

### Cómo usar:
1. Inicia: `INICIAR-PRUEBA.bat`
2. Escribe tus mensajes en la consola
3. El bot responderá inmediatamente
4. Escribe `salir` para terminar

**Ejemplo:**
```
Tú: hola
Bot: Hola! Bienvenido
     1. Proceso de Reclutamiento
     2. Información General

Tú: 1
Bot: *¿Cómo puedo aplicar a la vacante?*
     ...

Tú: atras
Bot: Hola! Bienvenido
     ...

Tú: salir
Adiós! Sesión de prueba terminada.
```

---

## Consejos y buenas prácticas

### Para mantener el bot funcionando:

1. **No cierres la ventana del bot**
   - Mientras esté abierta, el bot responde
   - Si la cierras, el bot deja de funcionar

2. **Revisa la consola regularmente**
   - Verás quién está escribiendo
   - Detectarás errores rápidamente

3. **Mantén actualizado Node.js**
   - Versión recomendada: 18.x o superior

4. **Haz respaldos**
   - Copia `chat-sessions.json` regularmente
   - Guarda la carpeta `sessions`

### Para modificar respuestas:

1. Edita `bot.js` para el bot principal
2. Edita `test-offline.js` para pruebas
3. Prueba primero en modo offline
4. Luego actualiza el bot principal

---

## Logs y depuración

### Qué verás en la consola:

**Al iniciar:**
```
Escanea este código QR con tu WhatsApp:
[Código QR]
Bot de WhatsApp listo!
```

**Al recibir mensajes:**
```
Message from 1234567890@c.us: "hola"
Replying to 1234567890@c.us
```

**Si hay errores:**
```
Error guardando sesiones: [detalles del error]
```

---

## Contacto y soporte

Si tienes problemas:
1. Revisa esta guía
2. Verifica la sección "Solución de problemas"
3. Revisa los logs en la consola
4. Contacta al desarrollador

---

## Notas finales

- El bot funciona 24/7 mientras la ventana esté abierta
- Cada usuario tiene su propia sesión independiente
- El historial se guarda automáticamente
- Solo responde a chats individuales (ignora grupos)
- La navegación "atrás" funciona correctamente

**¡El bot está listo para usar!** 🚀
