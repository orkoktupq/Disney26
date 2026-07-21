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
    { id: "i1", date: "2026-07-17", title: "Parque de Agua - Disney Typhoon Lagoon", notes: "Día de parque acuático en Disney Typhoon Lagoon. Disfrutar de la pileta de olas gigantes, toboganes y el río lento.", is_park_day: true, park_name: "Typhoon Lagoon", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i2", date: "2026-07-18", title: "Epcot", notes: "Visita a Epcot. Cosmic Rewind es prioridad (Virtual Queue a las 7:00 AM o Lightning Lane Single Pass). Pasear por los pabellones de World Showcase en la tarde.", is_park_day: true, park_name: "Epcot", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i3", date: "2026-07-19", title: "Día de Descanso", notes: "Día libre de descanso, piscina en el hotel o paseos cortos.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i4", date: "2026-07-20", title: "Disney's Animal Kingdom", notes: "{\"general_notes\":\"Atracciones: Avatar Flight of Passage, Na'vi River Journey, Kilimanjaro Safaris, Gorilla Falls Exploration Trail, Kali River Rapids, Expedition Everest, Zootopia.\",\"activities\":[{\"id\":\"act-bus-ak\",\"time\":\"07:30\",\"title\":\"Ir en bus del hotel al parque 🚌\",\"is_completed\":false}]}", is_park_day: true, park_name: "Animal Kingdom", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i5", date: "2026-07-21", title: "Disney's Hollywood Studios", notes: "{\"general_notes\":\"Atracciones: Star Wars: Rise of the Resistance, Millennium Falcon, Star Tours - The Adventure Continues, Indiana Jones, Alien Swirling Saucers, Slinky Dog Dash, Toy Story Mania, Meet Edna Mode, The Twilight Zone, Rock 'n' Roller Coaster.\",\"activities\":[{\"id\":\"act-sky-hs\",\"time\":\"08:00\",\"title\":\"Ir en Skyliner al parque 🚡\",\"is_completed\":false}]}", is_park_day: true, park_name: "Hollywood Studios", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i6", date: "2026-07-22", title: "Magic Kingdom", notes: "Llegar temprano para el Rope Drop. Reservar TRON y Tiana en Virtual Queue/Lightning Lane a las 7:00 AM.", is_park_day: true, park_name: "Magic Kingdom", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i7", date: "2026-07-23", title: "Día de Descanso", notes: "Día para reponer energías tras los parques intensos de Disney.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i8", date: "2026-07-24", title: "Universal Studios Florida", notes: "Visita a Universal Studios. Diagon Alley (Gringotts), Revenge of the Mummy y Men in Black. Almorzar en el Caldero Chorreante.", is_park_day: true, park_name: "Universal Studios", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i9", date: "2026-07-25", title: "Universal's Islands of Adventure", notes: "Atracciones principales: VelociCoaster, Hagrid's Motorbike Adventure y Spider-Man. Tomar el Hogwarts Express hacia Universal Studios.", is_park_day: true, park_name: "Islands of Adventure", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i10", date: "2026-07-26", title: "Día de Compras (Shopping)", notes: "Mañana libre de piscina. Tarde de compras en outlets y cena en Disney Springs.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i11", date: "2026-07-27", title: "Día de Compras (Shopping)", notes: "Día dedicado a centros comerciales, Walmart, Target y paseos de compras adicionales.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i12", date: "2026-07-28", title: "Universal Epic Universe", notes: "Visita al nuevo parque temático Epic Universe. Explorar Celestial Park y las nuevas tierras mágicas.", is_park_day: true, park_name: "Epic Universe", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i13", date: "2026-07-29", title: "Universal Epic Universe (Día 2)", notes: "Segundo día en Epic Universe para repetir atracciones favoritas y completar la exploración de las áreas temáticas.", is_park_day: true, park_name: "Epic Universe", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i14", date: "2026-07-30", title: "Universal Studios e Islands of Adventure", notes: "Día combinado para repetir las mejores montañas rusas y atracciones favoritas de ambos parques de Universal.", is_park_day: true, park_name: "Universal Studios, Islands of Adventure", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i15", date: "2026-07-31", title: "Regreso a Casa", notes: "Check-out del hotel, devolución del auto de alquiler en Hertz (MCO) y vuelo de regreso.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "i16", date: "2026-08-01", title: "Llegada a Casa", notes: "Llegada al aeropuerto internacional e ingreso al país. Fin de este increíble viaje familiar.", is_park_day: false, park_name: "", updated_at: "2026-07-14T08:00:00Z" }
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
    { id: "a19_1", park: "Hollywood Studios", name: "Star Tours - The Adventure Continues", land: "Echo Lake", date: "2026-07-21", is_completed: false, visit_order: 3, notes: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a19_2", park: "Hollywood Studios", name: "Indiana Jones Epic Stunt Spectacular", land: "Echo Lake", date: "2026-07-21", is_completed: false, visit_order: 4, notes: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a19_3", park: "Hollywood Studios", name: "Alien Swirling Saucers", land: "Toy Story Land", date: "2026-07-21", is_completed: false, visit_order: 5, notes: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a19", park: "Hollywood Studios", name: "Slinky Dog Dash", land: "Toy Story Land", date: "2026-07-21", is_completed: false, visit_order: 6, notes: "Montaña rusa familiar pero muy divertida. Fila siempre de más de 60 min.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a20", park: "Hollywood Studios", name: "Toy Story Mania!", land: "Toy Story Land", date: "2026-07-21", is_completed: false, visit_order: 7, notes: "Juego de puntería 3D adictivo.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a20_1", park: "Hollywood Studios", name: "Meet Edna Mode", land: "Pixar Place", date: "2026-07-21", is_completed: false, visit_order: 8, notes: "", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a21", park: "Hollywood Studios", name: "The Twilight Zone Tower of Terror", land: "Sunset Boulevard", date: "2026-07-21", is_completed: false, visit_order: 9, notes: "Caídas libres aleatorias. Estética de hotel abandonado espectacular.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a22", park: "Hollywood Studios", name: "Rock 'n' Roller Coaster Starring Aerosmith", land: "Sunset Boulevard", date: "2026-07-21", is_completed: false, visit_order: 10, notes: "Salida a toda velocidad a oscuras con música de Aerosmith.", updated_at: "2026-07-14T08:00:00Z" },
    // Islands of Adventure
    { id: "a23", park: "Islands of Adventure", name: "VelociCoaster", land: "Jurassic Park", date: "2026-07-23", is_completed: false, visit_order: 1, notes: "Impresionante montaña rusa de lanzamiento. Fila obligatoria pero avanza rápido.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a24", park: "Islands of Adventure", name: "Hagrid's Magical Creatures Motorbike Adventure", land: "Hogsmeade", date: "2026-07-23", is_completed: false, visit_order: 2, notes: "Prioridad N°1 en Islands. No acepta Express Pass normal. Rope Drop indispensable.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a25", park: "Islands of Adventure", name: "Harry Potter and the Forbidden Journey", land: "Hogsmeade", date: "2026-07-23", is_completed: false, visit_order: 3, notes: "Dentro del castillo de Hogwarts. Da un poco de mareo, tomar recaudo.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a26", park: "Islands of Adventure", name: "The Amazing Adventures of Spider-Man", land: "Marvel Super Hero Island", date: "2026-07-23", is_completed: false, visit_order: 4, notes: "Simulador de juego clásico en 3D espectacular.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a27", park: "Islands of Adventure", name: "The Incredible Hulk Coaster", land: "Marvel Super Hero Island", date: "2026-07-23", is_completed: false, visit_order: 5, notes: "Lanzamiento inicial potente, giros de alta velocidad.", updated_at: "2026-07-14T08:00:00Z" },
    // Universal Studios
    { id: "a28", park: "Universal Studios", name: "Harry Potter and the Escape from Gringotts", land: "Diagon Alley", date: "2026-07-24", is_completed: false, visit_order: 1, notes: "Híbrido montaña rusa y simulador dentro del banco de Gringotts. Increíble.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a29", park: "Universal Studios", name: "Revenge of the Mummy", land: "New York", date: "2026-07-24", is_completed: false, visit_order: 2, notes: "Montaña rusa bajo techo. Muy divertida y con excelente ambientación.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a30", park: "Universal Studios", name: "Men in Black: Alien Attack", land: "World Expo", date: "2026-07-24", is_completed: false, visit_order: 3, notes: "Juego de disparar a alienígenas. Quien pierda paga los donuts de Lard Lad.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a31", park: "Universal Studios", name: "The Simpsons Ride", land: "Springfield", date: "2026-07-24", is_completed: false, visit_order: 4, notes: "Simulador muy divertido con el humor clásico de la serie.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "a32", park: "Universal Studios", name: "Despicable Me Minion Mayhem", land: "Minion Land", date: "2026-07-24", is_completed: false, visit_order: 5, notes: "Atracción muy tierna para reír un rato.", updated_at: "2026-07-14T08:00:00Z" }
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

const DEFAULT_EXPENSE_CATEGORIES = [
    { id: "ec1", name: "Comidas", emoji: "🍔", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "ec2", name: "Juegos", emoji: "🎮", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "ec3", name: "Regalos", emoji: "🎁", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "ec4", name: "Super", emoji: "🛒", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "ec5", name: "Tecnologia", emoji: "💻", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "ec6", name: "Vestimenta", emoji: "👕", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "ec7", name: "Misceláneas", emoji: "📦", is_default: true, updated_at: "2026-07-14T08:00:00Z" }
];

const DEFAULT_PAYMENT_METHODS = [
    { id: "pm1", name: "Efectivo", emoji: "💵", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "pm2", name: "Tarjeta Sofi Santander", emoji: "💳", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "pm3", name: "Tarjeta Juanma BBVA", emoji: "💳", is_default: true, updated_at: "2026-07-14T08:00:00Z" },
    { id: "pm4", name: "Habitación", emoji: "🏨", is_default: true, updated_at: "2026-07-14T08:00:00Z" }
];

const DEFAULT_EXPENSES = [
    { id: "e1", title: "Almuerzo en Las Tres Escobas", amount: 48.50, category: "Comidas", payment_method: "Tarjeta Sofi Santander", date: "2026-07-20", notes: "Comida en Harry Potter Universal", updated_at: "2026-07-14T08:00:00Z" },
    { id: "e2", title: "Varita mágica interactiva", amount: 63.00, category: "Juegos", payment_method: "Tarjeta Juanma BBVA", date: "2026-07-20", notes: "Varita para Sofi en Diagon Alley", updated_at: "2026-07-14T08:00:00Z" },
    { id: "e3", title: "Compras Walmart", amount: 72.10, category: "Super", payment_method: "Efectivo", date: "2026-07-17", notes: "Agua, snacks y protector solar", updated_at: "2026-07-14T08:00:00Z" }
];

const DEFAULT_COMPRAS = [
    { id: "c1", profile: "Sofi", title: "Termo Stanley Rosa 🥤", location: "Target", is_completed: false, notes: "De 40oz con manija.", updated_at: "2026-07-14T08:00:00Z" },
    { id: "c2", profile: "Juanma", title: "Zapatillas Running 👟", location: "Premium Outlets", is_completed: false, notes: "Talle US 10 en Nike o Adidas.", updated_at: "2026-07-14T08:00:00Z" }
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
        { name: "Star Tours - The Adventure Continues", land: "Echo Lake" },
        { name: "Indiana Jones Epic Stunt Spectacular", land: "Echo Lake" },
        { name: "Alien Swirling Saucers", land: "Toy Story Land" },
        { name: "Slinky Dog Dash", land: "Toy Story Land" },
        { name: "Toy Story Mania!", land: "Toy Story Land" },
        { name: "Meet Edna Mode", land: "Pixar Place" },
        { name: "The Twilight Zone Tower of Terror", land: "Sunset Boulevard" },
        { name: "Rock 'n' Roller Coaster Starring Aerosmith", land: "Sunset Boulevard" }
    ],
    "Animal Kingdom": [
        { name: "Avatar Flight of Passage", land: "Pandora" },
        { name: "Na'vi River Journey", land: "Pandora" },
        { name: "Kilimanjaro Safaris", land: "Africa" },
        { name: "Gorilla Falls Exploration Trail", land: "Africa" },
        { name: "Kali River Rapids", land: "Asia" },
        { name: "Expedition Everest", land: "Asia" },
        { name: "Zootopia", land: "Zootopia" }
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
let activeShoppingProfile = "Sofi";

let sensitiveCategories = [
    { key: "Pasaporte", label: "Pasaportes", icon: "🪪", suffix: "documentos" },
    { key: "Hotel", label: "Hoteles", icon: "🏨", suffix: "reservas" },
    { key: "Auto", label: "Alquiler de Auto", icon: "🚗", suffix: "reservas" },
    { key: "Seguro", label: "Asistencia Médica", icon: "🏥", suffix: "pólizas" },
    { key: "Otro", label: "Otros Datos", icon: "📁", suffix: "registros" }
];

function loadCustomCategories() {
    const stored = localStorage.getItem("disney2026_custom_categories");
    if (stored) {
        try {
            const list = JSON.parse(stored);
            list.forEach(cat => {
                if (!sensitiveCategories.some(c => c.key === cat.key)) {
                    sensitiveCategories.push(cat);
                }
            });
        } catch (e) {
            console.error("Error parsing custom categories", e);
        }
    }
}

const DEFAULT_CATEGORY_EMOJIS = ["🪪", "🏨", "🚗", "🏥", "📁", "🎟️", "✈️", "💵", "🛍️", "🍽️", "🗺️", "🔑", "📄", "🎒", "🔋", "🧸", "📷", "💡", "🛡️", "🏷️", "💳", "📅", "✏️", "🔔"];

function saveCustomCategories() {
    const defaults = ["Pasaporte", "Hotel", "Auto", "Seguro", "Otro"];
    const customs = sensitiveCategories.filter(c => !defaults.includes(c.key));
    localStorage.setItem("disney2026_custom_categories", JSON.stringify(customs));
}

function saveCustomCategoriesOrder() {
    const order = sensitiveCategories.map(c => c.key);
    localStorage.setItem("disney2026_categories_order", JSON.stringify(order));
    saveCustomCategories();
}

let db = {
    itinerary: [],
    attractions: [],
    flights: [],
    sensible: [],
    expenses: [],
    expense_categories: [],
    payment_methods: [],
    compras: [],
    dirty: {} // Registra elementos que necesitan sincronizarse con Supabase
};

function populateCategoryEmojiGrids() {
    const newGrid = document.getElementById("new-category-emoji-grid");
    const editGrid = document.getElementById("edit-category-emoji-grid");
    
    [newGrid, editGrid].forEach(grid => {
        if (!grid) return;
        grid.innerHTML = "";
        DEFAULT_CATEGORY_EMOJIS.forEach(emoji => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = emoji;
            btn.addEventListener("click", () => {
                grid.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                
                if (grid.id === "new-category-emoji-grid") {
                    document.getElementById("new-category-icon").value = emoji;
                } else {
                    document.getElementById("edit-category-icon").value = emoji;
                }
            });
            grid.appendChild(btn);
        });
    });
}

// --- INICIALIZAR APLICACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
    initClock();
    initLocalDB();
    setupEventListeners();
    populateCategoryEmojiGrids();
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
    loadCustomCategories();
    
    const storedOrder = localStorage.getItem("disney2026_categories_order");
    if (storedOrder) {
        try {
            const orderKeys = JSON.parse(storedOrder);
            sensitiveCategories.sort((a, b) => {
                const idxA = orderKeys.indexOf(a.key);
                const idxB = orderKeys.indexOf(b.key);
                const posA = idxA === -1 ? 999 : idxA;
                const posB = idxB === -1 ? 999 : idxB;
                return posA - posB;
            });
        } catch (e) {
            console.error(e);
        }
    }

    const keys = ["itinerary", "attractions", "flights", "sensible", "expenses", "expense_categories", "payment_methods", "compras"];
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
            else if (key === "expenses") defaultVal = DEFAULT_EXPENSES;
            else if (key === "expense_categories") defaultVal = DEFAULT_EXPENSE_CATEGORIES;
            else if (key === "payment_methods") defaultVal = DEFAULT_PAYMENT_METHODS;
            else if (key === "compras") defaultVal = DEFAULT_COMPRAS;
            
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
    
    // Migración automática del itinerario y recalibración de fechas de atracciones (v4 con soporte de UUIDs de Supabase)
    const itineraryMigrationKeyV4 = "disney2026_itinerary_migration_v4";
    if (!localStorage.getItem(itineraryMigrationKeyV4)) {
        console.log("Migrando itinerario a la versión v4 solicitada...");
        
        const newItineraryByDate = {
            "2026-07-16": { title: "Día Previo / Viaje a Orlando", notes: "Día de preparación y salida del vuelo.", is_park_day: false, park_name: "" },
            "2026-07-17": { title: "Parque de Agua - Disney Typhoon Lagoon", notes: "Día de parque acuático en Disney Typhoon Lagoon. Disfrutar de la pileta de olas gigantes, toboganes y el río lento.", is_park_day: true, park_name: "Typhoon Lagoon" },
            "2026-07-18": { title: "Epcot", notes: "Visita a Epcot. Cosmic Rewind es prioridad (Virtual Queue a las 7:00 AM o Lightning Lane Single Pass). Pasear por los pabellones de World Showcase en la tarde.", is_park_day: true, park_name: "Epcot" },
            "2026-07-19": { title: "Día de Descanso", notes: "Día libre de descanso, piscina en el hotel o paseos cortos.", is_park_day: false, park_name: "" },
            "2026-07-20": { title: "Disney's Animal Kingdom", notes: "Entrar temprano para Avatar Flight of Passage. Expedition Everest y el safari Kilimanjaro Safaris en la mañana para ver los animales activos.", is_park_day: true, park_name: "Animal Kingdom" },
            "2026-07-21": { title: "Disney's Hollywood Studios", notes: "Mundo Star Wars (Galaxy's Edge) a primera hora. Rise of the Resistance y Slinky Dog Dash son las prioridades del día.", is_park_day: true, park_name: "Hollywood Studios" },
            "2026-07-22": { title: "Magic Kingdom", notes: "Llegar temprano para el Rope Drop. Reservar TRON y Tiana en Virtual Queue/Lightning Lane a las 7:00 AM.", is_park_day: true, park_name: "Magic Kingdom" },
            "2026-07-23": { title: "Día de Descanso", notes: "Día para reponer energías tras los parques intensos de Disney.", is_park_day: false, park_name: "" },
            "2026-07-24": { title: "Universal Studios Florida", notes: "Visita a Universal Studios. Diagon Alley (Gringotts), Revenge of the Mummy y Men in Black. Almorzar en el Caldero Chorreante.", is_park_day: true, park_name: "Universal Studios" },
            "2026-07-25": { title: "Universal's Islands of Adventure", notes: "Atracciones principales: VelociCoaster, Hagrid's Motorbike Adventure y Spider-Man. Tomar el Hogwarts Express hacia Universal Studios.", is_park_day: true, park_name: "Islands of Adventure" },
            "2026-07-26": { title: "Día de Compras (Shopping)", notes: "Mañana libre de piscina. Tarde de compras en outlets y cena en Disney Springs.", is_park_day: false, park_name: "" },
            "2026-07-27": { title: "Día de Compras (Shopping)", notes: "Día dedicado a centros comerciales, Walmart, Target y paseos de compras adicionales.", is_park_day: false, park_name: "" },
            "2026-07-28": { title: "Universal Epic Universe", notes: "Visita al nuevo parque temático Epic Universe. Explorar Celestial Park y las nuevas tierras mágicas.", is_park_day: true, park_name: "Epic Universe" },
            "2026-07-29": { title: "Universal Epic Universe (Día 2)", notes: "Segundo día en Epic Universe para repetir atracciones favoritas y completar la exploración de las áreas temáticas.", is_park_day: true, park_name: "Epic Universe" },
            "2026-07-30": { title: "Universal Studios e Islands of Adventure", notes: "Día combinado para repetir las mejores montañas rusas y atracciones favoritas de ambos parques de Universal.", is_park_day: true, park_name: "Universal Studios, Islands of Adventure" },
            "2026-07-31": { title: "Regreso a Casa", notes: "Check-out del hotel, devolución del auto de alquiler en Hertz (MCO) y vuelo de regreso.", is_park_day: false, park_name: "" },
            "2026-08-01": { title: "Llegada a Casa", notes: "Llegada al aeropuerto internacional e ingreso al país. Fin de este increíble viaje familiar.", is_park_day: false, park_name: "" }
        };
        
        // Actualizar o insertar días
        for (const [targetDate, targetData] of Object.entries(newItineraryByDate)) {
            const existingDay = db.itinerary.find(d => d.date === targetDate);
            if (existingDay) {
                existingDay.title = targetData.title;
                existingDay.notes = JSON.stringify({
                    general_notes: targetData.notes,
                    activities: []
                });
                existingDay.is_park_day = targetData.is_park_day;
                existingDay.park_name = targetData.park_name;
                existingDay.updated_at = new Date().toISOString();
            } else {
                db.itinerary.push({
                    id: generateUUID(),
                    date: targetDate,
                    title: targetData.title,
                    notes: JSON.stringify({
                        general_notes: targetData.notes,
                        activities: []
                    }),
                    is_park_day: targetData.is_park_day,
                    park_name: targetData.park_name,
                    updated_at: new Date().toISOString()
                });
            }
        }
        
        // 2. Mapear las atracciones existentes a sus nuevas fechas correspondientes
        const parkDateMapping = {
            "Magic Kingdom": "2026-07-22",
            "Epcot": "2026-07-18",
            "Universal Studios": "2026-07-24",
            "Hollywood Studios": "2026-07-21",
            "Islands of Adventure": "2026-07-25",
            "Animal Kingdom": "2026-07-20",
            "Volcano Bay": "2026-07-17"
        };
        
        db.attractions = db.attractions.map(att => {
            if (parkDateMapping[att.park]) {
                att.date = parkDateMapping[att.park];
                att.updated_at = new Date().toISOString();
            }
            return att;
        });
        
        localStorage.setItem("disney2026_itinerary", JSON.stringify(db.itinerary));
        localStorage.setItem("disney2026_attractions", JSON.stringify(db.attractions));
        
        db.dirty.itinerary = true;
        db.dirty.attractions = true;
        
        localStorage.setItem("disney2026_dirty", JSON.stringify(db.dirty));
        localStorage.setItem(itineraryMigrationKeyV4, "true");
        
        if (supabaseClient) {
            triggerBackgroundSync();
        }
    }

    // Migración: inyectar medio de pago y categoría "Habitación" si no existen
    const hasHabitacionPM = db.payment_methods.some(pm => pm.name === "Habitación");
    if (!hasHabitacionPM) {
        db.payment_methods.push({ id: generateUUID(), name: "Habitación", emoji: "🏨", is_default: true, updated_at: new Date().toISOString() });
        localStorage.setItem("disney2026_payment_methods", JSON.stringify(db.payment_methods));
        db.dirty.payment_methods = true;
    }
    // Migración: renombrar categoría "Habitación" a "Misceláneas" e inyectar si no existe
    let catChanged = false;
    db.expense_categories.forEach(c => {
        if (c.name === "Habitación") {
            c.name = "Misceláneas";
            c.emoji = "📦";
            c.updated_at = new Date().toISOString();
            catChanged = true;
        }
    });
    const hasMiscelaneasCat = db.expense_categories.some(c => c.name === "Misceláneas");
    if (!hasMiscelaneasCat) {
        db.expense_categories.push({ id: generateUUID(), name: "Misceláneas", emoji: "📦", is_default: true, updated_at: new Date().toISOString() });
        catChanged = true;
    }
    if (catChanged) {
        localStorage.setItem("disney2026_expense_categories", JSON.stringify(db.expense_categories));
        db.dirty.expense_categories = true;
    }

    // Renombrar categoría en gastos existentes de "Habitación" a "Misceláneas"
    let expChanged = false;
    db.expenses.forEach(e => {
        if (e.category === "Habitación") {
            e.category = "Misceláneas";
            e.updated_at = new Date().toISOString();
            expChanged = true;
        }
    });
    if (expChanged) {
        localStorage.setItem("disney2026_expenses", JSON.stringify(db.expenses));
        db.dirty.expenses = true;
    }

    // Deduplicar itinerario: mantener solo la versión más reciente por fecha
    const itineraryByDate = {};
    db.itinerary.forEach(item => {
        const existing = itineraryByDate[item.date];
        if (!existing || new Date(item.updated_at || 0) > new Date(existing.updated_at || 0)) {
            itineraryByDate[item.date] = item;
        }
    });
    const dedupedItinerary = Object.values(itineraryByDate);
    if (dedupedItinerary.length < db.itinerary.length) {
        console.log(`Deduplicación de itinerario: ${db.itinerary.length} → ${dedupedItinerary.length} items`);
        db.itinerary = dedupedItinerary;
        localStorage.setItem("disney2026_itinerary", JSON.stringify(db.itinerary));
    }

    // Migración específica para el itinerario y atracciones del 20/07/2026 (Animal Kingdom)
    const july20MigrationKey = "disney2026_july20_update_v2";
    if (!localStorage.getItem(july20MigrationKey)) {
        console.log("Migrando itinerario y atracciones del 20/07/2026...");
        
        // 1. Modificar día en itinerario
        const day20 = db.itinerary.find(item => item.date === "2026-07-20");
        if (day20) {
            day20.title = "Disney's Animal Kingdom";
            day20.park_name = "Animal Kingdom";
            day20.is_park_day = true;
            day20.notes = JSON.stringify({
                general_notes: "Atracciones: Avatar Flight of Passage, Na'vi River Journey, Kilimanjaro Safaris, Gorilla Falls Exploration Trail, Kali River Rapids, Expedition Everest, Zootopia.",
                activities: [
                    { id: generateUUID(), time: "07:30", title: "Ir en bus del hotel al parque 🚌", is_completed: false }
                ]
            });
            day20.updated_at = new Date().toISOString();
        }
        
        // 2. Modificar atracciones
        // Eliminar atracciones previas en 20/07/2026 para reordenar/actualizar
        db.attractions = db.attractions.filter(att => att.date !== "2026-07-20");
        
        const newAtts = [
            { name: "Avatar Flight of Passage", land: "Pandora" },
            { name: "Na'vi River Journey", land: "Pandora" },
            { name: "Kilimanjaro Safaris", land: "Africa" },
            { name: "Gorilla Falls Exploration Trail", land: "Africa" },
            { name: "Kali River Rapids", land: "Asia" },
            { name: "Expedition Everest", land: "Asia" },
            { name: "Zootopia", land: "Zootopia" }
        ];
        
        newAtts.forEach((att, idx) => {
            db.attractions.push({
                id: generateUUID(),
                park: "Animal Kingdom",
                name: att.name,
                land: att.land,
                date: "2026-07-20",
                is_completed: false,
                visit_order: idx + 1,
                notes: "",
                updated_at: new Date().toISOString()
            });
        });
        
        localStorage.setItem("disney2026_itinerary", JSON.stringify(db.itinerary));
        localStorage.setItem("disney2026_attractions", JSON.stringify(db.attractions));
        
        db.dirty.itinerary = true;
        db.dirty.attractions = true;
        localStorage.setItem("disney2026_dirty", JSON.stringify(db.dirty));
        
        localStorage.setItem(july20MigrationKey, "true");
        if (supabaseClient) {
            triggerBackgroundSync();
        }
    }

    // Migración específica para el itinerario y atracciones del 21/07/2026 (Hollywood Studios)
    const july21MigrationKey = "disney2026_july21_update_v1";
    if (!localStorage.getItem(july21MigrationKey)) {
        console.log("Migrando itinerario y atracciones del 21/07/2026...");
        
        // 1. Modificar día en itinerario
        const day21 = db.itinerary.find(item => item.date === "2026-07-21");
        if (day21) {
            day21.title = "Disney's Hollywood Studios";
            day21.park_name = "Hollywood Studios";
            day21.is_park_day = true;
            day21.notes = JSON.stringify({
                general_notes: "Atracciones: Star Wars: Rise of the Resistance, Millennium Falcon, Star Tours - The Adventure Continues, Indiana Jones, Alien Swirling Saucers, Slinky Dog Dash, Toy Story Mania, Meet Edna Mode, The Twilight Zone, Rock 'n' Roller Coaster.",
                activities: [
                    { id: generateUUID(), time: "08:00", title: "Ir en Skyliner al parque 🚡", is_completed: false }
                ]
            });
            day21.updated_at = new Date().toISOString();
        }
        
        // 2. Modificar atracciones
        // Eliminar atracciones previas en 21/07/2026 para reordenar/actualizar
        db.attractions = db.attractions.filter(att => att.date !== "2026-07-21");
        
        const newAtts21 = [
            { name: "Star Wars: Rise of the Resistance", land: "Galaxy's Edge" },
            { name: "Millennium Falcon: Smugglers Run", land: "Galaxy's Edge" },
            { name: "Star Tours - The Adventure Continues", land: "Echo Lake" },
            { name: "Indiana Jones Epic Stunt Spectacular", land: "Echo Lake" },
            { name: "Alien Swirling Saucers", land: "Toy Story Land" },
            { name: "Slinky Dog Dash", land: "Toy Story Land" },
            { name: "Toy Story Mania!", land: "Toy Story Land" },
            { name: "Meet Edna Mode", land: "Pixar Place" },
            { name: "The Twilight Zone Tower of Terror", land: "Sunset Boulevard" },
            { name: "Rock 'n' Roller Coaster Starring Aerosmith", land: "Sunset Boulevard" }
        ];
        
        newAtts21.forEach((att, idx) => {
            db.attractions.push({
                id: generateUUID(),
                park: "Hollywood Studios",
                name: att.name,
                land: att.land,
                date: "2026-07-21",
                is_completed: false,
                visit_order: idx + 1,
                notes: "",
                updated_at: new Date().toISOString()
            });
        });
        
        localStorage.setItem("disney2026_itinerary", JSON.stringify(db.itinerary));
        localStorage.setItem("disney2026_attractions", JSON.stringify(db.attractions));
        
        db.dirty.itinerary = true;
        db.dirty.attractions = true;
        localStorage.setItem("disney2026_dirty", JSON.stringify(db.dirty));
        
        localStorage.setItem(july21MigrationKey, "true");
        if (supabaseClient) {
            triggerBackgroundSync();
        }
    }

    // Deduplicar atracciones: mantener solo la versión más reciente por nombre y fecha
    const attractionUnique = {};
    db.attractions.forEach(item => {
        const key = `${item.date || ""}_${item.name}`;
        const existing = attractionUnique[key];
        if (!existing || new Date(item.updated_at || 0) > new Date(existing.updated_at || 0)) {
            attractionUnique[key] = item;
        }
    });
    const dedupedAttractions = Object.values(attractionUnique);
    if (dedupedAttractions.length < db.attractions.length) {
        console.log(`Deduplicación de atracciones: ${db.attractions.length} → ${dedupedAttractions.length} items`);
        db.attractions = dedupedAttractions;
        localStorage.setItem("disney2026_attractions", JSON.stringify(db.attractions));
    }
}

// Formateador de moneda USD con formato argentino: USD XXX.XXX.XXX,XX
function formatUSD(amount) {
    const num = parseFloat(amount) || 0;
    const isNeg = num < 0;
    const abs = Math.abs(num);
    // Separar parte entera y decimal
    const parts = abs.toFixed(2).split(".");
    // Agregar puntos como separador de miles
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const formatted = `USD ${isNeg ? "-" : ""}${intPart},${parts[1]}`;
    return formatted;
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
    // 1. Botón de ingreso directo (Usuario único "Flia. López")
    const unlockBtn = document.getElementById("btn-unlock-direct");
    if (unlockBtn) {
        unlockBtn.addEventListener("click", () => {
            currentUser = "Flia. López";
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
            switchTab(tabName, true);
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
    document.getElementById("form-expense").addEventListener("submit", handleExpenseSubmit);
    document.getElementById("form-pay-room").addEventListener("submit", handlePayRoomSubmit);
    document.getElementById("form-settle-debt").addEventListener("submit", handleSettleDebtSubmit);
    document.getElementById("form-add-expense-category").addEventListener("submit", handleCategorySubmit);
    document.getElementById("form-add-payment-method").addEventListener("submit", handlePaymentMethodSubmit);
    document.getElementById("form-flight").addEventListener("submit", handleFlightSubmit);
    document.getElementById("form-sensitive").addEventListener("submit", handleSensitiveSubmit);

    // 5. Selector de Parque y Filtros
    document.getElementById("park-select").addEventListener("change", (e) => {
        activePark = e.target.value;
        renderParkChecklist();
    });

    document.getElementById("park-date-select").addEventListener("change", handleParkDateChange);

    // Botón agregar gasto
    document.getElementById("btn-add-expense-modal").addEventListener("click", () => {
        document.getElementById("form-expense").reset();
        document.getElementById("expense-id").value = "";
        document.getElementById("expense-split-group-id").value = "";
        
        // Resetear controles de división de gastos
        document.getElementById("expense-is-split").checked = false;
        document.getElementById("expense-splits-section").style.display = "none";
        
        const amountInput = document.getElementById("expense-amount");
        amountInput.readOnly = false;
        amountInput.style.backgroundColor = "";
        
        const catGroup = document.getElementById("expense-category").closest(".form-group");
        if (catGroup) catGroup.style.display = "block";
        
        document.getElementById("expense-splits-list").innerHTML = "";
        
        // Cargar por defecto la fecha actual local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        document.getElementById("expense-date").value = `${year}-${month}-${day}`;
        
        loadExpenseDropdowns();
        document.getElementById("expense-modal-title").textContent = "Registrar Gasto";
        document.getElementById("modal-expense").showModal();
    });

    // Controlar el cambio en el checkbox "Dividir este Gasto"
    document.getElementById("expense-is-split").addEventListener("change", (e) => {
        const section = document.getElementById("expense-splits-section");
        const amountInput = document.getElementById("expense-amount");
        const catGroup = document.getElementById("expense-category").closest(".form-group");
        const listEl = document.getElementById("expense-splits-list");
        
        if (e.target.checked) {
            section.style.display = "block";
            amountInput.readOnly = true;
            amountInput.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            if (catGroup) catGroup.style.display = "none";
            
            // Agregar dos filas vacías por defecto si está vacío
            if (listEl && listEl.children.length === 0) {
                const mainTitle = document.getElementById("expense-title").value;
                addSplitRow(mainTitle, "", "", "");
                addSplitRow("", "", "", "");
            }
        } else {
            section.style.display = "none";
            amountInput.readOnly = false;
            amountInput.style.backgroundColor = "";
            if (catGroup) catGroup.style.display = "block";
            if (listEl) listEl.innerHTML = "";
            amountInput.value = "";
        }
    });

    // Botón para añadir nueva línea de división
    document.getElementById("btn-add-split-row").addEventListener("click", () => {
        addSplitRow("", "", "", "");
    });

    // Botones para abrir sub-modales de agregar categoría y medio de pago
    document.getElementById("btn-add-cat-modal").addEventListener("click", () => {
        document.getElementById("form-add-expense-category").reset();
        document.getElementById("modal-add-expense-category").showModal();
    });

    document.getElementById("btn-add-pay-modal").addEventListener("click", () => {
        document.getElementById("form-add-payment-method").reset();
        document.getElementById("modal-add-payment-method").showModal();
    });

    // Botón pagar habitación
    const payRoomBtn = document.getElementById("btn-pay-room-modal");
    if (payRoomBtn) {
        payRoomBtn.addEventListener("click", () => {
            document.getElementById("form-pay-room").reset();
            
            // Calcular balance de habitación actual
            let roomBalance = 0;
            db.expenses.forEach(e => {
                const methodLower = e.payment_method.toLowerCase();
                if (methodLower === "habitación" || methodLower.includes("habitacion")) {
                    roomBalance += parseFloat(e.amount) || 0;
                }
            });
            
            document.getElementById("pay-room-amount").value = roomBalance > 0 ? roomBalance.toFixed(2) : "";
            
            // Cargar por defecto la fecha actual local
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            document.getElementById("pay-room-date").value = `${year}-${month}-${day}`;
            
            // Cargar medios de pago en el selector (filtrando Habitación)
            const selectEl = document.getElementById("pay-room-payment-method");
            if (selectEl) {
                selectEl.innerHTML = "";
                db.payment_methods.forEach(pm => {
                    if (pm.name.toLowerCase() !== "habitación" && !pm.name.toLowerCase().includes("habitacion")) {
                        const opt = document.createElement("option");
                        opt.value = pm.name;
                        opt.textContent = `${pm.emoji} ${pm.name}`;
                        selectEl.appendChild(opt);
                    }
                });
            }
            
            document.getElementById("modal-pay-room").showModal();
        });
    }

    // Botón agregar vuelo
    document.getElementById("btn-add-flight-modal").addEventListener("click", () => {
        document.getElementById("form-flight").reset();
        document.getElementById("flight-id").value = "";
        document.getElementById("flight-modal-title").textContent = "Registrar Vuelo";
        document.getElementById("modal-flight").showModal();
    });

    // Abrir modal nueva categoría
    document.getElementById("btn-add-sensitive-category").addEventListener("click", () => {
        document.getElementById("form-new-category").reset();
        document.getElementById("modal-new-category").showModal();
    });

    // Submit de nueva categoría
    document.getElementById("form-new-category").addEventListener("submit", (e) => {
        const name = document.getElementById("new-category-name").value.trim();
        const icon = document.getElementById("new-category-icon").value.trim() || "📁";
        
        if (name) {
            // Verificar si ya existe
            if (sensitiveCategories.some(c => c.key.toLowerCase() === name.toLowerCase())) {
                alert("Esta categoría ya existe.");
                e.preventDefault();
                return;
            }
            
            sensitiveCategories.push({
                key: name,
                label: name,
                icon: icon,
                suffix: "registros"
            });
            saveCustomCategoriesOrder();
            updateSensitiveCounters();
        }
    });

    // Submit de editar categoría
    document.getElementById("form-edit-category").addEventListener("submit", (e) => {
        const key = document.getElementById("edit-category-key").value;
        const newName = document.getElementById("edit-category-name").value.trim();
        const newIcon = document.getElementById("edit-category-icon").value.trim() || "📁";
        
        if (key && newName) {
            const catIndex = sensitiveCategories.findIndex(c => c.key === key);
            if (catIndex !== -1) {
                const oldKey = sensitiveCategories[catIndex].key;
                
                // Actualizar propiedades
                sensitiveCategories[catIndex].label = newName;
                sensitiveCategories[catIndex].icon = newIcon;
                
                // Si el nombre cambió, actualizar todos los registros asociados
                if (oldKey !== newName) {
                    sensitiveCategories[catIndex].key = newName;
                    
                    db.sensible.forEach((item, idx) => {
                        if (item.category === oldKey) {
                            db.sensible[idx].category = newName;
                        }
                    });
                    saveLocal("sensible");
                }
                
                saveCustomCategoriesOrder();
                updateSensitiveCounters();
            }
        }
    });

    // Cerrar panel sensible
    document.getElementById("btn-close-sensitive-panel").addEventListener("click", () => {
        toggleSensitiveViews(false);
    });

    // Agregar ítem de datos sensibles
    document.getElementById("btn-add-sensitive-item").addEventListener("click", () => {
        document.getElementById("form-sensitive").reset();
        document.getElementById("sensitive-id").value = "";
        document.getElementById("sensitive-category").value = selectedSensitiveCategory;
        setupSensitiveFormFields(selectedSensitiveCategory);
        document.getElementById("sensitive-modal-title").textContent = `Nuevo Registro: ${selectedSensitiveCategory}`;
        document.getElementById("modal-sensitive").showModal();
    });

    // Navegación de perfiles de compras
    document.querySelectorAll(".profile-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".profile-tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeShoppingProfile = btn.getAttribute("data-profile");
            renderShoppingList();
        });
    });

    // Agregar artículo de compra
    const btnAddCompra = document.getElementById("btn-add-compra-item");
    if (btnAddCompra) {
        btnAddCompra.addEventListener("click", openAddShoppingItemModal);
    }

    // Submit de compra
    const formCompra = document.getElementById("form-compra");
    if (formCompra) {
        formCompra.addEventListener("submit", handleShoppingSubmit);
    }

    // Botón agregar atracción en el parque
    document.getElementById("btn-add-attraction-modal").addEventListener("click", openAddAttractionModal);
    
    // Cambios en preset de atracciones
    document.getElementById("attraction-preset").addEventListener("change", handleAttractionPresetChange);
}



function unlockApp() {
    document.getElementById("lock-screen").classList.add("hidden");
    document.getElementById("lock-screen").classList.remove("active");
    
    document.getElementById("app-container").classList.remove("hidden");
    document.getElementById("current-user-name").textContent = "Flia. López";
    
    switchTab("calendario");
    updateSensitiveCounters();
}

// --- CONTROL DE NAVEGACIÓN TAB BAR ---
function switchTab(tabName, isUserClick = false) {
    // Solo volver al inicio (resetear vista a categorías) si el usuario hace click explícito y cambia de pestaña
    if (isUserClick && tabName !== currentActiveTab) {
        toggleSensitiveViews(false);
    }
    
    currentActiveTab = tabName;
    
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
        "gastos": "Control de Gastos",
        "vuelos": "Vuelos",
        "compras": "Lista de Compras",
        "sensible": "Documentos"
    };
    
    document.getElementById("view-title").textContent = titleMap[tabName] || "Orlando 2026";
    
    // Cambiar acciones disponibles en cabecera según pestaña
    const actionContainer = document.getElementById("header-action-container");
    actionContainer.innerHTML = "";
    
    // El botón de cerrar sesión ahora está siempre visible en el header (index.html)
    
    // Renderizar contenidos dinámicos
    if (tabName === "calendario") renderCalendarList();
    else if (tabName === "parques") renderParkChecklist();
    else if (tabName === "gastos") {
        renderGastosFilterBar();
        renderExpensesList("all");
    }
    else if (tabName === "vuelos") renderFlightsList();
    else if (tabName === "compras") renderShoppingList();
    else if (tabName === "sensible") {
        updateSensitiveCounters();
        const detailPanel = document.getElementById("sensitive-detail-panel");
        if (detailPanel && !detailPanel.classList.contains("hidden")) {
            renderSensitiveItems();
        }
    }
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

function getDynamicFlightActivities(dateStr) {
    if (!db || !Array.isArray(db.flights)) return [];
    
    const flightActivities = [];
    
    // 1. Vuelos que salen ese día
    const departingFlights = db.flights.filter(f => f.date === dateStr);
    departingFlights.forEach(f => {
        flightActivities.push({
            id: f.id,
            is_flight: true,
            emoji: "✈️",
            title: `Vuelo ${f.flight_number} (${f.airline})`,
            time: f.departure_time,
            notes: `Ruta: ${f.departure_airport} ➔ ${f.arrival_airport}. Horario: ${f.departure_time} - ${f.arrival_time}. Confirmación: ${f.code || ""}`
        });
    });
    
    // 2. Vuelos que llegan ese día (vuelos del día anterior con "+1" en hora de llegada)
    try {
        const prevDate = new Date(dateStr + "T00:00:00");
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split("T")[0];
        
        const prevDayFlights = db.flights.filter(f => f.date === prevDateStr);
        prevDayFlights.forEach(f => {
            if (f.arrival_time && f.arrival_time.includes("+1")) {
                const cleanArrivalTime = f.arrival_time.replace("+1", "").trim();
                flightActivities.push({
                    id: f.id + "_arr",
                    is_flight: true,
                    emoji: "🛬",
                    title: `Llegada Vuelo ${f.flight_number} a ${f.arrival_airport}`,
                    time: cleanArrivalTime,
                    notes: `Aterriza a las ${cleanArrivalTime} (vuelo del día anterior desde ${f.departure_airport})`
                });
            }
        });
    } catch (err) {
        console.warn("Error calculando llegada de vuelo del día anterior:", err);
    }
    
    return flightActivities;
}

function getDynamicAutoActivities(dateStr) {
    if (!db || !Array.isArray(db.sensible)) return [];
    
    const autoActivities = [];
    
    db.sensible.forEach(item => {
        if (item.category !== "Auto") return;
        
        try {
            const data = JSON.parse(item.content);
            if (!data) return;
            
            // 1. Recogida (Pickup)
            if (data.fecha_retiro) {
                const parts = data.fecha_retiro.split("T");
                const rDate = parts[0];
                const rTime = parts[1] || "";
                
                if (rDate === dateStr) {
                    autoActivities.push({
                        id: item.id + "_pickup",
                        is_auto: true,
                        emoji: "🚗",
                        title: `Retiro de Auto (${data.compania || "Hertz"})`,
                        time: rTime,
                        notes: `Lugar: ${data.retiro || ""}. Reserva: ${data.codigo || ""}. Modelo: ${data.modelo || ""}.`
                    });
                }
            }
            
            // 2. Devolución (Return)
            if (data.fecha_devolucion) {
                const parts = data.fecha_devolucion.split("T");
                const dDate = parts[0];
                const dTime = parts[1] || "";
                
                if (dDate === dateStr) {
                    autoActivities.push({
                        id: item.id + "_return",
                        is_auto: true,
                        emoji: "🚗",
                        title: `Devolución de Auto (${data.compania || "Hertz"})`,
                        time: dTime,
                        notes: `Lugar: ${data.devolucion || data.retiro || ""}. Reserva: ${data.codigo || ""}.`
                    });
                }
            }
        } catch (e) {
            // Ignorar errores de parseo de datos no estructurados antiguos
        }
    });
    
    return autoActivities;
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
        
        // Obtener y combinar vuelos y autos del día
        const flightActivities = getDynamicFlightActivities(day.date);
        const autoActivities = getDynamicAutoActivities(day.date);
        const allActivities = [...activities, ...flightActivities, ...autoActivities];
        
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
            
            const sortedActivities = [...allActivities].sort((a, b) => {
                const timeA = a.time || "99:99";
                const timeB = b.time || "99:99";
                return timeA.localeCompare(timeB);
            });
            
            sortedActivities.forEach(act => {
                const actCard = document.createElement("div");
                
                if (act.is_flight || act.is_auto) {
                    const typeLabel = act.is_flight ? "Vuelo" : "Auto";
                    const themeColor = act.is_flight ? "var(--accent-color)" : "#34c759";
                    const bgLight = act.is_flight ? "rgba(10, 132, 255, 0.05)" : "rgba(52, 199, 89, 0.05)";
                    const borderTheme = act.is_flight ? "var(--accent-color)" : "#34c759";
                    const badgeBg = act.is_flight ? "rgba(10, 132, 255, 0.12)" : "rgba(52, 199, 89, 0.12)";
                    
                    actCard.className = `nested-activity-card ${act.is_flight ? "flight-activity" : "auto-activity"}`;
                    actCard.style.background = bgLight;
                    actCard.style.borderLeft = `3px solid ${borderTheme}`;
                    actCard.style.padding = "10px 12px";
                    
                    actCard.innerHTML = `
                        <div class="activity-left-side" style="padding-left: 4px; display: flex; align-items: center; gap: 8px;">
                            ${act.time ? `<span class="activity-time-badge" style="background: ${themeColor}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">${act.time}</span>` : ""}
                            <span class="activity-emoji">${act.emoji || (act.is_flight ? "✈️" : "🚗")}</span>
                            <div class="activity-text-container">
                                <span class="activity-text" style="font-weight: 600;">${act.title}</span>
                                ${act.notes ? `<span class="activity-notes-subtext" style="color: var(--text-secondary); display: block; font-size: 12px; margin-top: 2px;">${act.notes}</span>` : ""}
                            </div>
                        </div>
                        <div class="activity-right-side">
                            <span style="font-size: 10px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; background: ${badgeBg}; padding: 2px 6px; border-radius: 4px; display: inline-block;">${typeLabel}</span>
                        </div>
                    `;
                } else {
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
                }
                
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
        "Universal Studios", "Islands of Adventure", "Volcano Bay", "Epic Universe"
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
        "Universal Studios", "Islands of Adventure", "Volcano Bay", "Epic Universe"
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
        "Universal Studios", "Islands of Adventure", "Volcano Bay", "Epic Universe"
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

// --- RENDERIZAR TAB 3: GASTOS ---
function renderGastosFilterBar() {
    const barEl = document.getElementById("gastos-filter-bar");
    if (!barEl) return;
    
    // Guardar cuál es el chip activo actualmente
    const activeChip = barEl.querySelector(".filter-chip.active");
    const activeCat = activeChip ? activeChip.getAttribute("data-cat") : "all";
    
    barEl.innerHTML = "";
    
    // Chip "Todos"
    const allChip = document.createElement("button");
    allChip.className = "filter-chip" + (activeCat === "all" ? " active" : "");
    allChip.setAttribute("data-cat", "all");
    allChip.innerHTML = `<span class="chip-emoji">🌍</span><span class="chip-text">Todos</span>`;
    allChip.addEventListener("click", () => {
        barEl.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        allChip.classList.add("active");
        renderExpensesList("all");
    });
    barEl.appendChild(allChip);
    
    // Chips de categorías
    db.expense_categories.forEach(cat => {
        const chip = document.createElement("button");
        chip.className = "filter-chip" + (activeCat === cat.name ? " active" : "");
        chip.setAttribute("data-cat", cat.name);
        chip.innerHTML = `<span class="chip-emoji">${cat.emoji}</span><span class="chip-text">${cat.name}</span>`;
        chip.addEventListener("click", () => {
            barEl.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            renderExpensesList(cat.name);
        });
        barEl.appendChild(chip);
    });
}

function loadExpenseDropdowns() {
    const catSelect = document.getElementById("expense-category");
    const paySelect = document.getElementById("expense-payment-method");
    if (!catSelect || !paySelect) return;
    
    const prevCat = catSelect.value;
    const prevPay = paySelect.value;
    
    catSelect.innerHTML = "";
    db.expense_categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = `${cat.emoji} ${cat.name}`;
        catSelect.appendChild(opt);
    });
    
    paySelect.innerHTML = "";
    db.payment_methods.forEach(pm => {
        const opt = document.createElement("option");
        opt.value = pm.name;
        opt.textContent = `${pm.emoji} ${pm.name}`;
        paySelect.appendChild(opt);
    });
    
    // Restaurar selecciones previas si aún existen
    if (prevCat && db.expense_categories.some(c => c.name === prevCat)) {
        catSelect.value = prevCat;
    }
    if (prevPay && db.payment_methods.some(p => p.name === prevPay)) {
        paySelect.value = prevPay;
    }
}

function updateGastosSummary() {
    let total = 0;
    const perMethod = {}; // { "Efectivo": 72.10, "Tarjeta Sofi Santander": 48.50, ... }
    
    db.expenses.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        total += amt;
        const pm = e.payment_method || "Otro";
        perMethod[pm] = (perMethod[pm] || 0) + amt;
    });
    
    const totalEl = document.getElementById("gastos-total-amount");
    if (totalEl) totalEl.textContent = formatUSD(total);
    
    // Generar breakdown dinámicamente
    const breakdownEl = document.getElementById("gastos-breakdown");
    if (!breakdownEl) return;
    breakdownEl.innerHTML = "";
    
    // Colores para los dots por medio de pago
    const dotColors = ["#34c759", "#0a84ff", "#ff9500", "#ff375f", "#af52de", "#5ac8fa", "#ff6b35", "#64d2ff"];
    
    // Ordenar: primero los que tienen saldo > 0, luego por nombre
    const methodOrder = db.payment_methods.map(pm => pm.name);
    const sortedMethods = Object.keys(perMethod).sort((a, b) => {
        const idxA = methodOrder.indexOf(a);
        const idxB = methodOrder.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
    
    sortedMethods.forEach((methodName, i) => {
        const amt = perMethod[methodName];
        const pmObj = db.payment_methods.find(p => p.name === methodName);
        const emoji = pmObj ? pmObj.emoji : "💳";
        const dotColor = dotColors[i % dotColors.length];
        
        const item = document.createElement("div");
        item.className = "breakdown-item";
        item.innerHTML = `
            <span class="breakdown-dot" style="background-color: ${dotColor};"></span>
            <span class="breakdown-label">${emoji} ${methodName}:</span>
            <span class="breakdown-val">${formatUSD(amt)}</span>
        `;
        breakdownEl.appendChild(item);
    });
    
    // Actualizar el panel de deudas/saldos de personas
    updateCuentasClaras();
}

function handlePayRoomSubmit(e) {
    const amount = parseFloat(document.getElementById("pay-room-amount").value) || 0;
    const payment_method = document.getElementById("pay-room-payment-method").value;
    const date = document.getElementById("pay-room-date").value;
    const notes = document.getElementById("pay-room-notes").value;
    
    if (amount <= 0 || !payment_method || !date) return;
    
    // Obtener emoji del medio de pago destino
    const destPM = db.payment_methods.find(p => p.name === payment_method);
    const destEmoji = destPM ? destPM.emoji : "💳";
    
    // 1. Gasto negativo en Habitación (reduce el balance de la habitación)
    const negExpense = {
        id: generateUUID(),
        title: `Liquidación Habitación 🏨 ➜ ${destEmoji} ${payment_method}`,
        amount: -amount,
        category: "Misceláneas",
        payment_method: "Habitación",
        date: date,
        notes: notes,
        updated_at: new Date().toISOString()
    };
    
    // 2. Gasto positivo en el medio de pago destino (registra el cobro en efectivo/tarjeta)
    const posExpense = {
        id: generateUUID(),
        title: `Liquidación Habitación 🏨 ➜ ${destEmoji} ${payment_method}`,
        amount: amount,
        category: "Misceláneas",
        payment_method: payment_method,
        date: date,
        notes: notes,
        updated_at: new Date().toISOString()
    };
    
    db.expenses.push(negExpense);
    db.expenses.push(posExpense);
    
    saveLocal("expenses");
    
    // Forzar renderizado en "all"
    const barEl = document.getElementById("gastos-filter-bar");
    if (barEl) {
        barEl.querySelectorAll(".filter-chip").forEach(c => {
            c.classList.remove("active");
            if (c.getAttribute("data-cat") === "all") c.classList.add("active");
        });
    }
    
    renderExpensesList("all");
}

function renderExpensesList(category = "all") {
    updateGastosSummary();
    
    const listEl = document.getElementById("gastos-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    
    const filtered = category === "all"
        ? db.expenses
        : db.expenses.filter(e => e.category === category);
        
    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state-text" style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">No hay gastos registrados en esta categoría.</div>`;
        return;
    }
    
    // Ordenar por fecha desc, luego por updated_at desc
    const sorted = [...filtered].sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });
    
    sorted.forEach(expense => {
        // Encontrar emoji de la categoría
        const catObj = db.expense_categories.find(c => c.name === expense.category);
        const catEmoji = catObj ? catObj.emoji : "🏷️";
        
        // Encontrar emoji de medio de pago
        const pmObj = db.payment_methods.find(p => p.name === expense.payment_method);
        const pmEmoji = pmObj ? pmObj.emoji : "💳";
        
        const card = document.createElement("div");
        card.className = "gasto-card";
        
        // Formatear fecha a es-AR (DD/MM)
        let formattedDate = "";
        if (expense.date) {
            const [y, m, d] = expense.date.split("-");
            formattedDate = `${d}/${m}`;
        }
        
        card.innerHTML = `
            <div class="gasto-card-left">
                <div class="gasto-icon-wrapper" title="${expense.category}">
                    ${catEmoji}
                </div>
                <div class="gasto-details">
                    <h3>${expense.title}</h3>
                    <div class="gasto-sub-info">
                        <span>${pmEmoji} ${expense.payment_method}</span>
                        ${expense.notes ? `<span class="notes-indicator" title="${expense.notes.replace(/"/g, '&quot;')}">📝</span>` : ""}
                    </div>
                </div>
            </div>
            <div class="gasto-card-right">
                <span class="gasto-amount">${formatUSD(expense.amount)}</span>
                <span class="gasto-date">${formattedDate}</span>
                <div class="gasto-actions">
                    <button class="btn-edit-gasto" data-action="edit" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete-gasto" data-action="delete" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
        `;
        
        card.querySelector('[data-action="edit"]').addEventListener("click", () => openEditExpenseModal(expense.id));
        card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteExpense(expense.id));
        
        listEl.appendChild(card);
    });
}

function openEditExpenseModal(id) {
    const expense = db.expenses.find(e => e.id === id);
    if (!expense) return;
    
    document.getElementById("form-expense").reset();
    
    // Configurar campos generales
    document.getElementById("expense-title").value = expense.title;
    document.getElementById("expense-date").value = expense.date;
    loadExpenseDropdowns();
    document.getElementById("expense-payment-method").value = expense.payment_method;
    document.getElementById("expense-notes").value = expense.notes || "";
    
    const isSplit = !!expense.split_group_id;
    document.getElementById("expense-is-split").checked = isSplit;
    
    const section = document.getElementById("expense-splits-section");
    const amountInput = document.getElementById("expense-amount");
    const catGroup = document.getElementById("expense-category").closest(".form-group");
    const listEl = document.getElementById("expense-splits-list");
    listEl.innerHTML = "";
    
    if (isSplit) {
        document.getElementById("expense-id").value = "";
        document.getElementById("expense-split-group-id").value = expense.split_group_id;
        
        section.style.display = "block";
        amountInput.readOnly = true;
        amountInput.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
        if (catGroup) catGroup.style.display = "none";
        
        // Obtener todos los sub-gastos del grupo
        const groupExpenses = db.expenses.filter(e => e.split_group_id === expense.split_group_id);
        groupExpenses.forEach(ge => {
            addSplitRow(ge.title, ge.amount.toString(), ge.category, ge.debtor_name || "");
        });
    } else {
        document.getElementById("expense-id").value = expense.id;
        document.getElementById("expense-split-group-id").value = "";
        
        section.style.display = "none";
        amountInput.readOnly = false;
        amountInput.style.backgroundColor = "";
        if (catGroup) catGroup.style.display = "block";
        
        document.getElementById("expense-amount").value = expense.amount;
        document.getElementById("expense-category").value = expense.category;
    }
    
    document.getElementById("expense-modal-title").textContent = isSplit ? "Editar Gasto Dividido" : "Editar Gasto";
    document.getElementById("modal-expense").showModal();
}

async function handleExpenseSubmit(e) {
    const id = document.getElementById("expense-id").value;
    const splitGroupId = document.getElementById("expense-split-group-id").value;
    const title = document.getElementById("expense-title").value;
    const amount = parseFloat(document.getElementById("expense-amount").value) || 0;
    const date = document.getElementById("expense-date").value;
    const category = document.getElementById("expense-category").value;
    const payment_method = document.getElementById("expense-payment-method").value;
    const notes = document.getElementById("expense-notes").value;
    const isSplitChecked = document.getElementById("expense-is-split").checked;
    
    // 1. Eliminar versiones previas de esta transacción para evitar duplicados/desfases
    if (splitGroupId) {
        // Estábamos editando un gasto dividido anterior
        db.expenses = db.expenses.filter(exp => exp.split_group_id !== splitGroupId);
        if (window.navigator.onLine && supabaseClient) {
            try {
                await supabaseClient.from("trip_expenses").delete().eq("split_group_id", splitGroupId);
            } catch (err) {
                console.warn("Error eliminando grupo previo de Supabase:", err);
            }
        }
    } else if (id) {
        // Estábamos editando un gasto individual anterior
        db.expenses = db.expenses.filter(exp => exp.id !== id);
        if (window.navigator.onLine && supabaseClient) {
            const isValidUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
            if (isValidUUID(id)) {
                try {
                    await supabaseClient.from("trip_expenses").delete().eq("id", id);
                } catch (err) {
                    console.warn("Error eliminando gasto previo de Supabase:", err);
                }
            }
        }
    }
    
    // 2. Insertar los nuevos registros
    if (isSplitChecked) {
        const finalGroupId = splitGroupId || generateUUID();
        const rows = document.getElementById("expense-splits-list").querySelectorAll(".split-row");
        rows.forEach(row => {
            const sTitle = row.querySelector(".split-title").value || title;
            const sAmount = parseFloat(row.querySelector(".split-amount").value) || 0;
            const sCategory = row.querySelector(".split-category").value;
            const sDebtor = row.querySelector(".split-debtor").value || null;
            
            const newSubExpense = {
                id: generateUUID(),
                title: sTitle,
                amount: sAmount,
                category: sCategory,
                payment_method: payment_method,
                date: date,
                notes: notes,
                split_group_id: finalGroupId,
                debtor_name: sDebtor,
                updated_at: new Date().toISOString()
            };
            db.expenses.push(newSubExpense);
        });
    } else {
        const newExpense = {
            id: id || generateUUID(),
            title: title,
            amount: amount,
            category: category,
            payment_method: payment_method,
            date: date,
            notes: notes,
            split_group_id: null,
            debtor_name: null,
            updated_at: new Date().toISOString()
        };
        db.expenses.push(newExpense);
    }
    
    saveLocal("expenses");
    
    // Obtener la categoría del filtro que está activa antes de guardar
    let activeCat = "all";
    const activeChip = document.querySelector("#gastos-filter-bar .filter-chip.active");
    if (activeChip) {
        activeCat = activeChip.getAttribute("data-cat");
    }
    
    renderGastosFilterBar();
    const barEl = document.getElementById("gastos-filter-bar");
    if (barEl) {
        barEl.querySelectorAll(".filter-chip").forEach(c => {
            c.classList.remove("active");
            if (c.getAttribute("data-cat") === activeCat) c.classList.add("active");
        });
    }
    
    renderExpensesList(activeCat);
}

async function deleteExpense(id) {
    const expense = db.expenses.find(e => e.id === id);
    if (!expense) return;
    
    const isSplit = !!expense.split_group_id;
    const confirmMsg = isSplit
        ? "¿Quieres eliminar esta compra completa con todas sus divisiones?"
        : "¿Quieres eliminar este gasto?";
        
    if (confirm(confirmMsg)) {
        if (isSplit) {
            const splitGroupId = expense.split_group_id;
            db.expenses = db.expenses.filter(e => e.split_group_id !== splitGroupId);
            saveLocal("expenses");
            
            if (window.navigator.onLine && supabaseClient) {
                try {
                    await supabaseClient.from("trip_expenses").delete().eq("split_group_id", splitGroupId);
                } catch (err) {
                    console.warn("Fallo al eliminar grupo de gastos de Supabase:", err);
                }
            }
        } else {
            db.expenses = db.expenses.filter(e => e.id !== id);
            saveLocal("expenses");
            
            const isValidUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
            if (window.navigator.onLine && supabaseClient && isValidUUID(id)) {
                try {
                    await supabaseClient.from("trip_expenses").delete().eq("id", id);
                } catch (err) {
                    console.warn("Fallo al eliminar gasto de Supabase:", err);
                }
            }
        }
        
        const activeChip = document.querySelector("#gastos-filter-bar .filter-chip.active");
        const activeCat = activeChip ? activeChip.getAttribute("data-cat") : "all";
        renderExpensesList(activeCat);
    }
}

// --- UTILERÍAS DE DESGLOSE / DIVISIÓN DE GASTOS ---
function addSplitRow(title = "", amount = "", category = "", debtor = "") {
    const listEl = document.getElementById("expense-splits-list");
    if (!listEl) return;
    
    const row = document.createElement("div");
    row.className = "split-row";
    
    // Crear select de categorías
    let catOptions = "";
    db.expense_categories.forEach(c => {
        const selected = c.name === category ? "selected" : "";
        catOptions += `<option value="${c.name}" ${selected}>${c.emoji} ${c.name}</option>`;
    });
    
    // Crear select de deudores
    const debtors = ["Todos", "Sofi", "Juanma", "Agus", "Cata"];
    let debtorOptions = "";
    debtors.forEach(d => {
        const val = d === "Todos" ? "" : d;
        const selected = val === debtor ? "selected" : "";
        debtorOptions += `<option value="${val}" ${selected}>${d === "Todos" ? "👥 Todos" : "👤 " + d}</option>`;
    });
    
    row.innerHTML = `
        <input type="text" class="apple-input split-title" placeholder="Concepto (ej: Remera)" value="${title}" required style="padding: 6px 10px; font-size:13px;">
        <input type="number" class="apple-input split-amount" placeholder="0.00" step="0.01" min="0.01" value="${amount}" required style="padding: 6px 10px; font-size:13px;">
        <select class="apple-select split-category" required style="padding: 6px 10px; font-size:13px;">
            ${catOptions}
        </select>
        <select class="apple-select split-debtor" required style="padding: 6px 10px; font-size:13px;">
            ${debtorOptions}
        </select>
        <button type="button" class="btn-delete-split-row" title="Eliminar fila">✕</button>
    `;
    
    // Event listener para eliminar fila
    row.querySelector(".btn-delete-split-row").addEventListener("click", () => {
        row.remove();
        calculateSplitTotal();
    });
    
    // Event listener para recalcular total al cambiar monto
    row.querySelector(".split-amount").addEventListener("input", calculateSplitTotal);
    
    listEl.appendChild(row);
    calculateSplitTotal();
}

function calculateSplitTotal() {
    const listEl = document.getElementById("expense-splits-list");
    if (!listEl) return;
    
    let total = 0;
    listEl.querySelectorAll(".split-row").forEach(row => {
        const val = parseFloat(row.querySelector(".split-amount").value) || 0;
        total += val;
    });
    
    document.getElementById("expense-amount").value = total > 0 ? total.toFixed(2) : "";
}

// --- UTILERÍAS DE COBRO / LIQUIDACIÓN DE CUENTAS CLARAS ---
function openSettleDebtModal(person, balance) {
    document.getElementById("form-settle-debt").reset();
    document.getElementById("settle-debt-person").value = person;
    
    const label = document.getElementById("settle-debt-label");
    if (label) label.textContent = `Monto a Cobrar de ${person} (USD)`;
    
    document.getElementById("settle-debt-amount").value = balance ? balance.toFixed(2) : "";
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById("settle-debt-date").value = `${year}-${month}-${day}`;
    
    document.getElementById("settle-debt-notes").value = `Devolución de deudas - ${person}`;
    
    // Cargar medios de pago (filtrando Habitación)
    const selectEl = document.getElementById("settle-debt-payment-method");
    if (selectEl) {
        selectEl.innerHTML = "";
        db.payment_methods.forEach(pm => {
            if (pm.name.toLowerCase() !== "habitación" && !pm.name.toLowerCase().includes("habitacion")) {
                const opt = document.createElement("option");
                opt.value = pm.name;
                opt.textContent = `${pm.emoji} ${pm.name}`;
                selectEl.appendChild(opt);
            }
        });
    }
    
    document.getElementById("modal-settle-debt").showModal();
}

function handleSettleDebtSubmit(e) {
    const person = document.getElementById("settle-debt-person").value;
    const amount = parseFloat(document.getElementById("settle-debt-amount").value) || 0;
    const payment_method = document.getElementById("settle-debt-payment-method").value;
    const date = document.getElementById("settle-debt-date").value;
    const notes = document.getElementById("settle-debt-notes").value;
    
    if (amount <= 0 || !payment_method || !date || !person) return;
    
    // Crear gasto negativo para saldar la deuda
    const settlementExpense = {
        id: generateUUID(),
        title: `Devolución de deudas - 👤 ${person}`,
        amount: -amount,
        category: "Misceláneas",
        payment_method: payment_method,
        date: date,
        notes: notes,
        split_group_id: null,
        debtor_name: person,
        updated_at: new Date().toISOString()
    };
    
    db.expenses.push(settlementExpense);
    saveLocal("expenses");
    
    // Forzar renderizado en "all"
    const barEl = document.getElementById("gastos-filter-bar");
    if (barEl) {
        barEl.querySelectorAll(".filter-chip").forEach(c => {
            c.classList.remove("active");
            if (c.getAttribute("data-cat") === "all") c.classList.add("active");
        });
    }
    
    renderExpensesList("all");
}

function updateCuentasClaras() {
    const cardEl = document.getElementById("cuentas-claras-card");
    const listEl = document.getElementById("cuentas-claras-list");
    if (!cardEl || !listEl) return;
    
    const balances = {
        "Sofi": 0,
        "Juanma": 0,
        "Agus": 0,
        "Cata": 0
    };
    
    db.expenses.forEach(e => {
        if (e.debtor_name && balances.hasOwnProperty(e.debtor_name)) {
            balances[e.debtor_name] += parseFloat(e.amount) || 0;
        }
    });
    
    listEl.innerHTML = "";
    let hasActiveBalances = false;
    
    const avatarMap = {
        "Sofi": '<img src="assets/avatar_sofi.png" style="width:100%; height:100%; object-fit:cover;" alt="Sofi">',
        "Juanma": '<img src="assets/avatar_juanma.png" style="width:100%; height:100%; object-fit:cover;" alt="Juanma">',
        "Agus": '<img src="assets/avatar_agus.jpg" style="width:100%; height:100%; object-fit:cover; object-position:center top;" alt="Agus">',
        "Cata": '<img src="assets/avatar_cata.png" style="width:100%; height:100%; object-fit:contain;" alt="Cata">'
    };
    
    for (const [person, bal] of Object.entries(balances)) {
        if (Math.abs(bal) > 0.009) {
            hasActiveBalances = true;
            
            const row = document.createElement("div");
            row.className = "cuenta-person-row";
            
            const avatarContent = avatarMap[person] || `<span>${person[0]}</span>`;
            const isOwed = bal > 0;
            const balanceText = isOwed ? `Debe ${formatUSD(bal)}` : `A favor ${formatUSD(Math.abs(bal))}`;
            const balanceColor = isOwed ? "var(--warning-color)" : "var(--success-color)";
            
            row.innerHTML = `
                <div class="cuenta-person-left">
                    <div class="cuenta-avatar">
                        ${avatarContent}
                    </div>
                    <span class="cuenta-name">${person}</span>
                </div>
                <div class="cuenta-person-right">
                    <span class="cuenta-balance" style="color: ${balanceColor};">${balanceText}</span>
                    <button class="apple-btn-secondary btn-cobrar" data-person="${person}" data-balance="${bal.toFixed(2)}">
                        ${isOwed ? "Cobrar" : "Liquidar"}
                    </button>
                </div>
            `;
            
            row.querySelector(".btn-cobrar").addEventListener("click", () => {
                openSettleDebtModal(person, Math.abs(bal));
            });
            
            listEl.appendChild(row);
        }
    }
    
    cardEl.style.display = hasActiveBalances ? "block" : "none";
}

function handleCategorySubmit(e) {
    const name = document.getElementById("new-expense-cat-name").value.trim();
    const emoji = document.getElementById("new-expense-cat-emoji").value.trim();
    
    if (!name || !emoji) return;
    
    const exists = db.expense_categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert("Esta categoría ya existe.");
        return;
    }
    
    const newCat = {
        id: generateUUID(),
        name,
        emoji,
        is_default: false,
        updated_at: new Date().toISOString()
    };
    
    db.expense_categories.push(newCat);
    saveLocal("expense_categories");
    
    loadExpenseDropdowns();
    renderGastosFilterBar();
    
    document.getElementById("expense-category").value = name;
}

function handlePaymentMethodSubmit(e) {
    const name = document.getElementById("new-pay-method-name").value.trim();
    const emoji = document.getElementById("new-pay-method-emoji").value.trim();
    
    if (!name || !emoji) return;
    
    const exists = db.payment_methods.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert("Este medio de pago ya existe.");
        return;
    }
    
    const newPM = {
        id: generateUUID(),
        name,
        emoji,
        is_default: false,
        updated_at: new Date().toISOString()
    };
    
    db.payment_methods.push(newPM);
    saveLocal("payment_methods");
    
    loadExpenseDropdowns();
    
    document.getElementById("expense-payment-method").value = name;
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

// Configura los campos del formulario sensible según la categoría
function setupSensitiveFormFields(category) {
    const groups = ["passport-fields-group", "hotel-fields-group", "auto-fields-group", "seguro-fields-group", "otro-fields-group"];
    groups.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
    
    const inputsToClearRequired = [
        "passport-fullname", "passport-number",
        "hotel-name", "hotel-checkin",
        "auto-company", "auto-pickuptime",
        "seguro-company", "seguro-policy"
    ];
    inputsToClearRequired.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.removeAttribute("required");
    });
    
    if (category === "Pasaporte") {
        document.getElementById("passport-fields-group").classList.remove("hidden");
        document.getElementById("passport-fullname").setAttribute("required", "true");
        document.getElementById("passport-number").setAttribute("required", "true");
    } else if (category === "Hotel") {
        document.getElementById("hotel-fields-group").classList.remove("hidden");
        document.getElementById("hotel-name").setAttribute("required", "true");
        document.getElementById("hotel-checkin").setAttribute("required", "true");
    } else if (category === "Auto") {
        document.getElementById("auto-fields-group").classList.remove("hidden");
        document.getElementById("auto-company").setAttribute("required", "true");
        document.getElementById("auto-pickuptime").setAttribute("required", "true");
    } else if (category === "Seguro") {
        document.getElementById("seguro-fields-group").classList.remove("hidden");
        document.getElementById("seguro-company").setAttribute("required", "true");
        document.getElementById("seguro-policy").setAttribute("required", "true");
    } else {
        document.getElementById("otro-fields-group").classList.remove("hidden");
    }
}

// --- RENDERIZAR TAB 5: LOCKER SEGURO (DATOS SENSIBLES) ---
let draggedCategoryKey = null;

function updateSensitiveCounters() {
    const grid = document.getElementById("sensitive-categories-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    sensitiveCategories.forEach(cat => {
        const count = db.sensible.filter(s => s.category === cat.key).length;
        let suffixText = cat.suffix;
        if (count === 1) {
            if (cat.suffix === "documentos") suffixText = "documento";
            else if (cat.suffix === "reservas") suffixText = "reserva";
            else if (cat.suffix === "pólizas") suffixText = "póliza";
            else suffixText = "registro";
        }
        
        const card = document.createElement("button");
        card.className = "sensitive-cat-card";
        card.setAttribute("data-cat", cat.key);
        card.setAttribute("draggable", "true");
        
        card.innerHTML = `
            <div class="cat-icon">${cat.icon}</div>
            <div class="cat-info" style="padding-right: 28px;">
                <h4>${cat.label}</h4>
                <p>${count} ${suffixText}</p>
            </div>
        `;
        
        // Botón para editar la categoría
        const editCatBtn = document.createElement("div");
        editCatBtn.className = "btn-edit-cat-icon";
        editCatBtn.title = "Modificar Categoría";
        editCatBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        `;
        editCatBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openEditCategoryModal(cat.key);
        });
        card.appendChild(editCatBtn);
        
        card.addEventListener("click", () => {
            selectedSensitiveCategory = cat.key;
            openSensitiveCategoryPanel();
        });
        
        // Eventos de arrastre (Drag & Drop)
        card.addEventListener("dragstart", (e) => {
            draggedCategoryKey = cat.key;
            card.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
        });
        
        card.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        
        card.addEventListener("drop", (e) => {
            e.preventDefault();
            if (draggedCategoryKey && draggedCategoryKey !== cat.key) {
                const dragIdx = sensitiveCategories.findIndex(c => c.key === draggedCategoryKey);
                const dropIdx = sensitiveCategories.findIndex(c => c.key === cat.key);
                
                const draggedItem = sensitiveCategories[dragIdx];
                sensitiveCategories.splice(dragIdx, 1);
                sensitiveCategories.splice(dropIdx, 0, draggedItem);
                
                saveCustomCategoriesOrder();
                updateSensitiveCounters();
            }
        });
        
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            draggedCategoryKey = null;
        });
        
        grid.appendChild(card);
    });
}

