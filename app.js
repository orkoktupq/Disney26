// Disney & Universal Itinerary 2026 - App Engine
// Apple-Style Minimalist SPA & Offline-First Sync Engine

// --- CONFIGURACIÓN DE SUPABASE ---
// Juanma: Aquí puedes indicarme tu URL y Anon Key de Supabase cuando quieras y yo las pegaré aquí.
// Si están vacías, la app funciona de forma 100% local en tu dispositivo con persistencia en localStorage.
const SUPABASE_CONFIG = {
    url: "https://qalyzkqzfhqwfznxegcb.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbHl6a3F6Zmhxd2Z6bnhlZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjE4OTUsImV4cCI6MjA5MjY5Nzg5NX0.pNQog1YLK3cOJps9KQUKxYB6JiAWxn6V1Gm-PKw_Au4"
};

// Helper para extraer el emoji y el título de un día del itinerario
function extractEmojiAndTitle(fullTitle) {
    if (!fullTitle) return { emoji: "📅", title: "" };
    const emojiRegex = /[\s]*([\p{Emoji_Presentation}\p{Emoji}\u200d\uFE0F]+)$/u;
    const match = fullTitle.match(emojiRegex);
    if (match) {
        const emoji = match[1];
        const cleanTitle = fullTitle.replace(emojiRegex, "").trim();
        return { emoji, title: cleanTitle };
    }
    return { emoji: "📅", title: fullTitle.trim() };
}

let supabaseClient = null;

// --- DATOS INICIALES REALISTAS DE FACTO (FALLBACK LOCAL) ---
const DEFAULT_ITINERARY = [
    { id: "i0", date: "2026-07-16", title: "Día Previo / Viaje a Orlando", notes: "Día de preparación y salida del vuelo.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i1", date: "2026-07-17", title: "Llegada a Orlando", notes: "Vuelo EZE -> MCO. Retiro del auto de alquiler en Hertz y check-in en Universal Cabana Bay Beach Resort. Compras rápidas en Walmart.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i2", date: "2026-07-18", title: "Magic Kingdom", notes: "¡Primer día de parque! Llegar temprano para el Rope Drop. Reservar TRON y Tiana en Virtual Queue/Lightning Lane a las 7:00 AM.", is_park_day: true, park_name: "Magic Kingdom", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i3", date: "2026-07-19", title: "Epcot", notes: "Visita a Epcot. Cosmic Rewind es prioridad (Virtual Queue a las 7:00 AM o Lightning Lane Single Pass). Pasear por los pabellones de World Showcase en la tarde.", is_park_day: true, park_name: "Epcot", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i4", date: "2026-07-20", title: "Universal Studios Florida", notes: "Visita a Universal Studios. Diagon Alley (Gringotts), Revenge of the Mummy y Men in Black. Almorzar en el Caldero Chorreante.", is_park_day: true, park_name: "Universal Studios", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i5", date: "2026-07-21", title: "Disney's Hollywood Studios", notes: "Mundo Star Wars (Galaxy's Edge) a primera hora. Rise of the Resistance y Slinky Dog Dash son las prioridades del día.", is_park_day: true, park_name: "Hollywood Studios", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i6", date: "2026-07-22", title: "Día de Compras y Descanso", notes: "Mañana libre en la pileta de Cabana Bay. Tarde de compras en Orlando Premium Outlets (International Dr) y cena en Disney Springs.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i7", date: "2026-07-23", title: "Universal's Islands of Adventure", notes: "Atracciones principales: VelociCoaster, Hagrid's Motorbike Adventure y Spider-Man. Tomar el Hogwarts Express hacia Universal Studios.", is_park_day: true, park_name: "Islands of Adventure", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i8", date: "2026-07-24", title: "Disney's Animal Kingdom", notes: "Entrar temprano para Avatar Flight of Passage. Expedition Everest y el safari Kilimanjaro Safaris en la mañana para ver los animales activos.", is_park_day: true, park_name: "Animal Kingdom", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i9", date: "2026-07-25", title: "Volcano Bay", notes: "Día de relax y toboganes en el parque acuático de Universal. Utilizar la pulsera TapuTapu para reservar tiempos de fila virtual.", is_park_day: true, park_name: "Volcano Bay", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i10", date: "2026-07-26", title: "Magic Kingdom (Día 2)", notes: "Completar atracciones pendientes de Fantasyland y Frontierland. Ver el show de fuegos artificiales Happily Ever After desde una buena ubicación.", is_park_day: true, park_name: "Magic Kingdom", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i11", date: "2026-07-27", title: "Islands of Adventure (Día 2)", notes: "Repetir VelociCoaster y Hagrid's. Disfrutar los detalles de Hogsmeade y almorzar en Las Tres Escobas.", is_park_day: true, park_name: "Islands of Adventure", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i12", date: "2026-07-28", title: "Epcot (Día 2)", notes: "Repetir Cosmic Rewind y Soarin'. Caminar con calma por World Showcase, cenar en el pabellón de Japón y ver el show nocturno Luminous.", is_park_day: true, park_name: "Epcot", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i13", date: "2026-07-29", title: "Hollywood Studios (Día 2)", notes: "Hacer Toy Story Mania, Tower of Terror y ver el show nocturno Fantasmic! (llegar 45 min antes).", is_park_day: true, park_name: "Hollywood Studios", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i14", date: "2026-07-30", title: "Últimas Compras y Valijas", notes: "Último día para comprar recuerdos en Target y Disney Springs. Armar valijas y pesar el equipaje para evitar sorpresas en el aeropuerto.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i15", date: "2026-07-31", title: "Regreso a Casa", notes: "Check-out del hotel Cabana Bay. Devolución del auto en Hertz (MCO). Vuelo de regreso MCO -> Buenos Aires.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" }
];

