# Spec Delta

## Purpose

Garantiza que cada usuario autenticado solo acceda al panel correspondiente a su rol (`staff` o `parent`) de open-daycare: el proxy valida el rol por URL en cada request, `/` enruta por rol, y los layouts de cada panel re-verifican el rol antes de renderizar.

## ADDED Requirements

### Requirement: Resolutor de rol en la ruta raíz

La ruta `/`, para un usuario autenticado, SHALL redirigir al panel que corresponde a su rol leído de la base de datos: `/staff` si el rol es `staff`, `/familia` si es `parent`.

#### Scenario: Staff entra a la raíz

- **WHEN** un usuario autenticado con rol `staff` navega a `/`
- **THEN** es redirigido a `/staff` (o a la página raíz del panel staff) sin ver contenido de `/`

#### Scenario: Padre entra a la raíz

- **WHEN** un usuario autenticado con rol `parent` navega a `/`
- **THEN** es redirigido a `/familia` (o a la página raíz del panel familia)

#### Scenario: Anónimo entra a la raíz

- **WHEN** un visitante sin sesión navega a `/`
- **THEN** es redirigido a `/login`

### Requirement: Guard de rol en el proxy para rutas staff

El proxy de la aplicación SHALL validar en cada request las rutas bajo `/staff/*`, permitiendo acceso solo al usuario autenticado con rol `staff` según la base de datos. Un usuario autenticado con otro rol SHALL ser redirigido a la raíz `/` (que re-enruta a su panel); un visitante sin sesión SHALL ser redirigido a `/login`.

#### Scenario: Parent intenta una ruta de staff

- **WHEN** un usuario autenticado con rol `parent` navega a una ruta bajo `/staff/*`
- **THEN** no ve el contenido de la página y es redirigido a su panel familia

#### Scenario: Staff navega su panel

- **WHEN** un usuario autenticado con rol `staff` navega a `/staff` o `/staff/kids`
- **THEN** la página se muestra normalmente

#### Scenario: Anónimo en ruta de staff

- **WHEN** un visitante sin sesión navega a una ruta bajo `/staff/*`
- **THEN** es redirigido a `/login`

### Requirement: Guard de rol en el proxy para rutas familia

El proxy SHALL validar en cada request las rutas bajo `/familia/*`,permitiendo acceso solo al usuario autenticado con rol `parent`. Un `staff` autenticado que intente entrar SHALL ser redirigido a `/staff`; un visitante sin sesión SHALL ir a `/login`.

#### Scenario: Staff intenta el panel familia

- **WHEN** un usuario autenticado con rol `staff` navega a una ruta bajo `/familia/*`
- **THEN** no ve el contenido de la página y es redirigido a su panel staff

#### Scenario: Parent navega su panel

- **WHEN** un usuario autenticado con rol `parent` navega a una ruta bajo `/familia/*`
- **THEN** la página se muestra normalmente

### Requirement: Guard defensivo en el layout de cada panel

El layout de cada panel (`staff` y `familia`) SHALL re-verificar el rol del usuario antes de renderizar y SHALL redirigir al panel opuesto si no corresponde, de forma que un bypass del proxy (por ejemplo, cambio del matcher) no revele contenido del panel contrario.

#### Scenario: El layout bloquea un rol incorrecto

- **WHEN** el render del layout de un panel es llamado con una sesión cuyo rol no corresponde al panel (aunque el proxy no haya bloqueado)
- **THEN** la request termina en un redirect al panel opuesto y nada del panel es renderizado

### Requirement: Refresco de sesión preservado

El guard de rol en el proxy SHALL coexistir con el refresco de sesión existente: la validación de rol no debe interferir con la lógica de sesión (no borrar el refresco de claims ni insertar código entre la creación del cliente y la resolución de la sesión, según las reglas del proyecto).

#### Scenario: Sesión expirada se refresca y se valida rol

- **WHEN** un usuario con sesión vencida navega a una ruta protegida
- **THEN** la sesión se refresca como hoy y, después de eso, el rol se evalúa con el rol vigente en la base de datos antes de permitir el acceso

### Requirement: Post-login enruta por rol

La acción de login SHALL mantener su redirect hacia `/`, y el resolutor de rol SHALL atender cualquier panel según el rol del usuario; el nombre de la URL destino de login no SHALL depender del rol.

#### Scenario: Login de un parent

- **WHEN** un usuario con rol `parent` inicia sesión correctamente
- **THEN** termina en `/familia` tras pasar por `/`

#### Scenario: Login de un staff

- **WHEN** un usuario con rol `staff` inicia sesión correctamente
- **THEN** termina en `/staff` tras pasar por `/`

### Requirement: Rol mutable re-evaluado por request

El guard SHALL siempre evaluar el rol contra la base de datos en el request en curso, nunca un valor cacheado de la sesión o de un token: si el rol de un usuario cambia en la base de datos (por ejemplo, un staff pasa a ser `parent`), el siguiente request de ese usuario SHALL resolver el panel según el rol nuevo, sin requerir logout forzado ni re-emisión de sesión.

#### Scenario: Staff cambia a parent con sesión viva

- **WHEN** el rol guardado en la BD de un usuario cambia de `staff` a `parent` mientras su sesión sigue activa
- **THEN** el próximo request del usuario a una ruta `/staff/*` lo redirige a `/familia` sin requerir logout
