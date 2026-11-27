[简体中文](../README.md) | [English](README.en.md) | [繁體中文](README.zh-TW.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | **Español** | [Português (BR)](README.pt-BR.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [ไทย](README.th.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md)

# Persona Tags

Una extensión de gestión de personas mejorada para SillyTavern.

Cuando tu lista de personas crece demasiado, rápidamente se vuelve difícil saber quién es quién. Esta extensión te permite añadir tags a tus personas, filtrar por tags, gestionarlas por lotes y reordenarlas libremente para mantener todo organizado y fácil de encontrar.

## Características

### Sistema de tags
- Añade tags a las personas (separados por comas para añadir varios a la vez)
- Selector rápido desplegable de **Tags existentes** en la columna derecha (oculta automáticamente los tags que ya tiene la persona actual, con desplazamiento fluido cuando tienes muchos tags)
- Filtra personas por tags con los modos **Incluir** (mostrar solo las coincidentes) y **Excluir** (ocultar las coincidentes)
- Mantén pulsados los tags en el panel de filtros para arrastrarlos y reordenarlos
- Los tags usados por personas vinculadas al personaje actual brillan sutilmente
- Muestra los tags directamente en cada tarjeta de persona
- Añade tags iniciales directamente desde el diálogo de creación de persona

### Gestión por lotes
- Haz clic en **Lote** para entrar en el modo de edición por lotes con casillas de verificación en cada tarjeta
- **Sel. todo** / **Limpiar** selección
- **Añadir tags**, **Quitar tags** y **Borrar** personas por lotes

### Ordenación y posición
- Mantén pulsadas las tarjetas de persona para arrastrarlas y reordenarlas (compatible con móviles)
- Introduce un número de posición exacto en la columna derecha para moverte directamente
- Muestra el índice de posición actual en cada tarjeta
- Órdenes de clasificación independientes para **Todos** y para las personas vinculadas a cada personaje o grupo individual

### Vistas y navegación
- Vista **Conectados**: muestra solo las personas vinculadas al personaje o grupo actual
- Vista **Todos**: muestra todas las personas
- Desplazamiento rápido superior **↑ / ↓**: salta un número personalizado de personas (por defecto `10`, se conserva entre sesiones); mantén pulsado durante `0.5s` para ir directamente al principio o al final
- Botón de actualización manual para recargar la lista
- Compatible tanto con la vista de lista como con la vista de cuadrícula

### Localización y más
- Soporte completo para los **17 idiomas oficiales de la interfaz de SillyTavern**, siguiendo automáticamente tu configuración de idioma en SillyTavern (usa inglés como respaldo para idiomas no compatibles o futuros)
- Casillas opcionales para **Copiar tags** y **Copiar vínculos** al duplicar una persona
- Ventana emergente mejorada de selección múltiple de personas que muestra avatar, nombre y tags cuando hay varias personas vinculadas al mismo personaje
- La copia de seguridad y restauración de personas incluye automáticamente tags, órdenes personalizados y ajustes de desplazamiento rápido

## Instalación

### Método 1: Instalar dentro de SillyTavern (Recomendado)

1. Abre SillyTavern y haz clic en **Extensiones** (el icono de cubos en la barra superior)
2. Haz clic en **Instalar extensión**
3. Pega la siguiente URL del repositorio, instálala y actualiza la página:

```
https://github.com/XiaoBai20001212/persona-tags
```

> Las futuras actualizaciones pueden instalarse directamente desde **Gestionar extensiones**.

### Método 2: Instalación manual

Descarga y extrae el repositorio, luego coloca toda la carpeta `persona-tags` en:

```
SillyTavern/public/scripts/extensions/third-party/persona-tags/
```

Actualiza la página y listo.

## Almacenamiento de datos

Los datos de tags y ordenación se guardan dentro de `extension_settings` de SillyTavern sin modificar tus datos originales de personas. Si eliminas la carpeta de la extensión, la interfaz predeterminada se restaura limpiamente sin afectar a SillyTavern.

## Autores

- [小白](https://github.com/XiaoBai20001212)
- [好大一只鱼](https://github.com/haodayizhiyu404)