const DEFAULT_ATTRACTIONS = [
    // Magic Kingdom
    { id: "a1", park: "Magic Kingdom", name: "TRON Lightcycle / Run", land: "Tomorrowland", date: "2026-07-18", is_completed: false, visit_order: 1, notes: "Virtual Queue Grupo 12 a las 7 AM. Imprescindible guardar todo en lockers.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a2", park: "Magic Kingdom", name: "Space Mountain", land: "Tomorrowland", date: "2026-07-18", is_completed: false, visit_order: 2, notes: "Fila rápida si se hace temprano justo después de TRON.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a3", park: "Magic Kingdom", name: "Buzz Lightyear's Space Ranger Spin", land: "Tomorrowland", date: "2026-07-18", is_completed: false, visit_order: 3, notes: "Competir Juanma vs Sofi. ¡A apuntar a los triángulos de 100k puntos!", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a4", park: "Magic Kingdom", name: "Seven Dwarfs Mine Train", land: "Fantasyland", date: "2026-07-18", is_completed: false, visit_order: 4, notes: "Fila alta. Evaluar Lightning Lane Single Pass.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a5", park: "Magic Kingdom", name: "Peter Pan's Flight", land: "Fantasyland", date: "2026-07-18", is_completed: false, visit_order: 5, notes: "Un clásico con fila siempre larga.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a6", park: "Magic Kingdom", name: "Haunted Mansion", land: "Liberty Square", date: "2026-07-18", is_completed: false, visit_order: 6, notes: "Perfecto para hacer al mediodía (tiene aire acondicionado).", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a7", park: "Magic Kingdom", name: "Tiana's Bayou Adventure", land: "Frontierland", date: "2026-07-18", is_completed: false, visit_order: 7, notes: "Nueva atracción. Virtual Queue o comprar Lightning Lane.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a8", park: "Magic Kingdom", name: "Big Thunder Mountain Railroad", land: "Frontierland", date: "2026-07-18", is_completed: false, visit_order: 8, notes: "¡La montaña rusa más salvaje del oeste! Mejor hacerla al atardecer.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a9", park: "Magic Kingdom", name: "Pirates of the Caribbean", land: "Adventureland", date: "2026-07-18", is_completed: false, visit_order: 9, notes: "Clásico imperdible. Fila fluida.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a10", park: "Magic Kingdom", name: "Jungle Cruise", land: "Adventureland", date: "2026-07-18", is_completed: false, visit_order: 10, notes: "Fila lenta en la tarde. Intentar reservar Lightning Lane.", updated_at: "2026-07-14T08:00:00Z" },
    // Epcot
    { id: "a11", park: "Epcot", name: "Guardians of the Galaxy: Cosmic Rewind", land: "World Discovery", date: "2026-07-19", is_completed: false, visit_order: 1, notes: "¡Mejor montaña rusa de Orlando! Virtual Queue a las 7 AM o pago individual.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a12", park: "Epcot", name: "Test Track", land: "World Discovery", date: "2026-07-19", is_completed: false, visit_order: 2, notes: "Diseñar el auto antes de subir. Fila suele ser alta.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a13", park: "Epcot", name: "Soarin' Around the World", land: "World Nature", date: "2026-07-19", is_completed: false, visit_order: 3, notes: "Simulador de vuelo hermoso. Pedir fila central si es posible.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a14", park: "Epcot", name: "Living with the Land", land: "World Nature", date: "2026-07-19", is_completed: false, visit_order: 4, notes: "Paseo en bote tranquilo sobre cultivos del futuro. Ideal para descansar.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a15", park: "Epcot", name: "Frozen Ever After", land: "World Showcase", date: "2026-07-19", is_completed: false, visit_order: 5, notes: "Ubicado en Noruega. Fila alta, intentar ir en la tarde.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a16", park: "Epcot", name: "Remy's Ratatouille Adventure", land: "World Showcase", date: "2026-07-19", is_completed: false, visit_order: 6, notes: "Ubicado en Francia. Hermoso simulador 3D. Filas muy largas en el día.", updated_at: "2026-07-14T08:00:00Z" },
    // Hollywood Studios
    { id: "a17", park: "Hollywood Studios", name: "Star Wars: Rise of the Resistance", land: "Galaxy's Edge", date: "2026-07-21", is_completed: false, visit_order: 1, notes: "Atracción super inmersiva. Si falla temprano, intentar a la hora del almuerzo.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a18", park: "Hollywood Studios", name: "Millennium Falcon: Smugglers Run", land: "Galaxy's Edge", date: "2026-07-21", is_completed: false, visit_order: 2, notes: "Juanma piloto, Sofi ingeniera. Divertida interactiva.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a19", park: "Hollywood Studios", name: "Slinky Dog Dash", land: "Toy Story Land", date: "2026-07-21", is_completed: false, visit_order: 3, notes: "Montaña rusa familiar pero muy divertida. Fila siempre de más de 60 min.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a20", park: "Hollywood Studios", name: "Toy Story Mania!", land: "Toy Story Land", date: "2026-07-21", is_completed: false, visit_order: 4, notes: "Juego de puntería 3D adictivo.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a21", park: "Hollywood Studios", name: "Tower of Terror", land: "Sunset Boulevard", date: "2026-07-21", is_completed: false, visit_order: 5, notes: "Caídas libres aleatorias. Estética de hotel abandonado espectacular.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a22", park: "Hollywood Studios", name: "Rock 'n' Roller Coaster Starring Aerosmith", land: "Sunset Boulevard", date: "2026-07-21", is_completed: false, visit_order: 6, notes: "Salida a toda velocidad a oscuras con música de Aerosmith.", updated_at: "2026-07-14T08:00:00Z" },
    // Islands of Adventure
    { id: "a23", park: "Islands of Adventure", name: "VelociCoaster", land: "Jurassic Park", date: "2026-07-23", is_completed: false, visit_order: 1, notes: "Impresionante montaña rusa de lanzamiento. Fila obligatoria pero avanza rápido.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a24", park: "Islands of Adventure", name: "Hagrid's Magical Creatures Motorbike Adventure", land: "Hogsmeade", date: "2026-07-23", is_completed: false, visit_order: 2, notes: "Prioridad N°1 en Islands. No acepta Express Pass normal. Rope Drop indispensable.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a25", park: "Islands of Adventure", name: "Harry Potter and the Forbidden Journey", land: "Hogsmeade", date: "2026-07-23", is_completed: false, visit_order: 3, notes: "Dentro del castillo de Hogwarts. Da un poco de mareo, tomar recaudo.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a26", park: "Islands of Adventure", name: "The Amazing Adventures of Spider-Man", land: "Marvel Super Hero Island", date: "2026-07-23", is_completed: false, visit_order: 4, notes: "Simulador de juego clásico en 3D espectacular.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a27", park: "Islands of Adventure", name: "The Incredible Hulk Coaster", land: "Marvel Super Hero Island", date: "2026-07-23", is_completed: false, visit_order: 5, notes: "Lanzamiento inicial potente, giros de alta velocidad.", updated_at: "2026-07-14T08:00:00Z" },
    // Universal Studios
    { id: "a28", park: "Universal Studios", name: "Harry Potter and the Escape from Gringotts", land: "Diagon Alley", date: "2026-07-20", is_completed: false, visit_order: 1, notes: "Híbrido montaña rusa y simulador dentro del banco de Gringotts. Increíble.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a29", park: "Universal Studios", name: "Revenge of the Mummy", land: "New York", date: "2026-07-20", is_completed: false, visit_order: 2, notes: "Montaña rusa bajo techo. Muy divertida y con excelente ambientación.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a30", park: "Universal Studios", name: "Men in Black: Alien Attack", land: "World Expo", date: "2026-07-20", is_completed: false, visit_order: 3, notes: "Juego de disparar a alienígenas. Quien pierda paga los donuts de Lard Lad.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a31", park: "Universal Studios", name: "The Simpsons Ride", land: "Springfield", date: "2026-07-20", is_completed: false, visit_order: 4, notes: "Simulador muy divertido con el humor clásico de la serie.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a32", park: "Universal Studios", name: "Despicable Me Minion Mayhem", land: "Minion Land", date: "2026-07-20", is_completed: false, visit_order: 5, notes: "Atracción muy tierna para reír un rato.", updated_at: "2026-07-14T08:00:00Z" }
];

const DEFAULT_FLIGHTS = [
    { id: "f1", flight_number: "AA908", airline: "American Airlines", departure_airport: "EZE", arrival_airport: "MIA", departure_time: "22:30", arrival_time: "06:45 +1", code: "RESERVA_AA_JMSF26_1", date: "2026-07-16", updated_at: "2026-07-14T08:00:00Z" },
    { id: "f2", flight_number: "AA2412", airline: "American Airlines", departure_airport: "MIA", arrival_airport: "MCO", departure_time: "08:30", arrival_time: "09:45", code: "RESERVA_AA_JMSF26_1", date: "2026-07-17", updated_at: "2026-07-14T08:00:00Z" },
    { id: "f3", flight_number: "AA907", airline: "American Airlines", departure_airport: "MCO", arrival_airport: "MIA", departure_time: "17:15", arrival_time: "18:30", code: "RESERVA_AA_JMSF26_2", date: "2026-07-31", updated_at: "2026-07-14T08:00:00Z" },
    { id: "f4", flight_number: "AA909", airline: "American Airlines", departure_airport: "MIA", arrival_airport: "EZE", departure_time: "20:15", arrival_time: "06:15 +1", code: "RESERVA_AA_JMSF26_2", date: "2026-07-31", updated_at: "2026-07-14T08:00:00Z" }
];

const DEFAULT_SENSIBLE = [
    { id: "s1", category: "Pasaporte", title: "Pasaporte de Juanma 🇦🇷", content: "Número: AA1234567\nFecha Exp: 12/10/2032\nNacionalidad: Argentina\nEmitido por: Renaper", updated_at: "2026-07-14T08:00:00Z" },
    { id: "s2", category: "Pasaporte", title: "Pasaporte de Sofi 🇦🇷", content: "Número: AB9876543\nFecha Exp: 24/05/2034\nNacionalidad: Argentina\nEmitido por: Renaper", updated_at: "2026-07-14T08:00:00Z" },
    { id: "s3", category: "Hotel", title: "Reserva Hotel Universal Cabana Bay Beach Resort 🏨", content: "Dirección: 6550 Adventure Way, Orlando, FL 32819\nCheck-in: 17/07/2026 (16:00)\nCheck-out: 31/07/2026 (11:00)\nCódigo de Confirmación: #UNIV-9827361\nHabitación: Standard 2 Queen Beds - Volcano View", updated_at: "2026-07-14T08:00:00Z" },
    { id: "s4", category: "Auto", title: "Alquiler de Auto - Hertz MCO 🚗", content: "Ubicación: Aeropuerto Internacional de Orlando (Terminal A/B Hertz Counter)\nCategoría: SUV Mediano (Toyota RAV4 o similar)\nCheck-in: 17/07/2026 (10:30 AM)\nCheck-out: 31/07/2026 (14:00 PM)\nReserva: #HZ-82736412\nSeguro Incluido: CDW, LIS y kilometraje ilimitado", updated_at: "2026-07-14T08:00:00Z" },
    { id: "s5", category: "Seguro", title: "Asistencia al Viajero - Assist Card Premium 🏥", content: "Compañía: Assist Card\nNúmero de Póliza: #AC-9928374-12\nTitulares: Juan Manuel López & Sofía ...\nTeléfono Emergencias (USA): +1 800 874 2222\nCobertura: Hasta USD 150,000 por persona por accidente o enfermedad.", updated_at: "2026-07-14T08:00:00Z" }
];

const DEFAULT_TIPS = [
    { id: "t1", category: "Disney", title: "Virtual Queue a las 7:00 AM 📱", content: "Para entrar a la fila virtual de TRON Lightcycle / Run o Cosmic Rewind, abre la app My Disney Experience a las 6:58 AM. Ve a \"Virtual Queues\", selecciona a tu grupo y dale click a \"Refresh\" exactamente a las 7:00:00 AM. Si no consigues, hay otra oportunidad a las 1:00 PM estando dentro del parque.", author: "Juanma", updated_at: "2026-07-14T08:00:00Z" },
    { id: "t2", category: "Universal", title: "Estrategia para Hagrid's Motorbike 🏍️", content: "Esta atracción es la más popular de Universal y no ofrece fila Express normal. La mejor estrategia es hacer \"Rope Drop\" (llegar 45 minutos antes de la apertura oficial del parque Islands of Adventure) e ir corriendo directamente hacia allí. La otra buena opción es hacer la fila al final del día, 15 minutos antes del cierre del parque.", author: "Sofi", updated_at: "2026-07-14T08:00:00Z" },
    { id: "t3", category: "Disney", title: "Ahorra batería con el modo Ahorro de Energía 🔋", content: "La app My Disney Experience consume muchísima batería por usar GPS continuamente para los mapas y Lightning Lanes. Pon tu iPhone en \"Modo de bajo consumo\" desde la mañana, lleva una batería portátil (Powerbank) potente en la mochila, y apaga el Wi-Fi si notas que la señal pública del parque está muy inestable.", author: "Juanma", updated_at: "2026-07-14T08:00:00Z" },
    { id: "t4", category: "General", title: "Evitar las horas de calor pico (12 PM - 3 PM) ☀️", content: "Julio en Orlando es extremadamente caluroso y húmedo, con lluvias rápidas por la tarde. Usa las horas del mediodía para comer en restaurantes con aire acondicionado, ver shows en teatros cerrados (como Indiana Jones en Hollywood Studios o PhilharMagic en Magic Kingdom) o volver al hotel a bañarse en la pileta y regresar al parque al atardecer.", author: "Sofi", updated_at: "2026-07-14T08:00:00Z" },
    { id: "t5", category: "Universal", title: "Vasos refill de Coca-Cola Freestyle 🥤", content: "Vale mucho la pena comprar el vaso recargable \"Coca-Cola Freestyle\" en Universal. Pagas un precio fijo por día y puedes recargar bebidas en decenas de máquinas automáticas cada 10 minutos. Ideal para mantenerse hidratado con el calor de julio.", author: "Juanma", updated_at: "2026-07-14T08:00:00Z" }
];

// --- PRESETS DE ATRACCIONES POR PARQUE ---
const PARK_PRESETS = {
    "Magic Kingdom": [
        { name: "TRON Lightcycle / Run", land: "Tomorrowland" },
        { name: "Space Mountain", land: "Tomorrowland" },
        { name: "Buzz Lightyear's Space Ranger Spin", land: "Tomorrowland" },
        { name: "Seven Dwarfs Mine Train", land: "Fantasyland" },
        { name: "Peter Pan's Flight", land: "Fantasyland" },
        { name: "It's a Small World", land: "Fantasyland" },
        { name: "Haunted Mansion", land: "Liberty Square" },
        { name: "Big Thunder Mountain Railroad", land: "Frontierland" },
        { name: "Tiana's Bayou Adventure", land: "Frontierland" },
        { name: "Pirates of the Caribbean", land: "Adventureland" },
        { name: "Jungle Cruise", land: "Adventureland" }
    ],
    "Epcot": [
        { name: "Guardians of the Galaxy: Cosmic Rewind", land: "World Discovery" },
        { name: "Test Track", land: "World Discovery" },
        { name: "Mission: SPACE", land: "World Discovery" },
        { name: "Soarin' Around the World", land: "World Nature" },
        { name: "Living with the Land", land: "World Nature" },
        { name: "Remy's Ratatouille Adventure", land: "World Showcase" },
        { name: "Frozen Ever After", land: "World Showcase" },
        { name: "Spaceship Earth", land: "World Celebration" }
    ],
    "Hollywood Studios": [
        { name: "Star Wars: Rise of the Resistance", land: "Galaxy's Edge" },
        { name: "Millennium Falcon: Smugglers Run", land: "Galaxy's Edge" },
        { name: "Slinky Dog Dash", land: "Toy Story Land" },
        { name: "Toy Story Mania!", land: "Toy Story Land" },
        { name: "Tower of Terror", land: "Sunset Boulevard" },
        { name: "Rock 'n' Roller Coaster Starring Aerosmith", land: "Sunset Boulevard" },
        { name: "Mickey & Minnie's Runaway Railway", land: "Hollywood Boulevard" }
    ],
    "Animal Kingdom": [
        { name: "Avatar Flight of Passage", land: "Pandora" },
        { name: "Na'vi River Journey", land: "Pandora" },
        { name: "Expedition Everest", land: "Asia" },
        { name: "Kali River Rapids", land: "Asia" },
        { name: "Kilimanjaro Safaris", land: "Africa" },
        { name: "DINOSAUR", land: "DinoLand U.S.A." }
    ],
    "Universal Studios": [
        { name: "Harry Potter and the Escape from Gringotts", land: "Diagon Alley" },
        { name: "Revenge of the Mummy", land: "New York" },
        { name: "Men in Black: Alien Attack", land: "World Expo" },
        { name: "The Simpsons Ride", land: "Springfield" },
        { name: "Despicable Me Minion Mayhem", land: "Minion Land" },
        { name: "Fast & Furious - Supercharged", land: "San Francisco" },
        { name: "E.T. Adventure", land: "Woody Woodpecker" },
        { name: "The Bourne Stuntacular", land: "Hollywood" }
    ],
    "Islands of Adventure": [
        { name: "Hagrid's Magical Creatures Motorbike Adventure", land: "Hogsmeade" },
        { name: "Harry Potter and the Forbidden Journey", land: "Hogsmeade" },
        { name: "Flight of the Hippogriff", land: "Hogsmeade" },
        { name: "VelociCoaster", land: "Jurassic Park" },
        { name: "Jurassic Park River Adventure", land: "Jurassic Park" },
        { name: "The Amazing Adventures of Spider-Man", land: "Marvel Super Hero Island" },
        { name: "The Incredible Hulk Coaster", land: "Marvel Super Hero Island" },
        { name: "Dudley Do-Right's Ripsaw Falls", land: "Toon Lagoon" },
        { name: "Popeye & Bluto's Bilge-Rat Barges", land: "Toon Lagoon" },
        { name: "The Cat in the Hat", land: "Seuss Landing" }
    ],
    "Volcano Bay": [
        { name: "Krakatau Aqua Coaster", land: "River Village" },
        { name: "Ko'okiri Body Plunge", land: "Rainforest Village" },
        { name: "Honu ika Moana", land: "River Village" },
        { name: "Waturi Beach", land: "Wave Pool" }
    ],
    "Typhoon Lagoon": [
        { name: "Miss Tilly (Iconic Ship)", land: "Mount Mayday" },
        { name: "Crush 'n' Gusher", land: "Hideaway Bay" },
        { name: "Castaway Creek (Lazy River)", land: "Lasy River" },
        { name: "Typhoon Lagoon Surf Pool", land: "Mount Mayday" },
        { name: "Gangplank Falls", land: "Mount Mayday" },
        { name: "Humunga Kowabunga", land: "Mount Mayday" }
    ],
    "Blizzard Beach": [
        { name: "Summit Plummet", land: "Green Slope" },
        { name: "Teamboat Springs", land: "Red Slope" },
        { name: "Runoff Rapids", land: "Red Slope" },
        { name: "Melt-Away Bay", land: "Green Slope" },
        { name: "Cross Country Creek (Lazy River)", land: "Lazy River" },
        { name: "Toboggan Racers", land: "Purple Slope" }
    ]
};

// --- MATRIZ DE DISTANCIAS Y TIEMPOS ENTRE AREAS (LANDS) POR PARQUE ---
const PARK_LANDS_DISTANCE = {
    "Magic Kingdom": {
        "Main Street, U.S.A.": { "Adventureland": 4, "Tomorrowland": 4, "Fantasyland": 5, "Liberty Square": 4, "Frontierland": 6 },
        "Tomorrowland": { "Fantasyland": 3, "Main Street, U.S.A.": 4, "Liberty Square": 6, "Adventureland": 10, "Frontierland": 12 },
        "Fantasyland": { "Tomorrowland": 3, "Liberty Square": 2, "Main Street, U.S.A.": 5, "Adventureland": 7, "Frontierland": 7 },
        "Liberty Square": { "Fantasyland": 2, "Frontierland": 2, "Main Street, U.S.A.": 4, "Adventureland": 3, "Tomorrowland": 6 },
        "Frontierland": { "Liberty Square": 2, "Adventureland": 3, "Main Street, U.S.A.": 6, "Fantasyland": 7, "Tomorrowland": 12 },
        "Adventureland": { "Frontierland": 3, "Liberty Square": 3, "Main Street, U.S.A.": 4, "Fantasyland": 7, "Tomorrowland": 10 }
    },
    "Epcot": {
        "World Discovery": { "World Celebration": 3, "World Nature": 6, "World Showcase": 10 },
        "World Celebration": { "World Discovery": 3, "World Nature": 3, "World Showcase": 5 },
        "World Nature": { "World Celebration": 3, "World Discovery": 6, "World Showcase": 8 },
        "World Showcase": { "World Celebration": 5, "World Discovery": 10, "World Nature": 8 }
    },
    "Hollywood Studios": {
        "Hollywood Boulevard": { "Sunset Boulevard": 3, "Echo Lake": 3, "Animation Courtyard": 4, "Toy Story Land": 6, "Galaxy's Edge": 8 },
        "Sunset Boulevard": { "Hollywood Boulevard": 3, "Echo Lake": 5, "Animation Courtyard": 4, "Toy Story Land": 7, "Galaxy's Edge": 10 },
        "Echo Lake": { "Hollywood Boulevard": 3, "Galaxy's Edge": 4, "Toy Story Land": 5, "Animation Courtyard": 5, "Sunset Boulevard": 5 },
        "Galaxy's Edge": { "Echo Lake": 4, "Toy Story Land": 3, "Hollywood Boulevard": 8, "Animation Courtyard": 8, "Sunset Boulevard": 10 },
        "Toy Story Land": { "Galaxy's Edge": 3, "Animation Courtyard": 3, "Echo Lake": 5, "Hollywood Boulevard": 6, "Sunset Boulevard": 7 },
        "Animation Courtyard": { "Toy Story Land": 3, "Hollywood Boulevard": 4, "Sunset Boulevard": 4, "Echo Lake": 5, "Galaxy's Edge": 8 }
    },
    "Islands of Adventure": {
        "Port of Entry": { "Marvel Super Hero Island": 3, "Seuss Landing": 3, "Toon Lagoon": 6, "Lost Continent": 6, "Jurassic Park": 8, "Hogsmeade": 9 },
        "Marvel Super Hero Island": { "Port of Entry": 3, "Toon Lagoon": 3, "Jurassic Park": 6, "Hogsmeade": 8, "Lost Continent": 8 },
        "Toon Lagoon": { "Marvel Super Hero Island": 3, "Jurassic Park": 3, "Hogsmeade": 5, "Port of Entry": 6 },
        "Jurassic Park": { "Toon Lagoon": 3, "Hogsmeade": 3, "Marvel Super Hero Island": 6, "Lost Continent": 6, "Port of Entry": 8 },
        "Hogsmeade": { "Jurassic Park": 3, "Lost Continent": 2, "Toon Lagoon": 5, "Marvel Super Hero Island": 8, "Port of Entry": 9 },
        "Lost Continent": { "Hogsmeade": 2, "Seuss Landing": 3, "Port of Entry": 6, "Jurassic Park": 6, "Marvel Super Hero Island": 8 },
        "Seuss Landing": { "Lost Continent": 3, "Port of Entry": 3, "Hogsmeade": 5, "Jurassic Park": 8, "Marvel Super Hero Island": 9 }
    },
    "Universal Studios": {
        "Production Central": { "New York": 2, "Hollywood": 3, "San Francisco": 5, "Diagon Alley": 6, "World Expo": 8, "Springfield": 9 },
        "Minion Land": { "New York": 2, "Hollywood": 3, "San Francisco": 5, "Diagon Alley": 6, "World Expo": 8, "Springfield": 9 },
        "New York": { "Production Central": 2, "Minion Land": 2, "San Francisco": 2, "Hollywood": 3, "Diagon Alley": 4, "World Expo": 6 },
        "San Francisco": { "New York": 2, "Diagon Alley": 2, "Production Central": 5, "Minion Land": 5, "World Expo": 4, "Springfield": 6 },
        "Diagon Alley": { "San Francisco": 2, "World Expo": 2, "New York": 4, "Production Central": 6, "Springfield": 4 },
        "World Expo": { "Diagon Alley": 2, "Springfield": 2, "San Francisco": 4, "New York": 6, "Production Central": 8 },
        "Springfield": { "World Expo": 2, "Diagon Alley": 4, "Hollywood": 3, "Production Central": 9, "San Francisco": 6 },
        "Hollywood": { "Production Central": 3, "New York": 3, "Springfield": 3, "San Francisco": 5, "Diagon Alley": 6 }
    },
    "Typhoon Lagoon": {
        "Mount Mayday": { "Hideaway Bay": 3, "Lasy River": 2 },
        "Hideaway Bay": { "Mount Mayday": 3, "Lasy River": 3 },
        "Lasy River": { "Mount Mayday": 2, "Hideaway Bay": 3 }
    },
    "Blizzard Beach": {
        "Green Slope": { "Red Slope": 2, "Purple Slope": 2, "Lazy River": 3 },
        "Red Slope": { "Green Slope": 2, "Purple Slope": 2, "Lazy River": 3 },
        "Purple Slope": { "Green Slope": 2, "Red Slope": 2, "Lazy River": 3 },
        "Lazy River": { "Green Slope": 3, "Red Slope": 3, "Purple Slope": 3 }
    }
};

// --- GESTIÓN DE ESTADO ---
let currentUser = null;
let currentPasscode = "";
let currentActiveTab = "calendario";
let selectedSensitiveCategory = "";
let activePark = "Magic Kingdom";

let db = {
    itinerary: [],
    attractions: [],
    flights: [],
    sensible: [],
    tips: [],
    dirty: {} // Registra elementos que necesitan sincronizarse con Supabase
};

// --- INICIALIZAR APLICACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
    initClock();
    initLocalDB();
    setupEventListeners();
    fetchOrlandoWeather();
    
    // Iniciar Supabase si las credenciales están configuradas
    if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        try {
            await initSupabaseConnection();
        } catch (e) {
            console.error("Error al iniciar Supabase:", e);
            updateSyncIndicator("red");
        }
    } else {
        updateSyncIndicator("green"); // Mostrar sincronizado localmente por defecto
    }

    // Auto-desbloquear si ya hay sesión activa
    const savedUser = localStorage.getItem("disney_2026_user");
    if (savedUser) {
        currentUser = savedUser;
        unlockApp();
    }
});

