package com.finanzas.backend.balance.dto;

import com.finanzas.backend.user.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBalanceResponse {

    private Long userId;
    private String username;

    // Positivo: le deben plata. Negativo: debe plata.
    private BigDecimal netBalance;

    public static UserBalanceResponse of(User user, BigDecimal netBalance) {
        return new UserBalanceResponse(user.getId(), user.getUsername(), netBalance);
    }
}
