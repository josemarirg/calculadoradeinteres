/**
 * Datos del titular del sitio (aviso legal, privacidad, contacto).
 * La LSSI (art. 10) obliga a publicarlos: todo lo que hay aquí será visible.
 */
export const TITULAR = {
  nombre: 'José María Rodríguez Gómez', // TODO(titular): confirmar grafía (tildes) tal como figura en tu DNI.
  nif: '29562145S',
  // La localidad se deduce del código postal 41010 (Sevilla). TODO(titular): añade piso o puerta si procede.
  direccion: 'Calle Gutiérrez de Alba, 6, 41010 Sevilla',
  email: 'calculadoradeinteres@gmail.com',
} as const;