// --- CLOCK & DATE IN LOCK SCREEN ---
function initClock() {
    const timeEl = document.getElementById("lock-time");
    const dateEl = document.getElementById("lock-date");
    
    if (!timeEl || !dateEl) return;
    
    function updateClock() {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
        dateEl.textContent = now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    }
    
    updateClock();
    setInterval(updateClock, 30000);
}

// --- BASE DE DATOS LOCAL (localStorage fallback) ---
function initLocalDB() {
    const keys = ["itinerary", "attractions", "flights", "sensible", "tips"];
    keys.forEach(key => {
        const stored = localStorage.getItem(`disney2026_${key}`);
        if (stored) {
            db[key] = JSON.parse(stored);
        } else {
            // Cargar datos predeterminados
            let defaultVal = [];
            if (key === "itinerary") defaultVal = DEFAULT_ITINERARY;
            else if (key === "attractions") defaultVal = DEFAULT_ATTRACTIONS;
            else if (key === "flights") defaultVal = DEFAULT_FLIGHTS;
            else if (key === "sensible") defaultVal = DEFAULT_SENSIBLE;
            else if (key === "tips") defaultVal = DEFAULT_TIPS;
            
            db[key] = defaultVal;
            localStorage.setItem(`disney2026_${key}`, JSON.stringify(defaultVal));
        }
    });

    // Inyectar el día 16/7 si no existe en el itinerario cargado
    const hasJuly16 = db.itinerary.some(item => item.date === "2026-07-16");
    if (!hasJuly16) {
        db.itinerary.push({
            id: generateUUID(),
            date: "2026-07-16",
            title: "Día Previo / Viaje a Orlando",
            notes: JSON.stringify({
                general_notes: "Día de preparación y salida del vuelo.",
                activities: []
            }),
            is_park_day: false,
            park_name: "",
            updated_at: new Date().toISOString()
        });
        localStorage.setItem("disney2026_itinerary", JSON.stringify(db.itinerary));
        db.dirty.itinerary = true;
    }

    const storedDirty = localStorage.getItem("disney2026_dirty");
    if (storedDirty) {
        db.dirty = JSON.parse(storedDirty);
    }
}

