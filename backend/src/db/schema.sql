IF OBJECT_ID('dbo.categorias', 'U') IS NULL
CREATE TABLE dbo.categorias (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(500) NULL
);

IF OBJECT_ID('dbo.usuarios', 'U') IS NULL
CREATE TABLE dbo.usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre_usuario NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    tipo NVARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'emprendedor', 'admin', 'moderador')),
    activo BIT NOT NULL DEFAULT 1,
    fecha_registro DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('dbo.emprendimientos', 'U') IS NULL
CREATE TABLE dbo.emprendimientos (
    id_emprendimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES dbo.usuarios(id_usuario),
    nombre NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    telefono NVARCHAR(50) NULL,
    ubicacion NVARCHAR(255) NULL,
    imagen_perfil NVARCHAR(500) NULL,
    redes_sociales NVARCHAR(255) NULL,
    id_categoria INT NULL REFERENCES dbo.categorias(id_categoria),
    activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    latitud FLOAT NULL,
    longitud FLOAT NULL
);

IF OBJECT_ID('dbo.productos', 'U') IS NULL
CREATE TABLE dbo.productos (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    id_emprendimiento INT NOT NULL REFERENCES dbo.emprendimientos(id_emprendimiento),
    id_categoria INT NULL REFERENCES dbo.categorias(id_categoria),
    nombre NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    precio DECIMAL(10,2) NOT NULL,
    destacado BIT NOT NULL DEFAULT 0,
    activo BIT NOT NULL DEFAULT 1,
    fecha_publicacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('dbo.imagenes_producto', 'U') IS NULL
CREATE TABLE dbo.imagenes_producto (
    id_imagen INT IDENTITY(1,1) PRIMARY KEY,
    id_producto INT NOT NULL REFERENCES dbo.productos(id_producto),
    url NVARCHAR(1000) NOT NULL,
    orden INT NOT NULL DEFAULT 0
);

IF OBJECT_ID('dbo.servicios', 'U') IS NULL
CREATE TABLE dbo.servicios (
    id_servicio INT IDENTITY(1,1) PRIMARY KEY,
    id_emprendimiento INT NOT NULL REFERENCES dbo.emprendimientos(id_emprendimiento),
    nombre NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    precio DECIMAL(10,2) NULL,
    activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('dbo.favoritos', 'U') IS NULL
CREATE TABLE dbo.favoritos (
    id_favorito INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES dbo.usuarios(id_usuario),
    id_producto INT NOT NULL REFERENCES dbo.productos(id_producto),
    fecha DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_favoritos_usuario_producto UNIQUE (id_usuario, id_producto)
);

IF OBJECT_ID('dbo.solicitudes_presupuesto', 'U') IS NULL
CREATE TABLE dbo.solicitudes_presupuesto (
    id_solicitud INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES dbo.usuarios(id_usuario),
    id_emprendimiento INT NOT NULL REFERENCES dbo.emprendimientos(id_emprendimiento),
    mensaje NVARCHAR(MAX) NULL,
    estado NVARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('dbo.reportes', 'U') IS NULL
CREATE TABLE dbo.reportes (
    id_reporte INT IDENTITY(1,1) PRIMARY KEY,
    id_reportante INT NOT NULL REFERENCES dbo.usuarios(id_usuario),
    id_reportado INT NOT NULL REFERENCES dbo.usuarios(id_usuario),
    id_producto INT NULL REFERENCES dbo.productos(id_producto),
    motivo NVARCHAR(500) NOT NULL,
    comentarios NVARCHAR(500) NULL,
    estado NVARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'resuelto', 'descartado')),
    fecha DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('dbo.emprendedor_destacado', 'U') IS NULL
CREATE TABLE dbo.emprendedor_destacado (
    id INT PRIMARY KEY DEFAULT 1,
    id_emprendimiento INT NOT NULL,
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (id_emprendimiento) REFERENCES dbo.emprendimientos(id_emprendimiento) ON DELETE CASCADE,
    CONSTRAINT chk_single_row CHECK (id = 1)
);

