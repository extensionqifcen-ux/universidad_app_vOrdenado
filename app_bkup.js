// app.js

document.addEventListener("DOMContentLoaded", () => {
    initRouter();
});

let isAnimating = false; // Evita que toquen muchos botones a la vez

function initRouter() {
    // 1. Buscar todos los botones que tienen onclick="window.location.href='...'"
    const buttons = document.querySelectorAll('button[onclick^="window.location.href"]');
    
    buttons.forEach(btn => {
        // 2. Extraer la URL de destino del atributo onclick
        const onclickText = btn.getAttribute('onclick');
        const match = onclickText.match(/'([^']+)'/);
        
        if(match && match[1]) {
            const targetUrl = match[1];
            
            // 3. Determinar para dónde va la animación leyendo tus propias clases CSS
            let direction = 'right'; // Por defecto: entrar por la derecha
            
            if (btn.classList.contains('btn-oeste') || btn.classList.contains('btn-back')) {
                direction = 'left';  // Si es retroceso o flecha oeste, entra por la izquierda
            } else if (btn.classList.contains('btn-norte')) {
                direction = 'top';   // Flecha norte entra por arriba
            } else if (btn.classList.contains('btn-sur')) {
                direction = 'bottom';// Flecha sur entra por abajo
            }

            // 4. Secuestrar el botón: Le borramos el salto brusco y le ponemos el nuestro
            btn.removeAttribute('onclick');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!isAnimating) {
                    navigateAnimated(targetUrl, direction);
                }
            });
        }
    });
}

async function navigateAnimated(url, direction) {
    isAnimating = true;

    try {
        // 5. Ir a buscar el archivo HTML de fondo
        const response = await fetch(url);
        if (!response.ok) throw new Error("No se pudo cargar el archivo");
        const htmlText = await response.text();
        
        // 6. Extraer solo el bloque ".screen" del nuevo archivo
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlText, "text/html");
        const newScreen = newDoc.querySelector('.screen');
        
        if (!newScreen) throw new Error("No se encontró contenido en el destino");

        // 7. Preparar la caja contenedora y las pantallas
        const appContainer = document.querySelector('.app-container');
        const currentScreen = document.querySelector('.screen');

        // Fijamos el alto para que la app no colapse en el medio de la animación
        appContainer.style.position = 'relative';
        appContainer.style.height = appContainer.offsetHeight + 'px';
        appContainer.style.overflow = 'hidden';

        // Definimos qué clases aplicar
        let inClass, outClass;
        if (direction === 'right')  { inClass = 'slide-in-right';  outClass = 'slide-out-left'; }
        if (direction === 'left')   { inClass = 'slide-in-left';   outClass = 'slide-out-right'; }
        if (direction === 'top')    { inClass = 'slide-in-top';    outClass = 'slide-out-bottom'; }
        if (direction === 'bottom') { inClass = 'slide-in-bottom'; outClass = 'slide-out-top'; }

        // Superponemos ambas pantallas
        currentScreen.style.position = 'absolute';
        currentScreen.style.width = 'calc(100% - 40px)'; // Respetando tus padding de 20px
        
        newScreen.style.position = 'absolute';
        newScreen.style.width = 'calc(100% - 40px)';
        
        // Ejecutamos animación
        newScreen.classList.add(inClass);
        currentScreen.classList.add(outClass);
        appContainer.appendChild(newScreen);

        // Cambiamos la URL de arriba sin recargar la página (Magia SPA)
        window.history.pushState({ path: url }, newDoc.title, url);
        document.title = newDoc.title; // Actualiza el título de la pestaña

        // 8. Limpiar la basura cuando termine la animación (400ms)
        setTimeout(() => {
            currentScreen.remove(); // Borramos el HTML viejo
            
            // Le sacamos las ataduras al nuevo para que el scroll vuelva a funcionar normal
            newScreen.style.position = '';
            newScreen.style.width = '';
            newScreen.classList.remove(inClass);
            
            // ACA ESTÁ LA LÍNEA NUEVA QUE CLAVA LOS FRENOS
            newScreen.style.animation = 'none'; 
            
            appContainer.style.position = '';
            appContainer.style.height = '';
            appContainer.style.overflow = '';
            
            window.scrollTo(0, 0); // Lo mandamos arriba de todo
            initRouter(); // Reiniciamos el rastreador para que encuentre los botones nuevos
            isAnimating = false;
        }, 400);      
      
    } catch (error) {
        console.error("Fallo la transición fluida, haciendo salto normal:", error);
        window.location.href = url; // Fallback: si algo se rompe, salta normal para no dejar a pata al usuario
    }
}

// Si el usuario toca la flechita de "Atrás" propia de su celular/navegador, recargamos la página para que no se rompa
window.addEventListener('popstate', () => {
    window.location.reload();
});