function saveLocal(key) {
    localStorage.setItem(`disney2026_${key}`, JSON.stringify(db[key]));
    db.dirty[key] = true;
    localStorage.setItem("disney2026_dirty", JSON.stringify(db.dirty));
    
    // Disparar sincronización en segundo plano si está disponible
    triggerBackgroundSync();
}

// Generador UUID local si Supabase está offline
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- CONFIGURACIÓN DE EVENT LISTENERS ---
function setupEventListeners() {
    // 1. Botón de ingreso directo (Usuario único "Juanma y Sofi")
    const unlockBtn = document.getElementById("btn-unlock-direct");
    if (unlockBtn) {
        unlockBtn.addEventListener("click", () => {
            currentUser = "Juanma y Sofi";
            localStorage.setItem("disney_2026_user", currentUser);
            unlockApp();
        });
    }

    // Botón de cerrar sesión (siempre visible en el header)
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    // 2. Navegación por Pestañas
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tabName = btn.getAttribute("data-tab");
            switchTab(tabName);
        });
    });

    // Configurar el selector de emojis para las tareas/actividades
    const selectTaskEmojiBtn = document.getElementById("btn-select-task-emoji");
    if (selectTaskEmojiBtn) {
        selectTaskEmojiBtn.addEventListener("click", () => {
            const pickerModal = document.getElementById("modal-emoji-picker");
            if (pickerModal) pickerModal.showModal();
        });
    }

    // Seleccionar emoji del modal e insertarlo en el botón disparador de la tarea
    document.querySelectorAll(".picker-emoji-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const emoji = btn.getAttribute("data-emoji");
            const trigger = document.getElementById("btn-select-task-emoji");
            if (trigger) {
                trigger.textContent = emoji;
                trigger.setAttribute("data-emoji", emoji);
            }
            const pickerModal = document.getElementById("modal-emoji-picker");
            if (pickerModal) pickerModal.close();
        });
    });

    // Guardar para el editor de actividades/tareas
    const submitTaskBtn = document.getElementById("btn-submit-task");
    if (submitTaskBtn) {
        submitTaskBtn.addEventListener("click", handleTaskSubmit);
    }

    // 4. Modales - Control de envío
    document.getElementById("form-itinerary").addEventListener("submit", handleItinerarySubmit);
    document.getElementById("form-attraction").addEventListener("submit", handleAttractionSubmit);
    document.getElementById("form-tip").addEventListener("submit", handleTipSubmit);
    document.getElementById("form-flight").addEventListener("submit", handleFlightSubmit);
    document.getElementById("form-sensitive").addEventListener("submit", handleSensitiveSubmit);

    // 5. Selector de Parque y Filtros
    document.getElementById("park-select").addEventListener("change", (e) => {
        activePark = e.target.value;
        renderParkChecklist();
    });

    document.getElementById("park-date-select").addEventListener("change", handleParkDateChange);

    // Chips de filtrado de tips
    document.querySelectorAll(".filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            renderTipsList(chip.getAttribute("data-cat"));
        });
    });

    // Botón agregar tip
    document.getElementById("btn-add-tip-modal").addEventListener("click", () => {
        document.getElementById("form-tip").reset();
        document.getElementById("tip-id").value = "";
        document.getElementById("tip-modal-title").textContent = "Nuevo Tip";
        document.getElementById("modal-tip").showModal();
    });

    // Botón agregar vuelo
    document.getElementById("btn-add-flight-modal").addEventListener("click", () => {
        document.getElementById("form-flight").reset();
        document.getElementById("flight-id").value = "";
        document.getElementById("flight-modal-title").textContent = "Registrar Vuelo";
        document.getElementById("modal-flight").showModal();
    });

    // Categorías de Datos Sensibles
    document.querySelectorAll(".sensitive-cat-card").forEach(card => {
        card.addEventListener("click", () => {
            selectedSensitiveCategory = card.getAttribute("data-cat");
            openSensitiveCategoryPanel();
        });
    });

    // Cerrar panel sensible
    document.getElementById("btn-close-sensitive-panel").addEventListener("click", () => {
        document.getElementById("sensitive-detail-panel").classList.add("hidden");
    });

    // Agregar ítem de datos sensibles
    document.getElementById("btn-add-sensitive-item").addEventListener("click", () => {
        document.getElementById("form-sensitive").reset();
        document.getElementById("sensitive-id").value = "";
        document.getElementById("sensitive-category").value = selectedSensitiveCategory;
        document.getElementById("sensitive-modal-title").textContent = `Nuevo Registro: ${selectedSensitiveCategory}`;
        document.getElementById("modal-sensitive").showModal();
    });

    // Botón agregar atracción en el parque
    document.getElementById("btn-add-attraction-modal").addEventListener("click", openAddAttractionModal);
    
    // Cambios en preset de atracciones
    document.getElementById("attraction-preset").addEventListener("change", handleAttractionPresetChange);
}



function unlockApp() {
    document.getElementById("lock-screen").classList.add("hidden");
    document.getElementById("lock-screen").classList.remove("active");
    
    document.getElementById("app-container").classList.remove("hidden");
    document.getElementById("current-user-name").textContent = currentUser;
    
    switchTab("calendario");
    updateSensitiveCounters();
}

// --- CONTROL DE NAVEGACIÓN TAB BAR ---
function switchTab(tabName) {
    currentActiveTab = tabName;
    
    // Siempre volver al inicio de la página (ej: ocultar detalle de Locker Seguro)
    const sensitiveDetailPanel = document.getElementById("sensitive-detail-panel");
    if (sensitiveDetailPanel) {
        sensitiveDetailPanel.classList.add("hidden");
    }
    
    // Cambiar clase activa en Tab Buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-tab") === tabName) {
            btn.classList.add("active");
        }
    });
    
    // Mostrar sección correspondiente
    document.querySelectorAll(".app-view").forEach(view => {
        view.classList.remove("active");
    });
    
    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.add("active");
    
    // Actualizar título de cabecera
    const titleMap = {
        "calendario": "Calendario",
        "parques": "Plan de Parques",
        "tips": "Tips del Viaje",
        "vuelos": "Vuelos",
        "sensible": "Locker Seguro"
    };
    
    document.getElementById("view-title").textContent = titleMap[tabName] || "Orlando 2026";
    
    // Cambiar acciones disponibles en cabecera según pestaña
    const actionContainer = document.getElementById("header-action-container");
    actionContainer.innerHTML = "";
    
    // El botón de cerrar sesión ahora está siempre visible en el header (index.html)
    
    // Renderizar contenidos dinámicos
    if (tabName === "calendario") renderCalendarList();
    else if (tabName === "parques") renderParkChecklist();
    else if (tabName === "tips") renderTipsList("all");
    else if (tabName === "vuelos") renderFlightsList();
    else if (tabName === "sensible") updateSensitiveCounters();
}

