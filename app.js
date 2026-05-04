// app.js

document.addEventListener("DOMContentLoaded", () => {
    initRouter();
    dibujarGraficoSalarios(); // Por si el usuario entra directo a esta URL
});

let isAnimating = false;

function initRouter() {
    const buttons = document.querySelectorAll('button[onclick^="window.location.href"]');
    
    buttons.forEach(btn => {
        const onclickText = btn.getAttribute('onclick');
        const match = onclickText.match(/'([^']+)'/);
        
        if(match && match[1]) {
            const targetUrl = match[1];
            let direction = 'right'; 
            
            if (btn.classList.contains('btn-oeste') || btn.classList.contains('btn-back')) {
                direction = 'left';
            } else if (btn.classList.contains('btn-norte')) {
                direction = 'top';
            } else if (btn.classList.contains('btn-sur')) {
                direction = 'bottom';
            }

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
        const response = await fetch(url);
        if (!response.ok) throw new Error("No se pudo cargar el archivo");
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlText, "text/html");
        const newScreen = newDoc.querySelector('.screen');
        
        if (!newScreen) throw new Error("No se encontró contenido en el destino");

        const appContainer = document.querySelector('.app-container');
        const currentScreen = document.querySelector('.screen');

        appContainer.style.position = 'relative';
        appContainer.style.height = appContainer.offsetHeight + 'px';
        appContainer.style.overflow = 'hidden';

        let inClass, outClass;
        if (direction === 'right')  { inClass = 'slide-in-right';  outClass = 'slide-out-left'; }
        if (direction === 'left')   { inClass = 'slide-in-left';   outClass = 'slide-out-right'; }
        if (direction === 'top')    { inClass = 'slide-in-top';    outClass = 'slide-out-bottom'; }
        if (direction === 'bottom') { inClass = 'slide-in-bottom'; outClass = 'slide-out-top'; }

        currentScreen.style.position = 'absolute';
        currentScreen.style.width = 'calc(100% - 40px)'; 
        
        newScreen.style.position = 'absolute';
        newScreen.style.width = 'calc(100% - 40px)';
        
        newScreen.classList.add(inClass);
        currentScreen.classList.add(outClass);
        appContainer.appendChild(newScreen);

        window.history.pushState({ path: url }, newDoc.title, url);
        document.title = newDoc.title; 

        setTimeout(() => {
            currentScreen.remove(); 
            
            newScreen.style.position = '';
            newScreen.style.width = '';
            newScreen.classList.remove(inClass);
            newScreen.style.animation = 'none'; 
            
            appContainer.style.position = '';
            appContainer.style.height = '';
            appContainer.style.overflow = '';
            
            window.scrollTo(0, 0); 
            initRouter(); 
            isAnimating = false;

            // ACA ESTÁ LA MAGIA NUEVA: Si entramos a la vista que tiene el gráfico, lo dibuja.
            dibujarGraficoSalarios();

        }, 400);      
      
    } catch (error) {
        console.error("Fallo la transición, salto normal:", error);
        window.location.href = url; 
    }
}

window.addEventListener('popstate', () => {
    window.location.reload();
});


/* ==========================================================
   FUNCIÓN PARA DIBUJAR EL GRÁFICO INTERACTIVO (APEXCHARTS)
   AHORA CARGA LOS DATOS EXTERNOS DESDE DATOS.JSON
   ========================================================== */
async function dibujarGraficoSalarios() {
    // Buscamos si el HTML actual tiene el contenedor del gráfico
    const contenedor = document.querySelector("#chart-salarios");
    
    // Si no está el contenedor o ya está dibujado, cortamos acá.
    if (!contenedor || contenedor.innerHTML !== "") return;

    try {
        // Hacemos el pedido (fetch) al archivo externo. 
        // Usamos "../datos.json" porque el HTML de esta página está dentro de la carpeta "detalles"
        const respuesta = await fetch('../datos.json');
        
        if (!respuesta.ok) throw new Error("No se pudo cargar el archivo JSON");
        
        // Convertimos el archivo en un objeto de JavaScript
        const datosExternos = await respuesta.json();

        // Armamos las opciones del gráfico usando la información que acabamos de traer
	// Armamos las opciones del gráfico
        var options = {
            series:[
                { name: 'Docencia Universitaria', data: datosExternos.docentes },
                { name: 'Privado Registrado', data: datosExternos.privados }
            ],
            chart: {
                type: 'line',
                height: 350,
                fontFamily: 'Montserrat, sans-serif',
                toolbar: {
                    show: true,
                    tools: { zoom: true, zoomin: false, zoomout: false, pan: true, reset: true, download: false, selection: false }
                },
                zoom: {
                    enabled: true,
                    type: 'x',
                    autoScaleYaxis: true
                },
                // Traducimos las herramientas internas al español
                locales:[{
                    name: 'es',
                    options: {
                        toolbar: {
                            pan: 'Mover',
                            reset: 'Restaurar Zoom'
                        }
                    }
                }],
                defaultLocale: 'es'
            },
            colors:['#003380', '#D10020'],
            stroke: { curve: 'straight', width: 3 },
            xaxis: {
                type: 'datetime',
                labels: {
                    format: 'yyyy', // Eje inferior: muestra solo el año para no amontonarse
                    datetimeUTC: false
                }
            },
            yaxis: {
                title: { text: 'Índice (Ene 1999 = 100)', style: { fontWeight: 600 } }
            },
            legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '12px' },
            tooltip: {
                x: { format: 'dd-MM-yyyy' }, // Cartel flotante: muestra el formato latino al tocar
                theme: 'light'
            }
        };

        // Pintamos el gráfico
        var chart = new ApexCharts(contenedor, options);
        chart.render();

    } catch (error) {
        console.error("Error al graficar:", error);
        contenedor.innerHTML = "<p style='padding: 20px; color: var(--accent-red);'>Ups, no se pudieron cargar los datos del gráfico histórico.</p>";
    }
}
