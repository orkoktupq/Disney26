-- Script de Configuración de Base de Datos para Supabase
-- Disney & Universal Itinerary 2026
-- Ejecuta este script en el editor SQL de tu panel de Supabase.

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Itinerario Diario
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    is_park_day BOOLEAN DEFAULT false,
    park_name VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Lista de Atracciones por Parque
CREATE TABLE IF NOT EXISTS attraction_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    park VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    land VARCHAR(100) NOT NULL,
    date DATE, -- Asignado a qué día
    is_completed BOOLEAN DEFAULT false,
    visit_order INT DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de Datos Sensibles
CREATE TABLE IF NOT EXISTS sensitive_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL, -- 'Pasaporte', 'Hotel', 'Auto', 'Seguro', 'Otro'
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de Vuelos
CREATE TABLE IF NOT EXISTS flight_itinerary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number VARCHAR(50) NOT NULL,
    airline VARCHAR(100) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,
    arrival_airport VARCHAR(10) NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(20) NOT NULL,
    code VARCHAR(100) NOT NULL, -- Código de reserva
    date DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla de Tips de Viaje
CREATE TABLE IF NOT EXISTS travel_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL, -- 'Disney', 'Universal', 'General'
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(50) NOT NULL, -- 'Juanma' o 'Sofi'
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Limpiar tablas si ya existen datos previos para evitar duplicados
TRUNCATE TABLE itinerary_items CASCADE;
TRUNCATE TABLE attraction_checklist CASCADE;
TRUNCATE TABLE sensitive_details CASCADE;
TRUNCATE TABLE flight_itinerary CASCADE;
TRUNCATE TABLE travel_tips CASCADE;

-- =========================================================================
-- DATOS DE EJEMPLO REALISTAS
-- =========================================================================

-- 1. Insertar días de Itinerario (17/07/2026 al 31/07/2026)
INSERT INTO itinerary_items (date, title, notes, is_park_day, park_name) VALUES
('2026-07-17', 'Llegada a Orlando ✈️', 'Vuelo EZE -> MCO. Retiro del auto de alquiler en Hertz y check-in en Universal Cabana Bay Beach Resort. Compras rápidas en Walmart.', false, NULL),
('2026-07-18', 'Magic Kingdom 🏰', '¡Primer día de parque! Llegar temprano para el Rope Drop. Reservar TRON y Tiana en Virtual Queue/Lightning Lane a las 7:00 AM.', true, 'Magic Kingdom'),
('2026-07-19', 'Epcot 🚀', 'Visita a Epcot. Cosmic Rewind es prioridad (Virtual Queue a las 7:00 AM o Lightning Lane Single Pass). Pasear por los pabellones de World Showcase en la tarde.', true, 'Epcot'),
('2026-07-20', 'Universal Studios Florida 🎬', 'Visita a Universal Studios. Diagon Alley (Gringotts), Revenge of the Mummy y Men in Black. Almorzar en el Caldero Chorreante.', true, 'Universal Studios'),
('2026-07-21', 'Disney''s Hollywood Studios 🎬', 'Mundo Star Wars (Galaxy''s Edge) a primera hora. Rise of the Resistance y Slinky Dog Dash son las prioridades del día.', true, 'Hollywood Studios'),
('2026-07-22', 'Día de Compras y Descanso 🛍️', 'Mañana libre en la pileta de Cabana Bay. Tarde de compras en Orlando Premium Outlets (International Dr) y cena en Disney Springs.', false, NULL),
('2026-07-23', 'Universal''s Islands of Adventure 🦖', 'Atracciones principales: VelociCoaster, Hagrid''s Motorbike Adventure y Spider-Man. Tomar el Hogwarts Express hacia Universal Studios.', true, 'Islands of Adventure'),
('2026-07-24', 'Disney''s Animal Kingdom 🌳', 'Entrar temprano para Avatar Flight of Passage. Expedition Everest y el safari Kilimanjaro Safaris en la mañana para ver los animales activos.', true, 'Animal Kingdom'),
('2026-07-25', 'Volcano Bay 🌊', 'Día de relax y toboganes en el parque acuático de Universal. Utilizar la pulsera TapuTapu para reservar tiempos de fila virtual.', true, 'Volcano Bay'),
('2026-07-26', 'Magic Kingdom (Día 2) 🏰', 'Completar atracciones pendientes de Fantasyland y Frontierland. Ver el show de fuegos artificiales Happily Ever After desde una buena ubicación.', true, 'Magic Kingdom'),
('2026-07-27', 'Islands of Adventure (Día 2) 🦖', 'Repetir VelociCoaster y Hagrid''s. Disfrutar los detalles de Hogsmeade y almorzar en Las Tres Escobas.', true, 'Islands of Adventure'),
('2026-07-28', 'Epcot (Día 2) 🚀', 'Repetir Cosmic Rewind y Soarin''. Caminar con calma por World Showcase, cenar en el pabellón de Japón y ver el show nocturno Luminous.', true, 'Epcot'),
('2026-07-29', 'Hollywood Studios (Día 2) 🎬', 'Hacer Toy Story Mania, Tower of Terror y ver el show nocturno Fantasmic! (llegar 45 min antes).', true, 'Hollywood Studios'),
('2026-07-30', 'Últimas Compras y Valijas 🎒', 'Último día para comprar recuerdos en Target y Disney Springs. Armar valijas y pesar el equipaje para evitar sorpresas en el aeropuerto.', false, NULL),
('2026-07-31', 'Regreso a Casa ✈️', 'Check-out del hotel Cabana Bay. Devolución del auto en Hertz (MCO). Vuelo de regreso MCO -> Buenos Aires.', false, NULL);