function handleLogout() {
    localStorage.removeItem("disney_2026_user");
    currentUser = null;
    currentPasscode = "";
    
    document.getElementById("app-container").classList.add("hidden");
    
    document.getElementById("lock-screen").classList.remove("hidden");
    document.getElementById("lock-screen").classList.add("active");
}

// --- DETALLES DE CLIMA (WEATHER WIDGET) ---
async function fetchOrlandoWeather() {
    try {
        // Coordenadas de Orlando (Disney World Area: Lat 28.36, Lon -81.55)
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=28.36&longitude=-81.55&current=temperature_2m,weather_code");
        if (!response.ok) throw new Error("Error fetching weather");
        
        const data = await response.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        
        // Traducir código WMO a emoji e icono
        let icon = "☀️";
        if (code === 0) icon = "☀️"; // Despejado
        else if (code >= 1 && code <= 3) icon = "⛅"; // Parcialmente nublado
        else if (code >= 45 && code <= 48) icon = "🌫️"; // Niebla
        else if (code >= 51 && code <= 67) icon = "🌧️"; // Llovizna / Lluvia
        else if (code >= 71 && code <= 77) icon = "❄️"; // Nieve
        else if (code >= 80 && code <= 82) icon = "🌦️"; // Lluvia rápida
        else if (code >= 95 && code <= 99) icon = "⛈️"; // Tormenta
        
        document.getElementById("weather-widget").querySelector(".weather-icon").textContent = icon;
        document.getElementById("weather-widget").querySelector(".weather-temp").textContent = `${temp}°C`;
    } catch (e) {
        console.warn("No se pudo obtener el clima:", e);
        // Fallback sutil
        document.getElementById("weather-widget").querySelector(".weather-temp").textContent = "Orlando";
    }
}

let expandedDays = {}; // Almacena qué días están expandidos (id -> true/false)

// Helper para extraer notas de texto y actividades estructuradas
function getDayNotesAndActivities(notesField) {
    if (!notesField) {
        return { general_notes: "", activities: [] };
    }
    try {
        const trimmed = notesField.trim();
        if (trimmed.startsWith("{")) {
            const parsed = JSON.parse(trimmed);
            if (parsed && Array.isArray(parsed.activities)) {
                return {
                    general_notes: parsed.general_notes || "",
                    activities: parsed.activities
                };
            }
        }
    } catch (e) {
        // Fallback
    }
    
    // Soporte para notas de texto heredadas: convertir en notas generales y parsear viñetas si existen
    const lines = notesField.split("\n");
    const activities = [];
    const plainNotesLines = [];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            const taskText = trimmed.substring(1).trim();
            if (taskText) {
                const { emoji, title } = extractEmojiAndTitle(taskText);
                activities.push({
                    id: generateUUID(),
                    title: title,
                    emoji: emoji,
                    completed: false,
                    park_link: ""
                });
            }
        } else if (trimmed) {
            plainNotesLines.push(trimmed);
        }
    });
    
    return {
        general_notes: plainNotesLines.join("\n"),
        activities: activities
    };
}

// --- RENDERIZAR TAB 1: CALENDARIO ---
function renderCalendarList() {
    const listEl = document.getElementById("calendar-list");
    listEl.innerHTML = "";
    
    // Ordenar por fecha
    const sorted = [...db.itinerary].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach(day => {
        const d = new Date(day.date + "T00:00:00");
        const dayNum = d.getDate();
        const monthStr = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
        const weekdayStr = d.toLocaleDateString("es-AR", { weekday: "long" });
        
        const card = document.createElement("div");
        card.className = "calendar-card";
        const isExpanded = !!expandedDays[day.id];
        if (isExpanded) card.classList.add("expanded");
        
        const { general_notes, activities } = getDayNotesAndActivities(day.notes);
        
        // Cabecera del día (toda la fila de arriba)
        const header = document.createElement("div");
        header.className = "card-header";
        header.innerHTML = `
            <div class="card-date-badge">
                <span class="date-day">${dayNum}</span>
                <span class="date-month">${monthStr}</span>
            </div>
            <div class="card-info" style="flex: 1; margin-left: 12px;">
                <span style="font-size: 11px; text-transform: uppercase; color: var(--text-secondary); font-weight:600;">${weekdayStr}</span>
                <h3>${day.title || "Sin título"}</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-edit-day" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:6px; display:flex;" title="Editar Día">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <span class="arrow-icon" style="display: flex;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
            </div>
        `;
        
        // Clic en la cabecera abre/cierra la lista de actividades del día
        header.addEventListener("click", () => {
            expandedDays[day.id] = !expandedDays[day.id];
            renderCalendarList();
        });
        
        // Clic en el lápiz abre el editor de día
        const editBtn = header.querySelector(".btn-edit-day");
        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openItineraryEditModal(day.id);
        });
        
        card.appendChild(header);
        
        // Contenido expandido (notas generales y listado de actividades/tareas)
        if (isExpanded) {
            const expContent = document.createElement("div");
            expContent.className = "card-expanded-content";
            

            // Lista de tareas/actividades (Ordenadas cronológicamente por horario)
            const listContainer = document.createElement("div");
            listContainer.className = "activities-list-nested";
            
            const sortedActivities = [...activities].sort((a, b) => {
                const timeA = a.time || "99:99";
                const timeB = b.time || "99:99";
                return timeA.localeCompare(timeB);
            });
            
            sortedActivities.forEach(act => {
                const actCard = document.createElement("div");
                actCard.className = "nested-activity-card";
                if (act.completed) actCard.classList.add("completed");
                
                actCard.innerHTML = `
                    <div class="activity-left-side">
                        <input type="checkbox" class="activity-checkbox" ${act.completed ? "checked" : ""}>
                        ${act.time ? `<span class="activity-time-badge">${act.time}</span>` : ""}
                        <span class="activity-emoji">${act.emoji || "📅"}</span>
                        <div class="activity-text-container">
                            <span class="activity-text">${act.title}</span>
                            ${act.notes ? `<span class="activity-notes-subtext">${act.notes}</span>` : ""}
                        </div>
                    </div>
                    <div class="activity-right-side">
                        <button class="btn-edit-activity" title="Editar Actividad">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="btn-delete-activity" title="Eliminar Actividad">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;
                
                // Marcar/Desmarcar completada
                const chk = actCard.querySelector(".activity-checkbox");
                chk.addEventListener("change", () => {
                    act.completed = chk.checked;
                    saveDayNotesAndActivities(day.id, general_notes, activities);
                });
                
                // Editar actividad
                const editActBtn = actCard.querySelector(".btn-edit-activity");
                editActBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openTaskEditorModal(day.id, act.id);
                });
                
                // Eliminar actividad
                const deleteActBtn = actCard.querySelector(".btn-delete-activity");
                deleteActBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (confirm(`¿Seguro que querés eliminar la actividad "${act.title}"?`)) {
                        const newActivities = activities.filter(a => a.id !== act.id);
                        saveDayNotesAndActivities(day.id, general_notes, newActivities);
                    }
                });
                
                listContainer.appendChild(actCard);
            });
            
            expContent.appendChild(listContainer);
            
            // Botón de agregar actividad anidado
            const addActBtn = document.createElement("button");
            addActBtn.className = "btn-add-activity-nested";
            addActBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Nueva Actividad</span>
            `;
            addActBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openTaskEditorModal(day.id, null);
            });
            
            expContent.appendChild(addActBtn);
            card.appendChild(expContent);
        }
        
        listEl.appendChild(card);
    });
}

function openItineraryEditModal(id) {
    const day = db.itinerary.find(item => item.id === id);
    if (!day) return;
    
    document.getElementById("itinerary-id").value = day.id;
    document.getElementById("itinerary-title").value = day.title || "";
    
    const { general_notes } = getDayNotesAndActivities(day.notes);
    document.getElementById("itinerary-notes").value = general_notes || "";
    
    // Configurar los checkboxes de actividades
    const selectedActivities = day.park_name ? day.park_name.split(", ") : [];
    document.querySelectorAll("input[name='activity-item']").forEach(chk => {
        chk.checked = selectedActivities.includes(chk.value);
    });
    
    document.getElementById("itinerary-modal-title").textContent = `Editar: ${day.date.split("-").reverse().slice(0, 2).join("/")}`;
    document.getElementById("modal-itinerary").showModal();
}

function handleItinerarySubmit(e) {
    const id = document.getElementById("itinerary-id").value;
    const dayIndex = db.itinerary.findIndex(item => item.id === id);
    if (dayIndex === -1) return;
    
    // Guardar el título directo
    db.itinerary[dayIndex].title = document.getElementById("itinerary-title").value.trim();
    
    const generalNotes = document.getElementById("itinerary-notes").value;
    const { activities } = getDayNotesAndActivities(db.itinerary[dayIndex].notes);
    
    db.itinerary[dayIndex].notes = JSON.stringify({
        general_notes: generalNotes || "",
        activities: activities || []
    });
    
    // Recopilar actividades seleccionadas
    const checkedActivities = [];
    document.querySelectorAll("input[name='activity-item']:checked").forEach(chk => {
        checkedActivities.push(chk.value);
    });
    
    // ¿Es día de parque temático? (Cualquiera de los parques de Disney o Universal)
    const themeParks = [
        "Magic Kingdom", "Epcot", "Hollywood Studios", "Animal Kingdom", 
        "Typhoon Lagoon", "Blizzard Beach", 
        "Universal Studios", "Islands of Adventure", "Volcano Bay"
    ];
    const hasThemePark = checkedActivities.some(act => themeParks.includes(act));
    
    db.itinerary[dayIndex].is_park_day = hasThemePark;
    db.itinerary[dayIndex].park_name = checkedActivities.join(", ");
    db.itinerary[dayIndex].updated_at = new Date().toISOString();
    
    saveLocal("itinerary");
    renderCalendarList();
}

