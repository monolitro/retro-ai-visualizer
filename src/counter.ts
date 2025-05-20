// src/counter.ts
/**
 * Componente contador para un botón.
 * @param element Botón donde se mostrará el contador.
 */
export function setupCounter(element: HTMLButtonElement): void {
  let count = 0;
  // Inicializamos el texto
  element.textContent = `count is ${count}`;

  // Al hacer click, incrementamos y actualizamos
  element.addEventListener('click', () => {
    count += 1;
    element.textContent = `count is ${count}`;
  });
}