-- 2. Insertar Atracciones Predeterminadas por Parque
INSERT INTO attraction_checklist (park, name, land, date, is_completed, visit_order, notes) VALUES
-- Magic Kingdom
('Magic Kingdom', 'TRON Lightcycle / Run', 'Tomorrowland', '2026-07-18', false, 1, 'Virtual Queue Grupo 12 a las 7 AM. Imprescindible guardar todo en lockers.'),
('Magic Kingdom', 'Space Mountain', 'Tomorrowland', '2026-07-18', false, 2, 'Fila rápida si se hace temprano justo después de TRON.'),
('Magic Kingdom', 'Buzz Lightyear''s Space Ranger Spin', 'Tomorrowland', '2026-07-18', false, 3, 'Competir Juanma vs Sofi. ¡A apuntar a los triángulos de 100k puntos!'),
('Magic Kingdom', 'Seven Dwarfs Mine Train', 'Fantasyland', '2026-07-18', false, 4, 'Fila alta. Evaluar Lightning Lane Single Pass.'),
('Magic Kingdom', 'Peter Pan''s Flight', 'Fantasyland', '2026-07-18', false, 5, 'Un clásico con fila siempre larga.'),
('Magic Kingdom', 'Haunted Mansion', 'Liberty Square', '2026-07-18', false, 6, 'Perfecto para hacer al mediodía (tiene aire acondicionado).'),
('Magic Kingdom', 'Tiana''s Bayou Adventure', 'Frontierland', '2026-07-18', false, 7, 'Nueva atracción. Virtual Queue o comprar Lightning Lane.'),
('Magic Kingdom', 'Big Thunder Mountain Railroad', 'Frontierland', '2026-07-18', false, 8, '¡La montaña rusa más salvaje del oeste! Mejor hacerla al atardecer.'),
('Magic Kingdom', 'Pirates of the Caribbean', 'Adventureland', '2026-07-18', false, 9, 'Clásico imperdible. Fila fluida.'),
('Magic Kingdom', 'Jungle Cruise', 'Adventureland', '2026-07-18', false, 10, 'Fila lenta en la tarde. Intentar reservar Lightning Lane.'),
-- Epcot
('Epcot', 'Guardians of the Galaxy: Cosmic Rewind', 'World Discovery', '2026-07-19', false, 1, '¡Mejor montaña rusa de Orlando! Virtual Queue a las 7 AM o pago individual.'),
('Epcot', 'Test Track', 'World Discovery', '2026-07-19', false, 2, 'Diseñar el auto antes de subir. Fila suele ser alta.'),
('Epcot', 'Soarin'' Around the World', 'World Nature', '2026-07-19', false, 3, 'Simulador de vuelo hermoso. Pedir fila central si es posible.'),
('Epcot', 'Living with the Land', 'World Nature', '2026-07-19', false, 4, 'Paseo en bote tranquilo sobre cultivos del futuro. Ideal para descansar.'),
('Epcot', 'Frozen Ever After', 'World Showcase', '2026-07-19', false, 5, 'Ubicado en Noruega. Fila alta, intentar ir en la tarde.'),
('Epcot', 'Remy''s Ratatouille Adventure', 'World Showcase', '2026-07-19', false, 6, 'Ubicado en Francia. Hermoso simulador 3D. Filas muy largas en el día.'),
-- Hollywood Studios
('Hollywood Studios', 'Star Wars: Rise of the Resistance', 'Galaxy''s Edge', '2026-07-21', false, 1, 'Atracción super inmersiva. Si falla temprano, intentar a la hora del almuerzo.'),
('Hollywood Studios', 'Millennium Falcon: Smugglers Run', 'Galaxy''s Edge', '2026-07-21', false, 2, 'Juanma piloto, Sofi ingeniera. Divertida interactiva.'),
('Hollywood Studios', 'Slinky Dog Dash', 'Toy Story Land', '2026-07-21', false, 3, 'Montaña rusa familiar pero muy divertida. Fila siempre de más de 60 min.'),
('Hollywood Studios', 'Toy Story Mania!', 'Toy Story Land', '2026-07-21', false, 4, 'Juego de puntería 3D adictivo.'),
('Hollywood Studios', 'Tower of Terror', 'Sunset Boulevard', '2026-07-21', false, 5, 'Caídas libres aleatorias. Estética de hotel abandonado espectacular.'),
('Hollywood Studios', 'Rock ''n'' Roller Coaster Starring Aerosmith', 'Sunset Boulevard', '2026-07-21', false, 6, 'Salida a toda velocidad a oscuras con música de Aerosmith.'),
-- Islands of Adventure
('Islands of Adventure', 'VelociCoaster', 'Jurassic Park', '2026-07-23', false, 1, 'Impresionante montaña rusa de lanzamiento. Fila obligatoria pero avanza rápido.'),
('Islands of Adventure', 'Hagrid''s Magical Creatures Motorbike Adventure', 'Hogsmeade', '2026-07-23', false, 2, 'Prioridad N°1 en Islands. No acepta Express Pass normal. Rope Drop indispensable.'),
('Islands of Adventure', 'Harry Potter and the Forbidden Journey', 'Hogsmeade', '2026-07-23', false, 3, 'Dentro del castillo de Hogwarts. Da un poco de mareo, tomar recaudo.'),
('Islands of Adventure', 'The Amazing Adventures of Spider-Man', 'Marvel Super Hero Island', '2026-07-23', false, 4, 'Simulador de juego clásico en 3D espectacular.'),
('Islands of Adventure', 'The Incredible Hulk Coaster', 'Marvel Super Hero Island', '2026-07-23', false, 5, 'Lanzamiento inicial potente, giros de alta velocidad.'),
-- Universal Studios
('Universal Studios', 'Harry Potter and the Escape from Gringotts', 'Diagon Alley', '2026-07-20', false, 1, 'Híbrido montaña rusa y simulador dentro del banco de Gringotts. Increíble.'),
('Universal Studios', 'Revenge of the Mummy', 'New York', '2026-07-20', false, 2, 'Montaña rusa bajo techo. Muy divertida y con excelente ambientación.'),
('Universal Studios', 'Men in Black: Alien Attack', 'World Expo', '2026-07-20', false, 3, 'Juego de disparar a alienígenas. Quien pierda paga los donuts de Lard Lad.'),
('Universal Studios', 'The Simpsons Ride', 'Springfield', '2026-07-20', false, 4, 'Simulador muy divertido con el humor clásico de la serie.'),
('Universal Studios', 'Despicable Me Minion Mayhem', 'Minion Land', '2026-07-20', false, 5, 'Atracción muy tierna para reír un rato.');