// Guarda las actividades y notas generales de un día en formato JSON
function saveDayNotesAndActivities(dayId, generalNotes, activities) {
    const dayIndex = db.itinerary.findIndex(item => item.id === dayId);
    if (dayIndex === -1) return;
    
    // Auto-actualizar vinculación de parques según las actividades
    updateThemeParksFromActivities(dayId, activities);
    
    db.itinerary[dayIndex].notes = JSON.stringify({
        general_notes: generalNotes || "",
        activities: activities || []
    });
    db.itinerary[dayIndex].updated_at = new Date().toISOString();
    
    saveLocal("itinerary");
    renderCalendarList();
}

// Sincroniza las actividades vinculadas a parques con las banderas principales de itinerario
function updateThemeParksFromActivities(dayId, activities) {
    const dayIndex = db.itinerary.findIndex(item => item.id === dayId);
    if (dayIndex === -1) return;
    
    const themeParks = [
        "Magic Kingdom", "Epcot", "Hollywood Studios", "Animal Kingdom", 
        "Typhoon Lagoon", "Blizzard Beach", 
        "Universal Studios", "Islands of Adventure", "Volcano Bay"
    ];
    
    // Obtener todos los parques/actividades vinculados
    const linkedParks = activities
        .map(a => a.park_link)
        .filter(Boolean);
        
    // Agregar también las actividades generales
    const uniqueLinks = [...new Set(linkedParks)];
    
    const hasThemePark = uniqueLinks.some(link => themeParks.includes(link));
    
    db.itinerary[dayIndex].is_park_day = hasThemePark;
    db.itinerary[dayIndex].park_name = uniqueLinks.join(", ");
}

// Abre el modal de edición de una tarea/actividad específica
function openTaskEditorModal(dayId, taskId) {
    document.getElementById("task-day-id").value = dayId;
    document.getElementById("task-id").value = taskId || "";
    
    const day = db.itinerary.find(d => d.id === dayId);
    const { activities } = getDayNotesAndActivities(day.notes);
    
    const emojiBtn = document.getElementById("btn-select-task-emoji");
    const titleInput = document.getElementById("task-title");
    const parkLinkSelect = document.getElementById("task-park-link");
    const hourSelect = document.getElementById("task-time-hour");
    const minuteSelect = document.getElementById("task-time-minute");
    const notesInput = document.getElementById("task-notes");
    
    if (taskId) {
        // Editar existente
        const act = activities.find(a => a.id === taskId);
        titleInput.value = act.title || "";
        emojiBtn.textContent = act.emoji || "📅";
        emojiBtn.setAttribute("data-emoji", act.emoji || "📅");
        parkLinkSelect.value = act.park_link || "";
        
        // Cargar horario en las ruedas
        const [hh, mm] = (act.time || "12:00").split(":");
        hourSelect.value = hh || "12";
        
        let minutesNum = parseInt(mm || "00", 10);
        let roundedMinutes = Math.round(minutesNum / 5) * 5;
        if (roundedMinutes >= 60) roundedMinutes = 55;
        let mmString = roundedMinutes.toString().padStart(2, '0');
        minuteSelect.value = mmString;
        
        notesInput.value = act.notes || "";
        document.getElementById("task-modal-title").textContent = "Editar Actividad";
    } else {
        // Nueva actividad
        titleInput.value = "";
        emojiBtn.textContent = "📅";
        emojiBtn.setAttribute("data-emoji", "📅");
        parkLinkSelect.value = "";
        hourSelect.value = "12";
        minuteSelect.value = "00";
        notesInput.value = "";
        document.getElementById("task-modal-title").textContent = "Agregar Actividad";
    }
    
    document.getElementById("modal-task-editor").showModal();
}

// Envía el formulario de tarea/actividad
function handleTaskSubmit() {
    const titleInput = document.getElementById("task-title");
    
    if (!titleInput.checkValidity()) {
        titleInput.reportValidity();
        return;
    }
    
    const dayId = document.getElementById("task-day-id").value;
    const taskId = document.getElementById("task-id").value;
    const title = titleInput.value.trim();
    const emojiBtn = document.getElementById("btn-select-task-emoji");
    const emoji = emojiBtn ? emojiBtn.getAttribute("data-emoji") || "📅" : "📅";
    const parkLink = document.getElementById("task-park-link").value;
    
    // Leer horario de las ruedas
    const hh = document.getElementById("task-time-hour").value;
    const mm = document.getElementById("task-time-minute").value;
    const time = `${hh}:${mm}`;
    
    const notes = document.getElementById("task-notes").value.trim();
    
    const day = db.itinerary.find(d => d.id === dayId);
    const { general_notes, activities } = getDayNotesAndActivities(day.notes);
    
    if (taskId) {
        // Actualizar existente
        const actIdx = activities.findIndex(a => a.id === taskId);
        if (actIdx !== -1) {
            activities[actIdx].title = title;
            activities[actIdx].emoji = emoji;
            activities[actIdx].park_link = parkLink;
            activities[actIdx].time = time;
            activities[actIdx].notes = notes;
        }
    } else {
        // Agregar nueva
        activities.push({
            id: generateUUID(),
            title: title,
            emoji: emoji,
            completed: false,
            park_link: parkLink,
            time: time,
            notes: notes
        });
    }
    
    saveDayNotesAndActivities(dayId, general_notes, activities);
    document.getElementById("modal-task-editor").close();
}

// --- RENDERIZAR TAB 2: CHECKLIST DE PARQUES & DISTANCIAS ---
function renderParkChecklist() {
    // 1. Encontrar qué día se asignó este parque
    const dayAssigned = db.itinerary.find(d => d.is_park_day && d.park_name.split(", ").includes(activePark));
    const dateSelect = document.getElementById("park-date-select");
    
    // Popular fechas disponibles
    dateSelect.innerHTML = `<option value="">No asignado</option>`;
    db.itinerary.forEach(d => {
        dateSelect.innerHTML += `<option value="${d.date}">${d.date.split("-").reverse().slice(0, 2).join("/")} - ${d.title}</option>`;
    });
    
    if (dayAssigned) {
        dateSelect.value = dayAssigned.date;
    } else {
        dateSelect.value = "";
    }
    
    // 2. Filtrar atracciones del parque actual
    const attractions = db.attractions.filter(a => a.park === activePark);
    // Ordenar por orden de visita
    attractions.sort((a, b) => a.visit_order - b.visit_order);
    
    const listEl = document.getElementById("attractions-list");
    listEl.innerHTML = "";
    
    if (attractions.length === 0) {
        listEl.innerHTML = `<div class="empty-state-text" style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">No has agregado atracciones para este parque. Haz clic en '+ Agregar' para armar tu recorrido.</div>`;
        return;
    }
    
    attractions.forEach((att, idx) => {
        // Crear elemento de atracción
        const card = document.createElement("div");
        card.className = `attraction-card ${att.is_completed ? 'completed' : ''}`;
        card.setAttribute("data-id", att.id);
        
        card.innerHTML = `
            <div class="attraction-checkbox">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="attraction-content">
                <div class="attraction-name-row">
                    <span class="attraction-title">${att.name}</span>
                    <div class="card-action-buttons">
                        <button class="btn-edit-card" data-action="edit" title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-delete-card" data-action="delete" title="Eliminar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
                <span class="attraction-land-badge">${att.land}</span>
                ${att.notes ? `<p class="attraction-desc">${att.notes}</p>` : ''}
            </div>
        `;
        
        // Listener completar checkbox
        card.querySelector(".attraction-checkbox").addEventListener("click", () => toggleAttractionComplete(att.id));
        
        // Listener editar atracción
        card.querySelector('[data-action="edit"]').addEventListener("click", (e) => {
            e.stopPropagation();
            openEditAttractionModal(att.id);
        });
        
        // Listener eliminar atracción
        card.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
            e.stopPropagation();
            deleteAttraction(att.id);
        });
        
        listEl.appendChild(card);
        
        // 3. Estimar distancias y caminar si hay una siguiente atracción
        if (idx < attractions.length - 1) {
            const nextAtt = attractions[idx + 1];
            const walkDivider = calculateWalkDivider(activePark, att.land, nextAtt.land);
            listEl.appendChild(walkDivider);
        }
    });
}

function handleParkDateChange(e) {
    const selectedDate = e.target.value;
    
    const themeParks = [
        "Magic Kingdom", "Epcot", "Hollywood Studios", "Animal Kingdom", 
        "Typhoon Lagoon", "Blizzard Beach", 
        "Universal Studios", "Islands of Adventure", "Volcano Bay"
    ];
    
    // Primero, remover este parque de cualquier otro día
    db.itinerary.forEach((d, idx) => {
        if (d.park_name) {
            const list = d.park_name.split(", ");
            if (list.includes(activePark)) {
                const newList = list.filter(p => p !== activePark);
                db.itinerary[idx].park_name = newList.join(", ");
                db.itinerary[idx].is_park_day = newList.some(act => themeParks.includes(act));
                db.itinerary[idx].updated_at = new Date().toISOString();
            }
        }
    });
    
    // Si asignó una fecha, colocar este parque a esa fecha
    if (selectedDate) {
        const dayIdx = db.itinerary.findIndex(d => d.date === selectedDate);
        if (dayIdx !== -1) {
            let list = db.itinerary[dayIdx].park_name ? db.itinerary[dayIdx].park_name.split(", ") : [];
            if (!list.includes(activePark)) {
                list.push(activePark);
            }
            db.itinerary[dayIdx].park_name = list.join(", ");
            db.itinerary[dayIdx].is_park_day = true;
            db.itinerary[dayIdx].updated_at = new Date().toISOString();
        }
    }
    
    saveLocal("itinerary");
}

function toggleAttractionComplete(id) {
    const attIdx = db.attractions.findIndex(a => a.id === id);
    if (attIdx !== -1) {
        db.attractions[attIdx].is_completed = !db.attractions[attIdx].is_completed;
        db.attractions[attIdx].updated_at = new Date().toISOString();
        saveLocal("attractions");
        renderParkChecklist();
    }
}

function deleteAttraction(id) {
    if (confirm("¿Estás seguro de eliminar esta atracción de tu itinerario?")) {
        db.attractions = db.attractions.filter(a => a.id !== id);
        saveLocal("attractions");
        renderParkChecklist();
    }
}

