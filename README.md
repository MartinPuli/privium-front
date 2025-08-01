# Privium Front

Este repositorio contiene la aplicación web de **Privium**, un marketplace privado para barrios cerrados. El proyecto principal está desarrollado en **Angular 20** y utiliza **Tailwind CSS** para estilos. También se incluyen componentes de React/Next.js (carpeta `components`) empleados para prototipos de interfaz.

## Requisitos
- [Node.js](https://nodejs.org/) 20 o superior
- `npm` (o `pnpm`/`yarn` si se prefiere)

## Instalación
1. Clona este repositorio.
2. Instala las dependencias:
   ```bash
 npm install
  ```

### Configuración de entorno
La comunicación con la API utiliza los archivos de `src/environments`.
Modifica `environment.ts` para desarrollo y `environment.prod.ts` para
producción indicando la URL base del backend.

## Uso
### Servidor de desarrollo de Angular
Inicia la aplicación Angular con:
```bash
npx ng serve
```
El servidor se inicia por defecto en `http://localhost:4200`.

### Compilación
Para compilar la aplicación en modo producción ejecuta:
```bash
npx ng build
```
Los archivos listos para desplegar quedarán en `dist/`.

### Prototipos con Next.js
En la carpeta `components` se encuentran componentes UI basados en React. Para probarlos se utilizó un pequeño proyecto de Next.js presente en la carpeta `app`. Para levantar dicho entorno ejecuta:
```bash
npm run dev
```
*Nota:* las dependencias de Next.js no están incluidas por defecto; si necesitas este entorno instala `next` manualmente.

## Estructura del proyecto
- `src/` – código principal de la aplicación Angular.
- `components/` – biblioteca de componentes React/Tailwind.
- `app/` – proyecto mínimo de Next.js para prototipos.
- `public/` – recursos estáticos.

## Licencia
Actualmente este proyecto no especifica una licencia.