function openEditCategoryModal(key) {
    const cat = sensitiveCategories.find(c => c.key === key);
    if (!cat) return;
    
    document.getElementById("edit-category-key").value = cat.key;
    document.getElementById("edit-category-name").value = cat.label;
    document.getElementById("edit-category-icon").value = cat.icon;
    
    // Pre-seleccionar el emoji activo en la grilla
    const editGrid = document.getElementById("edit-category-emoji-grid");
    if (editGrid) {
        editGrid.querySelectorAll("button").forEach(btn => {
            if (btn.textContent === cat.icon) {
                btn.classList.add("selected");
            } else {
                btn.classList.remove("selected");
            }
        });
    }
    
    document.getElementById("modal-edit-category").showModal();
}

function toggleSensitiveViews(showDetail) {
    const detailPanel = document.getElementById("sensitive-detail-panel");
    const subheader = document.querySelector("#view-sensible .documents-header");
    const addCatBtnContainer = document.getElementById("sensitive-add-category-btn-container");
    const categoriesGrid = document.getElementById("sensitive-categories-grid");
    
    if (showDetail) {
        if (detailPanel) detailPanel.classList.remove("hidden");
        if (subheader) subheader.classList.add("hidden");
        if (addCatBtnContainer) addCatBtnContainer.classList.add("hidden");
        if (categoriesGrid) categoriesGrid.classList.add("hidden");
    } else {
        if (detailPanel) detailPanel.classList.add("hidden");
        if (subheader) subheader.classList.remove("hidden");
        if (addCatBtnContainer) addCatBtnContainer.classList.remove("hidden");
        if (categoriesGrid) categoriesGrid.classList.remove("hidden");
    }
}