// Cálculo de distancias y renderizado de la división
function calculateWalkDivider(park, landA, landB) {
    const container = document.createElement("div");
    container.className = "timeline-walk-divider";
    
    let walkTime = 5; // Default fallback mins
    let warning = false;
    
    if (landA === landB) {
        walkTime = 2; // Mismo land
    } else if (PARK_LANDS_DISTANCE[park] && PARK_LANDS_DISTANCE[park][landA] && PARK_LANDS_DISTANCE[park][landA][landB]) {
        walkTime = PARK_LANDS_DISTANCE[park][landA][landB];
    }
    
    // Advertencia si la caminata es larga (>= 8 minutos representa cruzar el parque)
    if (walkTime >= 8) {
        warning = true;
    }
    
    const approxDist = walkTime * 80; // Suponiendo caminata promedio de 80 metros por minuto
    
    const badgeClass = warning ? "walk-badge warning" : "walk-badge";
    const badgeText = warning 
        ? `⚠️ Caminata Larga: ~${walkTime} min (${approxDist}m) - Cruce de parque`
        : `🚶‍♂️ ~${walkTime} min de traslado (${approxDist}m)`;
        
    container.innerHTML = `
        <div class="walk-line"></div>
        <div class="${badgeClass}">${badgeText}</div>
        <div class="walk-line"></div>
    `;
    
    return container;
}

// Agregar atracción
function openAddAttractionModal() {
    const presetSelect = document.getElementById("attraction-preset");
    presetSelect.innerHTML = `<option value="custom">-- Atracción Personalizada --</option>`;
    
    const presets = PARK_PRESETS[activePark] || [];
    presets.forEach(p => {
        presetSelect.innerHTML += `<option value="${p.name}" data-land="${p.land}">${p.name} (${p.land})</option>`;
    });
    
    document.getElementById("form-attraction").reset();
    document.getElementById("attraction-id").value = "";
    document.getElementById("modal-attraction").showModal();
}

function handleAttractionPresetChange(e) {
    const val = e.target.value;
    const nameInput = document.getElementById("attraction-name");
    const landInput = document.getElementById("attraction-land");
    
    if (val === "custom") {
        nameInput.value = "";
        landInput.value = "";
        nameInput.disabled = false;
        landInput.disabled = false;
    } else {
        const option = e.target.options[e.target.selectedIndex];
        const land = option.getAttribute("data-land");
        nameInput.value = val;
        landInput.value = land;
    }
}

function openEditAttractionModal(id) {
    const att = db.attractions.find(a => a.id === id);
    if (!att) return;
    
    openAddAttractionModal();
    
    document.getElementById("attraction-id").value = att.id;
    document.getElementById("attraction-name").value = att.name;
    document.getElementById("attraction-land").value = att.land;
    document.getElementById("attraction-notes").value = att.notes || "";
    
    document.getElementById("modal-attraction").querySelector("h2").textContent = "Editar Atracción";
}

function handleAttractionSubmit(e) {
    const id = document.getElementById("attraction-id").value;
    const name = document.getElementById("attraction-name").value;
    const land = document.getElementById("attraction-land").value;
    const notes = document.getElementById("attraction-notes").value;
    
    if (id) {
        const attIdx = db.attractions.findIndex(a => a.id === id);
        if (attIdx !== -1) {
            db.attractions[attIdx].name = name;
            db.attractions[attIdx].land = land;
            db.attractions[attIdx].notes = notes;
            db.attractions[attIdx].updated_at = new Date().toISOString();
        }
    } else {
        const park = activePark;
        const currentCount = db.attractions.filter(a => a.park === park).length;
        
        const newAtt = {
            id: generateUUID(),
            park,
            name,
            land,
            notes,
            is_completed: false,
            visit_order: currentCount + 1,
            date: null,
            updated_at: new Date().toISOString()
        };
        
        db.attractions.push(newAtt);
    }
    
    saveLocal("attractions");
    renderParkChecklist();
}

// --- RENDERIZAR TAB 3: TIPS ---
function renderTipsList(category = "all") {
    const listEl = document.getElementById("tips-list");
    listEl.innerHTML = "";
    
    const filtered = category === "all" 
        ? db.tips 
        : db.tips.filter(t => t.category === category);
        
    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state-text" style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">No hay tips registrados en esta categoría.</div>`;
        return;
    }
    
    // Mostrar tips del más reciente al más antiguo
    const sorted = [...filtered].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    sorted.forEach(tip => {
        const card = document.createElement("div");
        card.className = "tip-card";
        
        const isDisney = tip.category === "Disney";
        const isUniversal = tip.category === "Universal";
        const catBadgeClass = isDisney ? "tip-badge disney" : (isUniversal ? "tip-badge universal" : "tip-badge general");
        const authorClass = tip.author.toLowerCase() === "juanma" ? "tip-author-badge juanma" : "tip-author-badge sofi";
        
        card.innerHTML = `
            <div class="tip-card-header">
                <span class="${catBadgeClass}">${tip.category}</span>
                <span class="${authorClass}">${tip.author}</span>
            </div>
            <h3>${tip.title}</h3>
            <p>${tip.content}</p>
            <div class="tip-footer">
                <div class="card-action-buttons">
                    <button class="btn-edit-card" data-action="edit" title="Editar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete-card" data-action="delete" title="Eliminar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
        `;
        
        card.querySelector('[data-action="edit"]').addEventListener("click", () => openEditTipModal(tip.id));
        card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteTip(tip.id));
        listEl.appendChild(card);
    });
}

function openEditTipModal(id) {
    const tip = db.tips.find(t => t.id === id);
    if (!tip) return;
    
    document.getElementById("form-tip").reset();
    document.getElementById("tip-id").value = tip.id;
    document.getElementById("tip-category").value = tip.category;
    document.getElementById("tip-title").value = tip.title;
    document.getElementById("tip-content").value = tip.content;
    
    document.getElementById("tip-modal-title").textContent = "Editar Tip";
    document.getElementById("modal-tip").showModal();
}

function handleTipSubmit(e) {
    const id = document.getElementById("tip-id").value;
    const title = document.getElementById("tip-title").value;
    const content = document.getElementById("tip-content").value;
    const category = document.getElementById("tip-category").value;
    
    if (id) {
        const tipIdx = db.tips.findIndex(t => t.id === id);
        if (tipIdx !== -1) {
            db.tips[tipIdx].title = title;
            db.tips[tipIdx].content = content;
            db.tips[tipIdx].category = category;
            db.tips[tipIdx].updated_at = new Date().toISOString();
        }
    } else {
        const newTip = {
            id: generateUUID(),
            category,
            title,
            content,
            author: currentUser,
            updated_at: new Date().toISOString()
        };
        
        db.tips.push(newTip);
    }
    
    saveLocal("tips");
    
    document.querySelectorAll(".filter-chip").forEach(c => {
        c.classList.remove("active");
        if (c.getAttribute("data-cat") === category) c.classList.add("active");
    });
    
    renderTipsList(category);
}

function deleteTip(id) {
    if (confirm("¿Quieres eliminar este tip?")) {
        db.tips = db.tips.filter(t => t.id !== id);
        saveLocal("tips");
        
        // Averiguar categoría activa
        const activeChip = document.querySelector(".filter-chip.active");
        const activeCat = activeChip ? activeChip.getAttribute("data-cat") : "all";
        renderTipsList(activeCat);
    }
}

// --- RENDERIZAR TAB 4: VUELOS ---
function renderFlightsList() {
    const listEl = document.getElementById("flights-list");
    listEl.innerHTML = "";
    
    if (db.flights.length === 0) {
        listEl.innerHTML = `<div class="empty-state-text" style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">No hay vuelos cargados. Registra tus vuelos con el botón superior.</div>`;
        return;
    }
    
    // Ordenar por fecha
    const sorted = [...db.flights].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach(flight => {
        const card = document.createElement("div");
        card.className = "flight-card";
        
        const fDate = new Date(flight.date + "T00:00:00");
        const dateStr = fDate.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "long" });
        
        card.innerHTML = `
            <div class="flight-card-header">
                <span class="flight-airline">${flight.airline}</span>
                <span class="flight-number-badge">${flight.flight_number}</span>
            </div>
            <div class="flight-route-row">
                <div class="airport-info">
                    <span class="airport-code">${flight.departure_airport}</span>
                    <span class="flight-time">${flight.departure_time}hs</span>
                </div>
                <div class="flight-duration-line">
                    <span class="duration-airplane">✈️</span>
                    <div class="duration-line"></div>
                </div>
                <div class="airport-info" style="text-align: right;">
                    <span class="airport-code">${flight.arrival_airport}</span>
                    <span class="flight-time">${flight.arrival_time}hs</span>
                </div>
            </div>
            <div class="flight-meta-row">
                <span class="flight-date-txt">📅 ${dateStr}</span>
                <button class="flight-code-btn" data-code="${flight.code}">
                    <span>Reserva: <strong>${flight.code}</strong></span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
            <div class="flight-card-footer">
                <div class="card-action-buttons">
                    <button class="btn-edit-card" data-action="edit" title="Editar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete-card" data-action="delete" title="Eliminar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
        `;
        
        // Copiar reserva al portapapeles
        card.querySelector(".flight-code-btn").addEventListener("click", () => {
            navigator.clipboard.writeText(flight.code);
            alert("Código de reserva copiado al portapapeles! ✈️");
        });
        
        card.querySelector('[data-action="edit"]').addEventListener("click", () => openEditFlightModal(flight.id));
        card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteFlight(flight.id));
        listEl.appendChild(card);
    });
}

function openEditFlightModal(id) {
    const flight = db.flights.find(f => f.id === id);
    if (!flight) return;
    
    document.getElementById("form-flight").reset();
    document.getElementById("flight-id").value = flight.id;
    document.getElementById("flight-number").value = flight.flight_number;
    document.getElementById("flight-airline").value = flight.airline;
    document.getElementById("flight-dep-apt").value = flight.departure_airport;
    document.getElementById("flight-arr-apt").value = flight.arrival_airport;
    document.getElementById("flight-dep-time").value = flight.departure_time;
    document.getElementById("flight-arr-time").value = flight.arrival_time;
    document.getElementById("flight-date").value = flight.date;
    document.getElementById("flight-code").value = flight.code;
    
    document.getElementById("flight-modal-title").textContent = "Editar Vuelo";
    document.getElementById("modal-flight").showModal();
}

