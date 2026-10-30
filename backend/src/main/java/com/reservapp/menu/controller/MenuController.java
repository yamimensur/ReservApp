package com.reservapp.menu.controller;

import com.reservapp.menu.dto.MenuResponse;
import com.reservapp.menu.service.MenuService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/menus")
public class MenuController {
    private final MenuService menus;

    public MenuController(MenuService menus) { this.menus = menus; }

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLEADO','TERCERIZADO')")
    public MenuResponse consultar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                  Authentication auth) {
        return menus.consultarMenu(fecha, auth.getName());
    }
}
