# 🎧 AI Visualizer
Upload your favorite songs and be amazed by the visuals that will make you feel the beat

**Demo:** [(https://aivisualizer.vercel.app/)]



📦 Requisitos previos

Node.js (v14 o superior)

VB‑Audio Virtual Cable (Windows) para redirigir el audio de tu sistema al visualizador.



💿 Instalación

Clona el repositorio:

git clone https://github.com/TU_USUARIO/retro-ai-visualizer.git
cd retro-ai-visualizer

Instala dependencias:

npm install

Inicia el servidor de desarrollo:

npm run dev

Abre tu navegador en http://localhost:5173.



⚙️ Configuración de VB‑Audio Virtual Cable

Para capturar el audio de cualquier reproductor (Spotify, YouTube, etc.) y evitar eco:

Descarga e instala VB‑Audio Virtual Cable desde su web oficial:https://vb-audio.com/Cable/

Una vez instalado, abre Configuración de Sonido en Windows (Win + I → Sistema → Sonido).

En Salida, selecciona Cable Output (VB‑Audio Virtual Cable) como dispositivo predeterminado.

En Grabación, selecciona Cable Output (VB‑Audio Virtual Cable) como dispositivo predeterminado.

Abre las Propiedades de grabación de Cable Output → pestaña Escuchar → desmarca "Escuchar este dispositivo" → Aplicar.

Con esto tu sistema emitirá audio a través de VB‑Audio Cable, pero no lo escuchará de forma duplicada (sin eco).
