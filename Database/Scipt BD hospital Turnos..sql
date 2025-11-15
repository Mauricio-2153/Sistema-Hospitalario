--CREAR LA BASE DE DATOS----
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'HospitalTurnos')
BEGIN
    CREATE DATABASE HospitalTurnos;
END
GO

USE HospitalTurnos;
GO

-- 1. TABLA: Usuarios (Médicos y Enfermeros)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        UsuarioID INT PRIMARY KEY IDENTITY(1,1),
        NombreCompleto NVARCHAR(100) NOT NULL,
        Usuario NVARCHAR(50) NOT NULL UNIQUE,
        Contrasena NVARCHAR(255) NOT NULL,
        Rol NVARCHAR(20) NOT NULL CHECK (Rol IN ('Medico', 'Enfermero', 'Admin')),
        ClinicaID INT NULL,
        Estado BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
END
GO

-- 2. TABLA: Clínicas (Áreas de atención)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clinicas')
BEGIN
    CREATE TABLE Clinicas (
        ClinicaID INT PRIMARY KEY IDENTITY(1,1),
        NombreClinica NVARCHAR(100) NOT NULL UNIQUE,
        Descripcion NVARCHAR(255),
        Estado BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
END
GO

-- 3. TABLA: Pacientes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pacientes')
BEGIN
    CREATE TABLE Pacientes (
        PacienteID INT PRIMARY KEY IDENTITY(1,1),
        NombreCompleto NVARCHAR(100) NOT NULL,
        DPI NVARCHAR(20),
        FechaNacimiento DATE,
        Telefono NVARCHAR(15),
        Direccion NVARCHAR(255),
        FechaRegistro DATETIME DEFAULT GETDATE()
    );
END
GO

-- 4. TABLA: Turnos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Turnos')
BEGIN
    CREATE TABLE Turnos (
        TurnoID INT PRIMARY KEY IDENTITY(1,1),
        NumeroTurno NVARCHAR(20) NOT NULL,
        PacienteID INT NOT NULL,
        ClinicaID INT NOT NULL,
        UsuarioEnfermeroID INT NOT NULL,
        UsuarioMedicoID INT NULL,
        Estado NVARCHAR(20) NOT NULL DEFAULT 'En Espera' 
            CHECK (Estado IN ('En Espera', 'Llamando', 'Atendiendo', 'Finalizado', 'Ausente')),
        Prioridad INT DEFAULT 0,
        MotivoConsulta NVARCHAR(500),
        FechaHoraRegistro DATETIME DEFAULT GETDATE(),
        FechaHoraLlamado DATETIME NULL,
        FechaHoraAtencion DATETIME NULL,
        FechaHoraFinalizado DATETIME NULL,
        Observaciones NVARCHAR(500)
    );
END
GO

-- AGREGAR RELACIONES
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Usuarios_Clinicas')
BEGIN
    ALTER TABLE Usuarios
    ADD CONSTRAINT FK_Usuarios_Clinicas
    FOREIGN KEY (ClinicaID) REFERENCES Clinicas(ClinicaID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Turnos_Pacientes')
BEGIN
    ALTER TABLE Turnos
    ADD CONSTRAINT FK_Turnos_Pacientes
    FOREIGN KEY (PacienteID) REFERENCES Pacientes(PacienteID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Turnos_Clinicas')
BEGIN
    ALTER TABLE Turnos
    ADD CONSTRAINT FK_Turnos_Clinicas
    FOREIGN KEY (ClinicaID) REFERENCES Clinicas(ClinicaID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Turnos_UsuarioEnfermero')
BEGIN
    ALTER TABLE Turnos
    ADD CONSTRAINT FK_Turnos_UsuarioEnfermero
    FOREIGN KEY (UsuarioEnfermeroID) REFERENCES Usuarios(UsuarioID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Turnos_UsuarioMedico')
BEGIN
    ALTER TABLE Turnos
    ADD CONSTRAINT FK_Turnos_UsuarioMedico
    FOREIGN KEY (UsuarioMedicoID) REFERENCES Usuarios(UsuarioID);
END
GO

-- 7. INSERTAR DATOS INICIALES
INSERT INTO Clinicas (NombreClinica, Descripcion) VALUES
('Cardiología', 'Atención de enfermedades del corazón'),
('Pediatría', 'Atención médica infantil'),
('Medicina General', 'Consulta general'),
('Traumatología', 'Lesiones y fracturas'),
('Ginecología', 'Salud de la mujer');
GO

INSERT INTO Usuarios (NombreCompleto, Usuario, Contrasena, Rol, ClinicaID) VALUES
('Administrador del Sistema', 'admin', 'admin123', 'Admin', NULL),
('María López García', 'enfermero1', 'enfermero123', 'Enfermero', NULL),
('Dr. Carlos Ramírez', 'medico1', 'medico123', 'Medico', 1),
('Dra. Ana Martínez', 'medico2', 'medico123', 'Medico', 2),
('Dr. José Hernández', 'medico3', 'medico123', 'Medico', 3);
GO

INSERT INTO Pacientes (NombreCompleto, DPI, FechaNacimiento, Telefono, Direccion) VALUES
('Juan Pérez', '2839 54398 0101', '02-08-1994', '55551234', 'Zona 1, Ciudad'),
('María González', '3012 34566 0201', '22-05-1988', '55555678', 'Zona 5, Ciudad'),
('Pedro Rodríguez', '2966 02566 0101', '01-10-2001', '55559999', 'Zona 10, Ciudad');
GO

-- PROCEDIMIENTO: Obtener turnos en espera
CREATE OR ALTER PROCEDURE sp_ObtenerTurnosEnEspera
    @ClinicaID INT
AS
BEGIN
    SELECT 
        t.TurnoID,
        t.NumeroTurno,
        t.Estado,
        p.NombreCompleto AS Paciente,
        t.MotivoConsulta,
        t.FechaHoraRegistro,
        c.NombreClinica
    FROM Turnos t
    INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
    INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
    WHERE t.ClinicaID = @ClinicaID 
        AND t.Estado IN ('En Espera', 'Llamando')
    ORDER BY t.FechaHoraRegistro ASC;
END
GO