-- 3. Insertar Vuelos Predeterminados
INSERT INTO flight_itinerary (flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time, code, date) VALUES
('AA908', 'American Airlines', 'EZE', 'MIA', '22:30', '06:45 +1', 'RESERVA_AA_JMSF26_1', '2026-07-16'),
('AA2412', 'American Airlines', 'MIA', 'MCO', '08:30', '09:45', 'RESERVA_AA_JMSF26_1', '2026-07-17'),
('AA907', 'American Airlines', 'MCO', 'MIA', '17:15', '18:30', 'RESERVA_AA_JMSF26_2', '2026-07-31'),
('AA909', 'American Airlines', 'MIA', 'EZE', '20:15', '06:15 +1', 'RESERVA_AA_JMSF26_2', '2026-07-31');

-- 4. Insertar Datos Sensibles Predeterminados
INSERT INTO sensitive_details (category, title, content) VALUES
('Pasaporte', 'Pasaporte de Juanma 🇦🇷', 'Número: AA1234567\nFecha Exp: 12/10/2032\nNacionalidad: Argentina\nEmitido por: Renaper'),
('Pasaporte', 'Pasaporte de Sofi 🇦🇷', 'Número: AB9876543\nFecha Exp: 24/05/2034\nNacionalidad: Argentina\nEmitido por: Renaper'),
('Hotel', 'Reserva Hotel Universal Cabana Bay Beach Resort 🏨', 'Dirección: 6550 Adventure Way, Orlando, FL 32819\nCheck-in: 17/07/2026 (16:00)\nCheck-out: 31/07/2026 (11:00)\nCódigo de Confirmación: #UNIV-9827361\nHabitación: Standard 2 Queen Beds - Volcano View'),
('Auto', 'Alquiler de Auto - Hertz MCO 🚗', 'Ubicación: Aeropuerto Internacional de Orlando (Terminal A/B Hertz Counter)\nCategoría: SUV Mediano (Toyota RAV4 o similar)\nCheck-in: 17/07/2026 (10:30 AM)\nCheck-out: 31/07/2026 (14:00 PM)\nReserva: #HZ-82736412\nSeguro Incluido: CDW, LIS y kilometraje ilimitado'),
('Seguro', 'Asistencia al Viajero - Assist Card Premium 🏥', 'Compañía: Assist Card\nNúmero de Póliza: #AC-9928374-12\nTitulares: Juan Manuel López & Sofía ...\nTeléfono Emergencias (USA): +1 800 874 2222\nCobertura: Hasta USD 150,000 por persona por accidente o enfermedad.');

