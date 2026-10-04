package com.reservapp.reserva.service;

import com.reservapp.comida.entity.Comida;
import com.reservapp.comida.entity.EstadoComida;
import com.reservapp.comida.entity.TipoComida;
import com.reservapp.exception.ReglaNegocioException;
import com.reservapp.menu.entity.MenuDiario;
import com.reservapp.temporada.entity.EstadoTemporada;
import com.reservapp.temporada.entity.Temporada;
import com.reservapp.usuario.entity.Usuario;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Reglas de negocio de la reserva. Sin @Service, sin Prisma-equivalente
 * (no importa ningún Repository), sin Clock inyectado: todo lo que necesita
 * entra por parámetro, incluida la fecha y hora "de hoy". Con los mismos
 * parámetros, siempre da el mismo resultado (o lanza la misma excepción).
 *
 * ReservaService sigue siendo el responsable de ir a buscar los datos
 * (Usuario, MenuDiario, la lista de Comida) y de decidir qué hacer con el
 * veredicto; esta clase solo decide si la operación tiene sentido.
 */
public final class ReservaReglas {

    private ReservaReglas() {}

    /**
     * Reglas de POST /api/v1/reservas: ventana de fecha, coherencia del menú
     * con la temporada/semana activa y validez de la selección de comidas.
     * No chequea unicidad de la reserva: esa es una consulta (existsBy...),
     * no una regla que se pueda decidir con los datos que llegan acá.
     */
    public static void validarCreacion(LocalDate fecha, ZonedDateTime ahora, Usuario usuario,
                                        MenuDiario menu, List<Comida> seleccion, Set<Long> idsSolicitados) {
        LocalDate hoy = ahora.toLocalDate();
        if (fecha.isBefore(hoy) || fecha.isAfter(hoy.plusDays(7)) || fecha.getDayOfWeek().getValue() > 5) {
            throw new ReglaNegocioException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Solo se reserva para días laborables hasta siete días hacia adelante");
        }
        validarHorarioLimite(fecha, ahora);
        if (menu.getDiaSemana() != fecha.getDayOfWeek()) {
            throw new ReglaNegocioException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "El menú no corresponde al día solicitado");
        }
        Temporada temporada = menu.getSemana().getTemporada();
        long semana = ChronoUnit.WEEKS.between(temporada.getFechaDesde(), fecha) % 4 + 1;
        if (temporada.getEstado() != EstadoTemporada.PUBLICADA
                || fecha.isBefore(temporada.getFechaDesde())
                || fecha.isAfter(temporada.getFechaHasta())
                || menu.getSemana().getNumero() != semana) {
            throw new ReglaNegocioException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "El menú no pertenece a la semana activa de una temporada publicada");
        }
        validarSeleccion(usuario, menu, seleccion, idsSolicitados);
    }

    /**
     * Reglas comunes a crear y modificar una reserva: que la selección
     * exista, pertenezca al menú, tenga exactamente un plato principal y
     * sea compatible con las restricciones del usuario.
     */
    public static void validarSeleccion(Usuario usuario, MenuDiario menu, List<Comida> seleccion, Set<Long> idsSolicitados) {
        if (seleccion.size() != idsSolicitados.size()) {
            // Nota: esto es en rigor una consulta (404), no una regla — se deja
            // aquí temporalmente porque hoy ReservaService no separa ambas
            // búsquedas. Ver comentario en ReservaService.crear/modificar.
            throw new com.reservapp.exception.RecursoNoEncontradoException("Una o más comidas no existen");
        }
        Set<Long> ofrecidas = new HashSet<>();
        menu.getComidas().forEach(c -> ofrecidas.add(c.getId()));
        if (!ofrecidas.containsAll(idsSolicitados)) {
            throw new ReglaNegocioException(HttpStatus.UNPROCESSABLE_ENTITY, "Una comida no pertenece al menú");
        }
        long platosPrincipales = seleccion.stream().filter(c -> c.getTipo() == TipoComida.PLATO_PRINCIPAL).count();
        if (platosPrincipales != 1) {
            throw new ReglaNegocioException(HttpStatus.UNPROCESSABLE_ENTITY, "Debe seleccionar exactamente un plato principal");
        }
        for (Comida comida : seleccion) {
            boolean inactiva = comida.getEstado() != EstadoComida.ACTIVA;
            boolean incompatible = !comida.getRestriccionesCompatibles().containsAll(usuario.getRestricciones());
            if (inactiva || incompatible) {
                throw new ReglaNegocioException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "La selección contiene una comida inactiva o incompatible");
            }
        }
    }

    /**
     * Regla de PATCH y DELETE /api/v1/reservas/{id}: el horario límite es
     * las 09:00 del día de la reserva. "ahora" entra por parámetro para que
     * el test pueda fijar el instante exacto del vencimiento sin esperar
     * a que llegue esa hora.
     */
    public static void validarHorarioLimite(LocalDate fecha, ZonedDateTime ahora) {
        ZonedDateTime limite = fecha.atTime(9, 0).atZone(ahora.getZone());
        if (!ahora.isBefore(limite)) {
            throw new ReglaNegocioException(HttpStatus.CONFLICT,
                    "Venció el horario de modificación o cancelación");
        }
    }
}