-- ==========================================
--  ESSENTIAL TM - Configuración de Base de Datos
--  Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1. Crear tabla de pacientes (con campos completos)
create table pacientes (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  telefono text,
  email text,
  historia_clinica text,
  notas text,
  fecha_registro timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Crear tabla de sesiones por paciente
create table sesiones (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  fecha date not null default current_date,
  motivo text,
  tratamiento text,
  observaciones text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Crear tabla de imágenes vinculadas a pacientes
create table imagenes_paciente (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  sesion_id uuid references sesiones(id) on delete set null,
  url_imagen text not null,
  descripcion text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Habilitar seguridad por filas (RLS)
alter table pacientes enable row level security;
alter table sesiones enable row level security;
alter table imagenes_paciente enable row level security;

-- 5. Políticas: usuarios autenticados pueden todo (equipo pequeño y confiable)
create policy "Acceso total a usuarios autenticados"
  on pacientes for all to authenticated using (true);

create policy "Acceso total a usuarios autenticados"
  on sesiones for all to authenticated using (true);

create policy "Acceso total a usuarios autenticados"
  on imagenes_paciente for all to authenticated using (true);

-- 6. Políticas para Storage (bucket: fotos-pacientes)
-- NOTA: Ejecutar SOLO después de crear el bucket desde el Dashboard
create policy "Usuarios autenticados pueden leer fotos"
  on storage.objects for select to authenticated using (bucket_id = 'fotos-pacientes');

create policy "Usuarios autenticados pueden subir fotos"
  on storage.objects for insert to authenticated using (bucket_id = 'fotos-pacientes');

create policy "Usuarios autenticados pueden eliminar fotos"
  on storage.objects for delete to authenticated using (bucket_id = 'fotos-pacientes');