-- 5. Insertar Tips Predeterminados
INSERT INTO travel_tips (category, title, content, author) VALUES
('Disney', 'Virtual Queue a las 7:00 AM 📱', 'Para entrar a la fila virtual de TRON Lightcycle / Run o Cosmic Rewind, abre la app My Disney Experience a las 6:58 AM. Ve a "Virtual Queues", selecciona a tu grupo y dale click a "Refresh" exactamente a las 7:00:00 AM. Si no consigues, hay otra oportunidad a las 1:00 PM estando dentro del parque.', 'Juanma'),
('Universal', 'Estrategia para Hagrid''s Motorbike 🏍️', 'Esta atracción es la más popular de Universal y no ofrece fila Express normal. La mejor estrategia es hacer "Rope Drop" (llegar 45 minutos antes de la apertura oficial del parque Islands of Adventure) e ir corriendo directamente hacia allí. La otra buena opción es hacer la fila al final del día, 15 minutos antes del cierre del parque.', 'Sofi'),
('Disney', 'Ahorra batería con el modo Ahorro de Energía 🔋', 'La app My Disney Experience consume muchísima batería por usar GPS continuamente para los mapas y Lightning Lanes. Pon tu iPhone en "Modo de bajo consumo" desde la mañana, lleva una batería portátil (Powerbank) potente en la mochila, y apaga el Wi-Fi si notas que la señal pública del parque está muy inestable.', 'Juanma'),
('General', 'Evitar las horas de calor pico (12 PM - 3 PM) ☀️', 'Julio en Orlando es extremadamente caluroso y húmedo, con lluvias rápidas por la tarde. Usa las horas del mediodía para comer en restaurantes con aire acondicionado, ver shows en teatros cerrados (como Indiana Jones en Hollywood Studios o PhilharMagic en Magic Kingdom) o volver al hotel a bañarse en la pileta y regresar al parque al atardecer.', 'Sofi'),
('Universal', 'Vasos refill de Coca-Cola Freestyle 🥤', 'Vale mucho la pena comprar el vaso recargable "Coca-Cola Freestyle" en Universal. Pagas un precio fijo por día y puedes recargar bebidas en decenas de máquinas automáticas cada 10 minutos. Ideal para mantenerse hidratado con el calor de julio.', 'Juanma');