function handleFlightSubmit(e) {
    const id = document.getElementById("flight-id").value;
    const flight_number = document.getElementById("flight-number").value.toUpperCase();
    const airline = document.getElementById("flight-airline").value;
    const departure_airport = document.getElementById("flight-dep-apt").value.toUpperCase();
    const arrival_airport = document.getElementById("flight-arr-apt").value.toUpperCase();
    const departure_time = document.getElementById("flight-dep-time").value;
    const arrival_time = document.getElementById("flight-arr-time").value;
    const date = document.getElementById("flight-date").value;
    const code = document.getElementById("flight-code").value.toUpperCase();
    
    if (id) {
        const flightIdx = db.flights.findIndex(f => f.id === id);
        if (flightIdx !== -1) {
            db.flights[flightIdx].flight_number = flight_number;
            db.flights[flightIdx].airline = airline;
            db.flights[flightIdx].departure_airport = departure_airport;
            db.flights[flightIdx].arrival_airport = arrival_airport;
            db.flights[flightIdx].departure_time = departure_time;
            db.flights[flightIdx].arrival_time = arrival_time;
            db.flights[flightIdx].date = date;
            db.flights[flightIdx].code = code;
            db.flights[flightIdx].updated_at = new Date().toISOString();
        }
    } else {
        const newFlight = {
            id: generateUUID(),
            flight_number,
            airline,
            departure_airport,
            arrival_airport,
            departure_time,
            arrival_time,
            date,
            code,
            updated_at: new Date().toISOString()
        };
        
        db.flights.push(newFlight);
    }
    
    saveLocal("flights");
    renderFlightsList();
}

function deleteFlight(id) {
    if (confirm("¿Deseas eliminar este vuelo?")) {
        db.flights = db.flights.filter(f => f.id !== id);
        saveLocal("flights");
        renderFlightsList();
    }
}

// --- RENDERIZAR TAB 5: LOCKER SEGURO (DATOS SENSIBLES) ---
function updateSensitiveCounters() {
    const categories = ["Pasaporte", "Hotel", "Auto", "Seguro", "Otro"];
    categories.forEach(cat => {
        const count = db.sensible.filter(s => s.category === cat).length;
        const sub = cat === "Pasaporte" ? "documentos" : (cat === "Hotel" || cat === "Auto" ? "reservas" : (cat === "Seguro" ? "pólizas" : "registros"));
        document.getElementById(`cnt-${cat.toLowerCase()}`).textContent = `${count} ${sub}`;
    });
}

function openSensitiveCategoryPanel() {
    document.getElementById("sensitive-panel-title").textContent = selectedSensitiveCategory;
    renderSensitiveItems();
    document.getElementById("sensitive-detail-panel").classList.remove("hidden");
}

function renderSensitiveItems() {
    const listEl = document.getElementById("sensitive-items-list");
    listEl.innerHTML = "";
    
    const filtered = db.sensible.filter(s => s.category === selectedSensitiveCategory);
    
    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state-text" style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">No hay registros cargados. Haz clic en '+ Agregar' para guardar información.</div>`;
        return;
    }
    
    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "sensitive-item-card";
        
        card.innerHTML = `
            <div class="sensitive-item-card-header">
                <h4>${item.title}</h4>
                <div class="card-action-buttons">
                    <button class="btn-edit-card" data-action="edit" title="Editar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete-card" data-action="delete" title="Eliminar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            <pre>${item.content}</pre>
        `;
        
        card.querySelector('[data-action="edit"]').addEventListener("click", () => openEditSensitiveModal(item.id));
        card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteSensitiveItem(item.id));
        listEl.appendChild(card);
    });
}

function openEditSensitiveModal(id) {
    const item = db.sensible.find(s => s.id === id);
    if (!item) return;
    
    document.getElementById("form-sensitive").reset();
    document.getElementById("sensitive-id").value = item.id;
    document.getElementById("sensitive-category").value = item.category;
    document.getElementById("sensitive-title").value = item.title;
    document.getElementById("sensitive-content").value = item.content;
    
    document.getElementById("sensitive-modal-title").textContent = `Editar Registro: ${item.category}`;
    document.getElementById("modal-sensitive").showModal();
}

function handleSensitiveSubmit(e) {
    const id = document.getElementById("sensitive-id").value;
    const title = document.getElementById("sensitive-title").value;
    const content = document.getElementById("sensitive-content").value;
    const category = document.getElementById("sensitive-category").value;
    
    if (id) {
        const itemIdx = db.sensible.findIndex(s => s.id === id);
        if (itemIdx !== -1) {
            db.sensible[itemIdx].title = title;
            db.sensible[itemIdx].content = content;
            db.sensible[itemIdx].category = category;
            db.sensible[itemIdx].updated_at = new Date().toISOString();
        }
    } else {
        const newItem = {
            id: generateUUID(),
            category,
            title,
            content,
            updated_at: new Date().toISOString()
        };
        
        db.sensible.push(newItem);
    }
    
    saveLocal("sensible");
    renderSensitiveItems();
    updateSensitiveCounters();
}

function deleteSensitiveItem(id) {
    if (confirm("¿Estás seguro de eliminar esta información confidencial?")) {
        db.sensible = db.sensible.filter(s => s.id !== id);
        saveLocal("sensible");
        
        renderSensitiveItems();
        updateSensitiveCounters();
    }
}

// --- CONFIGURACIÓN E INTEGRACIÓN SUPABASE ---
async function initSupabaseConnection() {
    updateSyncIndicator("orange");
    
    // Cargar librería Supabase de forma dinámica
    if (typeof window.supabase === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Inicializar cliente Supabase
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    
    // Probar conexión y realizar sincronización inicial
    try {
        await runSupabaseSync();
        startAutoSync(); // Iniciar sincronización periódica cada 30 segundos
    } catch (e) {
        console.warn("Fallo al conectar/sincronizar con Supabase (ejecutando offline):", e);
        updateSyncIndicator("red");
    }
}

function updateSyncIndicator(color) {
    const dot = document.getElementById("sync-indicator").querySelector(".sync-dot");
    dot.className = `sync-dot ${color}`;
    
    const titleMap = {
        "green": "Sincronizado con Supabase (Local-First)",
        "orange": "Sincronizando...",
        "red": "Modo offline (Sin conexión / Error Supabase)"
    };
    document.getElementById("sync-indicator").title = titleMap[color] || "";
}

// Motor de sincronización
async function runSupabaseSync() {
    if (!supabaseClient) return;
    
    updateSyncIndicator("orange");
    
    const tablesMap = {
        itinerary: "itinerary_items",
        attractions: "attraction_checklist",
        flights: "flight_itinerary",
        sensible: "sensitive_details",
        tips: "travel_tips"
    };
    
    // Función para validar si un ID es UUID válido
    const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    try {
        for (const [localKey, supabaseTable] of Object.entries(tablesMap)) {
            // 1. Si hay cambios locales "sucios" (dirty), subir solo los que tengan UUID válido
            if (db.dirty[localKey]) {
                const localData = db[localKey];
                
                for (const row of localData) {
                    // Solo hacer upsert si el ID es un UUID válido (no "i1", "a1", etc.)
                    if (isValidUUID(row.id)) {
                        try {
                            const { error } = await supabaseClient
                                .from(supabaseTable)
                                .upsert(row);
                            if (error) console.warn(`Upsert error en ${supabaseTable}:`, error.message);
                        } catch (e) {
                            console.warn(`Error al subir fila a ${supabaseTable}:`, e);
                        }
                    }
                }
                
                // Apagar bandera dirty
                db.dirty[localKey] = false;
            }
            
            // 2. Traer los datos más nuevos de Supabase
            const { data: cloudData, error } = await supabaseClient
                .from(supabaseTable)
                .select("*");
                
            if (error) throw error;
            
            if (cloudData && cloudData.length > 0) {
                // Filtrar datos locales: quedarse solo con los que tienen UUID válido
                const validLocalData = db[localKey].filter(item => isValidUUID(item.id));
                const merged = [...validLocalData];
                
                cloudData.forEach(cloudRow => {
                    const localIdx = merged.findIndex(l => l.id === cloudRow.id);
                    if (localIdx === -1) {
                        // Elemento no existe localmente, agregar
                        merged.push(cloudRow);
                    } else {
                        // Comparar marcas de tiempo
                        const localTime = new Date(merged[localIdx].updated_at || 0).getTime();
                        const cloudTime = new Date(cloudRow.updated_at || 0).getTime();
                        
                        if (cloudTime > localTime) {
                            // Reemplazar local por nube si la nube es más nueva
                            merged[localIdx] = cloudRow;
                        }
                    }
                });
                
                db[localKey] = merged;
                localStorage.setItem(`disney2026_${localKey}`, JSON.stringify(merged));
            }
        }
        
        // Guardar estado dirty finalizado
        localStorage.setItem("disney2026_dirty", JSON.stringify(db.dirty));
        updateSyncIndicator("green");
        
        // Re-renderizar pestaña activa para reflejar cambios de nube
        switchTab(currentActiveTab);
        
    } catch (e) {
        console.error("Fallo durante sincronización de Supabase:", e);
        updateSyncIndicator("red");
        throw e;
    }
}

// Disparador de sincronización sutil con throttle
let syncTimeout = null;
function triggerBackgroundSync() {
    if (!navigator.onLine || !supabaseClient) {
        updateSyncIndicator("red");
        return;
    }
    
    if (syncTimeout) clearTimeout(syncTimeout);
    
    syncTimeout = setTimeout(async () => {
        try {
            await runSupabaseSync();
        } catch (e) {
            console.warn("Re-intentando sincronización en segundo plano después...");
        }
    }, 2000); // Esperar 2 segundos después del último cambio para no saturar la red
}

// Escuchar cambios de red del navegador
window.addEventListener("online", () => {
    if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        if (!supabaseClient) {
            initSupabaseConnection();
        } else {
            triggerBackgroundSync();
        }
    } else {
        updateSyncIndicator("green");
    }
});

window.addEventListener("offline", () => {
    updateSyncIndicator("red");
});

// Sincronización automática periódica (cada 30 segundos)
let autoSyncInterval = null;
function startAutoSync() {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(async () => {
        if (navigator.onLine && supabaseClient) {
            try {
                await runSupabaseSync();
            } catch (e) {
                console.warn("Auto-sync periódico falló:", e);
            }
        }
    }, 30000); // Cada 30 segundos
}

// Sincronizar también cuando la app vuelve a estar visible (tab/app switch)
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine && supabaseClient) {
        triggerBackgroundSync();
    }
});