function openSensitiveCategoryPanel() {
    document.getElementById("sensitive-panel-title").textContent = selectedSensitiveCategory;
    renderSensitiveItems();
    toggleSensitiveViews(true);
}

function getFlagEmoji(countryOrNationality) {
    if (!countryOrNationality) return "";
    const clean = countryOrNationality.trim().toLowerCase();
    
    const flagMap = {
        "argentina": "🇦🇷",
        "argentino": "🇦🇷",
        "argentina 🇦🇷": "🇦🇷",
        "españa": "🇪🇸",
        "español": "🇪🇸",
        "española": "🇪🇸",
        "espanol": "🇪🇸",
        "espanola": "🇪🇸",
        "italia": "🇮🇹",
        "italiano": "🇮🇹",
        "italiana": "🇮🇹",
        "estados unidos": "🇺🇸",
        "usa": "🇺🇸",
        "eeuu": "🇺🇸",
        "americano": "🇺🇸",
        "americana": "🇺🇸",
        "uruguay": "🇺🇾",
        "uruguayo": "🇺🇾",
        "uruguaya": "🇺🇾",
        "brasil": "🇧🇷",
        "brasileño": "🇧🇷",
        "brasileña": "🇧🇷",
        "chile": "🇨🇱",
        "chileno": "🇨🇱",
        "chilena": "🇨🇱",
        "colombia": "🇨🇴",
        "colombiano": "🇨🇴",
        "colombiana": "🇨🇴",
        "paraguay": "🇵🇾",
        "paraguayo": "🇵🇾",
        "paraguaya": "🇵🇾",
        "méxico": "🇲🇽",
        "mexico": "🇲🇽",
        "mexicano": "🇲🇽",
        "mexicana": "🇲🇽",
        "suiza": "🇨🇭",
        "suizo": "🇨🇭",
        "alemania": "🇩🇪",
        "alemán": "🇩🇪",
        "alemana": "🇩🇪",
        "francia": "🇫🇷",
        "francés": "🇫🇷",
        "francesa": "🇫🇷",
        "reino unido": "🇬🇧",
        "uk": "🇬🇧",
        "británico": "🇬🇧",
        "portugal": "🇵🇹",
        "portugués": "🇵🇹",
        "canadá": "🇨🇦",
        "canadiense": "🇨🇦",
        "bolivia": "🇧🇴",
        "perú": "🇵🇪",
        "ecuador": "🇪🇨",
        "venezuela": "🇻🇪"
    };
    
    if (flagMap[clean]) return flagMap[clean];
    
    if (clean.includes("argent")) return "🇦🇷";
    if (clean.includes("esp")) return "🇪🇸";
    if (clean.includes("ital")) return "🇮🇹";
    if (clean.includes("urug")) return "🇺🇾";
    if (clean.includes("bras")) return "🇧🇷";
    if (clean.includes("chil")) return "🇨🇱";
    if (clean.includes("colo")) return "🇨🇴";
    if (clean.includes("para")) return "🇵🇾";
    if (clean.includes("mexi")) return "🇲🇽";
    if (clean.includes("estad") || clean.includes("eeuu") || clean.includes("usa") || clean.includes("united states") || clean.includes("america")) return "🇺🇸";
    if (clean.includes("suiz")) return "🇨🇭";
    if (clean.includes("alem")) return "🇩🇪";
    if (clean.includes("fran")) return "🇫🇷";
    if (clean.includes("portu")) return "🇵🇹";
    if (clean.includes("cana")) return "🇨🇦";
    if (clean.includes("boli")) return "🇧🇴";
    if (clean.includes("peru")) return "🇵🇪";
    if (clean.includes("ecua")) return "🇪🇨";
    if (clean.includes("vene")) return "🇻🇪";
    if (clean.includes("uk") || clean.includes("gb") || clean.includes("brit") || clean.includes("ingl")) return "🇬🇧";
    
    return "";
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
        
        let contentHtml = "";
        let flag = "";
        try {
            const data = JSON.parse(item.content);
            const notesText = data.notas ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color); font-style:italic; color:var(--text-secondary); font-size:12.5px;">Nota: ${data.notas}</div>` : "";
            
            if (item.category === "Pasaporte") {
                flag = getFlagEmoji(data.nacionalidad);
                contentHtml = `
                    <div class="passport-detail-box" style="display:flex; flex-direction:column; gap:6px; font-size:13.5px; color:var(--text-secondary);">
                        <div><strong>Nombre:</strong> ${data.nombre || ""}</div>
                        <div><strong>Nro Pasaporte:</strong> ${data.numero || ""}</div>
                        <div><strong>Nacionalidad:</strong> ${data.nacionalidad || ""}</div>
                        <div><strong>Vencimiento:</strong> ${data.vencimiento ? data.vencimiento.split("-").reverse().join("/") : ""}</div>
                        ${notesText}
                    </div>
                `;
            } else if (item.category === "Hotel") {
                contentHtml = `
                    <div class="hotel-detail-box" style="display:flex; flex-direction:column; gap:6px; font-size:13.5px; color:var(--text-secondary);">
                        <div><strong>Hotel:</strong> ${data.nombre || ""}</div>
                        <div><strong>Ubicación:</strong> ${data.direccion || ""}</div>
                        <div><strong>Check-in:</strong> ${data.checkin ? data.checkin.split("-").reverse().join("/") : ""}</div>
                        <div><strong>Check-out:</strong> ${data.checkout ? data.checkout.split("-").reverse().join("/") : ""}</div>
                        <div><strong>Reserva:</strong> <span style="font-family:monospace; background:var(--bg-secondary); padding:2px 6px; border-radius:4px; font-weight:600;">${data.codigo || ""}</span></div>
                        ${notesText}
                    </div>
                `;
            } else if (item.category === "Auto") {
                let checkinDateStr = "";
                if (data.fecha_retiro) {
                    const rDate = new Date(data.fecha_retiro);
                    checkinDateStr = isNaN(rDate.getTime()) ? data.fecha_retiro : rDate.toLocaleString('es-AR', {dateStyle:'short', timeStyle:'short'});
                }
                let checkoutDateStr = "";
                if (data.fecha_devolucion) {
                    const dDate = new Date(data.fecha_devolucion);
                    checkoutDateStr = isNaN(dDate.getTime()) ? data.fecha_devolucion : dDate.toLocaleString('es-AR', {dateStyle:'short', timeStyle:'short'});
                }
                contentHtml = `
                    <div class="auto-detail-box" style="display:flex; flex-direction:column; gap:6px; font-size:13.5px; color:var(--text-secondary);">
                        <div><strong>Rentadora:</strong> ${data.compania || ""} (${data.modelo || ""})</div>
                        <div><strong>Lugar Retiro:</strong> ${data.retiro || ""}</div>
                        <div><strong>Fecha Retiro:</strong> ${checkinDateStr}</div>
                        <div><strong>Fecha Devolución:</strong> ${checkoutDateStr}</div>
                        <div><strong>Reserva:</strong> <span style="font-family:monospace; background:var(--bg-secondary); padding:2px 6px; border-radius:4px; font-weight:600;">${data.codigo || ""}</span></div>
                        ${notesText}
                    </div>
                `;
            } else if (item.category === "Seguro") {
                contentHtml = `
                    <div class="seguro-detail-box" style="display:flex; flex-direction:column; gap:6px; font-size:13.5px; color:var(--text-secondary);">
                        <div><strong>Asistencia:</strong> ${data.compania || ""}</div>
                        <div><strong>Póliza/Voucher:</strong> <span style="font-family:monospace; background:var(--bg-secondary); padding:2px 6px; border-radius:4px; font-weight:600;">${data.poliza || ""}</span></div>
                        <div><strong>Emergencias:</strong> <a href="tel:${data.telefono || ""}" style="color:var(--apple-blue); text-decoration:none; font-weight:500;">${data.telefono || ""}</a></div>
                        <div><strong>Vigencia:</strong> ${data.vigencia_desde ? data.vigencia_desde.split("-").reverse().join("/") : ""} al ${data.vigencia_hasta ? data.vigencia_hasta.split("-").reverse().join("/") : ""}</div>
                        ${notesText}
                    </div>
                `;
            } else {
                contentHtml = `
                    <div class="other-detail-box" style="display:flex; flex-direction:column; gap:6px; font-size:13.5px; color:var(--text-secondary);">
                        <div><strong>Referencia:</strong> ${data.referencia || ""}</div>
                        ${notesText}
                    </div>
                `;
            }
        } catch (e) {
            contentHtml = `<pre>${item.content}</pre>`;
        }
        
        let displayTitle = item.title;
        if (item.category === "Pasaporte" && flag) {
            displayTitle = displayTitle.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "").trim();
            displayTitle = `${flag} ${displayTitle}`;
        }
        
        card.innerHTML = `
            <div class="sensitive-item-card-header">
                <h4>${displayTitle}</h4>
                <div class="card-action-buttons">
                    <button class="btn-edit-card" data-action="edit" title="Editar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete-card" data-action="delete" title="Eliminar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            <div class="sensitive-item-card-body" style="padding-top: 8px;">
                ${contentHtml}
            </div>
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
    
    setupSensitiveFormFields(item.category);
    document.getElementById("sensitive-notes").value = "";
    
    try {
        const data = JSON.parse(item.content);
        document.getElementById("sensitive-notes").value = data.notas || "";
        
        if (item.category === "Pasaporte") {
            document.getElementById("passport-fullname").value = data.nombre || "";
            document.getElementById("passport-number").value = data.numero || "";
            document.getElementById("passport-nationality").value = data.nacionalidad || "";
            document.getElementById("passport-expiry").value = data.vencimiento || "";
        } else if (item.category === "Hotel") {
            document.getElementById("hotel-name").value = data.nombre || "";
            document.getElementById("hotel-address").value = data.direccion || "";
            document.getElementById("hotel-checkin").value = data.checkin || "";
            document.getElementById("hotel-checkout").value = data.checkout || "";
            document.getElementById("hotel-code").value = data.codigo || "";
        } else if (item.category === "Auto") {
            document.getElementById("auto-company").value = data.compania || "";
            document.getElementById("auto-model").value = data.modelo || "";
            document.getElementById("auto-pickup").value = data.retiro || "";
            document.getElementById("auto-pickuptime").value = data.fecha_retiro || "";
            document.getElementById("auto-droptime").value = data.fecha_devolucion || "";
            document.getElementById("auto-code").value = data.codigo || "";
        } else if (item.category === "Seguro") {
            document.getElementById("seguro-company").value = data.compania || "";
            document.getElementById("seguro-policy").value = data.poliza || "";
            document.getElementById("seguro-phone").value = data.telefono || "";
            document.getElementById("seguro-start").value = data.vigencia_desde || "";
            document.getElementById("seguro-end").value = data.vigencia_hasta || "";
        } else {
            document.getElementById("otro-reference").value = data.referencia || "";
        }
    } catch (e) {
        if (item.category === "Pasaporte") {
            document.getElementById("passport-fullname").value = "";
            document.getElementById("passport-number").value = item.content || "";
            document.getElementById("passport-nationality").value = "";
            document.getElementById("passport-expiry").value = "";
        } else if (item.category === "Hotel") {
            document.getElementById("hotel-name").value = item.title;
            document.getElementById("hotel-code").value = item.content || "";
        } else if (item.category === "Auto") {
            document.getElementById("auto-company").value = item.title;
            document.getElementById("auto-code").value = item.content || "";
        } else if (item.category === "Seguro") {
            document.getElementById("seguro-company").value = item.title;
            document.getElementById("seguro-policy").value = item.content || "";
        } else {
            document.getElementById("otro-reference").value = item.content || "";
        }
    }
    
    document.getElementById("sensitive-modal-title").textContent = `Editar Registro: ${item.category}`;
    document.getElementById("modal-sensitive").showModal();
}

function handleSensitiveSubmit(e) {
    const id = document.getElementById("sensitive-id").value;
    const title = document.getElementById("sensitive-title").value.trim();
    const category = document.getElementById("sensitive-category").value;
    
    const notas = document.getElementById("sensitive-notes").value.trim();
    let content = "";
    
    if (category === "Pasaporte") {
        const nombre = document.getElementById("passport-fullname").value.trim();
        const numero = document.getElementById("passport-number").value.trim();
        const nacionalidad = document.getElementById("passport-nationality").value.trim();
        const vencimiento = document.getElementById("passport-expiry").value;
        content = JSON.stringify({ nombre, numero, nacionalidad, vencimiento, notas });
    } else if (category === "Hotel") {
        const nombre = document.getElementById("hotel-name").value.trim();
        const direccion = document.getElementById("hotel-address").value.trim();
        const checkin = document.getElementById("hotel-checkin").value;
        const checkout = document.getElementById("hotel-checkout").value;
        const codigo = document.getElementById("hotel-code").value.trim();
        content = JSON.stringify({ nombre, direccion, checkin, checkout, codigo, notas });
    } else if (category === "Auto") {
        const compania = document.getElementById("auto-company").value.trim();
        const modelo = document.getElementById("auto-model").value.trim();
        const retiro = document.getElementById("auto-pickup").value.trim();
        const fecha_retiro = document.getElementById("auto-pickuptime").value;
        const fecha_devolucion = document.getElementById("auto-droptime").value;
        const codigo = document.getElementById("auto-code").value.trim();
        content = JSON.stringify({ compania, modelo, retiro, fecha_retiro, fecha_devolucion, codigo, notas });
    } else if (category === "Seguro") {
        const compania = document.getElementById("seguro-company").value.trim();
        const poliza = document.getElementById("seguro-policy").value.trim();
        const telefono = document.getElementById("seguro-phone").value.trim();
        const vigencia_desde = document.getElementById("seguro-start").value;
        const vigencia_hasta = document.getElementById("seguro-end").value;
        content = JSON.stringify({ compania, poliza, telefono, vigencia_desde, vigencia_hasta, notas });
    } else {
        const referencia = document.getElementById("otro-reference").value.trim();
        content = JSON.stringify({ referencia, notas });
    }
    
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
        expenses: "trip_expenses",
        expense_categories: "expense_categories",
        payment_methods: "payment_methods",
        compras: "shopping_items"
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
            try {
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
                    
                    // Deduplicar itinerario post-merge (mantener solo la versión más reciente por fecha)
                    if (localKey === "itinerary") {
                        const byDate = {};
                        merged.forEach(item => {
                            const ex = byDate[item.date];
                            if (!ex || new Date(item.updated_at || 0) > new Date(ex.updated_at || 0)) {
                                byDate[item.date] = item;
                            }
                        });
                        const deduped = Object.values(byDate);
                        db[localKey] = deduped;
                        localStorage.setItem(`disney2026_${localKey}`, JSON.stringify(deduped));
                    } else if (localKey === "attractions") {
                        // Deduplicar atracciones post-merge (mantener solo una por nombre en la misma fecha)
                        const byNameAndDate = {};
                        merged.forEach(item => {
                            const key = `${item.date || ""}_${item.name}`;
                            const ex = byNameAndDate[key];
                            if (!ex || new Date(item.updated_at || 0) > new Date(ex.updated_at || 0)) {
                                byNameAndDate[key] = item;
                            }
                        });
                        const deduped = Object.values(byNameAndDate);
                        db[localKey] = deduped;
                        localStorage.setItem(`disney2026_${localKey}`, JSON.stringify(deduped));
                    } else {
                        db[localKey] = merged;
                        localStorage.setItem(`disney2026_${localKey}`, JSON.stringify(merged));
                    }
                }
            } catch (tableErr) {
                console.warn(`Error al sincronizar la tabla ${supabaseTable}:`, tableErr.message || tableErr);
                // No propagamos para que el resto de las tablas válidas sí se sincronicen
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

// --- COMPRAS PER-PROFILE CHECKLIST MANAGEMENT ---
let draggedShoppingItemId = null;

function renderShoppingList() {
    const listEl = document.getElementById("compras-items-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    
    // Actualizar título
    document.getElementById("compras-profile-title").textContent = `Lista de ${activeShoppingProfile}`;
    
    const filtered = db.compras.filter(item => item.profile === activeShoppingProfile);
    
    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state-text" style="text-align: center; color: var(--text-secondary); padding: 40px 20px;">No hay artículos en la lista de ${activeShoppingProfile}. Haz clic en '+ Agregar' para sumar uno.</div>`;
        return;
    }
    
    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = `sensitive-item-card ${item.is_completed ? "completed" : ""}`;
        card.setAttribute("draggable", "true");
        card.style.display = "flex";
        card.style.alignItems = "flex-start";
        card.style.gap = "12px";
        card.style.opacity = item.is_completed ? "0.6" : "1";
        card.style.padding = "14px";
        card.style.cursor = "grab";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.is_completed;
        checkbox.style.marginTop = "3px";
        checkbox.style.transform = "scale(1.2)";
        checkbox.style.cursor = "pointer";
        checkbox.addEventListener("change", () => toggleShoppingItemCompletion(item.id));
        
        const infoDiv = document.createElement("div");
        infoDiv.style.flex = "1";
        
        let subText = "";
        if (item.location) subText += `<div style="font-size: 12px; color: var(--apple-blue); font-weight:600; margin-top: 2px;">📍 ${item.location}</div>`;
        if (item.notes) subText += `<div style="font-size: 13px; color: var(--text-secondary); margin-top: 6px; font-style: italic; border-top: 1px dashed var(--card-border); padding-top: 4px;">${item.notes}</div>`;
        
        infoDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4 style="font-size: 15px; font-weight: 600; margin: 0; text-decoration: ${item.is_completed ? "line-through" : "none"}; color: ${item.is_completed ? "var(--text-secondary)" : "var(--text-primary)"};">${item.title}</h4>
                <div class="card-action-buttons" style="display: flex; gap: 8px; margin-left: 8px;">
                    <button class="btn-edit-card" data-action="edit" title="Editar" style="background:none; border:none; padding:4px; cursor:pointer; color:var(--text-secondary); transition: var(--transition);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete-card" data-action="delete" title="Eliminar" style="background:none; border:none; padding:4px; cursor:pointer; color:var(--text-secondary); transition: var(--transition);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            ${subText}
        `;
        
        infoDiv.querySelector('[data-action="edit"]').addEventListener("click", (e) => {
            e.stopPropagation();
            openEditShoppingItemModal(item.id);
        });
        infoDiv.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
            e.stopPropagation();
            deleteShoppingItem(item.id);
        });
        
        // Eventos de arrastre (Drag & Drop)
        card.addEventListener("dragstart", (e) => {
            draggedShoppingItemId = item.id;
            card.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
        });
        
        card.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        
        card.addEventListener("drop", (e) => {
            e.preventDefault();
            if (draggedShoppingItemId && draggedShoppingItemId !== item.id) {
                const dragIdx = db.compras.findIndex(i => i.id === draggedShoppingItemId);
                const dropIdx = db.compras.findIndex(i => i.id === item.id);
                
                if (dragIdx !== -1 && dropIdx !== -1) {
                    const draggedItem = db.compras[dragIdx];
                    db.compras.splice(dragIdx, 1);
                    db.compras.splice(dropIdx, 0, draggedItem);
                    
                    saveLocal("compras");
                    renderShoppingList();
                }
            }
        });
        
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            draggedShoppingItemId = null;
        });
        
        card.appendChild(checkbox);
        card.appendChild(infoDiv);
        listEl.appendChild(card);
    });
}

function toggleShoppingItemCompletion(id) {
    const itemIdx = db.compras.findIndex(item => item.id === id);
    if (itemIdx !== -1) {
        db.compras[itemIdx].is_completed = !db.compras[itemIdx].is_completed;
        db.compras[itemIdx].updated_at = new Date().toISOString();
        saveLocal("compras");
        renderShoppingList();
    }
}

function openAddShoppingItemModal() {
    document.getElementById("form-compra").reset();
    document.getElementById("compra-id").value = "";
    document.getElementById("compra-profile").value = activeShoppingProfile;
    document.getElementById("compra-modal-title").textContent = `Agregar a ${activeShoppingProfile}`;
    document.getElementById("modal-compra").showModal();
}

function openEditShoppingItemModal(id) {
    const item = db.compras.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById("form-compra").reset();
    document.getElementById("compra-id").value = item.id;
    document.getElementById("compra-profile").value = item.profile;
    document.getElementById("compra-title").value = item.title;
    document.getElementById("compra-location").value = item.location || "";
    document.getElementById("compra-notes").value = item.notes || "";
    
    document.getElementById("compra-modal-title").textContent = `Editar: ${item.title}`;
    document.getElementById("modal-compra").showModal();
}

function handleShoppingSubmit(e) {
    const id = document.getElementById("compra-id").value;
    const profile = document.getElementById("compra-profile").value;
    const title = document.getElementById("compra-title").value.trim();
    const location = document.getElementById("compra-location").value.trim();
    const notes = document.getElementById("compra-notes").value.trim();
    
    if (id) {
        const itemIdx = db.compras.findIndex(i => i.id === id);
        if (itemIdx !== -1) {
            db.compras[itemIdx].title = title;
            db.compras[itemIdx].location = location;
            db.compras[itemIdx].notes = notes;
            db.compras[itemIdx].updated_at = new Date().toISOString();
        }
    } else {
        const newItem = {
            id: generateUUID(),
            profile,
            title,
            location,
            notes,
            is_completed: false,
            updated_at: new Date().toISOString()
        };
        db.compras.push(newItem);
    }
    
    saveLocal("compras");
    renderShoppingList();
}

function deleteShoppingItem(id) {
    if (confirm("¿Estás seguro de eliminar este artículo de la lista de compras?")) {
        db.compras = db.compras.filter(i => i.id !== id);
        saveLocal("compras");
        renderShoppingList();
    }
}
