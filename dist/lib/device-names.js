"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomName = generateRandomName;
exports.getUniqueName = getUniqueName;
exports.clearDeviceName = clearDeviceName;
// Listas de nombres aleatorios organizados por categorías
const adjectives = [
    'Rápido', 'Inteligente', 'Brillante', 'Potente', 'Ágil',
    'Moderno', 'Eficiente', 'Innovador', 'Seguro', 'Compacto',
    'Veloz', 'Futurista', 'Dinámico', 'Premium', 'Eléctrico',
    'Digital', 'Virtual', 'Cibernético', 'Automático', 'Portátil'
];
const techNouns = [
    'Processor', 'Chip', 'Server', 'Node', 'Core', 'Drive',
    'Matrix', 'Grid', 'Cloud', 'Data', 'Byte', 'Bit', 'Pixel',
    'Vector', 'Quantum', 'Neural', 'Solar', 'Atomic', 'Nano',
    'Logic', 'Circuit', 'Module', 'Unit', 'Device', 'Machine'
];
const animalNouns = [
    'León', 'Tigre', 'Águila', 'Delfín', 'Lobo', 'Pantera',
    'Halcon', 'Jaguar', 'Cóndor', 'Búho', 'Zorro', 'Lince',
    'Guepardo', 'Tiburón', 'Ballena', 'Elefante', 'Gorila'
];
const colorAdjectives = [
    'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Púrpura',
    'Rosa', 'Cian', 'Magenta', 'Turquesa', 'Esmeralda', 'Zafiro',
    'Rubí', 'Ámbar', 'Oro', 'Plata', 'Bronce', 'Negro', 'Blanco'
];
// Función para generar nombre aleatorio
function generateRandomName() {
    const categories = [
        () => `${getRandomElement(colorAdjectives)} ${getRandomElement(animalNouns)}`,
        () => `${getRandomElement(adjectives)} ${getRandomElement(techNouns)}`,
        () => `${getRandomElement(adjectives)} ${getRandomElement(animalNouns)}`,
        () => `Super ${getRandomElement(techNouns)}`,
        () => `Mega ${getRandomElement(animalNouns)}`,
        () => `Hyper ${getRandomElement(colorAdjectives)}`
    ];
    return getRandomElement(categories)();
}
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
// Almacenar nombres asignados para evitar duplicados
const assignedNames = new Map();
function getUniqueName(deviceId) {
    // Si ya tiene nombre, devolverlo
    if (assignedNames.has(deviceId)) {
        return assignedNames.get(deviceId);
    }
    // Generar nombre único
    let name;
    let attempts = 0;
    do {
        name = generateRandomName();
        attempts++;
        // Si hay muchos intentos, agregar número único
        if (attempts > 10) {
            name = `${name} ${Math.floor(Math.random() * 1000)}`;
        }
    } while (Array.from(assignedNames.values()).includes(name) && attempts < 20);
    assignedNames.set(deviceId, name);
    return name;
}
// Limpiar nombre cuando un dispositivo se desconecte
function clearDeviceName(deviceId) {
    assignedNames.delete(deviceId);
}
